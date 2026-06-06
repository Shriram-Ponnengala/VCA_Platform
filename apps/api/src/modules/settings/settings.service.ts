import { prisma } from '@vca/database';

export class SettingsService {
  async get(key: string) {
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });
    return setting?.data || null;
  }

  async upsert(key: string, data: any) {
    return prisma.systemSetting.upsert({
      where: { key },
      update: { data },
      create: { key, data }
    });
  }
}
