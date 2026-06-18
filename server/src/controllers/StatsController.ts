import { Request, Response, Router } from 'express';
import { BuildingService } from '../services/BuildingService';

export class StatsController {
  private buildingService: BuildingService;
  public router: Router;

  constructor(buildingService?: BuildingService) {
    this.buildingService = buildingService || new BuildingService();
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get('/overview', this.getOverview.bind(this));
    this.router.get('/unmapped', this.getUnmapped.bind(this));
    this.router.get('/quality', this.getQuality.bind(this));
  }

  private getOverview(req: Request, res: Response): void {
    const stats = this.buildingService.getOverviewStats();

    res.json({
      success: true,
      message: '获取成功',
      data: stats
    });
  }

  private getUnmapped(req: Request, res: Response): void {
    const buildings = this.buildingService.getUnmappedBuildings();

    res.json({
      success: true,
      message: '获取成功',
      data: buildings
    });
  }

  private getQuality(req: Request, res: Response): void {
    const stats = this.buildingService.getQualityStats();

    res.json({
      success: true,
      message: '获取成功',
      data: stats
    });
  }
}
