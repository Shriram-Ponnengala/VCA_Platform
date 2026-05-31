const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.systemSetting.upsert({
    where: { key: 'branding' },
    update: { data: { headingFont: 'Oleo Script', bodyFont: 'Open Sans', primaryColor: '#2563eb' } },
    create: { key: 'branding', data: { headingFont: 'Oleo Script', bodyFont: 'Open Sans', primaryColor: '#2563eb' } }
  });
  console.log("Settings updated in DB.");
}
main().catch(console.error).finally(() => prisma.$disconnect());
