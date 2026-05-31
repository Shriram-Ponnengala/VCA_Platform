import { prisma } from '@vca/database';

export class AttendanceRepository {
  async findAll() { return prisma.attendance.findMany(); }
  async create(data: any) { return prisma.attendance.create({ data }); }

  async getMakeovers(user: any) {
    let where: any = {};
    if (user?.role === 'COACH') {
      const coach = await prisma.coach.findUnique({ where: { userId: user.id } });
      if (coach) {
        where.coachId = coach.id;
      }
    }

    return prisma.makeover.findMany({
      where,
      include: {
        student: { include: { user: true } },
        originalClass: true,
        targetClass: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async assignMakeover(id: string, payload: any, user: any) {
    const { targetClassId, targetDate } = payload;
    
    // Check permission logic here or in service. 
    // We update the Makeover record.
    return prisma.makeover.update({
      where: { id },
      data: {
        targetClassId,
        targetDate: new Date(targetDate),
        status: 'SCHEDULED'
      }
    });
  }

  async completeMakeover(id: string) {
    return prisma.makeover.update({
      where: { id },
      data: {
        status: 'COMPLETED'
      }
    });
  }
}
