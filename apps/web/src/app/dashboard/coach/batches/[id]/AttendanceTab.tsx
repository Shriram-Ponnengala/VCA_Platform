'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Save, CheckCircle, XCircle } from 'lucide-react';
import { useBatchAttendance } from '@/lib/hooks/useBatchAttendance';
import styles from './AttendanceTab.module.css';

interface AttendanceTabProps {
  batchId: string;
  enrolledStudents: any[];
}

export function AttendanceTab({ batchId, enrolledStudents }: AttendanceTabProps) {
  const { sessions, isLoaded, createSession, getAttendanceRecords, upsertAttendanceRecords, refreshSessions } = useBatchAttendance(batchId);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newSessionDate, setNewSessionDate] = useState('');
  const [newSessionStartTime, setNewSessionStartTime] = useState('17:00');
  const [newSessionEndTime, setNewSessionEndTime] = useState('18:00');

  const [attendanceState, setAttendanceState] = useState<Record<string, string>>({}); // studentId -> status
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId && !isCreatingNew) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId, isCreatingNew]);

  useEffect(() => {
    async function loadRecords() {
      if (!selectedSessionId) return;
      setIsLoadingRecords(true);
      try {
        const records = await getAttendanceRecords(selectedSessionId);
        const newState: Record<string, string> = {};
        enrolledStudents.forEach(s => {
          const record = records.find((r: any) => r.studentId === s.id);
          newState[s.id] = record ? record.status : 'absent';
        });
        setAttendanceState(newState);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingRecords(false);
      }
    }
    loadRecords();
  }, [selectedSessionId, enrolledStudents]);

  const handleCreateSession = async () => {
    if (!newSessionDate) return alert('Date is required');
    try {
      const newSession = await createSession({
        sessionDate: newSessionDate,
        startTime: newSessionStartTime,
        endTime: newSessionEndTime,
      });
      setIsCreatingNew(false);
      setSelectedSessionId(newSession.id);
      
      const newState: Record<string, string> = {};
      enrolledStudents.forEach(s => {
        newState[s.id] = 'absent'; // Default
      });
      setAttendanceState(newState);
    } catch (err) {
      alert('Failed to create session');
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedSessionId) return;
    setIsSaving(true);
    try {
      const recordsToSave = Object.keys(attendanceState).map(studentId => ({
        studentId,
        status: attendanceState[studentId],
        isGuest: false,
        comment: ''
      }));
      await upsertAttendanceRecords(selectedSessionId, recordsToSave);
      alert('Attendance saved successfully!');
    } catch (err) {
      alert('Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <div className={styles.container} style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>Mark Attendance</h2>
        
        {!isCreatingNew && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select 
              value={selectedSessionId} 
              onChange={e => setSelectedSessionId(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            >
              {sessions.length === 0 && <option value="">No sessions available</option>}
              {sessions.map(s => {
                const d = new Date(s.sessionDate);
                return <option key={s.id} value={s.id}>{d.toLocaleDateString()} ({s.startTime} - {s.endTime})</option>;
              })}
            </select>
            <button 
              onClick={() => setIsCreatingNew(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
            >
              <Plus size={16} /> New Session
            </button>
          </div>
        )}
      </div>

      {isCreatingNew && (
        <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#334155' }}>Create New Session</h3>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Date</label>
              <input type="date" value={newSessionDate} onChange={e => setNewSessionDate(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Start Time</label>
              <input type="time" value={newSessionStartTime} onChange={e => setNewSessionStartTime(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', color: '#64748b' }}>End Time</label>
              <input type="time" value={newSessionEndTime} onChange={e => setNewSessionEndTime(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleCreateSession} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Create</button>
              <button onClick={() => setIsCreatingNew(false)} style={{ padding: '8px 16px', background: 'white', color: '#64748b', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {!isCreatingNew && selectedSessionId && (
        <>
          {isLoadingRecords ? (
            <div>Loading records...</div>
          ) : (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {enrolledStudents.map(student => (
                  <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 600, color: '#334155' }}>{student.name}</div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        onClick={() => setAttendanceState(prev => ({...prev, [student.id]: 'present'}))}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '99px', border: 'none', cursor: 'pointer',
                          backgroundColor: attendanceState[student.id] === 'present' ? '#dcfce7' : '#f1f5f9',
                          color: attendanceState[student.id] === 'present' ? '#15803d' : '#64748b',
                          fontWeight: attendanceState[student.id] === 'present' ? 600 : 400
                        }}
                      >
                        <CheckCircle size={16} /> Present
                      </button>
                      
                      <button 
                        onClick={() => setAttendanceState(prev => ({...prev, [student.id]: 'absent'}))}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '99px', border: 'none', cursor: 'pointer',
                          backgroundColor: attendanceState[student.id] === 'absent' ? '#fee2e2' : '#f1f5f9',
                          color: attendanceState[student.id] === 'absent' ? '#b91c1c' : '#64748b',
                          fontWeight: attendanceState[student.id] === 'absent' ? 600 : 400
                        }}
                      >
                        <XCircle size={16} /> Absent
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={handleSaveAttendance}
                  disabled={isSaving}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--primary)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, opacity: isSaving ? 0.7 : 1 }}
                >
                  <Save size={18} /> {isSaving ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
