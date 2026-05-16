import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const date = searchParams.get('date');

    if (!classId || !date) {
      return NextResponse.json({ error: 'Missing classId or date' }, { status: 400 });
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        classId,
        date: new Date(date),
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Fetch attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    const { classId, date, records } = await request.json(); // records: { studentId: string, status: string }[]

    if (!classId || !date || !records) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const attendanceDate = new Date(date);

    // Ensure all studentIds are Student.id, not User.id
    const resolvedRecords = await Promise.all(records.map(async (record: any) => {
      const studentProfile = await prisma.student.findUnique({ where: { userId: record.studentId } });
      return {
        ...record,
        studentId: studentProfile ? studentProfile.id : record.studentId
      };
    }));

    // Use a transaction to update multiple records
    const result = await prisma.$transaction(
      resolvedRecords.map((record: any) =>
        prisma.attendance.upsert({
          where: {
            classId_studentId_date: {
              classId,
              studentId: record.studentId,
              date: attendanceDate,
            },
          },
          update: {
            status: record.status,
            markedBy: userId!,
            timestamp: new Date(),
          },
          create: {
            classId,
            studentId: record.studentId,
            date: attendanceDate,
            status: record.status,
            markedBy: userId!,
          },
        })
      )
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Save attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
