import { ParcelRepository } from '../repositories/ParcelRepository';
import type { Parcel } from '../types';

export class ParcelService {
  private parcelRepository: ParcelRepository;

  constructor(parcelRepository?: ParcelRepository) {
    this.parcelRepository = parcelRepository || new ParcelRepository();
  }

  getAllParcels(): Parcel[] {
    return this.parcelRepository.findAll();
  }

  getParcelById(id: string): Parcel | null {
    return this.parcelRepository.findById(id);
  }
}
