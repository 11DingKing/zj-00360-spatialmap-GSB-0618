import { getDb } from '../db';
import { v4 as uuidv4 } from 'uuid';
import type { LifeCycleRecord } from '../types';

export class LifeCycleRepository {
  private db = getDb();

  findByBuildingId(buildingId: string): LifeCycleRecord[] {
    const rows = this.db.prepare(`
      SELECT id, building_id, stage, date, operator, remark, created_at
      FROM life_cycle_records
      WHERE building_id = ?
      ORDER BY date ASC
    `).all(buildingId) as any[];

    return rows.map(row => this.mapRowToLifeCycleRecord(row));
  }

  create(data: Omit<LifeCycleRecord, 'id' | 'createdAt'>): LifeCycleRecord {
    const id = uuidv4();

    this.db.prepare(`
      INSERT INTO life_cycle_records (id, building_id, stage, date, operator, remark)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.buildingId,
      data.stage,
      data.date,
      data.operator,
      data.remark
    );

    const row = this.db.prepare(`
      SELECT id, building_id, stage, date, operator, remark, created_at
      FROM life_cycle_records
      WHERE id = ?
    `).get(id) as any;

    return this.mapRowToLifeCycleRecord(row);
  }

  private mapRowToLifeCycleRecord(row: any): LifeCycleRecord {
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
