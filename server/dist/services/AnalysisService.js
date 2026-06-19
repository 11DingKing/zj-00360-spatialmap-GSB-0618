"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisService = void 0;
const BuildingRepository_1 = require("../repositories/BuildingRepository");
const ParcelRepository_1 = require("../repositories/ParcelRepository");
const RedlineRepository_1 = require("../repositories/RedlineRepository");
const SpatialService_1 = require("./SpatialService");
const RedlineService_1 = require("./RedlineService");
class AnalysisService {
    constructor(buildingRepository, parcelRepository, redlineRepository, spatialService) {
        this.buildingRepository = buildingRepository || new BuildingRepository_1.BuildingRepository();
        this.parcelRepository = parcelRepository || new ParcelRepository_1.ParcelRepository();
        this.redlineRepository = redlineRepository || new RedlineRepository_1.RedlineRepository();
        this.spatialService = spatialService || new SpatialService_1.SpatialService();
    }
    analyzeArea(queryPolygon) {
        const bounds = this.spatialService.getPolygonBounds(queryPolygon);
        const candidateBuildings = this.buildingRepository.findWithinBounds(bounds.minX, bounds.maxX, bounds.minY, bounds.maxY);
        const allParcels = this.parcelRepository.findAll();
        const allRedlines = this.redlineRepository.findAll();
        const buildingsInArea = this.filterBuildingsInPolygon(candidateBuildings, queryPolygon);
        const parcelsInArea = this.filterParcelsInPolygon(allParcels, queryPolygon);
        const redlinesInArea = this.filterRedlinesIntersecting(allRedlines, queryPolygon);
        const conflictBuildings = this.detectConflicts(buildingsInArea, redlinesInArea);
        const conflictSummaryMap = new Map();
        conflictBuildings.forEach(cb => {
            cb.conflictTypes.forEach(type => {
                conflictSummaryMap.set(type, (conflictSummaryMap.get(type) || 0) + 1);
            });
        });
        const conflictSummary = Array.from(conflictSummaryMap.entries())
            .map(([type, count]) => ({
            type,
            typeName: RedlineService_1.REDLINE_TYPE_NAMES[type],
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
    filterBuildingsInPolygon(buildings, polygon) {
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
    filterParcelsInPolygon(parcels, polygon) {
        return parcels.filter(parcel => {
            return this.spatialService.polygonIntersects(polygon, parcel.boundary);
        });
    }
    filterRedlinesIntersecting(redlines, polygon) {
        return redlines.filter(redline => {
            return this.spatialService.polygonIntersects(polygon, redline.boundary);
        });
    }
    detectConflicts(buildings, redlines) {
        const conflictBuildings = [];
        for (const building of buildings) {
            if (!building.outline) {
                continue;
            }
            const conflictTypesSet = new Set();
            const conflictRedlineIds = [];
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
exports.AnalysisService = AnalysisService;
//# sourceMappingURL=AnalysisService.js.map