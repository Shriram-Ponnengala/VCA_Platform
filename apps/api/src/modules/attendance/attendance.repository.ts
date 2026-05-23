import { prisma } from '@vca/database';

export class AttendanceRepository {
  async findAll() { return prisma.attendance.findMany(); }
  async create(data: any) { return prisma.attendance.create({ data }); }
}
