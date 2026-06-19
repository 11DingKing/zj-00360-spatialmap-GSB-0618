"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParcelRepository = void 0;
const db_1 = require("../db");
const boolean_intersects_1 = __importDefault(require("@turf/boolean-intersects"));
class ParcelRepository {
    constructor() {
        this.db = (0, db_1.getDb)();
    }
    findAll() {
        const rows = this.db
            .prepare(`
      SELECT id, code, name, boundary, area, created_at, updated_at
      FROM parcels
      ORDER BY name
    `)
            .all();
        return rows.map((row) => this.mapRowToParcel(row));
    }
    findById(id) {
        const row = this.db
            .prepare(`
      SELECT id, code, name, boundary, area, created_at, updated_at
      FROM parcels
      WHERE id = ?
    `)
            .get(id);
        return row ? this.mapRowToParcel(row) : null;
    }
    findIntersectingPolygon(polygon) {
        const allParcels = this.findAll();
        return allParcels.filter((parcel) => {
            try {
                return (0, boolean_intersects_1.default)(polygon, parcel.boundary);
            }
            catch {
                return false;
            }
        });
    }
    mapRowToParcel(row) {
        return {
            id: row.id,
            code: row.code,
            name: row.name,
            boundary: JSON.parse(row.boundary),
            area: row.area,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
exports.ParcelRepository = ParcelRepository;
//# sourceMappingURL=ParcelRepository.js.map