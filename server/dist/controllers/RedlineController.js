"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedlineController = void 0;
const express_1 = require("express");
const RedlineService_1 = require("../services/RedlineService");
class RedlineController {
    constructor(redlineService) {
        this.redlineService = redlineService || new RedlineService_1.RedlineService();
        this.router = (0, express_1.Router)();
        this.initRoutes();
    }
    initRoutes() {
        this.router.get('/', this.getRedlines.bind(this));
        this.router.get('/types', this.getRedlineTypes.bind(this));
        this.router.get('/:id', this.getRedline.bind(this));
        this.router.post('/', this.createRedline.bind(this));
        this.router.put('/:id', this.updateRedline.bind(this));
        this.router.delete('/:id', this.deleteRedline.bind(this));
        this.router.post('/analyze', this.analyzeArea.bind(this));
    }
    getRedlines(req, res) {
        const { type } = req.query;
        const redlines = this.redlineService.getRedlines(type);
        res.json({
            success: true,
            message: '获取成功',
            data: redlines
        });
    }
    getRedline(req, res) {
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
    createRedline(req, res) {
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
    updateRedline(req, res) {
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
    deleteRedline(req, res) {
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
    getRedlineTypes(req, res) {
        const types = this.redlineService.getRedlineTypes();
        res.json({
            success: true,
            message: '获取成功',
            data: types
        });
    }
    analyzeArea(req, res) {
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
            const result = this.redlineService.analyzeArea(polygon);
            res.json({
                success: true,
                message: '分析完成',
                data: result
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: '分析失败: ' + error.message,
                data: null
            });
        }
    }
}
exports.RedlineController = RedlineController;
//# sourceMappingURL=RedlineController.js.map