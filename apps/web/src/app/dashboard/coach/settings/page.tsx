import React from 'react';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { CoachSettingsClient } from './CoachSettingsClient';

export default async function CoachSettingsPage() {
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

  return <CoachSettingsClient userId={userId} username={username} />;
}
