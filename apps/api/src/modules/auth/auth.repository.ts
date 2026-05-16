import { prisma } from '@vca/database';

export class AuthRepository {
  async findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      include: {
        student: true,
        coach: true
      }
    });
  }
}