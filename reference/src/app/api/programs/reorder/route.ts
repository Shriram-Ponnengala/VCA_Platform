import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { program1, program2 } = await request.json();

    await prisma.$transaction([
      prisma.program.update({
        where: { id: program1.id },
        data: { order: program1.order },
      }),
      prisma.program.update({
        where: { id: program2.id },
        data: { order: program2.order },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reorder programs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
