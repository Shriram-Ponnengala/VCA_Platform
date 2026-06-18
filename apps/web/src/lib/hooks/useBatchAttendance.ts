import { useState, useEffect, useCallback } from 'react';

export function useBatchAttendance(batchId: string) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`/api/attendance/batch-sessions/${batchId}`);
      if (!res.ok) throw new Error('Failed to fetch batch sessions');
      const data = await res.json();
      setSessions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoaded(true);
    }
  }, [batchId]);

  useEffect(() => {
    if (batchId) {
      fetchSessions();
    }
  }, [fetchSessions, batchId]);

  const createSession = async (sessionData: any) => {
    try {
      const res = await fetch(`/api/attendance/batch-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sessionData, batchId })
      });
      if (!res.ok) throw new Error('Failed to create session');
      const newSession = await res.json();
      setSessions([newSession, ...sessions]);
      return newSession;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getAttendanceRecords = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/attendance/records/${sessionId}`);
      if (!res.ok) throw new Error('Failed to fetch records');
      return await res.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const upsertAttendanceRecords = async (sessionId: string, records: any[]) => {
    try {
      const res = await fetch(`/api/attendance/records/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records })
      });
      if (!res.ok) throw new Error('Failed to save attendance');
      return await res.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    sessions,
    isLoaded,
    error,
    createSession,
    getAttendanceRecords,
    upsertAttendanceRecords,
    refreshSessions: fetchSessions
  };
}
