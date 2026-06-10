'use client';

import { useState, useEffect } from 'react';

export interface Student {
  id: string;
  userId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  name: string;
  email: string;
  parentFirstName: string;
  parentMiddleName?: string;
  parentLastName: string;
  parentName: string;
  mobile: string;
  countryCode: string;
  secParentFirstName?: string;
  secParentMiddleName?: string;
  secParentLastName?: string;
  dob: string;
  country: string;
  city: string;
  status: 'active' | 'inactive';
  memberSince: string;
  program?: string; // Default or assigned program
  profilePhoto?: string;
  username?: string;
}

const INITIAL_STUDENTS: Student[] = [
  {
    id: 's1',
    userId: 'u1',
    firstName: 'Arjun',
    lastName: 'Kumar',
    name: 'Arjun Kumar',
    email: 'arjun.k@example.com',
    parentFirstName: 'Amit',
    parentLastName: 'Kumar',
    parentName: 'Amit Kumar',
    mobile: '9876543210',
    countryCode: '+91',
    dob: '2015-05-20',
    country: 'India',
    city: 'Mumbai',
    status: 'active',
    memberSince: '2023-01-10',
    program: 'Pawn Batch'
  },
  {
    id: 's2',
    userId: 'u2',
    firstName: 'Priya',
    lastName: 'Sharma',
    name: 'Priya Sharma',
    email: 'priya.s@example.com',
    parentFirstName: 'Rajesh',
    parentLastName: 'Sharma',
    parentName: 'Rajesh Sharma',
    mobile: '9876543211',
    countryCode: '+91',
    dob: '2014-08-15',
    country: 'India',
    city: 'Delhi',
    status: 'active',
    memberSince: '2023-02-12',
    program: 'Rook Batch'
  },
  {
    id: 's3',
    userId: 'u3',
    firstName: 'Alice',
    lastName: 'Smith',
    name: 'Alice Smith',
    email: 'alice.s@example.com',
    parentFirstName: 'Bob',
    parentLastName: 'Smith',
    parentName: 'Bob Smith',
    mobile: '1234567890',
    countryCode: '+1',
    dob: '2016-03-10',
    country: 'USA',
    city: 'New York',
    status: 'active',
    memberSince: '2023-03-05',
    program: 'Pawn Batch'
  }
];

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = async (retryCount = 0) => {
    console.log(`[Hook] useStudents: Fetching students from API... (Attempt ${retryCount + 1})`);
    try {
      const res = await fetch('/api/users?role=STUDENT');
      const contentType = res.headers.get('content-type');
      if (!res.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch students');
        }
        throw new Error(`Server returned ${res.status}: API might be down or restarting`);
      }
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response from server. API might be restarting.');
      }
      const data = await res.json();
      console.log(`[Hook] useStudents: Successfully fetched ${data.length} students`);
      const mapped = data.map((u: any) => {
        const studentProfile = u.student || {};
        return {
          ...u,
          ...studentProfile,
          id: studentProfile.id || u.id, // Primary ID fallback to user ID
          userId: u.id,         // Keep userId for API calls
          name: `${u.firstName || ''} ${u.middleName ? u.middleName + ' ' : ''}${u.lastName || ''}`.trim() || u.username,
          parentName: `${studentProfile.parentFirstName || ''} ${studentProfile.parentMiddleName ? studentProfile.parentMiddleName + ' ' : ''}${studentProfile.parentLastName || ''}`.trim(),
          memberSince: u.createdAt ? u.createdAt.split('T')[0] : '',
          status: u.status || 'active'
        };
      });
      setStudents(mapped);
      setError(null);
      setIsLoaded(true);
    } catch (e: any) {
      console.error(`[Hook] useStudents: Fetch error (Attempt ${retryCount + 1}):`, e);
      const maxRetries = 3;
      if (retryCount < maxRetries) {
        const delay = 2000 * (retryCount + 1);
        console.log(`[Hook] useStudents: Retrying in ${delay}ms...`);
        setTimeout(() => {
          fetchStudents(retryCount + 1);
        }, delay);
      } else {
        setError(e.message || 'Failed to fetch students');
        setIsLoaded(true);
        if (students.length === 0) {
          console.warn('[Hook] useStudents: Falling back to INITIAL_STUDENTS mock data');
          setStudents(INITIAL_STUDENTS);
        }
      }
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const addStudent = async (studentData: Omit<Student, 'id' | 'name' | 'parentName' | 'memberSince' | 'status'>) => {
    console.log('[Hook] useStudents: Adding student...', studentData.email);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...studentData,
          username: studentData.email, // Use email as username
          role: 'STUDENT'
        }),
      });
      const contentType = res.headers.get('content-type');
      if (!res.ok) {
        let errorMsg = 'Failed to add student';
        if (contentType && contentType.includes('application/json')) {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        } else {
          errorMsg = `Server error: ${res.status}`;
        }
        console.error('[Hook] useStudents: Add failed:', errorMsg);
        throw new Error(errorMsg);
      }
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response from server.');
      }
      const newUser = await res.json();
      console.log('[Hook] useStudents: Student added successfully');
      await fetchStudents();
      return true;
    } catch (error: any) {
      console.error('[Hook] useStudents: Add error:', error.message);
      throw error;
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      const student = students.find(s => s.id === id);
      const targetId = student ? student.userId : id;
      
      const res = await fetch(`/api/users/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update student');
      await fetchStudents();
    } catch (error: any) {
      console.error('[Hook] useStudents: Update error:', error.message);
      throw error;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const student = students.find(s => s.id === id);
      const targetId = student ? student.userId : id;

      const res = await fetch(`/api/users/${targetId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete student');
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (error: any) {
      console.error('[Hook] useStudents: Delete error:', error.message);
      throw error;
    }
  };

  return {
    students,
    isLoaded,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
    refresh: fetchStudents
  };
}
