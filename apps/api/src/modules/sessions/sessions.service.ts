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
    if (data.attachments) {
      this.validateAttachments(data.attachments);
    }
    return await this.repository.create(data);
  }

  async updateSession(id: string, data: any) {
    if (data.attachments) {
      this.validateAttachments(data.attachments);
    }
    return await this.repository.update(id, data);
  }

  async deleteSession(id: string) {
    return await this.repository.delete(id);
  }

  private validateAttachments(attachments: any) {
    if (!Array.isArray(attachments)) {
      throw new Error('Attachments must be an array');
    }
    const allowedTypes = ["drive_recording", "pgn", "lichess_study", "other", "homework", "recording", "lichess", "youtube", "link", "pdf"];
    for (const att of attachments) {
      if (!att || typeof att !== 'object') {
        throw new Error('Attachment must be an object');
      }
      if (!allowedTypes.includes(att.type)) {
        throw new Error(`Invalid attachment type: ${att.type}`);
      }
    }
  }
}
