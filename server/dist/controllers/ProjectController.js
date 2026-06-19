"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectController = void 0;
const express_1 = require("express");
const ProjectService_1 = require("../services/ProjectService");
class ProjectController {
    constructor(projectService) {
        this.projectService = projectService || new ProjectService_1.ProjectService();
        this.router = (0, express_1.Router)();
        this.initRoutes();
    }
    initRoutes() {
        this.router.get('/', this.getProjects.bind(this));
        this.router.get('/:id', this.getProject.bind(this));
    }
    getProjects(req, res) {
        const projects = this.projectService.getAllProjects();
        res.json({
            success: true,
            message: '获取成功',
            data: projects
        });
    }
    getProject(req, res) {
        const { id } = req.params;
        const project = this.projectService.getProjectById(id);
        if (!project) {
            res.status(404).json({
                success: false,
                message: '项目不存在',
                data: null
            });
            return;
        }
        res.json({
            success: true,
            message: '获取成功',
            data: project
        });
    }
}
exports.ProjectController = ProjectController;
//# sourceMappingURL=ProjectController.js.map