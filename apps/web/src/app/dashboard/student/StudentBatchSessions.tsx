'use client';

import React from 'react';
import { Video } from 'lucide-react';
import { useSessions } from '@/lib/hooks/useSessions';

export function StudentBatchSessions({ batchId }: { batchId: string }) {
  const { sessions, isLoaded } = useSessions(batchId);

  if (!isLoaded) return <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Loading sessions...</div>;

  const upcomingSessions = sessions.filter(s => s.status === 'Upcoming' || s.status === 'Live');
  
  if (upcomingSessions.length === 0) {
    return <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '8px' }}>No upcoming sessions.</div>;
  }

  const nextSession = upcomingSessions[0]; // Assuming they are sorted by date

  const d = new Date(nextSession.date);
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div style={{ 
      marginTop: '12px', 
      padding: '12px', 
      backgroundColor: '#f8fafc', 
      borderRadius: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase' }}>Next Session</p>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', fontWeight: 600, color: '#3D1A0E' }}>{nextSession.title}</p>
        <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{dateStr} • {nextSession.startTime}</p>
      </div>
      {nextSession.meetingLink && (
        <button 
          onClick={() => window.open(nextSession.meetingLink || '', '_blank')}
          style={{
            padding: '6px 12px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Video size={14} /> Join Session
        </button>
      )}
    </div>
  );
}
