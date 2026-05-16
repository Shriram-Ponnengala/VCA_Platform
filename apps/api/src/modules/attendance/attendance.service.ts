import { AttendanceRepository } from './attendance.repository';
const repo = new AttendanceRepository();

export class AttendanceService {
  async getAll() { return repo.findAll(); }
  async create(data: any) { return repo.create(data); }
}
