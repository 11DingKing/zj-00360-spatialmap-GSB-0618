import * as turf from "@turf/turf";
import booleanIntersects from "@turf/boolean-intersects";
import booleanWithin from "@turf/boolean-within";
import type { Point, Polygon } from "../types";

export class SpatialService {
  booleanPointInPolygon(point: Point, polygon: Polygon): boolean {
    return turf.booleanPointInPolygon(point, polygon);
  }

  booleanIntersects(poly1: Polygon, poly2: Polygon): boolean {
    return booleanIntersects(poly1, poly2);
  }

  isPolygonWithin(inner: Polygon, outer: Polygon): boolean {
    return booleanWithin(inner, outer);
  }

  polygonIntersectsPolygon(poly1: Polygon, poly2: Polygon): boolean {
    return booleanIntersects(poly1, poly2);
  }

  getPolygonBounds(polygon: Polygon): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } {
    const bbox = turf.bbox(polygon);
    return {
      minX: bbox[0],
      minY: bbox[1],
      maxX: bbox[2],
      maxY: bbox[3],
    };
  }

  calculateArea(polygon: Polygon): number {
    return turf.area(polygon);
  }

  getPolygonCenter(polygon: Polygon): Point {
    const center = turf.centerOfMass(polygon);
    return {
      type: "Point",
      coordinates: center.geometry.coordinates as [number, number],
    };
  }

  isPointInBounds(
    point: Point,
    bounds: { minX: number; maxX: number; minY: number; maxY: number },
  ): boolean {
    const [lng, lat] = point.coordinates;
    return (
      lng >= bounds.minX &&
      lng <= bounds.maxX &&
      lat >= bounds.minY &&
      lat <= bounds.maxY
    );
  }

  coordsToPolygon(coordinates: [number, number][]): Polygon {
    const closed = [...coordinates];
    if (
      coordinates.length > 0 &&
      (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
        coordinates[0][1] !== coordinates[coordinates.length - 1][1])
    ) {
      closed.push(coordinates[0]);
    }
    return {
      type: "Polygon",
      coordinates: [closed.map(([lat, lng]) => [lng, lat])],
    };
  }
}
