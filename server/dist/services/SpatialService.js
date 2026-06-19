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
exports.SpatialService = void 0;
const turf = __importStar(require("@turf/turf"));
const boolean_intersects_1 = __importDefault(require("@turf/boolean-intersects"));
const boolean_within_1 = __importDefault(require("@turf/boolean-within"));
class SpatialService {
    booleanPointInPolygon(point, polygon) {
        return turf.booleanPointInPolygon(point, polygon);
    }
    booleanIntersects(poly1, poly2) {
        return (0, boolean_intersects_1.default)(poly1, poly2);
    }
    isPolygonWithin(inner, outer) {
        return (0, boolean_within_1.default)(inner, outer);
    }
    polygonIntersectsPolygon(poly1, poly2) {
        return (0, boolean_intersects_1.default)(poly1, poly2);
    }
    getPolygonBounds(polygon) {
        const bbox = turf.bbox(polygon);
        return {
            minX: bbox[0],
            minY: bbox[1],
            maxX: bbox[2],
            maxY: bbox[3],
        };
    }
    calculateArea(polygon) {
        return turf.area(polygon);
    }
    getPolygonCenter(polygon) {
        const center = turf.centerOfMass(polygon);
        return {
            type: "Point",
            coordinates: center.geometry.coordinates,
        };
    }
    isPointInBounds(point, bounds) {
        const [lng, lat] = point.coordinates;
        return (lng >= bounds.minX &&
            lng <= bounds.maxX &&
            lat >= bounds.minY &&
            lat <= bounds.maxY);
    }
    coordsToPolygon(coordinates) {
        const closed = [...coordinates];
        if (coordinates.length > 0 &&
            (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
                coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
            closed.push(coordinates[0]);
        }
        return {
            type: "Polygon",
            coordinates: [closed.map(([lat, lng]) => [lng, lat])],
        };
    }
}
exports.SpatialService = SpatialService;
//# sourceMappingURL=SpatialService.js.map