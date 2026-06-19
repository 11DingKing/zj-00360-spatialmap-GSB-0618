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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedlineRepository = void 0;
const db_1 = require("../db");
const turf = __importStar(require("@turf/turf"));
class RedlineRepository {
    constructor() {
        this.db = (0, db_1.getDb)();
    }
    findAll(type) {
        const conditions = [];
        const values = [];
        if (type) {
            conditions.push('type = ?');
            values.push(type);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const rows = this.db.prepare(`
      SELECT * FROM redlines
      ${whereClause}
      ORDER BY name
    `).all(...values);
        return rows.map(row => this.mapRowToRedline(row));
    }
    findById(id) {
        const row = this.db.prepare(`
      SELECT * FROM redlines WHERE id = ?
    `).get(id);
        return row ? this.mapRowToRedline(row) : null;
    }
    findWithinBounds(minLng, maxLng, minLat, maxLat) {
        const rows = this.db.prepare(`
      SELECT r.* FROM redlines r
      WHERE EXISTS (
        SELECT 1 FROM redline_rtree rt
        WHERE rt.id = r.id
          AND rt.min_x <= ?
          AND rt.max_x >= ?
          AND rt.min_y <= ?
          AND rt.max_y >= ?
      )
      ORDER BY r.name
    `).all(maxLng, minLng, maxLat, minLat);
        return rows.map(row => this.mapRowToRedline(row));
    }
    create(data) {
        const boundary = JSON.stringify(data.boundary);
        const info = this.db.prepare(`
      INSERT INTO redlines (
        id, name, type, description, boundary, area
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(data.id, data.name, data.type, data.description, boundary, data.area);
        this.updateRtreeIndex(data.id, data.boundary);
        const row = this.db.prepare(`
      SELECT * FROM redlines WHERE id = ?
    `).get(data.id);
        return this.mapRowToRedline(row);
    }
    update(id, data) {
        const fields = [];
        const values = [];
        if (data.name !== undefined) {
            fields.push('name = ?');
            values.push(data.name);
        }
        if (data.type !== undefined) {
            fields.push('type = ?');
            values.push(data.type);
        }
        if (data.description !== undefined) {
            fields.push('description = ?');
            values.push(data.description);
        }
        if (data.boundary !== undefined) {
            fields.push('boundary = ?');
            values.push(JSON.stringify(data.boundary));
        }
        if (data.area !== undefined) {
            fields.push('area = ?');
            values.push(data.area);
        }
        if (fields.length === 0) {
            return this.findById(id);
        }
        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        const info = this.db.prepare(`
      UPDATE redlines
      SET ${fields.join(', ')}
      WHERE id = ?
    `).run(...values);
        if (info.changes === 0) {
            return null;
        }
        if (data.boundary) {
            this.updateRtreeIndex(id, data.boundary);
        }
        const row = this.db.prepare(`
      SELECT * FROM redlines WHERE id = ?
    `).get(id);
        return this.mapRowToRedline(row);
    }
    delete(id) {
        this.db.prepare(`
      DELETE FROM redline_rtree WHERE id = ?
    `).run(id);
        const info = this.db.prepare(`
      DELETE FROM redlines WHERE id = ?
    `).run(id);
        return info.changes > 0;
    }
    getTypes() {
        const rows = this.db.prepare(`
      SELECT type, COUNT(*) as count FROM redlines GROUP BY type ORDER BY type
    `).all();
        return rows.map(row => ({
            type: row.type,
            count: row.count
        }));
    }
    updateRtreeIndex(id, boundary) {
        this.db.prepare(`DELETE FROM redline_rtree WHERE id = ?`).run(id);
        const bbox = turf.bbox(boundary);
        this.db.prepare(`
      INSERT INTO redline_rtree (id, min_x, max_x, min_y, max_y)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, bbox[0], bbox[2], bbox[1], bbox[3]);
    }
    mapRowToRedline(row) {
        return {
            id: row.id,
            name: row.name,
            type: row.type,
            description: row.description,
            boundary: JSON.parse(row.boundary),
            area: row.area,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
exports.RedlineRepository = RedlineRepository;
//# sourceMappingURL=RedlineRepository.js.map