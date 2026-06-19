import { getDb } from "../db";
import type { Parcel, Polygon } from "../types";
import * as turf from "@turf/turf";
import booleanIntersects from "@turf/boolean-intersects";

export class ParcelRepository {
  private db = getDb();

  findAll(): Parcel[] {
    const rows = this.db
      .prepare(
        `
      SELECT id, code, name, boundary, area, created_at, updated_at
      FROM parcels
      ORDER BY name
    `,
      )
      .all() as any[];

    return rows.map((row) => this.mapRowToParcel(row));
  }

  findById(id: string): Parcel | null {
    const row = this.db
      .prepare(
        `
      SELECT id, code, name, boundary, area, created_at, updated_at
      FROM parcels
      WHERE id = ?
    `,
      )
      .get(id) as any;

    return row ? this.mapRowToParcel(row) : null;
  }

  findIntersectingPolygon(polygon: Polygon): Parcel[] {
    const allParcels = this.findAll();

    return allParcels.filter((parcel) => {
      try {
        return booleanIntersects(polygon, parcel.boundary);
      } catch {
        return false;
      }
    });
  }

  private mapRowToParcel(row: any): Parcel {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      boundary: JSON.parse(row.boundary) as Polygon,
      area: row.area,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
