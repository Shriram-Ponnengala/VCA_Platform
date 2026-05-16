import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    const userCount = await prisma.user.count();
    
    if (userCount > 0) {
      return NextResponse.json({ error: 'Setup already completed' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash: hashedPassword,
        role: 'ADMIN',
      },
    });

    return NextResponse.json({ success: true, message: 'Admin created successfully (admin / admin123)', user: { username: admin.username, role: admin.role } });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
