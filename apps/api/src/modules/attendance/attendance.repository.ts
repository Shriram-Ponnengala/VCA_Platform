import { prisma } from '@vca/database';

export class AttendanceRepository {
  async findAll() { return prisma.attendance.findMany(); }
  async create(data: any) { return prisma.attendance.create({ data }); }

  async getBatchSessions(batchId: string) {
    return prisma.batchSession.findMany({
      where: { classId: batchId },
      orderBy: { sessionDate: 'desc' },
      include: {
        attendanceRecords: true
      }
    });
  }

  async createBatchSession(data: any) {
    return prisma.batchSession.create({
      data: {
        classId: data.batchId,
        sessionDate: new Date(data.sessionDate),
        startTime: data.startTime,
        endTime: data.endTime,
        createdById: data.createdById
      }
    });
  }

  async getAttendanceRecords(sessionId: string) {
    return prisma.attendanceRecord.findMany({
      where: { sessionId },
      include: {
        student: true
      }
    });
  }

  async upsertAttendanceRecords(sessionId: string, records: any[], markedById: string) {
    // records is an array of { studentId, status, isGuest, comment }
    
    // Check if the BatchSession exists. If not, try to find a Session with this ID and copy details to a new BatchSession
    const batchSessionExists = await prisma.batchSession.findUnique({
      where: { id: sessionId }
    });

    if (!batchSessionExists) {
      const session = await prisma.session.findUnique({
        where: { id: sessionId }
      });
      if (session) {
        await prisma.batchSession.create({
          data: {
            id: sessionId,
            classId: session.classId,
            sessionDate: session.date,
            startTime: session.startTime,
            endTime: session.endTime,
            createdById: markedById
          }
        });
      }
    }

    const results = [];
    for (const record of records) {
      results.push(await prisma.attendanceRecord.upsert({
        where: {
          sessionId_studentId: {
            sessionId,
            studentId: record.studentId
          }
        },
        create: {
          sessionId,
          studentId: record.studentId,
          status: record.status,
          isGuest: record.isGuest || false,
          comment: record.comment || null,
          markedById
        },
        update: {
          status: record.status,
          isGuest: record.isGuest || false,
          comment: record.comment || null,
          markedById,
          markedAt: new Date()
        }
      }));
    }
    return results;
  }

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
