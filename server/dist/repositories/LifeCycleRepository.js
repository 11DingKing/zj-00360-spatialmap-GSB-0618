"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifeCycleRepository = void 0;
const db_1 = require("../db");
const uuid_1 = require("uuid");
class LifeCycleRepository {
    constructor() {
        this.db = (0, db_1.getDb)();
    }
    findByBuildingId(buildingId) {
        const rows = this.db.prepare(`
      SELECT id, building_id, stage, date, operator, remark, created_at
      FROM life_cycle_records
      WHERE building_id = ?
      ORDER BY date ASC
    `).all(buildingId);
        return rows.map(row => this.mapRowToLifeCycleRecord(row));
    }
    create(data) {
        const id = (0, uuid_1.v4)();
        this.db.prepare(`
      INSERT INTO life_cycle_records (id, building_id, stage, date, operator, remark)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.buildingId, data.stage, data.date, data.operator, data.remark);
        const row = this.db.prepare(`
      SELECT id, building_id, stage, date, operator, remark, created_at
      FROM life_cycle_records
      WHERE id = ?
    `).get(id);
        return this.mapRowToLifeCycleRecord(row);
    }
    mapRowToLifeCycleRecord(row) {
        return {
            id: row.id,
            buildingId: row.building_id,
            stage: row.stage,
            date: row.date,
            operator: row.operator,
            remark: row.remark,
            createdAt: row.created_at
        };
    }
}
exports.LifeCycleRepository = LifeCycleRepository;
//# sourceMappingURL=LifeCycleRepository.js.map