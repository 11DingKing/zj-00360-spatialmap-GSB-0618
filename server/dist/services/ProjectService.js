"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
const ProjectRepository_1 = require("../repositories/ProjectRepository");
class ProjectService {
    constructor(projectRepository) {
        this.projectRepository = projectRepository || new ProjectRepository_1.ProjectRepository();
    }
    getAllProjects() {
        return this.projectRepository.findAll();
    }
    getProjectById(id) {
        return this.projectRepository.findById(id);
    }
}
exports.ProjectService = ProjectService;
//# sourceMappingURL=ProjectService.js.map