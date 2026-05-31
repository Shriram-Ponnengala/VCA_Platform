import { prisma } from '@vca/database';

export class AuthRepository {
  async findByUsername(username: string) {
    return prisma.user.findFirst({
      where: { 
        username: {
          equals: username,
          mode: 'insensitive'
        }
      },
      include: {
        student: true,
        coach: true
      }
    });
  }
}