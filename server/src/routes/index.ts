import { Router } from 'express';
import { BuildingController } from '../controllers/BuildingController';
import { ParcelController } from '../controllers/ParcelController';
import { ProjectController } from '../controllers/ProjectController';
import { StatsController } from '../controllers/StatsController';

const buildingController = new BuildingController();
const parcelController = new ParcelController();
const projectController = new ProjectController();
const statsController = new StatsController();

const router = Router();

router.use('/buildings', buildingController.router);
router.use('/parcels', parcelController.router);
router.use('/projects', projectController.router);
router.use('/stats', statsController.router);

export default router;
