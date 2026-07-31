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

  // Add coach
  const coachHash = await bcrypt.hash('coach123', 10);
  const coach = await prisma.user.upsert({
    where: { username: 'coach1@gmail.com' },
    update: { passwordHash: coachHash },
    create: {
      username: 'coach1@gmail.com',
      email: 'coach1@gmail.com',
      passwordHash: coachHash,
      role: 'COACH',
      firstName: 'coach 1',
      coach: {
        create: {}
      }
    }
  });
  console.log("User upserted:", coach.username);

  // Add student1
  const student1Hash = await bcrypt.hash('student123', 10);
  const student1 = await prisma.user.upsert({
    where: { username: 'student1@gmail.com' },
    update: { passwordHash: student1Hash },
    create: {
      username: 'student1@gmail.com',
      email: 'student1@gmail.com',
      passwordHash: student1Hash,
      role: 'STUDENT',
      firstName: 'student1',
      student: {
        create: {
          parentFirstName: 'parent1'
        }
      }
    }
  });
  console.log("User upserted:", student1.username);

  // Add student2
  const student2Hash = await bcrypt.hash('student123', 10);
  const student2 = await prisma.user.upsert({
    where: { username: 'student2@gmail.com' },
    update: { passwordHash: student2Hash },
    create: {
      username: 'student2@gmail.com',
      email: 'student2@gmail.com',
      passwordHash: student2Hash,
      role: 'STUDENT',
      firstName: 'student2',
      student: {
        create: {
          parentFirstName: 'parent1'
        }
      }
    }
  });
  console.log("User upserted:", student2.username);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
