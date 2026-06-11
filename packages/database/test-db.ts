import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const usersWithEmptyEmail = await prisma.user.findMany({
    where: { email: '' },
  });
  console.log('Users with empty email:', usersWithEmptyEmail.length);

  const usersWithEmptyUsername = await prisma.user.findMany({
    where: { username: '' },
  });
  console.log('Users with empty username:', usersWithEmptyUsername.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
