import { prisma } from '@vca/database';

export class AttendanceRepository {
  async findAll() { return prisma.attendanceRecord.findMany(); }
  async create(data: any) { return prisma.attendanceRecord.create({ data }); }
}
