import { prisma } from '@vca/database';

export class SettingsService {
  async get(key: string) {
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });
    return setting?.data || null;
  }

  async upsert(key: string, data: any) {
    const result = await prisma.systemSetting.upsert({
      where: { key },
      update: { data },
      create: { key, data }
    });

    if (key === 'account') {
      try {
        // Sync account settings with the ADMIN user in the database
        const adminUser = await prisma.user.findFirst({
          where: { role: 'ADMIN' }
        });
        
        if (adminUser) {
          const updateData: any = {};
          if (data.firstName !== undefined) updateData.firstName = data.firstName;
          if (data.lastName !== undefined) updateData.lastName = data.lastName;
          if (data.email !== undefined) updateData.email = data.email;
          if (data.phone !== undefined) updateData.mobile = data.phone;
          
          if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
              where: { id: adminUser.id },
              data: updateData
            });
          }
        }
      } catch (e) {
        console.error('Failed to sync admin profile with user table:', e);
      }
    }

    return result;
  }
}
