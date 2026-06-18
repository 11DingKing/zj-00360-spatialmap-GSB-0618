import { Request, Response, Router } from 'express';
import { ParcelService } from '../services/ParcelService';

export class ParcelController {
  private parcelService: ParcelService;
  public router: Router;

  constructor(parcelService?: ParcelService) {
    this.parcelService = parcelService || new ParcelService();
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get('/', this.getParcels.bind(this));
    this.router.get('/:id', this.getParcel.bind(this));
  }

  private getParcels(req: Request, res: Response): void {
    const parcels = this.parcelService.getAllParcels();

    res.json({
      success: true,
      message: '获取成功',
      data: parcels
    });
  }

  private getParcel(req: Request, res: Response): void {
    const { id } = req.params;
    const parcel = this.parcelService.getParcelById(id);

    if (!parcel) {
      res.status(404).json({
        success: false,
        message: '宗地不存在',
        data: null
      });
      return;
    }

    res.json({
      success: true,
      message: '获取成功',
      data: parcel
    });
  }
}
