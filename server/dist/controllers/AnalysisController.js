"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisController = void 0;
const express_1 = require("express");
const AnalysisService_1 = require("../services/AnalysisService");
const SpatialService_1 = require("../services/SpatialService");
class AnalysisController {
    constructor(analysisService, spatialService) {
        this.analysisService = analysisService || new AnalysisService_1.AnalysisService();
        this.spatialService = spatialService || new SpatialService_1.SpatialService();
        this.router = (0, express_1.Router)();
        this.initRoutes();
    }
    initRoutes() {
        this.router.post('/conflict-check', this.conflictCheck.bind(this));
    }
    conflictCheck(req, res) {
        const { polygon, points } = req.body;
        let queryPolygon;
        if (polygon) {
            queryPolygon = polygon;
        }
        else if (points && Array.isArray(points) && points.length >= 3) {
            queryPolygon = this.spatialService.polygonFromPoints(points);
        }
        else {
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
        }
        catch (error) {
            console.error('分析失败:', error);
            res.status(500).json({
                success: false,
                message: '分析过程中发生错误',
                data: null
            });
        }
    }
}
exports.AnalysisController = AnalysisController;
//# sourceMappingURL=AnalysisController.js.map