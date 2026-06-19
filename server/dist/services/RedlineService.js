"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedlineService = exports.REDLINE_TYPE_COLORS = exports.REDLINE_TYPE_NAMES = void 0;
const uuid_1 = require("uuid");
const RedlineRepository_1 = require("../repositories/RedlineRepository");
exports.REDLINE_TYPE_NAMES = {
    ecological: '生态保护红线',
    heritage: '历史街区保护线',
    cultural: '文物保护范围',
    infrastructure: '基础设施管控线',
    agricultural: '永久基本农田',
    other: '其他管控线'
};
exports.REDLINE_TYPE_COLORS = {
    ecological: '#DC2626',
    heritage: '#9333EA',
    cultural: '#F59E0B',
    infrastructure: '#2563EB',
    agricultural: '#16A34A',
    other: '#6B7280'
};
class RedlineService {
    constructor(redlineRepository) {
        this.redlineRepository = redlineRepository || new RedlineRepository_1.RedlineRepository();
    }
    getRedlines(type) {
        return this.redlineRepository.findAll(type);
    }
    getRedlineById(id) {
        return this.redlineRepository.findById(id);
    }
    getRedlinesByType(type) {
        return this.redlineRepository.findByType(type);
    }
    createRedline(data) {
        const id = data.id || (0, uuid_1.v4)();
        const color = data.color || exports.REDLINE_TYPE_COLORS[data.type];
        return this.redlineRepository.create({
            ...data,
            id,
            color
        });
    }
    updateRedline(id, data) {
        return this.redlineRepository.update(id, data);
    }
    deleteRedline(id) {
        return this.redlineRepository.delete(id);
    }
    getRedlineTypes() {
        const typeStats = this.redlineRepository.getTypes();
        return typeStats.map(stat => ({
            type: stat.type,
            name: exports.REDLINE_TYPE_NAMES[stat.type],
            color: exports.REDLINE_TYPE_COLORS[stat.type],
            count: stat.count
        }));
    }
}
exports.RedlineService = RedlineService;
//# sourceMappingURL=RedlineService.js.map