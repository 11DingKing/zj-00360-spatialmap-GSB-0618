"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParcelService = void 0;
const ParcelRepository_1 = require("../repositories/ParcelRepository");
class ParcelService {
    constructor(parcelRepository) {
        this.parcelRepository = parcelRepository || new ParcelRepository_1.ParcelRepository();
    }
    getAllParcels() {
        return this.parcelRepository.findAll();
    }
    getParcelById(id) {
        return this.parcelRepository.findById(id);
    }
}
exports.ParcelService = ParcelService;
//# sourceMappingURL=ParcelService.js.map