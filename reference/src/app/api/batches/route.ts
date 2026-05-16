import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const userRole = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');
    console.log(`[API] GET /api/batches - Role: ${userRole}, UserID: ${userId}`);

    let classes;

    if (userRole === 'ADMIN') {
      classes = await prisma.class.findMany({
        include: {
          coach: { include: { user: { select: { username: true } } } },
          enrollments: { include: { student: { include: { user: { select: { id: true, username: true } } } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (userRole === 'COACH') {
      // Find the coach record for this user
      const coachProfile = await prisma.coach.findUnique({ where: { userId: userId! } });
      if (!coachProfile) return NextResponse.json([]);

      classes = await prisma.class.findMany({
        where: { coachId: coachProfile.id },
        include: {
          coach: { include: { user: { select: { username: true } } } },
          enrollments: { include: { student: { include: { user: { select: { id: true, username: true } } } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Find the student record for this user
      const studentProfile = await prisma.student.findUnique({ where: { userId: userId! } });
      if (!studentProfile) return NextResponse.json([]);

      classes = await prisma.class.findMany({
        where: { enrollments: { some: { studentId: studentProfile.id } } },
        include: {
          coach: { include: { user: { select: { username: true } } } },
          enrollments: { include: { student: { include: { user: { select: { id: true, username: true } } } } } },
        },
      });
    }

    // Map to frontend "Batch" structure
    const batches = classes.map((c: any) => ({
      id: c.id,
      name: c.className,
      program: c.program,
      coach: c.coach.user.username,
      coachId: c.coachId,
      type: c.type,
      days: c.days,
      startTime: c.startTime,
      endTime: c.endTime,
      status: c.status,
      students: c.enrollments.map((e: any) => e.student.id),
      studentDetails: c.enrollments.map((e: any) => ({
        id: e.student.id,
        name: e.student.user.username
      })),
      createdAt: c.createdAt,
    }));

    return NextResponse.json(batches);
  } catch (error) {
    console.error('Fetch batches error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userRole = request.headers.get('x-user-role');
    console.log(`[API] POST /api/batches - Role: ${userRole}`);

    if (userRole !== 'ADMIN') {
      console.warn(`[API] Unauthorized batch creation attempt by role: ${userRole}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    let { name, program, coachId, type, startDate, days, startTime, endTime } = body;
    console.log(`[API] Creating batch: ${name} with coachId: ${coachId}`);

    if (!name || !coachId) {
      console.error('[API] Missing required fields for batch creation');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure coachId is the Coach.id, not User.id
    const coachByUserId = await prisma.coach.findUnique({ where: { userId: coachId } });
    if (coachByUserId) {
      coachId = coachByUserId.id;
    }

    const newBatch = await prisma.class.create({
      data: {
        className: name,
        program,
        coachId,
        type,
        days,
        startDate,
        startTime,
        endTime,
        status: 'active'
      },
      include: {
        coach: {
          include: { user: { select: { username: true } } }
        }
      }
    });

    console.log(`[API] Batch created successfully: ${newBatch.id}`);
    
    // Flatten for response consistency
    const responseData = {
      ...newBatch,
      coach: newBatch.coach.user.username
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('[API] Create batch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
