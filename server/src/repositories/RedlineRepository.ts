import { getDb } from '../db';
import type { Redline, RedlineType, Polygon } from '../types';
import * as turf from '@turf/turf';

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

  findWithinBounds(minLng: number, maxLng: number, minLat: number, maxLat: number): Redline[] {
    const allRedlines = this.findAll();
    const queryBbox = [minLng, minLat, maxLng, maxLat];

    return allRedlines.filter(redline => {
      const rBbox = turf.bbox(redline.boundary);
      return !(
        rBbox[2] < queryBbox[0] ||
        rBbox[0] > queryBbox[2] ||
        rBbox[3] < queryBbox[1] ||
        rBbox[1] > queryBbox[3]
      );
    });
  }

  create(data: Omit<Redline, 'createdAt' | 'updatedAt'>): Redline {
    const boundary = JSON.stringify(data.boundary);

    const info = this.db.prepare(`
      INSERT INTO redlines (
        id, name, type, description, boundary, area
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      data.id,
      data.name,
      data.type,
      data.description,
      boundary,
      data.area
    );

    this.updateRtreeIndex(data.id, data.boundary);

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

    if (data.boundary) {
      this.updateRtreeIndex(id, data.boundary);
    }

    const row = this.db.prepare(`
      SELECT * FROM redlines WHERE id = ?
    `).get(id) as any;

    return this.mapRowToRedline(row);
  }

  delete(id: string): boolean {
    this.db.prepare(`
      DELETE FROM redline_rtree WHERE id = ?
    `).run(id);

    const info = this.db.prepare(`
      DELETE FROM redlines WHERE id = ?
    `).run(id);

    return info.changes > 0;
  }

  getTypes(): { type: RedlineType; count: number }[] {
    const rows = this.db.prepare(`
      SELECT type, COUNT(*) as count FROM redlines GROUP BY type ORDER BY type
    `).all() as any[];

    return rows.map(row => ({
      type: row.type as RedlineType,
      count: row.count
    }));
  }

  private updateRtreeIndex(id: string, boundary: Polygon): void {
    this.db.prepare(`DELETE FROM redline_rtree WHERE id = ?`).run(id);

    const bbox = turf.bbox(boundary);
    this.db.prepare(`
      INSERT INTO redline_rtree (id, min_x, max_x, min_y, max_y)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, bbox[0], bbox[2], bbox[1], bbox[3]);
  }

  private mapRowToRedline(row: any): Redline {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      boundary: JSON.parse(row.boundary) as Polygon,
      area: row.area,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
