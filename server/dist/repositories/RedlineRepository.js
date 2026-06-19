"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedlineRepository = void 0;
const db_1 = require("../db");
class RedlineRepository {
    constructor() {
        this.db = (0, db_1.getDb)();
    }
    findAll(type) {
        let sql = 'SELECT id, name, type, description, boundary, area, created_at, updated_at FROM redlines';
        const values = [];
        if (type) {
            sql += ' WHERE type = ?';
            values.push(type);
        }
        sql += ' ORDER BY type, name';
        const rows = this.db.prepare(sql).all(...values);
        return rows.map(row => this.mapRowToRedline(row));
    }
    findById(id) {
        const row = this.db.prepare(`
      SELECT id, name, type, description, boundary, area, created_at, updated_at
      FROM redlines
      WHERE id = ?
    `).get(id);
        return row ? this.mapRowToRedline(row) : null;
    }
    findWithinBounds(minLng, maxLng, minLat, maxLat) {
        const rows = this.db.prepare(`
      SELECT id, name, type, description, boundary, area, created_at, updated_at
      FROM redlines
    `).all();
        return rows
            .map(row => this.mapRowToRedline(row))
            .filter(redline => {
            const coords = redline.boundary.coordinates[0];
            return coords.some(([lng, lat]) => lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat);
        });
    }
    findAllForAnalysis() {
        const rows = this.db.prepare(`
      SELECT id, name, type, description, boundary, area, created_at, updated_at
      FROM redlines
    `).all();
        return rows.map(row => this.mapRowToRedline(row));
    }
    create(data) {
        const boundary = JSON.stringify(data.boundary);
        this.db.prepare(`
      INSERT INTO redlines (id, name, type, description, boundary, area)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(data.id, data.name, data.type, data.description, boundary, data.area);
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
        const typeNames = {
            ecological: '生态保护红线',
            heritage: '历史街区保护线',
            farmland: '永久基本农田',
            water: '河湖蓝线',
            infrastructure: '基础设施控制线',
            other: '其他管控线'
        };
        return rows.map(row => ({
            type: row.type,
            name: typeNames[row.type] || '其他',
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
            area: row.area,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
exports.RedlineRepository = RedlineRepository;
//# sourceMappingURL=RedlineRepository.js.map