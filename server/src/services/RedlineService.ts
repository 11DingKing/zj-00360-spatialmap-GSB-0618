import { v4 as uuidv4 } from "uuid";
import { RedlineRepository } from "../repositories/RedlineRepository";
import { BuildingRepository } from "../repositories/BuildingRepository";
import { ParcelRepository } from "../repositories/ParcelRepository";
import { SpatialService } from "./SpatialService";
import type {
  AreaAnalysisResult,
  BuildingWithRelations,
  Parcel,
  Polygon,
  Redline,
  RedlineConflict,
  RedlineConflictSummary,
  RedlineType,
} from "../types";

export class RedlineService {
  private redlineRepository: RedlineRepository;
  private buildingRepository: BuildingRepository;
  private parcelRepository: ParcelRepository;
  private spatialService: SpatialService;

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

  getAllRedlines(type?: RedlineType): Redline[] {
    return this.redlineRepository.findAll(type);
  }

  getRedlineById(id: string): Redline | null {
    return this.redlineRepository.findById(id);
  }

  createRedline(
    data: Omit<Redline, "id" | "createdAt" | "updatedAt"> & { id?: string },
  ): Redline {
    const id = data.id || uuidv4();
    return this.redlineRepository.create({ ...data, id });
  }

  updateRedline(id: string, data: Partial<Redline>): Redline | null {
    return this.redlineRepository.update(id, data);
  }

  deleteRedline(id: string): boolean {
    return this.redlineRepository.delete(id);
  }

  analyzeArea(area: Polygon): AreaAnalysisResult {
    const bounds = this.spatialService.getPolygonBounds(area);

    const candidateBuildings = this.buildingRepository.findWithinBounds(
      bounds.minX,
      bounds.maxX,
      bounds.minY,
      bounds.maxY,
    );

    const buildings: BuildingWithRelations[] = [];
    for (const b of candidateBuildings) {
      if (b.outline) {
        if (this.spatialService.booleanIntersects(area, b.outline)) {
          buildings.push(b);
        }
      } else if (b.location) {
        if (this.spatialService.booleanPointInPolygon(b.location, area)) {
          buildings.push(b);
        }
      }
    }

    const allParcels = this.parcelRepository.findAll();
    const parcels: Parcel[] = allParcels.filter((p: Parcel) =>
      this.spatialService.booleanIntersects(area, p.boundary),
    );

    const allRedlines = this.redlineRepository.findAll();
    const intersectingRedlines: Redline[] = allRedlines.filter((r: Redline) =>
      this.spatialService.booleanIntersects(area, r.boundary),
    );

    const conflicts: RedlineConflict[] = [];
    for (const building of buildings) {
      if (!building.outline) continue;
      const matched: Redline[] = [];
      for (const redline of intersectingRedlines) {
        if (
          this.spatialService.booleanIntersects(
            building.outline,
            redline.boundary,
          )
        ) {
          matched.push(redline);
        }
      }
      if (matched.length > 0) {
        conflicts.push({
          buildingId: building.id,
          buildingName: building.name,
          redlineIds: matched.map((r) => r.id),
          redlineNames: matched.map((r) => r.name),
          redlineTypes: matched.map((r) => r.type),
        });
      }
    }

    const summaryMap = new Map<
      RedlineType,
      { redlineIds: Set<string>; buildingIds: Set<string> }
    >();
    for (const conflict of conflicts) {
      conflict.redlineTypes.forEach((type, idx) => {
        const entry = summaryMap.get(type) || {
          redlineIds: new Set<string>(),
          buildingIds: new Set<string>(),
        };
        entry.redlineIds.add(conflict.redlineIds[idx]);
        entry.buildingIds.add(conflict.buildingId);
        summaryMap.set(type, entry);
      });
    }
    const conflictSummary: RedlineConflictSummary[] = Array.from(
      summaryMap.entries(),
    ).map(([type, entry]) => ({
      type,
      redlineCount: entry.redlineIds.size,
      conflictBuildingCount: entry.buildingIds.size,
    }));

    return {
      area: this.spatialService.calculateArea(area),
      buildings,
      parcels,
      redlines: intersectingRedlines,
      conflicts,
      conflictSummary,
    };
  }
}
