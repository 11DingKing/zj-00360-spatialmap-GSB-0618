import { Router } from "express";
import { BuildingController } from "../controllers/BuildingController";
import { ParcelController } from "../controllers/ParcelController";
import { ProjectController } from "../controllers/ProjectController";
import { StatsController } from "../controllers/StatsController";
import { RedlineController } from "../controllers/RedlineController";
import { AnalysisController } from "../controllers/AnalysisController";

const buildingController = new BuildingController();
const parcelController = new ParcelController();
const projectController = new ProjectController();
const statsController = new StatsController();
const redlineController = new RedlineController();
const analysisController = new AnalysisController();

const router = Router();

router.use("/buildings", buildingController.router);
router.use("/parcels", parcelController.router);
router.use("/projects", projectController.router);
router.use("/stats", statsController.router);
router.use("/redlines", redlineController.router);
router.use("/analysis", analysisController.router);

export default router;
