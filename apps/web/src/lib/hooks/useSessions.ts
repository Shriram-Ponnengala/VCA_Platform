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
  notes: string | null;
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
    if (!batchId) {
      // batchId not ready yet — mark as not loaded so callers wait
      setIsLoaded(false);
      return;
    }
    setIsLoaded(false);
    try {
      const res = await fetch(`/api/sessions/batch/${batchId}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setSessions(data);
        } else {
          console.warn('Received non-JSON response from /api/sessions/batch. API might be restarting.');
        }
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

