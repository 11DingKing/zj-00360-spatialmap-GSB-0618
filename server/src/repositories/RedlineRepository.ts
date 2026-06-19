import { getDb } from '../db';
import type { Polygon, Redline, RedlineType } from '../types';

export class RedlineRepository {
  private db = getDb();

  findAll(type?: RedlineType): Redline[] {
    const where = type ? 'WHERE type = ?' : '';
    const params = type ? [type] : [];
    const rows = this.db.prepare(`
      SELECT id, code, name, type, boundary, description, created_at, updated_at
      FROM redlines
      ${where}
      ORDER BY name
    `).all(...params) as any[];

    return rows.map(row => this.mapRow(row));
  }

  findById(id: string): Redline | null {
    const row = this.db.prepare(`
      SELECT id, code, name, type, boundary, description, created_at, updated_at
      FROM redlines
      WHERE id = ?
    `).get(id) as any;

    return row ? this.mapRow(row) : null;
  }

  create(data: Omit<Redline, 'createdAt' | 'updatedAt'>): Redline {
    this.db.prepare(`
      INSERT INTO redlines (id, code, name, type, boundary, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      data.id,
      data.code,
      data.name,
      data.type,
      JSON.stringify(data.boundary),
      data.description
    );

    return this.findById(data.id) as Redline;
  }

  update(id: string, data: Partial<Redline>): Redline | null {
    const fields: string[] = [];
    const values: any[] = [];

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

  delete(id: string): boolean {
    const info = this.db.prepare(`DELETE FROM redlines WHERE id = ?`).run(id);
    return info.changes > 0;
  }

  private mapRow(row: any): Redline {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      type: row.type as RedlineType,
      boundary: JSON.parse(row.boundary) as Polygon,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
