import * as turf from '@turf/turf';
import booleanIntersects from '@turf/boolean-intersects';
import type { Point, Polygon } from '../types';

export class SpatialService {
  booleanPointInPolygon(point: Point, polygon: Polygon): boolean {
    return turf.booleanPointInPolygon(point, polygon);
  }

  booleanIntersects(poly1: Polygon, poly2: Polygon): boolean {
    return booleanIntersects(poly1, poly2);
  }

  polygonIntersects(queryPoly: Polygon, targetPoly: Polygon): boolean {
    return this.booleanIntersects(queryPoly, targetPoly);
  }

  getPolygonBounds(polygon: Polygon): { minX: number; maxX: number; minY: number; maxY: number } {
    const bbox = turf.bbox(polygon);
    return {
      minX: bbox[0],
      minY: bbox[1],
      maxX: bbox[2],
      maxY: bbox[3]
    };
  }

  calculateArea(polygon: Polygon): number {
    return turf.area(polygon);
  }

  polygonFromPoints(points: [number, number][]): Polygon {
    const closed = points.length > 0 && 
      (points[0][0] !== points[points.length - 1][0] || points[0][1] !== points[points.length - 1][1])
      ? [...points, points[0]]
      : points;
    return {
      type: 'Polygon',
      coordinates: [closed.map(([lat, lng]) => [lng, lat])]
    };
  }
}
