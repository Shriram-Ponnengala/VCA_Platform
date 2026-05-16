const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin_user' },
    update: {},
    create: {
      username: 'admin_user',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create Coach
  const coachPassword = await bcrypt.hash('coach123', 10);
  const coach = await prisma.user.upsert({
    where: { username: 'coach_vikram' },
    update: {},
    create: {
      username: 'coach_vikram',
      passwordHash: coachPassword,
      role: 'COACH',
    },
  });

  // Create Students
  const studentPassword = await bcrypt.hash('student123', 10);
  const student1 = await prisma.user.upsert({
    where: { username: 'arjun_k' },
    update: {},
    create: {
      username: 'arjun_k',
      passwordHash: studentPassword,
      role: 'STUDENT',
    },
  });

  const student2 = await prisma.user.upsert({
    where: { username: 'priya_s' },
    update: {},
    create: {
      username: 'priya_s',
      passwordHash: studentPassword,
      role: 'STUDENT',
    },
  });

  // Create a Class/Batch
  const batch = await prisma.class.create({
    data: {
      className: 'Weekend Pawn Beginners',
      program: 'Pawn Batch',
      coachId: coach.id,
      type: 'Group',
      days: ['SAT', 'SUN'],
      startTime: '10:00',
      endTime: '11:00',
    },
  });

  // Enroll Students
  await prisma.enrollment.createMany({
    data: [
      { classId: batch.id, studentId: student1.id },
      { classId: batch.id, studentId: student2.id },
    ],
    skipDuplicates: true,
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
