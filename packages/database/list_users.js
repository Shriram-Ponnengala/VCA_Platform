const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      student: true,
      coach: true
    }
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
