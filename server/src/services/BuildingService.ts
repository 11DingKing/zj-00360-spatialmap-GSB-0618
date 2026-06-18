import { v4 as uuidv4 } from 'uuid';
import { BuildingRepository } from '../repositories/BuildingRepository';
import { LifeCycleRepository } from '../repositories/LifeCycleRepository';
import { ParcelRepository } from '../repositories/ParcelRepository';
import { SpatialService } from './SpatialService';
import type {
  Building,
  BuildingWithRelations,
  BuildingUsage,
  FilterParams,
  LifeCycleRecord,
  OverviewStats,
  Point,
  Polygon,
  QualityStats,
  StatsResult,
  ValidationError,
  ValidationResult
} from '../types';

export class BuildingService {
  private buildingRepository: BuildingRepository;
  private lifeCycleRepository: LifeCycleRepository;
  private spatialService: SpatialService;
  private parcelRepository: ParcelRepository;

  constructor(
    buildingRepository?: BuildingRepository,
    lifeCycleRepository?: LifeCycleRepository,
    spatialService?: SpatialService,
    parcelRepository?: ParcelRepository
  ) {
    this.buildingRepository = buildingRepository || new BuildingRepository();
    this.lifeCycleRepository = lifeCycleRepository || new LifeCycleRepository();
    this.spatialService = spatialService || new SpatialService();
    this.parcelRepository = parcelRepository || new ParcelRepository();
  }

  getBuildings(params?: FilterParams): BuildingWithRelations[] {
    return this.buildingRepository.findAll(params);
  }

  getBuildingById(id: string): { building: BuildingWithRelations; lifecycle: LifeCycleRecord[] } | null {
    const building = this.buildingRepository.findById(id);
    if (!building) {
      return null;
    }
    const lifecycle = this.lifeCycleRepository.findByBuildingId(id);
    return { building, lifecycle };
  }

  getBuildingsWithinBounds(minLng: number, maxLng: number, minLat: number, maxLat: number): BuildingWithRelations[] {
    return this.buildingRepository.findWithinBounds(minLng, maxLng, minLat, maxLat);
  }

