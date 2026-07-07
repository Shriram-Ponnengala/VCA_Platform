import { AttendanceRepository } from './attendance.repository';
const repo = new AttendanceRepository();

export class AttendanceService {
  async getAll() { return repo.findAll(); }
  async create(data: any) { return repo.create(data); }

  async getBatchSessions(batchId: string) { return repo.getBatchSessions(batchId); }
  
  async createBatchSession(data: any) { return repo.createBatchSession(data); }

  async getAttendanceRecords(sessionId: string) { return repo.getAttendanceRecords(sessionId); }

  async upsertAttendanceRecords(sessionId: string, records: any[], markedById: string) {
    return repo.upsertAttendanceRecords(sessionId, records, markedById);
  }

  async getMakeovers(user: any) {
    return repo.getMakeovers(user);
  }

  async assignMakeover(id: string, payload: any, user: any) {
    return repo.assignMakeover(id, payload, user);
  }

  async completeMakeover(id: string, user: any) {
    return repo.completeMakeover(id);
  }
}
