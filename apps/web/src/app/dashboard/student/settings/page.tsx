import React from 'react';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { StudentSettingsClient } from './StudentSettingsClient';

export default async function StudentSettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  let userId = '';
  let username = '';

  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      userId = payload.id;
      username = payload.username;
    }
  }

  return <StudentSettingsClient userId={userId} username={username} />;
}
