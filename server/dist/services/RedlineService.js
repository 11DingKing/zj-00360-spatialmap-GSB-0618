"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedlineService = void 0;
const uuid_1 = require("uuid");
const RedlineRepository_1 = require("../repositories/RedlineRepository");
const BuildingRepository_1 = require("../repositories/BuildingRepository");
const ParcelRepository_1 = require("../repositories/ParcelRepository");
const SpatialService_1 = require("./SpatialService");
class RedlineService {
    constructor(redlineRepository, buildingRepository, parcelRepository, spatialService) {
        this.redlineRepository = redlineRepository || new RedlineRepository_1.RedlineRepository();
        this.buildingRepository = buildingRepository || new BuildingRepository_1.BuildingRepository();
        this.parcelRepository = parcelRepository || new ParcelRepository_1.ParcelRepository();
        this.spatialService = spatialService || new SpatialService_1.SpatialService();
    }
    getAllRedlines(type) {
        return this.redlineRepository.findAll(type);
    }
    getRedlineById(id) {
        return this.redlineRepository.findById(id);
    }
    createRedline(data) {
        const id = data.id || (0, uuid_1.v4)();
        return this.redlineRepository.create({ ...data, id });
    }
    updateRedline(id, data) {
        return this.redlineRepository.update(id, data);
    }
    deleteRedline(id) {
        return this.redlineRepository.delete(id);
    }
    analyzeArea(area) {
        const bounds = this.spatialService.getPolygonBounds(area);
        const candidateBuildings = this.buildingRepository.findWithinBounds(bounds.minX, bounds.maxX, bounds.minY, bounds.maxY);
        const buildings = [];
        for (const b of candidateBuildings) {
            if (b.outline) {
                if (this.spatialService.booleanIntersects(area, b.outline)) {
                    buildings.push(b);
                }
            }
            else if (b.location) {
                if (this.spatialService.booleanPointInPolygon(b.location, area)) {
                    buildings.push(b);
                }
            }
        }
        const allParcels = this.parcelRepository.findAll();
        const parcels = allParcels.filter((p) => this.spatialService.booleanIntersects(area, p.boundary));
        const allRedlines = this.redlineRepository.findAll();
        const intersectingRedlines = allRedlines.filter((r) => this.spatialService.booleanIntersects(area, r.boundary));
        const conflicts = [];
        for (const building of buildings) {
            if (!building.outline)
                continue;
            const matched = [];
            for (const redline of intersectingRedlines) {
                if (this.spatialService.booleanIntersects(building.outline, redline.boundary)) {
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
        const summaryMap = new Map();
        for (const conflict of conflicts) {
            conflict.redlineTypes.forEach((type, idx) => {
                const entry = summaryMap.get(type) || {
                    redlineIds: new Set(),
                    buildingIds: new Set(),
                };
                entry.redlineIds.add(conflict.redlineIds[idx]);
                entry.buildingIds.add(conflict.buildingId);
                summaryMap.set(type, entry);
            });
        }
        const conflictSummary = Array.from(summaryMap.entries()).map(([type, entry]) => ({
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
exports.RedlineService = RedlineService;
//# sourceMappingURL=RedlineService.js.map