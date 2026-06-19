"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedlineRepository = void 0;
const db_1 = require("../db");
class RedlineRepository {
    constructor() {
        this.db = (0, db_1.getDb)();
    }
    findAll(type) {
        const where = type ? 'WHERE type = ?' : '';
        const params = type ? [type] : [];
        const rows = this.db.prepare(`
      SELECT id, code, name, type, boundary, description, created_at, updated_at
      FROM redlines
      ${where}
      ORDER BY name
    `).all(...params);
        return rows.map(row => this.mapRow(row));
    }
    findById(id) {
        const row = this.db.prepare(`
      SELECT id, code, name, type, boundary, description, created_at, updated_at
      FROM redlines
      WHERE id = ?
    `).get(id);
        return row ? this.mapRow(row) : null;
    }
    create(data) {
        this.db.prepare(`
      INSERT INTO redlines (id, code, name, type, boundary, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(data.id, data.code, data.name, data.type, JSON.stringify(data.boundary), data.description);
        return this.findById(data.id);
    }
    update(id, data) {
        const fields = [];
        const values = [];
        if (data.code !== undefined) {
            fields.push('code = ?');
            values.push(data.code);
        }
        if (data.name !== undefined) {
            fields.push('name = ?');
            values.push(data.name);
        }
        if (data.type !== undefined) {
            fields.push('type = ?');
            values.push(data.type);
        }
        if (data.boundary !== undefined) {
            fields.push('boundary = ?');
            values.push(JSON.stringify(data.boundary));
        }
        if (data.description !== undefined) {
            fields.push('description = ?');
            values.push(data.description);
        }
        if (fields.length === 0) {
            return this.findById(id);
        }
        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        const info = this.db.prepare(`
      UPDATE redlines SET ${fields.join(', ')} WHERE id = ?
    `).run(...values);
        if (info.changes === 0) {
            return null;
        }
        return this.findById(id);
    }
    delete(id) {
        const info = this.db.prepare(`DELETE FROM redlines WHERE id = ?`).run(id);
        return info.changes > 0;
    }
    mapRow(row) {
        return {
            id: row.id,
            code: row.code,
            name: row.name,
            type: row.type,
            boundary: JSON.parse(row.boundary),
            description: row.description,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
exports.RedlineRepository = RedlineRepository;
//# sourceMappingURL=RedlineRepository.js.map