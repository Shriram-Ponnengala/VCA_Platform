import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id: classId } = await params;
    let { studentId } = await request.json();

    // Resolve studentId to Student.id if it's a User ID
    const studentProfile = await prisma.student.findUnique({ where: { userId: studentId } });
    if (studentProfile) {
      studentId = studentProfile.id;
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        classId,
        studentId,
      },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error('Enrollment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id: classId } = await params;
    let { studentId } = await request.json();

    // Resolve studentId to Student.id if it's a User ID
    const studentProfile = await prisma.student.findUnique({ where: { userId: studentId } });
    if (studentProfile) {
      studentId = studentProfile.id;
    }

    await prisma.enrollment.delete({
      where: {
        studentId_classId: {
          studentId,
          classId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unenrollment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
