import { getDb } from '../db';
import type { Redline, RedlineType, Polygon } from '../types';

export class RedlineRepository {
  private db = getDb();

  findAll(type?: RedlineType): Redline[] {
    const conditions: string[] = [];
    const values: any[] = [];

    if (type) {
      conditions.push('type = ?');
      values.push(type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = this.db.prepare(`
      SELECT * FROM redlines
      ${whereClause}
      ORDER BY name
    `).all(...values) as any[];

    return rows.map(row => this.mapRowToRedline(row));
  }

  findById(id: string): Redline | null {
    const row = this.db.prepare(`
      SELECT * FROM redlines WHERE id = ?
    `).get(id) as any;

    return row ? this.mapRowToRedline(row) : null;
  }

  findByType(type: RedlineType): Redline[] {
    return this.findAll(type);
  }

  findWithinBounds(minLng: number, maxLng: number, minLat: number, maxLat: number): Redline[] {
    const rows = this.db.prepare(`
      SELECT * FROM redlines
      WHERE boundary IS NOT NULL
      ORDER BY name
    `).all() as any[];

    const allRedlines = rows.map(row => this.mapRowToRedline(row));
    return allRedlines;
  }

  create(data: Omit<Redline, 'createdAt' | 'updatedAt'>): Redline {
    const boundary = JSON.stringify(data.boundary);

    this.db.prepare(`
      INSERT INTO redlines (
        id, name, type, description, boundary, color
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      data.id,
      data.name,
      data.type,
      data.description,
      boundary,
      data.color
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
    `).get(id) as any;

    return this.mapRowToRedline(row);
  }

  delete(id: string): boolean {
    const info = this.db.prepare(`
      DELETE FROM redlines WHERE id = ?
    `).run(id);

    return info.changes > 0;
  }

  getTypes(): { type: RedlineType; count: number }[] {
    const rows = this.db.prepare(`
      SELECT type, COUNT(*) as count
      FROM redlines
      GROUP BY type
      ORDER BY type
    `).all() as any[];

    return rows.map(row => ({
      type: row.type as RedlineType,
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
      color: row.color,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
