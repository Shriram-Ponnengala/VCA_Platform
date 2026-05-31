import { SessionsRepository } from './sessions.repository';

export class SessionsService {
  private repository: SessionsRepository;

  constructor() {
    this.repository = new SessionsRepository();
  }

  async getSessionsByBatch(batchId: string) {
    return await this.repository.findByBatchId(batchId);
  }

  async getSessionById(id: string) {
    return await this.repository.findById(id);
  }

  async createSession(data: any) {
    // If duration isn't provided, calculate it? Usually frontend will send it.
    return await this.repository.create(data);
  }

  async updateSession(id: string, data: any) {
    return await this.repository.update(id, data);
  }

  async deleteSession(id: string) {
    return await this.repository.delete(id);
  }
}
