import { getDb } from '../db';
import type { Building, BuildingWithRelations, FilterParams, Point, Polygon } from '../types';

export class BuildingRepository {
  private db = getDb();

  findAll(params?: FilterParams): BuildingWithRelations[] {
    const conditions: string[] = [];
    const values: any[] = [];

    if (params?.usage && params.usage.length > 0) {
      const placeholders = params.usage.map(() => '?').join(', ');
      conditions.push(`b.usage IN (${placeholders})`);
      values.push(...params.usage);
    }

    if (params?.yearStart !== undefined) {
      conditions.push('b.build_year >= ?');
      values.push(params.yearStart);
    }

    if (params?.yearEnd !== undefined) {
      conditions.push('b.build_year <= ?');
      values.push(params.yearEnd);
    }

    if (params?.isCoded !== undefined) {
      conditions.push('b.is_coded = ?');
      values.push(params.isCoded ? 1 : 0);
    }

    if (params?.hasLocation !== undefined) {
      conditions.push(params.hasLocation ? 'b.location IS NOT NULL' : 'b.location IS NULL');
    }

    if (params?.minLng !== undefined && params?.maxLng !== undefined &&
        params?.minLat !== undefined && params?.maxLat !== undefined) {
      conditions.push(`b.location IS NOT NULL
        AND json_extract(b.location, '$.coordinates[0]') >= ?
        AND json_extract(b.location, '$.coordinates[0]') <= ?
        AND json_extract(b.location, '$.coordinates[1]') >= ?
        AND json_extract(b.location, '$.coordinates[1]') <= ?`);
      values.push(params.minLng, params.maxLng, params.minLat, params.maxLat);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = this.db.prepare(`
      SELECT b.*, p.name AS parcel_name, p.code AS parcel_code, pr.name AS project_name
      FROM buildings b
      LEFT JOIN parcels p ON b.parcel_id = p.id
      LEFT JOIN projects pr ON b.project_id = pr.id
      ${whereClause}
      ORDER BY b.name
    `).all(...values) as any[];

    return rows.map(row => this.mapRowToBuildingWithRelations(row));
  }

  findById(id: string): BuildingWithRelations | null {
    const row = this.db.prepare(`
      SELECT b.*, p.name AS parcel_name, p.code AS parcel_code, pr.name AS project_name
      FROM buildings b
      LEFT JOIN parcels p ON b.parcel_id = p.id
      LEFT JOIN projects pr ON b.project_id = pr.id
      WHERE b.id = ?
    `).get(id) as any;

    return row ? this.mapRowToBuildingWithRelations(row) : null;
  }

  findWithinBounds(minLng: number, maxLng: number, minLat: number, maxLat: number): BuildingWithRelations[] {
    const rows = this.db.prepare(`
      SELECT b.*, p.name AS parcel_name, p.code AS parcel_code, pr.name AS project_name
      FROM buildings b
      LEFT JOIN parcels p ON b.parcel_id = p.id
      LEFT JOIN projects pr ON b.project_id = pr.id
      WHERE b.location IS NOT NULL
        AND json_extract(b.location, '$.coordinates[0]') >= ?
        AND json_extract(b.location, '$.coordinates[0]') <= ?
        AND json_extract(b.location, '$.coordinates[1]') >= ?
        AND json_extract(b.location, '$.coordinates[1]') <= ?
      ORDER BY b.name
    `).all(minLng, maxLng, minLat, maxLat) as any[];

    return rows.map(row => this.mapRowToBuildingWithRelations(row));
  }

  create(data: Omit<Building, 'createdAt' | 'updatedAt'>): Building {
    const location = data.location ? JSON.stringify(data.location) : null;
    const outline = data.outline ? JSON.stringify(data.outline) : null;

    const info = this.db.prepare(`
      INSERT INTO buildings (
        id, name, address, usage, build_year, floors, underground_floors,
        building_area, location, outline, parcel_id, project_id, is_coded, current_stage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.id,
      data.name,
      data.address,
      data.usage,
      data.buildYear,
      data.floors,
      data.undergroundFloors,
      data.buildingArea,
      location,
      outline,
      data.parcelId,
      data.projectId,
      data.isCoded ? 1 : 0,
      data.currentStage
    );

    const row = this.db.prepare(`
      SELECT * FROM buildings WHERE id = ?
    `).get(data.id) as any;

    return this.mapRowToBuilding(row);
  }

  update(id: string, data: Partial<Building>): Building | null {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.address !== undefined) {
      fields.push('address = ?');
      values.push(data.address);
    }
    if (data.usage !== undefined) {
      fields.push('usage = ?');
      values.push(data.usage);
    }
    if (data.buildYear !== undefined) {
      fields.push('build_year = ?');
      values.push(data.buildYear);
    }
    if (data.floors !== undefined) {
      fields.push('floors = ?');
      values.push(data.floors);
    }
    if (data.undergroundFloors !== undefined) {
      fields.push('underground_floors = ?');
      values.push(data.undergroundFloors);
    }
    if (data.buildingArea !== undefined) {
      fields.push('building_area = ?');
      values.push(data.buildingArea);
    }
    if (data.location !== undefined) {
      fields.push('location = ?');
      values.push(data.location ? JSON.stringify(data.location) : null);
    }
    if (data.outline !== undefined) {
      fields.push('outline = ?');
      values.push(data.outline ? JSON.stringify(data.outline) : null);
    }
    if (data.parcelId !== undefined) {
      fields.push('parcel_id = ?');
      values.push(data.parcelId);
    }
    if (data.projectId !== undefined) {
      fields.push('project_id = ?');
      values.push(data.projectId);
    }
    if (data.isCoded !== undefined) {
      fields.push('is_coded = ?');
      values.push(data.isCoded ? 1 : 0);
    }
    if (data.currentStage !== undefined) {
      fields.push('current_stage = ?');
      values.push(data.currentStage);
    }

    if (fields.length === 0) {
      return this.findById(id) as Building | null;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const info = this.db.prepare(`
      UPDATE buildings
      SET ${fields.join(', ')}
      WHERE id = ?
    `).run(...values);

    if (info.changes === 0) {
      return null;
    }

    const row = this.db.prepare(`
      SELECT * FROM buildings WHERE id = ?
    `).get(id) as any;

    return this.mapRowToBuilding(row);
  }

  delete(id: string): boolean {
    const info = this.db.prepare(`
      DELETE FROM buildings WHERE id = ?
    `).run(id);

    return info.changes > 0;
  }

  private mapRowToBuilding(row: any): Building {
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      usage: row.usage,
      buildYear: row.build_year,
      floors: row.floors,
      undergroundFloors: row.underground_floors,
      buildingArea: row.building_area,
      location: row.location ? JSON.parse(row.location) as Point : null,
      outline: row.outline ? JSON.parse(row.outline) as Polygon : null,
      parcelId: row.parcel_id,
      projectId: row.project_id,
      isCoded: row.is_coded === 1,
      currentStage: row.current_stage,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToBuildingWithRelations(row: any): BuildingWithRelations {
    const building = this.mapRowToBuilding(row);
    return {
      ...building,
      parcelName: row.parcel_name,
      parcelCode: row.parcel_code,
      projectName: row.project_name
    };
  }
}
