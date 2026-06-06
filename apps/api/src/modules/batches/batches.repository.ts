import { prisma } from '@vca/database';

export class BatchesRepository {
  async findAll(user?: any) { 
    if (!user) return [];
    
    let where: any = {};
    
    if (user.role !== 'ADMIN') {
      const role = typeof user.role === 'string' ? user.role.toUpperCase() : user.role;
      
      if (role === 'COACH') {
        const coach = await prisma.coach.findUnique({ where: { userId: user.id }});
        if (coach) {
          where.coachId = coach.id;
        } else {
          where.coachId = 'none';
        }
      } else if (role === 'STUDENT') {
        const student = await prisma.student.findUnique({ where: { userId: user.id }});
        if (student) {
          where.enrollments = {
            some: { studentId: student.id }
          };
        } else {
          where.id = 'none';
        }
      }
    }

    return prisma.class.findMany({ 
      where,
      include: { 
        coach: { include: { user: true } },
        enrollments: { include: { student: { include: { user: true } } } },
        sessions: true
      } 
    }); 
  }
  async findById(id: string) { 
    return prisma.class.findUnique({ 
      where: { id }, 
      include: { 
        coach: { include: { user: true } },
        enrollments: { include: { student: { include: { user: true } } } },
        targetMakeovers: {
          include: { student: { include: { user: true } } }
        },
        sessionOverrides: true
      } 
    }); 
  }
  async create(data: any) { return prisma.class.create({ data }); }
  async update(id: string, data: any) { return prisma.class.update({ where: { id }, data }); }
  async delete(id: string) { return prisma.class.delete({ where: { id } }); }

  async enroll(batchId: string, studentId: string) {
    // Resolve Student ID if User ID was passed
    let resolvedStudentId = studentId;
    const student = await prisma.student.findFirst({
      where: { OR: [{ id: studentId }, { userId: studentId }] }
    });
    if (student) resolvedStudentId = student.id;

    return prisma.enrollment.create({
      data: {
        classId: batchId,
        studentId: resolvedStudentId
      }
    });
  }

  async unenroll(batchId: string, studentId: string) {
    // Resolve Student ID if User ID was passed
    let resolvedStudentId = studentId;
    const student = await prisma.student.findFirst({
      where: { OR: [{ id: studentId }, { userId: studentId }] }
    });
    if (student) resolvedStudentId = student.id;

    // Use deleteMany to avoid errors if the enrollment doesn't exist
    return prisma.enrollment.deleteMany({
      where: {
        studentId: resolvedStudentId,
        classId: batchId
      }
    });
  }

  async markAttendance(batchId: string, payload: any, user: any) {
    const { date, records } = payload;
    const parsedDate = new Date(date);
    
    // Determine the coach who is marking this (if applicable)
    let coachId: string | undefined = undefined;
    if (user?.role === 'COACH') {
      const coach = await prisma.coach.findUnique({ where: { userId: user.id } });
      if (coach) coachId = coach.id;
    }

    const results = [];
    for (const record of records) {
      // Create or update attendance record
      const attendance = await prisma.attendance.upsert({
        where: {
          classId_studentId_date: {
            classId: batchId,
            studentId: record.studentId,
            date: parsedDate
          }
        },
        update: {
          status: record.status,
          markedBy: user?.username || 'system'
        },
        create: {
          classId: batchId,
          studentId: record.studentId,
          date: parsedDate,
          status: record.status,
          markedBy: user?.username || 'system'
        }
      });
      
      results.push(attendance);

      // If absent and needs makeover, create a Makeover record
      if (record.status === 'absent' && record.needsMakeover) {
        // check if one already exists to avoid duplicates
        const existingMakeover = await prisma.makeover.findFirst({
          where: {
            studentId: record.studentId,
            originalClassId: batchId,
            originalDate: parsedDate
          }
        });
        
        if (!existingMakeover) {
          await prisma.makeover.create({
            data: {
              studentId: record.studentId,
              originalClassId: batchId,
              originalDate: parsedDate,
              status: 'PENDING',
              coachId: coachId, // Will be set if the user is a coach
              assignedByAdmin: user?.role === 'ADMIN'
            }
          });
        }
      }
    }
    return results;
  }

  async rescheduleClass(batchId: string, payload: any) {
    const { originalDate, newDate, newStartTime, newEndTime, reason } = payload;
    
    return prisma.classSessionOverride.upsert({
      where: {
        classId_originalDate: {
          classId: batchId,
          originalDate: new Date(originalDate)
        }
      },
      update: {
        newDate: new Date(newDate),
        newStartTime,
        newEndTime,
        reason,
        status: 'RESCHEDULED'
      },
      create: {
        classId: batchId,
        originalDate: new Date(originalDate),
        newDate: new Date(newDate),
        newStartTime,
        newEndTime,
        reason,
        status: 'RESCHEDULED'
      }
    });
  }
}
