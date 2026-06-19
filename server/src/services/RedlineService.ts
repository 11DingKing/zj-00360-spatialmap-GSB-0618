import { randomUUID } from 'crypto';
import * as turf from '@turf/turf';
import booleanIntersects from '@turf/boolean-intersects';
import { RedlineRepository } from '../repositories/RedlineRepository';
import { BuildingRepository } from '../repositories/BuildingRepository';
import { ParcelRepository } from '../repositories/ParcelRepository';
import type {
  Redline,
  RedlineType,
  Polygon,
  AnalysisResult,
  BuildingWithConflicts,
  ConflictInfo
} from '../types';

const REDLINE_TYPE_NAMES: Record<RedlineType, string> = {
  ecological: '生态红线',
  heritage: '历史街区保护线',
  cultural: '文物保护线',
  infrastructure: '基础设施管控线',
  agricultural: '永久基本农田',
  other: '其他管控线'
};

export class RedlineService {
  private redlineRepository: RedlineRepository;
  private buildingRepository: BuildingRepository;
  private parcelRepository: ParcelRepository;

  constructor(
    redlineRepository?: RedlineRepository,
    buildingRepository?: BuildingRepository,
    parcelRepository?: ParcelRepository
  ) {
    this.redlineRepository = redlineRepository || new RedlineRepository();
    this.buildingRepository = buildingRepository || new BuildingRepository();
    this.parcelRepository = parcelRepository || new ParcelRepository();
  }

  getRedlines(type?: RedlineType): Redline[] {
    return this.redlineRepository.findAll(type);
  }

  getRedlineById(id: string): Redline | null {
    return this.redlineRepository.findById(id);
  }

  createRedline(data: {
    name: string;
    type: RedlineType;
    description?: string | null;
    boundary: Polygon;
  }): Redline {
    const area = turf.area(data.boundary);

    return this.redlineRepository.create({
      id: randomUUID(),
      name: data.name,
      type: data.type,
      description: data.description || null,
      boundary: data.boundary,
      area
    });
  }

  updateRedline(id: string, data: Partial<{
    name: string;
    type: RedlineType;
    description: string | null;
    boundary: Polygon;
  }>): Redline | null {
    const updateData: Partial<Redline> = { ...data };

    if (data.boundary) {
      updateData.area = turf.area(data.boundary);
    }

    return this.redlineRepository.update(id, updateData);
  }

  deleteRedline(id: string): boolean {
    return this.redlineRepository.delete(id);
  }

  getRedlineTypes(): { type: RedlineType; name: string; count: number }[] {
    const typeCounts = this.redlineRepository.getTypes();
    return typeCounts.map(tc => ({
      type: tc.type,
      name: REDLINE_TYPE_NAMES[tc.type] || tc.type,
      count: tc.count
    }));
  }

  analyzeArea(selectionPolygon: Polygon): AnalysisResult {
    const bbox = turf.bbox(selectionPolygon);
    const nearbyRedlines = this.redlineRepository.findWithinBounds(
      bbox[0], bbox[2], bbox[1], bbox[3]
    );

    const allBuildings = this.buildingRepository.findWithinBounds(
      bbox[0], bbox[2], bbox[1], bbox[3]
    );

    const intersectingParcels = this.parcelRepository.findIntersectingPolygon(selectionPolygon);

    const buildingsInArea = allBuildings.filter(building => {
      if (!building.outline) {
        return building.location ? turf.booleanPointInPolygon(building.location, selectionPolygon) : false;
      }
      try {
        return booleanIntersects(selectionPolygon, building.outline);
      } catch {
        return false;
      }
    });

    const buildingsWithConflicts: BuildingWithConflicts[] = buildingsInArea.map(building => {
      const conflicts: ConflictInfo[] = [];

      if (building.outline) {
        for (const redline of nearbyRedlines) {
          try {
            if (booleanIntersects(building.outline, redline.boundary)) {
              conflicts.push({
                redlineId: redline.id,
                redlineName: redline.name,
                redlineType: redline.type
              });
            }
          } catch {
          }
        }
      }

      return {
        ...building,
        hasConflict: conflicts.length > 0,
        conflicts
      };
    });

    const conflictTypeMap = new Map<RedlineType, number>();
    let totalConflicts = 0;

    buildingsWithConflicts.forEach(b => {
      const addedTypes = new Set<RedlineType>();
      b.conflicts.forEach(c => {
        if (!addedTypes.has(c.redlineType)) {
          addedTypes.add(c.redlineType);
          conflictTypeMap.set(c.redlineType, (conflictTypeMap.get(c.redlineType) || 0) + 1);
        }
        totalConflicts++;
      });
    });

    const conflictSummary = Array.from(conflictTypeMap.entries()).map(([type, count]) => ({
      type,
      typeName: REDLINE_TYPE_NAMES[type] || type,
      count
    }));

    return {
      buildings: buildingsWithConflicts,
      parcels: intersectingParcels,
      conflictSummary,
      totalBuildings: buildingsWithConflicts.length,
      totalConflicts,
      totalParcels: intersectingParcels.length
    };
  }

  static getRedlineTypeName(type: RedlineType): string {
    return REDLINE_TYPE_NAMES[type] || type;
  }
}
