"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsController = void 0;
const express_1 = require("express");
const BuildingService_1 = require("../services/BuildingService");
class StatsController {
    constructor(buildingService) {
        this.buildingService = buildingService || new BuildingService_1.BuildingService();
        this.router = (0, express_1.Router)();
        this.initRoutes();
    }
    initRoutes() {
        this.router.get('/overview', this.getOverview.bind(this));
        this.router.get('/unmapped', this.getUnmapped.bind(this));
        this.router.get('/quality', this.getQuality.bind(this));
    }
    getOverview(req, res) {
        const stats = this.buildingService.getOverviewStats();
        res.json({
            success: true,
            message: '获取成功',
            data: stats
        });
    }
    getUnmapped(req, res) {
        const buildings = this.buildingService.getUnmappedBuildings();
        res.json({
            success: true,
            message: '获取成功',
            data: buildings
        });
    }
    getQuality(req, res) {
        const stats = this.buildingService.getQualityStats();
        res.json({
            success: true,
            message: '获取成功',
            data: stats
        });
    }
}
exports.StatsController = StatsController;
//# sourceMappingURL=StatsController.js.map