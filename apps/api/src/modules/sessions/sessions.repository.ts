import { prisma } from '@vca/database';

export class SessionsRepository {
  async findByBatchId(classId: string) {
    return await prisma.session.findMany({
      where: { classId },
      orderBy: { date: 'asc' },
    });
  }

  async findById(id: string) {
    return await prisma.session.findUnique({
      where: { id },
      include: {
        class: {
          include: {
            enrollments: {
              include: {
                student: {
                  include: { user: true }
                }
              }
            },
            coach: {
              include: { user: true }
            }
          }
        }
      }
    });
  }

  async create(data: any) {
    return await prisma.session.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return await prisma.session.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return await prisma.session.delete({
      where: { id },
    });
  }
}
