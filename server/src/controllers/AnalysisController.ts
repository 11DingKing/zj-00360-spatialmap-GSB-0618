import { Request, Response, Router } from 'express';
import { AnalysisService } from '../services/AnalysisService';
import { SpatialService } from '../services/SpatialService';
import type { Polygon } from '../types';

export class AnalysisController {
  private analysisService: AnalysisService;
  private spatialService: SpatialService;
  public router: Router;

  constructor(analysisService?: AnalysisService, spatialService?: SpatialService) {
    this.analysisService = analysisService || new AnalysisService();
    this.spatialService = spatialService || new SpatialService();
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.post('/conflict-check', this.conflictCheck.bind(this));
  }

  private conflictCheck(req: Request, res: Response): void {
    const { polygon, points } = req.body;

    let queryPolygon: Polygon;

    if (polygon) {
      queryPolygon = polygon as Polygon;
    } else if (points && Array.isArray(points) && points.length >= 3) {
      queryPolygon = this.spatialService.polygonFromPoints(points as [number, number][]);
    } else {
      res.status(400).json({
        success: false,
        message: '缺少必要参数: polygon (GeoJSON Polygon) 或 points (顶点数组 [[lat,lng],...])',
        data: null
      });
      return;
    }

    try {
      const result = this.analysisService.analyzeArea(queryPolygon);

      res.json({
        success: true,
        message: '分析完成',
        data: result
      });
    } catch (error) {
      console.error('分析失败:', error);
      res.status(500).json({
        success: false,
        message: '分析过程中发生错误',
        data: null
      });
    }
  }
}
