import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/');
  }

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'COACH') {
    redirect(payload ? `/dashboard/${payload.role.toLowerCase()}` : '/');
  }

  return <>{children}</>;
}
