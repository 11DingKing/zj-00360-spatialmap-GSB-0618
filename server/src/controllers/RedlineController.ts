import { Request, Response, Router } from "express";
import { RedlineService } from "../services/RedlineService";
import type { Polygon, RedlineType } from "../types";

export class RedlineController {
  private redlineService: RedlineService;
  public router: Router;

  constructor(redlineService?: RedlineService) {
    this.redlineService = redlineService || new RedlineService();
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get("/", this.getRedlines.bind(this));
    this.router.post("/analyze", this.analyzeArea.bind(this));
    this.router.get("/:id", this.getRedline.bind(this));
    this.router.post("/", this.createRedline.bind(this));
    this.router.put("/:id", this.updateRedline.bind(this));
    this.router.delete("/:id", this.deleteRedline.bind(this));
  }

  private getRedlines(req: Request, res: Response): void {
    const { type } = req.query;
    const redlines = this.redlineService.getAllRedlines(
      type ? (type as RedlineType) : undefined,
    );

    res.json({
      success: true,
      message: "获取成功",
      data: redlines,
    });
  }

  private getRedline(req: Request, res: Response): void {
    const { id } = req.params;
    const redline = this.redlineService.getRedlineById(id);

    if (!redline) {
      res.status(404).json({
        success: false,
        message: "管控线不存在",
        data: null,
      });
      return;
    }

    res.json({
      success: true,
      message: "获取成功",
      data: redline,
    });
  }

  private createRedline(req: Request, res: Response): void {
    const { code, name, type, boundary, description } = req.body;

    if (!code || !name || !type || !boundary) {
      res.status(400).json({
        success: false,
        message: "缺少必要参数: code, name, type, boundary",
        data: null,
      });
      return;
    }

    const redline = this.redlineService.createRedline({
      code,
      name,
      type: type as RedlineType,
      boundary: boundary as Polygon,
      description: description ?? null,
    });

    res.status(201).json({
      success: true,
      message: "创建成功",
      data: redline,
    });
  }

  private updateRedline(req: Request, res: Response): void {
    const { id } = req.params;
    const redline = this.redlineService.updateRedline(id, req.body);

    if (!redline) {
      res.status(404).json({
        success: false,
        message: "管控线不存在",
        data: null,
      });
      return;
    }

    res.json({
      success: true,
      message: "更新成功",
      data: redline,
    });
  }

  private deleteRedline(req: Request, res: Response): void {
    const { id } = req.params;
    const deleted = this.redlineService.deleteRedline(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "管控线不存在",
        data: null,
      });
      return;
    }

    res.json({
      success: true,
      message: "删除成功",
      data: null,
    });
  }

  private analyzeArea(req: Request, res: Response): void {
    const { area } = req.body;

    if (!area || area.type !== "Polygon" || !Array.isArray(area.coordinates)) {
      res.status(400).json({
        success: false,
        message: "缺少必要参数: area (Polygon)",
        data: null,
      });
      return;
    }

    const result = this.redlineService.analyzeArea(area as Polygon);

    res.json({
      success: true,
      message: "分析完成",
      data: result,
    });
  }
}
