import { prisma } from '@vca/database';

export class BatchesRepository {
  async findAll() { 
    return prisma.class.findMany({ 
      include: { 
        coach: { include: { user: true } },
        enrollments: { include: { student: { include: { user: true } } } }
      } 
    }); 
  }
  async findById(id: string) { 
    return prisma.class.findUnique({ 
      where: { id }, 
      include: { 
        coach: { include: { user: true } },
        enrollments: { include: { student: { include: { user: true } } } }
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
}
