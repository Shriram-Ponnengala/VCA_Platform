import { prisma } from '@vca/database';

export class SetupRepository {
  async create(data: any) { return prisma.user.create({ data }); }
}
