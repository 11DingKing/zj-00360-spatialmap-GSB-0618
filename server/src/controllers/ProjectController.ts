import { Request, Response, Router } from 'express';
import { ProjectService } from '../services/ProjectService';

export class ProjectController {
  private projectService: ProjectService;
  public router: Router;

  constructor(projectService?: ProjectService) {
    this.projectService = projectService || new ProjectService();
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get('/', this.getProjects.bind(this));
    this.router.get('/:id', this.getProject.bind(this));
  }

  private getProjects(req: Request, res: Response): void {
    const projects = this.projectService.getAllProjects();

    res.json({
      success: true,
      message: '获取成功',
      data: projects
    });
  }

  private getProject(req: Request, res: Response): void {
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
