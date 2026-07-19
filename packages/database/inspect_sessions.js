const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.session.findMany();
  console.log('Sessions count:', sessions.length);
  sessions.forEach(s => {
    console.log(`Session: ID=${s.id}, Title="${s.title}", ClassId=${s.classId}, Date=${s.date}`);
  });

  const batchSessions = await prisma.batchSession.findMany();
  console.log('BatchSessions count:', batchSessions.length);
  batchSessions.forEach(bs => {
    console.log(`BatchSession: ID=${bs.id}, ClassId=${bs.classId}, Date=${bs.sessionDate}`);
  });

  const attendanceRecords = await prisma.attendanceRecord.findMany();
  console.log('AttendanceRecords count:', attendanceRecords.length);
  attendanceRecords.forEach(ar => {
    console.log(`AttendanceRecord: ID=${ar.id}, SessionId=${ar.sessionId}, StudentId=${ar.studentId}, Status=${ar.status}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
