const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({
    where: { username: 'priya_s' },
    data: { firstName: 'Priya', lastName: 'Sharma' }
  });

  await prisma.user.updateMany({
    where: { username: 'arjun_k' },
    data: { firstName: 'Arjun', lastName: 'Kumar' }
  });

  console.log('User first and last names updated successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
