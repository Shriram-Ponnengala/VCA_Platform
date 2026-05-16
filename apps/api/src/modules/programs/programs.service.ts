import { ProgramsRepository } from './programs.repository';
const repo = new ProgramsRepository();

export class ProgramsService {
  async getAll() { return repo.findAll(); }
  async getById(id: string) { return repo.findById(id); }
  async create(data: any) { return repo.create(data); }
  async update(id: string, data: any) { return repo.update(id, data); }
  async delete(id: string) { return repo.delete(id); }
}
