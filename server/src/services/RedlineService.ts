import { v4 as uuidv4 } from 'uuid';
import { RedlineRepository } from '../repositories/RedlineRepository';
import type { Redline, RedlineType } from '../types';

export const REDLINE_TYPE_NAMES: Record<RedlineType, string> = {
  ecological: '生态保护红线',
  heritage: '历史街区保护线',
  cultural: '文物保护范围',
  infrastructure: '基础设施管控线',
  agricultural: '永久基本农田',
  other: '其他管控线'
};

export const REDLINE_TYPE_COLORS: Record<RedlineType, string> = {
  ecological: '#DC2626',
  heritage: '#9333EA',
  cultural: '#F59E0B',
  infrastructure: '#2563EB',
  agricultural: '#16A34A',
  other: '#6B7280'
};

export class RedlineService {
  private redlineRepository: RedlineRepository;

  constructor(redlineRepository?: RedlineRepository) {
    this.redlineRepository = redlineRepository || new RedlineRepository();
  }

  getRedlines(type?: RedlineType): Redline[] {
    return this.redlineRepository.findAll(type);
  }

  getRedlineById(id: string): Redline | null {
    return this.redlineRepository.findById(id);
  }

  getRedlinesByType(type: RedlineType): Redline[] {
    return this.redlineRepository.findByType(type);
  }

  createRedline(data: Omit<Redline, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Redline {
    const id = data.id || uuidv4();
    const color = data.color || REDLINE_TYPE_COLORS[data.type];

    return this.redlineRepository.create({
      ...data,
      id,
      color
    });
  }

  updateRedline(id: string, data: Partial<Redline>): Redline | null {
    return this.redlineRepository.update(id, data);
  }

  deleteRedline(id: string): boolean {
    return this.redlineRepository.delete(id);
  }

  getRedlineTypes(): { type: RedlineType; name: string; color: string; count: number }[] {
    const typeStats = this.redlineRepository.getTypes();
    return typeStats.map(stat => ({
      type: stat.type,
      name: REDLINE_TYPE_NAMES[stat.type],
      color: REDLINE_TYPE_COLORS[stat.type],
      count: stat.count
    }));
  }
}
