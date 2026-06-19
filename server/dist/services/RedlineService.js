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
    static getTypeName(type) {
        return RedlineService.typeNames[type] || "其他";
    }
    getRedlines(type) {
        return this.redlineRepository.findAll(type);
    }
    getRedlineById(id) {
        return this.redlineRepository.findById(id);
    }
    getRedlineTypes() {
        return this.redlineRepository.getTypes();
    }
    createRedline(data) {
        const id = (0, uuid_1.v4)();
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
    updateRedline(id, data) {
        const updateData = { ...data };
        if (data.boundary) {
            updateData.area = this.spatialService.calculateArea(data.boundary);
        }
        return this.redlineRepository.update(id, updateData);
    }
    deleteRedline(id) {
        return this.redlineRepository.delete(id);
    }
    analyzeArea(selectionPolygon) {
        const bounds = this.spatialService.getPolygonBounds(selectionPolygon);
        const candidateBuildings = this.buildingRepository.findWithinBounds(bounds.minX, bounds.maxX, bounds.minY, bounds.maxY);
        const candidateParcels = this.parcelRepository.findWithinBounds(bounds.minX, bounds.maxX, bounds.minY, bounds.maxY);
        const allRedlines = this.redlineRepository.findAllForAnalysis();
        const buildingsInArea = [];
        const buildingOutlineMap = new Map();
        for (const building of candidateBuildings) {
            if (building.outline) {
                if (this.spatialService.booleanIntersects(building.outline, selectionPolygon)) {
                    buildingsInArea.push(building);
                    buildingOutlineMap.set(building.id, building.outline);
                }
            }
            else if (building.location) {
                if (this.spatialService.booleanPointInPolygon(building.location, selectionPolygon)) {
                    buildingsInArea.push(building);
                }
            }
        }
        const parcelsInArea = [];
        for (const parcel of candidateParcels) {
            if (this.spatialService.booleanIntersects(parcel.boundary, selectionPolygon)) {
                parcelsInArea.push(parcel);
            }
        }
        const redlinesInArea = [];
        const redlineBoundaryMap = new Map();
        for (const redline of allRedlines) {
            if (this.spatialService.booleanIntersects(redline.boundary, selectionPolygon)) {
                redlinesInArea.push(redline);
                redlineBoundaryMap.set(redline.id, redline.boundary);
            }
        }
        const conflictBuildings = [];
        const conflictTypeCount = new Map();
        for (const building of buildingsInArea) {
            const outline = buildingOutlineMap.get(building.id);
            if (!outline) {
                continue;
            }
            const conflictRedlineIds = [];
            const conflictRedlineTypes = [];
            const conflictRedlineNames = [];
            for (const redline of redlinesInArea) {
                const redlineBoundary = redlineBoundaryMap.get(redline.id);
                if (!redlineBoundary)
                    continue;
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
        const summaryByType = [];
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
exports.RedlineService = RedlineService;
RedlineService.typeNames = {
    ecological: "生态保护红线",
    heritage: "历史街区保护线",
    farmland: "永久基本农田",
    water: "河湖蓝线",
    infrastructure: "基础设施控制线",
    other: "其他管控线",
};
//# sourceMappingURL=RedlineService.js.map