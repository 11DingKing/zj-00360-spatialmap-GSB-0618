import { ProjectRepository } from '../repositories/ProjectRepository';
import type { Project } from '../types';

export class ProjectService {
  private projectRepository: ProjectRepository;

  constructor(projectRepository?: ProjectRepository) {
    this.projectRepository = projectRepository || new ProjectRepository();
  }

  getAllProjects(): Project[] {
    return this.projectRepository.findAll();
  }

  getProjectById(id: string): Project | null {
    return this.projectRepository.findById(id);
  }
}
