"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectRepository = void 0;
const db_1 = require("../db");
class ProjectRepository {
    constructor() {
        this.db = (0, db_1.getDb)();
    }
    findAll() {
        const rows = this.db.prepare(`
      SELECT id, name, developer, start_date, end_date, created_at, updated_at
      FROM projects
      ORDER BY name
    `).all();
        return rows.map(row => this.mapRowToProject(row));
    }
    findById(id) {
        const row = this.db.prepare(`
      SELECT id, name, developer, start_date, end_date, created_at, updated_at
      FROM projects
      WHERE id = ?
    `).get(id);
        return row ? this.mapRowToProject(row) : null;
    }
    mapRowToProject(row) {
        return {
            id: row.id,
            name: row.name,
            developer: row.developer,
            startDate: row.start_date,
            endDate: row.end_date,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
exports.ProjectRepository = ProjectRepository;
//# sourceMappingURL=ProjectRepository.js.map