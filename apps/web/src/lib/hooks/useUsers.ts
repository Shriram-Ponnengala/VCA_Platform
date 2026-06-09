'use client';

import { useState, useEffect } from 'react';

export interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'COACH' | 'STUDENT';
  firstName?: string;
  lastName?: string;
  createdAt: string;
  password?: string;
}

const INITIAL_USERS: User[] = [
  { id: '1', username: 'shriram_p', role: 'STUDENT', createdAt: '2026-04-20' },
  { id: '2', username: 'coach_vikram', role: 'COACH', createdAt: '2026-04-15' },
  { id: '3', username: 'admin_user', role: 'ADMIN', createdAt: '2026-04-01' },
  { id: '4', username: 'priya_m', role: 'COACH', createdAt: '2026-04-18' },
  { id: '5', username: 'rahul_s', role: 'STUDENT', createdAt: '2026-04-22' },
];

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const contentType = res.headers.get('content-type');
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: Failed to fetch users`);
      }
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response from server.');
      }
      const data = await res.json();
      setUsers(data);
      setIsLoaded(true);
    } catch (err: any) {
      setError(err.message);
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const addUser = async (userData: Omit<User, 'id' | 'createdAt'> & { password?: string }) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const contentType = res.headers.get('content-type');
      if (!res.ok) {
        let errorMsg = 'Failed to add user';
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } else {
          errorMsg = `Server error: ${res.status}`;
        }
        throw new Error(errorMsg);
      }
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response from server.');
      }
      const newUser = await res.json();
      setUsers(prev => [newUser, ...prev]);
      return newUser.id;
    } catch (err: any) {
      alert(err.message);
      return null;
    }
  };

  const updateUser = async (id: string, updates: Partial<User> & { password?: string }) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update user');
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete user');
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return {
    users,
    isLoaded,
    error,
    addUser,
    updateUser,
    deleteUser,
    refresh: fetchUsers
  };
}
