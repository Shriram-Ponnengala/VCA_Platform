import { prisma } from '@vca/database';

export class UsersRepository {
  async findAll(role?: string) { 
    return prisma.user.findMany({
      where: role ? { role: role as any } : undefined,
      include: {
        student: true,
        coach: true
      },
      orderBy: { createdAt: 'desc' }
    }); 
  }
  async findById(id: string) { return prisma.user.findUnique({ where: { id } }); }
  async create(data: any) { return prisma.user.create({ data }); }
  async update(id: string, data: any) { return prisma.user.update({ where: { id }, data }); }
  async delete(id: string) { return prisma.user.delete({ where: { id } }); }
}
