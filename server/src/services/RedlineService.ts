import { v4 as uuidv4 } from "uuid";
import { RedlineRepository } from "../repositories/RedlineRepository";
import { BuildingRepository } from "../repositories/BuildingRepository";
import { ParcelRepository } from "../repositories/ParcelRepository";
import { SpatialService } from "./SpatialService";
import type {
  Redline,
  RedlineType,
  Polygon,
  RedlineAnalysisResult,
  ConflictBuilding,
  ConflictSummary,
  BuildingWithRelations,
  Parcel,
} from "../types";

export class RedlineService {
  private redlineRepository: RedlineRepository;
  private buildingRepository: BuildingRepository;
  private parcelRepository: ParcelRepository;
  private spatialService: SpatialService;

  private static typeNames: Record<RedlineType, string> = {
    ecological: "生态保护红线",
    heritage: "历史街区保护线",
    farmland: "永久基本农田",
    water: "河湖蓝线",
    infrastructure: "基础设施控制线",
    other: "其他管控线",
  };

  constructor(
    redlineRepository?: RedlineRepository,
    buildingRepository?: BuildingRepository,
    parcelRepository?: ParcelRepository,
    spatialService?: SpatialService,
  ) {
    this.redlineRepository = redlineRepository || new RedlineRepository();
    this.buildingRepository = buildingRepository || new BuildingRepository();
    this.parcelRepository = parcelRepository || new ParcelRepository();
    this.spatialService = spatialService || new SpatialService();
  }

  static getTypeName(type: RedlineType): string {
    return RedlineService.typeNames[type] || "其他";
  }

  getRedlines(type?: RedlineType): Redline[] {
    return this.redlineRepository.findAll(type);
  }

  getRedlineById(id: string): Redline | null {
    return this.redlineRepository.findById(id);
  }

  getRedlineTypes(): { type: RedlineType; name: string; count: number }[] {
    return this.redlineRepository.getTypes();
  }

  createRedline(data: {
    name: string;
    type: RedlineType;
    description?: string | null;
    boundary: Polygon;
  }): Redline {
    const id = uuidv4();
    const area = this.spatialService.calculateArea(data.boundary);

    return this.redlineRepository.create({
      id,
      name: data.name,
      type: data.type,
      description: data.description || null,
      boundary: data.boundary,
      area,
    });
  }

  updateRedline(
    id: string,
    data: Partial<{
      name: string;
      type: RedlineType;
      description: string | null;
      boundary: Polygon;
    }>,
  ): Redline | null {
    const updateData: Partial<Redline> = { ...data };
    if (data.boundary) {
      updateData.area = this.spatialService.calculateArea(data.boundary);
    }
    return this.redlineRepository.update(id, updateData);
  }

  deleteRedline(id: string): boolean {
    return this.redlineRepository.delete(id);
  }

  analyzeArea(selectionPolygon: Polygon): RedlineAnalysisResult {
    const bounds = this.spatialService.getPolygonBounds(selectionPolygon);

    const candidateBuildings = this.buildingRepository.findWithinBounds(
      bounds.minX,
      bounds.maxX,
      bounds.minY,
      bounds.maxY,
    );

    const candidateParcels = this.parcelRepository.findWithinBounds(
      bounds.minX,
      bounds.maxX,
      bounds.minY,
      bounds.maxY,
    );

    const allRedlines = this.redlineRepository.findAllForAnalysis();

    const buildingsInArea: BuildingWithRelations[] = [];
    const buildingOutlineMap = new Map<string, Polygon>();

    for (const building of candidateBuildings) {
      if (building.outline) {
        if (
          this.spatialService.booleanIntersects(
            building.outline,
            selectionPolygon,
          )
        ) {
          buildingsInArea.push(building);
          buildingOutlineMap.set(building.id, building.outline);
        }
      } else if (building.location) {
        if (
          this.spatialService.booleanPointInPolygon(
            building.location,
            selectionPolygon,
          )
        ) {
          buildingsInArea.push(building);
        }
      }
    }

    const parcelsInArea: Parcel[] = [];
    for (const parcel of candidateParcels) {
      if (
        this.spatialService.booleanIntersects(parcel.boundary, selectionPolygon)
      ) {
        parcelsInArea.push(parcel);
      }
    }

    const redlinesInArea: Redline[] = [];
    const redlineBoundaryMap = new Map<string, Polygon>();
    for (const redline of allRedlines) {
      if (
        this.spatialService.booleanIntersects(
          redline.boundary,
          selectionPolygon,
        )
      ) {
        redlinesInArea.push(redline);
        redlineBoundaryMap.set(redline.id, redline.boundary);
      }
    }

    const conflictBuildings: ConflictBuilding[] = [];
    const conflictTypeCount = new Map<RedlineType, number>();

    for (const building of buildingsInArea) {
      const outline = buildingOutlineMap.get(building.id);
      if (!outline) {
        continue;
      }

      const conflictRedlineIds: string[] = [];
      const conflictRedlineTypes: RedlineType[] = [];
      const conflictRedlineNames: string[] = [];

      for (const redline of redlinesInArea) {
        const redlineBoundary = redlineBoundaryMap.get(redline.id);
        if (!redlineBoundary) continue;

        if (this.spatialService.booleanIntersects(outline, redlineBoundary)) {
          conflictRedlineIds.push(redline.id);
          if (!conflictRedlineTypes.includes(redline.type)) {
            conflictRedlineTypes.push(redline.type);
          }
          conflictRedlineNames.push(redline.name);

          const currentCount = conflictTypeCount.get(redline.type) || 0;
          conflictTypeCount.set(redline.type, currentCount + 1);
        }
      }

      if (conflictRedlineIds.length > 0) {
        conflictBuildings.push({
          building,
          conflictRedlineIds,
          conflictRedlineTypes,
          conflictRedlineNames,
        });
      }
    }

    const summaryByType: ConflictSummary[] = [];
    for (const [type, count] of conflictTypeCount.entries()) {
      summaryByType.push({
        type,
        typeName: RedlineService.getTypeName(type),
        count,
      });
    }
    summaryByType.sort((a, b) => b.count - a.count);

    return {
      totalBuildings: buildingsInArea.length,
      conflictBuildings,
      conflictCount: conflictBuildings.length,
      parcelsInArea,
      redlinesInArea,
      summaryByType,
    };
  }
}
