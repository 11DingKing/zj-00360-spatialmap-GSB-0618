import { getDb } from '../db';
import type { Project } from '../types';

export class ProjectRepository {
  private db = getDb();

  findAll(): Project[] {
    const rows = this.db.prepare(`
      SELECT id, name, developer, start_date, end_date, created_at, updated_at
      FROM projects
      ORDER BY name
    `).all() as any[];
    
    return rows.map(row => this.mapRowToProject(row));
  }

  findById(id: string): Project | null {
    const row = this.db.prepare(`
      SELECT id, name, developer, start_date, end_date, created_at, updated_at
      FROM projects
      WHERE id = ?
    `).get(id) as any;
    
    return row ? this.mapRowToProject(row) : null;
  }

  private mapRowToProject(row: any): Project {
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
