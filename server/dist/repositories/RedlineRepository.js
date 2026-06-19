"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedlineRepository = void 0;
const db_1 = require("../db");
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
    findByType(type) {
        return this.findAll(type);
    }
    findWithinBounds(minLng, maxLng, minLat, maxLat) {
        const rows = this.db.prepare(`
      SELECT * FROM redlines
      WHERE boundary IS NOT NULL
      ORDER BY name
    `).all();
        const allRedlines = rows.map(row => this.mapRowToRedline(row));
        return allRedlines;
    }
    create(data) {
        const boundary = JSON.stringify(data.boundary);
        this.db.prepare(`
      INSERT INTO redlines (
        id, name, type, description, boundary, color
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(data.id, data.name, data.type, data.description, boundary, data.color);
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
        if (data.color !== undefined) {
            fields.push('color = ?');
            values.push(data.color);
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
        const row = this.db.prepare(`
      SELECT * FROM redlines WHERE id = ?
    `).get(id);
        return this.mapRowToRedline(row);
    }
    delete(id) {
        const info = this.db.prepare(`
      DELETE FROM redlines WHERE id = ?
    `).run(id);
        return info.changes > 0;
    }
    getTypes() {
        const rows = this.db.prepare(`
      SELECT type, COUNT(*) as count
      FROM redlines
      GROUP BY type
      ORDER BY type
    `).all();
        return rows.map(row => ({
            type: row.type,
            count: row.count
        }));
    }
    mapRowToRedline(row) {
        return {
            id: row.id,
            name: row.name,
            type: row.type,
            description: row.description,
            boundary: JSON.parse(row.boundary),
            color: row.color,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
exports.RedlineRepository = RedlineRepository;
//# sourceMappingURL=RedlineRepository.js.map