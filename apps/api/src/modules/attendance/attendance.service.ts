import { AttendanceRepository } from './attendance.repository';
const repo = new AttendanceRepository();

export class AttendanceService {
  async getAll() { return repo.findAll(); }
  async create(data: any) { return repo.create(data); }

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
