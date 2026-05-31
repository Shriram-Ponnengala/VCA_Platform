import { useState, useEffect, useCallback } from 'react';

export interface Session {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  platform: string;
  meetingLink: string | null;
  description: string | null;
  status: string;
  classId: string;
  agenda: string[] | null;
  attachments: any | null;
  createdAt: string;
  updatedAt: string;
}

export function useSessions(batchId: string | null) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!batchId) return;
    try {
      const res = await fetch(`/api/sessions/batch/${batchId}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setIsLoaded(true);
    }
  }, [batchId]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete session:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    isLoaded,
    refetch: fetchSessions,
    deleteSession
  };
}

