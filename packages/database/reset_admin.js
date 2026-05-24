const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  console.log("New hash:", hash);
  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: hash },
    create: {
      username: 'admin',
      passwordHash: hash,
      role: 'ADMIN'
    }
  });
  console.log("User upserted:", user.username);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
