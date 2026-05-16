import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'ADMIN' && userRole !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    let { name, coachId, ...updateData } = body;
    
    // Map 'name' to 'className' for database compatibility
    const prismaData: any = {
      ...updateData,
      ...(name ? { className: name } : {})
    };

    // Ensure coachId is the Coach.id, not User.id if provided
    if (coachId) {
      const coachByUserId = await prisma.coach.findUnique({ where: { userId: coachId } });
      prismaData.coachId = coachByUserId ? coachByUserId.id : coachId;
    }

    const updated = await prisma.class.update({
      where: { id },
      data: prismaData,
      include: {
        coach: { include: { user: { select: { username: true } } } },
      },
    });

    // Flatten for response consistency
    const responseData = {
      ...updated,
      coach: updated.coach.user.username
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Update batch error:', error);
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

    const { id } = await params;
    await prisma.class.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete batch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
