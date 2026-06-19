"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParcelRepository = void 0;
const db_1 = require("../db");
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
    findWithinBounds(minLng, maxLng, minLat, maxLat) {
        const rows = this.db
            .prepare(`
      SELECT id, code, name, boundary, area, created_at, updated_at
      FROM parcels
    `)
            .all();
        return rows
            .map((row) => this.mapRowToParcel(row))
            .filter((parcel) => {
            const coords = parcel.boundary.coordinates[0];
            return coords.some(([lng, lat]) => lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat);
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