  createBuilding(data: Omit<Building, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Building {
    const id = data.id || uuidv4();

    const buildingData = {
      ...data,
      id
    };

    return this.buildingRepository.create(buildingData);
  }

  updateBuilding(id: string, data: Partial<Building>): Building | null {
    return this.buildingRepository.update(id, data);
  }

  deleteBuilding(id: string): boolean {
    return this.buildingRepository.delete(id);
  }

  validateBuilding(
    location: Point,
    outline: Polygon,
    parcelId: string,
    excludeId?: string
  ): ValidationResult {
    const errors: ValidationError[] = [];

    const parcel = this.parcelRepository.findById(parcelId);
    if (parcel) {
      const isInsideParcel = this.isPolygonInsidePolygon(outline, parcel.boundary);
      if (!isInsideParcel) {
        errors.push({
          type: 'outside_parcel',
          message: '建筑轮廓超出宗地范围'
        });
      }
    }

    const overlappingBuildings = this.findOverlappingBuildings(outline, excludeId);
    if (overlappingBuildings.length > 0) {
      errors.push({
        type: 'overlap',
        message: '建筑与其他建筑存在重叠',
        overlappingBuildings: overlappingBuildings.map(b => b.id)
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  getStats(params?: FilterParams): StatsResult {
    const buildings = this.buildingRepository.findAll(params);
    const totalCount = buildings.length;

    const usageMap = new Map<BuildingUsage, number>();
    const yearMap = new Map<number, number>();

    for (const building of buildings) {
      usageMap.set(building.usage, (usageMap.get(building.usage) || 0) + 1);
      yearMap.set(building.buildYear, (yearMap.get(building.buildYear) || 0) + 1);
    }

    const byUsage = Array.from(usageMap.entries()).map(([usage, count]) => ({
      usage,
      count,
      percentage: totalCount > 0 ? (count / totalCount) * 100 : 0
    }));

    const byYear = Array.from(yearMap.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);

    return { totalCount, byUsage, byYear };
  }

  getOverviewStats(): OverviewStats {
    const allBuildings = this.buildingRepository.findAll();

    const totalBuildings = allBuildings.length;
    const mappedBuildings = allBuildings.filter(b => b.location !== null).length;
    const unmappedBuildings = totalBuildings - mappedBuildings;
    const coordinateMissingRate = totalBuildings > 0 ? (unmappedBuildings / totalBuildings) * 100 : 0;
    const codedBuildings = allBuildings.filter(b => b.isCoded).length;
    const uncodedBuildings = totalBuildings - codedBuildings;

    const byRegionMap = new Map<string, number>();
    for (const building of allBuildings) {
      const regionName = building.parcelName || '未分配';
      byRegionMap.set(regionName, (byRegionMap.get(regionName) || 0) + 1);
    }
    const byRegion = Array.from(byRegionMap.entries()).map(([name, count]) => ({ name, count }));

    const byUsageMap = new Map<BuildingUsage, number>();
    for (const building of allBuildings) {
      byUsageMap.set(building.usage, (byUsageMap.get(building.usage) || 0) + 1);
    }
    const byUsage = Array.from(byUsageMap.entries()).map(([usage, count]) => ({ usage, count }));

    return {
      totalBuildings,
      mappedBuildings,
      unmappedBuildings,
      coordinateMissingRate,
      codedBuildings,
      uncodedBuildings,
      byRegion,
      byUsage
    };
  }

  getUnmappedBuildings(): Building[] {
    return this.buildingRepository.findAll({ hasLocation: false });
  }

  getQualityStats(): QualityStats {
    const allBuildings = this.buildingRepository.findAll();
    const totalBuildings = allBuildings.length;

    const coordinateMissingCount = allBuildings.filter(b => b.location === null).length;
    const coordinateMissingRate = totalBuildings > 0 ? (coordinateMissingCount / totalBuildings) * 100 : 0;

    let attributeCompleteCount = 0;
    for (const building of allBuildings) {
      const hasName = building.name && building.name.trim().length > 0;
      const hasAddress = building.address && building.address.trim().length > 0;
      const hasUsage = building.usage !== null && building.usage !== undefined;
      const hasBuildYear = building.buildYear > 0;
      const hasFloors = building.floors > 0;
      if (hasName && hasAddress && hasUsage && hasBuildYear && hasFloors) {
        attributeCompleteCount++;
      }
    }
    const attributeCompleteRate = totalBuildings > 0 ? (attributeCompleteCount / totalBuildings) * 100 : 0;

    const outlineCompleteCount = allBuildings.filter(b => b.outline !== null).length;
    const outlineCompleteRate = totalBuildings > 0 ? (outlineCompleteCount / totalBuildings) * 100 : 0;

    const byRegionMap = new Map<string, { total: number; missing: number }>();
    for (const building of allBuildings) {
      const regionName = building.parcelName || '未分配';
      const region = byRegionMap.get(regionName) || { total: 0, missing: 0 };
      region.total++;
      if (building.location === null) {
        region.missing++;
      }
      byRegionMap.set(regionName, region);
    }
    const byRegion = Array.from(byRegionMap.entries()).map(([name, data]) => ({
      name,
      coordinateMissingRate: data.total > 0 ? (data.missing / data.total) * 100 : 0
    }));

    return {
      coordinateMissingRate,
      attributeCompleteRate,
      outlineCompleteRate,
      byRegion
    };
  }

  private isPolygonInsidePolygon(inner: Polygon, outer: Polygon): boolean {
    for (const ring of inner.coordinates) {
      for (const coord of ring) {
        const point: Point = {
          type: 'Point',
          coordinates: [coord[0], coord[1]]
        };
        if (!this.spatialService.booleanPointInPolygon(point, outer)) {
          return false;
        }
      }
    }
    return true;
  }

  private findOverlappingBuildings(outline: Polygon, excludeId?: string): BuildingWithRelations[] {
    const bounds = this.spatialService.getPolygonBounds(outline);
    const candidates = this.buildingRepository.findWithinBounds(
      bounds.minX,
      bounds.maxX,
      bounds.minY,
      bounds.maxY
    );

    const overlapping: BuildingWithRelations[] = [];
    for (const candidate of candidates) {
      if (excludeId && candidate.id === excludeId) {
        continue;
      }
      if (candidate.outline && this.spatialService.booleanIntersects(outline, candidate.outline)) {
        overlapping.push(candidate);
      }
    }

    return overlapping;
  }
}
