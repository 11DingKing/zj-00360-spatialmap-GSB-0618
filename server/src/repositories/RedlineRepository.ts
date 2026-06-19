import { getDb } from '../db';
import type { Redline, RedlineType, Polygon } from '../types';

export class RedlineRepository {
  private db = getDb();

  findAll(type?: RedlineType): Redline[] {
    let sql = 'SELECT id, name, type, description, boundary, area, created_at, updated_at FROM redlines';
    const values: any[] = [];

    if (type) {
      sql += ' WHERE type = ?';
      values.push(type);
    }

    sql += ' ORDER BY type, name';

    const rows = this.db.prepare(sql).all(...values) as any[];
    return rows.map(row => this.mapRowToRedline(row));
  }

  findById(id: string): Redline | null {
    const row = this.db.prepare(`
      SELECT id, name, type, description, boundary, area, created_at, updated_at
      FROM redlines
      WHERE id = ?
    `).get(id) as any;

    return row ? this.mapRowToRedline(row) : null;
  }

  findWithinBounds(minLng: number, maxLng: number, minLat: number, maxLat: number): Redline[] {
    const rows = this.db.prepare(`
      SELECT id, name, type, description, boundary, area, created_at, updated_at
      FROM redlines
    `).all() as any[];

    return rows
      .map(row => this.mapRowToRedline(row))
      .filter(redline => {
        const coords = redline.boundary.coordinates[0];
        return coords.some(([lng, lat]) => 
          lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat
        );
      });
  }

  findAllForAnalysis(): Redline[] {
    const rows = this.db.prepare(`
      SELECT id, name, type, description, boundary, area, created_at, updated_at
      FROM redlines
    `).all() as any[];

    return rows.map(row => this.mapRowToRedline(row));
  }

  create(data: Omit<Redline, 'createdAt' | 'updatedAt'>): Redline {
    const boundary = JSON.stringify(data.boundary);

    this.db.prepare(`
      INSERT INTO redlines (id, name, type, description, boundary, area)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      data.id,
      data.name,
      data.type,
      data.description,
      boundary,
      data.area
    );

    const row = this.db.prepare(`
      SELECT * FROM redlines WHERE id = ?
    `).get(data.id) as any;

    return this.mapRowToRedline(row);
  }

  update(id: string, data: Partial<Redline>): Redline | null {
    const fields: string[] = [];
    const values: any[] = [];

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
    `).get(id) as any;

    return this.mapRowToRedline(row);
  }

  delete(id: string): boolean {
    const info = this.db.prepare(`
      DELETE FROM redlines WHERE id = ?
    `).run(id);

    return info.changes > 0;
  }

  getTypes(): { type: RedlineType; name: string; count: number }[] {
    const rows = this.db.prepare(`
      SELECT type, COUNT(*) as count
      FROM redlines
      GROUP BY type
      ORDER BY type
    `).all() as any[];

    const typeNames: Record<RedlineType, string> = {
      ecological: '生态保护红线',
      heritage: '历史街区保护线',
      farmland: '永久基本农田',
      water: '河湖蓝线',
      infrastructure: '基础设施控制线',
      other: '其他管控线'
    };

    return rows.map(row => ({
      type: row.type as RedlineType,
      name: typeNames[row.type as RedlineType] || '其他',
      count: row.count
    }));
  }

  private mapRowToRedline(row: any): Redline {
    return {
      id: row.id,
      name: row.name,
      type: row.type as RedlineType,
      description: row.description,
      boundary: JSON.parse(row.boundary) as Polygon,
      area: row.area,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
