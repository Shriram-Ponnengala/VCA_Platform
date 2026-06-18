import { prisma } from '@vca/database';

async function main() {
  const branding = await prisma.systemSetting.findUnique({
    where: { key: 'branding' }
  });
  console.log('--- DATABASE BRANDING SETTING ---');
  console.log(JSON.stringify(branding, null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
