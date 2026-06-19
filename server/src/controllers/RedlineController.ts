import { Request, Response, Router } from 'express';
import { RedlineService } from '../services/RedlineService';
import type { RedlineType, Polygon } from '../types';

export class RedlineController {
  private redlineService: RedlineService;
  public router: Router;

  constructor(redlineService?: RedlineService) {
    this.redlineService = redlineService || new RedlineService();
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get('/', this.getRedlines.bind(this));
    this.router.get('/types', this.getRedlineTypes.bind(this));
    this.router.get('/:id', this.getRedline.bind(this));
    this.router.post('/', this.createRedline.bind(this));
    this.router.put('/:id', this.updateRedline.bind(this));
    this.router.delete('/:id', this.deleteRedline.bind(this));
    this.router.post('/analyze', this.analyzeArea.bind(this));
  }

  private getRedlines(req: Request, res: Response): void {
    const { type } = req.query;
    const redlines = this.redlineService.getRedlines(type as RedlineType | undefined);

    res.json({
      success: true,
      message: '获取成功',
      data: redlines
    });
  }

  private getRedline(req: Request, res: Response): void {
    const { id } = req.params;
    const redline = this.redlineService.getRedlineById(id);

    if (!redline) {
      res.status(404).json({
        success: false,
        message: '管控线不存在',
        data: null
      });
      return;
    }

    res.json({
      success: true,
      message: '获取成功',
      data: redline
    });
  }

  private createRedline(req: Request, res: Response): void {
    const { name, type, description, boundary } = req.body;

    if (!name || !type || !boundary) {
      res.status(400).json({
        success: false,
        message: '缺少必要参数: name, type, boundary',
        data: null
      });
      return;
    }

    const redline = this.redlineService.createRedline({
      name,
      type,
      description,
      boundary
    });

    res.status(201).json({
      success: true,
      message: '创建成功',
      data: redline
    });
  }

  private updateRedline(req: Request, res: Response): void {
    const { id } = req.params;
    const redline = this.redlineService.updateRedline(id, req.body);

    if (!redline) {
      res.status(404).json({
        success: false,
        message: '管控线不存在',
        data: null
      });
      return;
    }

    res.json({
      success: true,
      message: '更新成功',
      data: redline
    });
  }

  private deleteRedline(req: Request, res: Response): void {
    const { id } = req.params;
    const deleted = this.redlineService.deleteRedline(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: '管控线不存在',
        data: null
      });
      return;
    }

    res.json({
      success: true,
      message: '删除成功',
      data: null
    });
  }

  private getRedlineTypes(req: Request, res: Response): void {
    const types = this.redlineService.getRedlineTypes();

    res.json({
      success: true,
      message: '获取成功',
      data: types
    });
  }

  private analyzeArea(req: Request, res: Response): void {
    const { polygon } = req.body;

    if (!polygon) {
      res.status(400).json({
        success: false,
        message: '缺少必要参数: polygon',
        data: null
      });
      return;
    }

    try {
      const result = this.redlineService.analyzeArea(polygon as Polygon);

      res.json({
        success: true,
        message: '分析完成',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '分析失败: ' + (error as Error).message,
        data: null
      });
    }
  }
}
