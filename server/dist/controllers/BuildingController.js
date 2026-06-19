"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingController = void 0;
const express_1 = require("express");
const BuildingService_1 = require("../services/BuildingService");
class BuildingController {
    constructor(buildingService) {
        this.buildingService = buildingService || new BuildingService_1.BuildingService();
        this.router = (0, express_1.Router)();
        this.initRoutes();
    }
    initRoutes() {
        this.router.get('/', this.getBuildings.bind(this));
        this.router.get('/within', this.getBuildingsWithin.bind(this));
        this.router.get('/stats', this.getStats.bind(this));
        this.router.get('/:id', this.getBuilding.bind(this));
        this.router.post('/', this.createBuilding.bind(this));
        this.router.put('/:id', this.updateBuilding.bind(this));
        this.router.delete('/:id', this.deleteBuilding.bind(this));
        this.router.post('/validate', this.validateBuilding.bind(this));
    }
    getBuildings(req, res) {
        const { usage, yearStart, yearEnd, isCoded, hasLocation, minLng, maxLng, minLat, maxLat } = req.query;
        const params = {};
        if (usage) {
            params.usage = (Array.isArray(usage) ? usage : [usage]);
        }
        if (yearStart !== undefined) {
            params.yearStart = Number(yearStart);
        }
        if (yearEnd !== undefined) {
            params.yearEnd = Number(yearEnd);
        }
        if (isCoded !== undefined) {
            params.isCoded = isCoded === 'true';
        }
        if (hasLocation !== undefined) {
            params.hasLocation = hasLocation === 'true';
        }
        if (minLng !== undefined && maxLng !== undefined && minLat !== undefined && maxLat !== undefined) {
            params.minLng = Number(minLng);
            params.maxLng = Number(maxLng);
            params.minLat = Number(minLat);
            params.maxLat = Number(maxLat);
        }
        const buildings = this.buildingService.getBuildings(params);
        res.json({
            success: true,
            message: '获取成功',
            data: buildings
        });
    }
    getBuilding(req, res) {
        const { id } = req.params;
        const result = this.buildingService.getBuildingById(id);
        if (!result) {
            res.status(404).json({
                success: false,
                message: '建筑不存在',
                data: null
            });
            return;
        }
        res.json({
            success: true,
            message: '获取成功',
            data: result
        });
    }
    createBuilding(req, res) {
        const building = this.buildingService.createBuilding(req.body);
        res.status(201).json({
            success: true,
            message: '创建成功',
            data: building
        });
    }
    updateBuilding(req, res) {
        const { id } = req.params;
        const building = this.buildingService.updateBuilding(id, req.body);
        if (!building) {
            res.status(404).json({
                success: false,
                message: '建筑不存在',
                data: null
            });
            return;
        }
        res.json({
            success: true,
            message: '更新成功',
            data: building
        });
    }
    deleteBuilding(req, res) {
        const { id } = req.params;
        const deleted = this.buildingService.deleteBuilding(id);
        if (!deleted) {
            res.status(404).json({
                success: false,
                message: '建筑不存在',
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
    getBuildingsWithin(req, res) {
        const { minLng, maxLng, minLat, maxLat } = req.query;
        if (minLng === undefined || maxLng === undefined || minLat === undefined || maxLat === undefined) {
            res.status(400).json({
                success: false,
                message: '缺少必要参数: minLng, maxLng, minLat, maxLat',
                data: null
            });
            return;
        }
        const buildings = this.buildingService.getBuildingsWithinBounds(Number(minLng), Number(maxLng), Number(minLat), Number(maxLat));
        res.json({
            success: true,
            message: '获取成功',
            data: buildings
        });
    }
    getStats(req, res) {
        const { usage, yearStart, yearEnd, isCoded, hasLocation } = req.query;
        const params = {};
        if (usage) {
            params.usage = (Array.isArray(usage) ? usage : [usage]);
        }
        if (yearStart !== undefined) {
            params.yearStart = Number(yearStart);
        }
        if (yearEnd !== undefined) {
            params.yearEnd = Number(yearEnd);
        }
        if (isCoded !== undefined) {
            params.isCoded = isCoded === 'true';
        }
        if (hasLocation !== undefined) {
            params.hasLocation = hasLocation === 'true';
        }
        const stats = this.buildingService.getStats(params);
        res.json({
            success: true,
            message: '获取成功',
            data: stats
        });
    }
    validateBuilding(req, res) {
        const { location, outline, parcelId, excludeId } = req.body;
        if (!location || !outline) {
            res.status(400).json({
                success: false,
                message: '缺少必要参数: location, outline',
                data: null
            });
            return;
        }
        const result = this.buildingService.validateBuilding(location, outline, parcelId, excludeId);
        res.json({
            success: true,
            message: '验证完成',
            data: result
        });
    }
}
exports.BuildingController = BuildingController;
//# sourceMappingURL=BuildingController.js.map