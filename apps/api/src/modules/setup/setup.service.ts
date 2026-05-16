import { SetupRepository } from './setup.repository';
const repo = new SetupRepository();

export class SetupService {
  async create(data: any) { return repo.create(data); }
}
