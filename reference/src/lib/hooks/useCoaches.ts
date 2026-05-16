'use client';

import { useState, useEffect } from 'react';

export interface Coach {
  id: string;
  userId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
  initials: string;
  photo?: string | null;
  countryCode?: string;
  mobile?: string;
  country?: string;
  city?: string;
  bio?: string;
  dob?: string;
  memberSince: string;
}

const INITIAL_COACHES: Coach[] = [
  { 
    id: '1',
    firstName: 'Magnus',
    lastName: 'Carlsen',
    name: 'Magnus Carlsen', 
    specialization: 'World Champion', 
    email: 'magnus@chess.com', 
    phone: '+47 900 00 000', 
    initials: 'MC',
    photo: null,
    memberSince: '2023-01-01'
  },
  { 
    id: '2',
    firstName: 'Judit',
    lastName: 'Polgar',
    name: 'Judit Polgar', 
    specialization: 'Grandmaster', 
    email: 'judit@chess.com', 
    phone: '+36 30 000 0000', 
    initials: 'JP',
    photo: null,
    memberSince: '2023-02-15'
  },
  { 
    id: '3',
    firstName: 'Shriram',
    lastName: 'Ponnengala',
    name: 'Shriram Ponnengala', 
    specialization: 'Academy Director', 
    email: 'shrmpnga@gmail.com', 
    phone: '+91 9567027370', 
    initials: 'SP',
    photo: null,
    memberSince: '2023-03-10'
  },
];

export function useCoaches() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchCoaches = async () => {
    console.log('[Hook] useCoaches: Fetching coaches from API...');
    try {
      const res = await fetch('/api/users?role=COACH');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch coaches');
      }
      const data = await res.json();
      console.log(`[Hook] useCoaches: Successfully fetched ${data.length} coaches`);
      const mapped = data.map((u: any) => {
        const coachProfile = u.coach || {};
        return {
          ...u,
          ...coachProfile,
          id: coachProfile.id, // Primary ID is now coach.id
          userId: u.id,        // Keep userId for API calls
          name: `${u.firstName || ''} ${u.middleName ? u.middleName + ' ' : ''}${u.lastName || ''}`.trim() || u.username,
          initials: `${u.firstName?.[0] || ''}${u.lastName?.[0] || u.username?.[0] || ''}`.toUpperCase(),
          memberSince: u.createdAt ? u.createdAt.split('T')[0] : '',
          phone: u.mobile || u.phone || ''
        };
      });
      setCoaches(mapped);
      setIsLoaded(true);
    } catch (e) {
      console.error('[Hook] useCoaches: Fetch error:', e);
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchCoaches();
  }, []);

  const addCoach = async (coachData: Omit<Coach, 'id' | 'memberSince'>) => {
    console.log('[Hook] useCoaches: Adding coach...', coachData.email);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...coachData,
          username: coachData.email.split('@')[0], // Generate username from email
          role: 'COACH'
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error('[Hook] useCoaches: Add failed:', err.error);
        throw new Error(err.error || 'Failed to add coach');
      }
      console.log('[Hook] useCoaches: Coach added successfully');
      await fetchCoaches();
      return true;
    } catch (error: any) {
      console.error('[Hook] useCoaches: Add error:', error.message);
      throw error;
    }
  };

  const updateCoach = async (id: string, updates: Partial<Coach>) => {
    try {
      const coach = coaches.find(c => c.id === id);
      const targetId = coach ? coach.userId : id;

      const res = await fetch(`/api/users/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update coach');
      await fetchCoaches();
    } catch (error: any) {
      console.error('[Hook] useCoaches: Update error:', error.message);
      throw error;
    }
  };

  const deleteCoach = async (id: string) => {
    try {
      const coach = coaches.find(c => c.id === id);
      const targetId = coach ? coach.userId : id;

      const res = await fetch(`/api/users/${targetId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete coach');
      setCoaches(prev => prev.filter(c => c.id !== id));
    } catch (error: any) {
      console.error('[Hook] useCoaches: Delete error:', error.message);
      throw error;
    }
  };

  return {
    coaches,
    isLoaded,
    addCoach,
    updateCoach,
    deleteCoach,
    refresh: fetchCoaches
  };
}
