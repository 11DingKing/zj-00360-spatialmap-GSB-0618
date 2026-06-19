import { BuildingRepository } from '../repositories/BuildingRepository';
import { ParcelRepository } from '../repositories/ParcelRepository';
import { RedlineRepository } from '../repositories/RedlineRepository';
import { SpatialService } from './SpatialService';
import { REDLINE_TYPE_NAMES } from './RedlineService';
import type {
  AnalysisResult,
  BuildingWithRelations,
  ConflictBuilding,
  Parcel,
  Polygon,
  Redline,
  RedlineType
} from '../types';

export class AnalysisService {
  private buildingRepository: BuildingRepository;
  private parcelRepository: ParcelRepository;
  private redlineRepository: RedlineRepository;
  private spatialService: SpatialService;

  constructor(
    buildingRepository?: BuildingRepository,
    parcelRepository?: ParcelRepository,
    redlineRepository?: RedlineRepository,
    spatialService?: SpatialService
  ) {
    this.buildingRepository = buildingRepository || new BuildingRepository();
    this.parcelRepository = parcelRepository || new ParcelRepository();
    this.redlineRepository = redlineRepository || new RedlineRepository();
    this.spatialService = spatialService || new SpatialService();
  }

  analyzeArea(queryPolygon: Polygon): AnalysisResult {
    const bounds = this.spatialService.getPolygonBounds(queryPolygon);

    const candidateBuildings = this.buildingRepository.findWithinBounds(
      bounds.minX,
      bounds.maxX,
      bounds.minY,
      bounds.maxY
    );

    const allParcels = this.parcelRepository.findAll();
    const allRedlines = this.redlineRepository.findAll();

    const buildingsInArea = this.filterBuildingsInPolygon(candidateBuildings, queryPolygon);
    const parcelsInArea = this.filterParcelsInPolygon(allParcels, queryPolygon);
    const redlinesInArea = this.filterRedlinesIntersecting(allRedlines, queryPolygon);

    const conflictBuildings = this.detectConflicts(buildingsInArea, redlinesInArea);

    const conflictSummaryMap = new Map<RedlineType, number>();
    conflictBuildings.forEach(cb => {
      cb.conflictTypes.forEach(type => {
        conflictSummaryMap.set(type, (conflictSummaryMap.get(type) || 0) + 1);
      });
    });

    const conflictSummary: AnalysisResult['conflictSummary'] = Array.from(conflictSummaryMap.entries())
      .map(([type, count]) => ({
        type,
        typeName: REDLINE_TYPE_NAMES[type],
        count
      }))
      .sort((a, b) => b.count - a.count);

    return {
      queryPolygon,
      buildingsInArea,
      parcelsInArea,
      redlinesInArea,
      conflictBuildings,
      conflictSummary,
      totalBuildings: buildingsInArea.length,
      totalConflictBuildings: conflictBuildings.length,
      totalParcels: parcelsInArea.length
    };
  }

  private filterBuildingsInPolygon(
    buildings: BuildingWithRelations[],
    polygon: Polygon
  ): BuildingWithRelations[] {
    return buildings.filter(building => {
      if (building.outline) {
        return this.spatialService.polygonIntersects(polygon, building.outline);
      }
      if (building.location) {
        return this.spatialService.booleanPointInPolygon(building.location, polygon);
      }
      return false;
    });
  }

  private filterParcelsInPolygon(parcels: Parcel[], polygon: Polygon): Parcel[] {
    return parcels.filter(parcel => {
      return this.spatialService.polygonIntersects(polygon, parcel.boundary);
    });
  }

  private filterRedlinesIntersecting(redlines: Redline[], polygon: Polygon): Redline[] {
    return redlines.filter(redline => {
      return this.spatialService.polygonIntersects(polygon, redline.boundary);
    });
  }

  private detectConflicts(
    buildings: BuildingWithRelations[],
    redlines: Redline[]
  ): ConflictBuilding[] {
    const conflictBuildings: ConflictBuilding[] = [];

    for (const building of buildings) {
      if (!building.outline) {
        continue;
      }

      const conflictTypesSet = new Set<RedlineType>();
      const conflictRedlineIds: string[] = [];

      for (const redline of redlines) {
        if (this.spatialService.booleanIntersects(building.outline, redline.boundary)) {
          conflictTypesSet.add(redline.type);
          conflictRedlineIds.push(redline.id);
        }
      }

      if (conflictRedlineIds.length > 0) {
        conflictBuildings.push({
          building,
          conflictTypes: Array.from(conflictTypesSet),
          conflictRedlineIds
        });
      }
    }

    return conflictBuildings;
  }
}
