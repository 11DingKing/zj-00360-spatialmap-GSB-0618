"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedlineService = void 0;
const crypto_1 = require("crypto");
const turf = __importStar(require("@turf/turf"));
const boolean_intersects_1 = __importDefault(require("@turf/boolean-intersects"));
const RedlineRepository_1 = require("../repositories/RedlineRepository");
const BuildingRepository_1 = require("../repositories/BuildingRepository");
const ParcelRepository_1 = require("../repositories/ParcelRepository");
const REDLINE_TYPE_NAMES = {
    ecological: '生态红线',
    heritage: '历史街区保护线',
    cultural: '文物保护线',
    infrastructure: '基础设施管控线',
    agricultural: '永久基本农田',
    other: '其他管控线'
};
class RedlineService {
    constructor(redlineRepository, buildingRepository, parcelRepository) {
        this.redlineRepository = redlineRepository || new RedlineRepository_1.RedlineRepository();
        this.buildingRepository = buildingRepository || new BuildingRepository_1.BuildingRepository();
        this.parcelRepository = parcelRepository || new ParcelRepository_1.ParcelRepository();
    }
    getRedlines(type) {
        return this.redlineRepository.findAll(type);
    }
    getRedlineById(id) {
        return this.redlineRepository.findById(id);
    }
    createRedline(data) {
        const area = turf.area(data.boundary);
        return this.redlineRepository.create({
            id: (0, crypto_1.randomUUID)(),
            name: data.name,
            type: data.type,
            description: data.description || null,
            boundary: data.boundary,
            area
        });
    }
    updateRedline(id, data) {
        const updateData = { ...data };
        if (data.boundary) {
            updateData.area = turf.area(data.boundary);
        }
        return this.redlineRepository.update(id, updateData);
    }
    deleteRedline(id) {
        return this.redlineRepository.delete(id);
    }
    getRedlineTypes() {
        const typeCounts = this.redlineRepository.getTypes();
        return typeCounts.map(tc => ({
            type: tc.type,
            name: REDLINE_TYPE_NAMES[tc.type] || tc.type,
            count: tc.count
        }));
    }
    analyzeArea(selectionPolygon) {
        const bbox = turf.bbox(selectionPolygon);
        const nearbyRedlines = this.redlineRepository.findWithinBounds(bbox[0], bbox[2], bbox[1], bbox[3]);
        const allBuildings = this.buildingRepository.findWithinBounds(bbox[0], bbox[2], bbox[1], bbox[3]);
        const intersectingParcels = this.parcelRepository.findIntersectingPolygon(selectionPolygon);
        const buildingsInArea = allBuildings.filter(building => {
            if (!building.outline) {
                return building.location ? turf.booleanPointInPolygon(building.location, selectionPolygon) : false;
            }
            try {
                return (0, boolean_intersects_1.default)(selectionPolygon, building.outline);
            }
            catch {
                return false;
            }
        });
        const buildingsWithConflicts = buildingsInArea.map(building => {
            const conflicts = [];
            if (building.outline) {
                for (const redline of nearbyRedlines) {
                    try {
                        if ((0, boolean_intersects_1.default)(building.outline, redline.boundary)) {
                            conflicts.push({
                                redlineId: redline.id,
                                redlineName: redline.name,
                                redlineType: redline.type
                            });
                        }
                    }
                    catch {
                    }
                }
            }
            return {
                ...building,
                hasConflict: conflicts.length > 0,
                conflicts
            };
        });
        const conflictTypeMap = new Map();
        let totalConflicts = 0;
        buildingsWithConflicts.forEach(b => {
            const addedTypes = new Set();
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
    static getRedlineTypeName(type) {
        return REDLINE_TYPE_NAMES[type] || type;
    }
}
exports.RedlineService = RedlineService;
//# sourceMappingURL=RedlineService.js.map