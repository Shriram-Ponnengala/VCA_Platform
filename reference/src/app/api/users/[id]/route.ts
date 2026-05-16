import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const userRole = request.headers.get('x-user-role');
    console.log(`[API] PATCH /api/users/${id} - Role: ${userRole}`);

    if (userRole !== 'ADMIN') {
      console.warn(`[API] Unauthorized update attempt for user ${id} by role: ${userRole}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { username, role, password, ...profileData } = body;
    console.log(`[API] Updating user ${id}:`, { username, role });

    // Split common fields from profile specific fields
    const { 
      parentFirstName, parentMiddleName, parentLastName,
      secParentFirstName, secParentMiddleName, secParentLastName,
      specialization, bio,
      ...userData 
    } = profileData;

    const updateData: any = { ...userData };
    if (username) updateData.username = username;
    if (role) updateData.role = role;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // Handle nested profile updates
    if (parentFirstName !== undefined || parentLastName !== undefined) {
      updateData.student = {
        update: {
          parentFirstName, parentMiddleName, parentLastName,
          secParentFirstName, secParentMiddleName, secParentLastName,
        }
      };
    }

    if (specialization !== undefined || bio !== undefined) {
      updateData.coach = {
        update: { specialization, bio }
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        student: true,
        coach: true,
      }
    });

    console.log(`[API] User ${id} updated successfully`);
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error(`[API] Update user ${id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const userRole = request.headers.get('x-user-role');
    console.log(`[API] DELETE /api/users/${id} - Role: ${userRole}`);

    if (userRole !== 'ADMIN') {
      console.warn(`[API] Unauthorized delete attempt for user ${id} by role: ${userRole}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });
    console.log(`[API] User ${id} deleted successfully`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[API] Delete user error for ${id}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
