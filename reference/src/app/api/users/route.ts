import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    const role = request.headers.get('x-user-role');
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filterRole = searchParams.get('role');

    const users = await prisma.user.findMany({
      where: filterRole ? { role: filterRole as any } : undefined,
      include: {
        student: true,
        coach: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userRole = request.headers.get('x-user-role');
    console.log(`[API] POST /api/users - Role: ${userRole}`);

    if (userRole !== 'ADMIN') {
      console.warn(`[API] Unauthorized access attempt to POST /api/users by role: ${userRole}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { username, password, role, ...profileData } = body;
    console.log(`[API] Creating user: ${username} with role: ${role}`);

    if (!username || !role) {
      console.error('[API] Missing required fields: username or role');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      console.warn(`[API] Username already exists: ${username}`);
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    // Use provided password or a default one
    const defaultPassword = role === 'COACH' ? 'coach123' : 'student123';
    const hashedPassword = await bcrypt.hash(password || defaultPassword, 10);

    // Split common fields from profile specific fields
    const { 
      parentFirstName, parentMiddleName, parentLastName,
      secParentFirstName, secParentMiddleName, secParentLastName,
      specialization, bio,
      ...userData 
    } = profileData;

    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash: hashedPassword,
        role,
        ...userData,
        ...(role === 'STUDENT' ? {
          student: {
            create: {
              parentFirstName, parentMiddleName, parentLastName,
              secParentFirstName, secParentMiddleName, secParentLastName,
            }
          }
        } : {}),
        ...(role === 'COACH' ? {
          coach: {
            create: { specialization, bio }
          }
        } : {}),
      },
      include: {
        student: true,
        coach: true,
      }
    });

    console.log(`[API] User created successfully: ${newUser.id}`);
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('[API] Create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
