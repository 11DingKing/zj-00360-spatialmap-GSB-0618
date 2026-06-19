"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParcelController = void 0;
const express_1 = require("express");
const ParcelService_1 = require("../services/ParcelService");
class ParcelController {
    constructor(parcelService) {
        this.parcelService = parcelService || new ParcelService_1.ParcelService();
        this.router = (0, express_1.Router)();
        this.initRoutes();
    }
    initRoutes() {
        this.router.get('/', this.getParcels.bind(this));
        this.router.get('/:id', this.getParcel.bind(this));
    }
    getParcels(req, res) {
        const parcels = this.parcelService.getAllParcels();
        res.json({
            success: true,
            message: '获取成功',
            data: parcels
        });
    }
    getParcel(req, res) {
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
exports.ParcelController = ParcelController;
//# sourceMappingURL=ParcelController.js.map