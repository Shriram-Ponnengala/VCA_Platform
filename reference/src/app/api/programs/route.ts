import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    console.log('[API] GET /api/programs - Fetching all programs');
    const programs = await prisma.program.findMany({
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(programs);
  } catch (error) {
    console.error('[API] Fetch programs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userRole = request.headers.get('x-user-role');
    console.log(`[API] POST /api/programs - Role: ${userRole}`);

    if (userRole !== 'ADMIN') {
      console.warn(`[API] Unauthorized program creation attempt by role: ${userRole}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name, code, order, topics } = await request.json();
    console.log(`[API] Creating program: ${name}`);
    
    const newProgram = await prisma.program.create({
      data: { 
        name, 
        code, 
        order: order || 0,
        topics: topics || []
      },
    });
    
    console.log(`[API] Program created successfully: ${newProgram.id}`);
    return NextResponse.json(newProgram, { status: 201 });
  } catch (error) {
    console.error('[API] Create program error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
