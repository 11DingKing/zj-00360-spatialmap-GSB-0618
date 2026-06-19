"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingService = void 0;
const uuid_1 = require("uuid");
const BuildingRepository_1 = require("../repositories/BuildingRepository");
const LifeCycleRepository_1 = require("../repositories/LifeCycleRepository");
const ParcelRepository_1 = require("../repositories/ParcelRepository");
const SpatialService_1 = require("./SpatialService");
class BuildingService {
    constructor(buildingRepository, lifeCycleRepository, spatialService, parcelRepository) {
        this.buildingRepository = buildingRepository || new BuildingRepository_1.BuildingRepository();
        this.lifeCycleRepository = lifeCycleRepository || new LifeCycleRepository_1.LifeCycleRepository();
        this.spatialService = spatialService || new SpatialService_1.SpatialService();
        this.parcelRepository = parcelRepository || new ParcelRepository_1.ParcelRepository();
    }
    getBuildings(params) {
        return this.buildingRepository.findAll(params);
    }
    getBuildingById(id) {
        const building = this.buildingRepository.findById(id);
        if (!building) {
            return null;
        }
        const lifecycle = this.lifeCycleRepository.findByBuildingId(id);
        return { building, lifecycle };
    }
    getBuildingsWithinBounds(minLng, maxLng, minLat, maxLat) {
        return this.buildingRepository.findWithinBounds(minLng, maxLng, minLat, maxLat);
    }
    createBuilding(data) {
        const id = data.id || (0, uuid_1.v4)();
        const buildingData = {
            ...data,
            id
        };
        return this.buildingRepository.create(buildingData);
    }
    updateBuilding(id, data) {
        return this.buildingRepository.update(id, data);
    }
    deleteBuilding(id) {
        return this.buildingRepository.delete(id);
    }
    validateBuilding(location, outline, parcelId, excludeId) {
        const errors = [];
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
    getStats(params) {
        const buildings = this.buildingRepository.findAll(params);
        const totalCount = buildings.length;
        const usageMap = new Map();
        const yearMap = new Map();
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
    getOverviewStats() {
        const allBuildings = this.buildingRepository.findAll();
        const totalBuildings = allBuildings.length;
        const mappedBuildings = allBuildings.filter(b => b.location !== null).length;
        const unmappedBuildings = totalBuildings - mappedBuildings;
        const coordinateMissingRate = totalBuildings > 0 ? (unmappedBuildings / totalBuildings) * 100 : 0;
        const codedBuildings = allBuildings.filter(b => b.isCoded).length;
        const uncodedBuildings = totalBuildings - codedBuildings;
        const byRegionMap = new Map();
        for (const building of allBuildings) {
            const regionName = building.parcelName || '未分配';
            byRegionMap.set(regionName, (byRegionMap.get(regionName) || 0) + 1);
        }
        const byRegion = Array.from(byRegionMap.entries()).map(([name, count]) => ({ name, count }));
        const byUsageMap = new Map();
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
    getUnmappedBuildings() {
        return this.buildingRepository.findAll({ hasLocation: false });
    }
    getQualityStats() {
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
        const byRegionMap = new Map();
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
    isPolygonInsidePolygon(inner, outer) {
        for (const ring of inner.coordinates) {
            for (const coord of ring) {
                const point = {
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
    findOverlappingBuildings(outline, excludeId) {
        const bounds = this.spatialService.getPolygonBounds(outline);
        const candidates = this.buildingRepository.findWithinBounds(bounds.minX, bounds.maxX, bounds.minY, bounds.maxY);
        const overlapping = [];
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
exports.BuildingService = BuildingService;
//# sourceMappingURL=BuildingService.js.map