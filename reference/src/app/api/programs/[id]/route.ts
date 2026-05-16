import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const updated = await prisma.program.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update program error:', error);
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
    await prisma.program.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete program error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
