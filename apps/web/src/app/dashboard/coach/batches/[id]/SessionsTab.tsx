'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Edit2, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { useSessions, Session } from '@/lib/hooks/useSessions';
import { CreateSessionModal } from './CreateSessionModal';
import { SessionDetailsModal } from './SessionDetailsModal';
import styles from './SessionsTab.module.css';

interface SessionsTabProps {
  batchId: string;
  enrolledStudents: any[];
}

export function SessionsTab({ batchId, enrolledStudents }: SessionsTabProps) {
  const { sessions, isLoaded, refetch, deleteSession } = useSessions(batchId);
  const [filter, setFilter] = useState('All Sessions');
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [viewingSession, setViewingSession] = useState<Session | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) setOpenMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  if (!isLoaded) return <div className={styles.loading}>Loading sessions...</div>;

  const filteredSessions = sessions.filter(s => {
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'Upcoming' && s.status !== 'Upcoming') return false;
    if (filter === 'Completed' && s.status !== 'Completed') return false;
    return true;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Upcoming Sessions</h3>
        <div className={styles.actions}>
          <select 
            className={styles.filterSelect}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option>All Sessions</option>
            <option>Upcoming</option>
            <option>Live</option>
            <option>Completed</option>
          </select>
          <input 
            type="text" 
            placeholder="Search sessions..." 
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className={styles.createBtn} onClick={() => setIsCreateOpen(true)}>
            <Plus size={16} /> Create Session
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {filteredSessions.length === 0 ? (
          <div className={styles.empty}>No sessions found.</div>
        ) : (
          filteredSessions.map(session => {
            const d = new Date(session.date);
            const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();
            const day = d.getDate();
            const dayOfWeek = d.toLocaleString('default', { weekday: 'short' }).toUpperCase();

            return (
              <div key={session.id} className={styles.card}>
                <div className={styles.dateBlock}>
                  <span className={styles.month}>{month}</span>
                  <span className={styles.day}>{day}</span>
                  <span className={styles.dayOfWeek}>{dayOfWeek}</span>
                </div>
                
                <div className={styles.info}>
                  <h4 className={styles.sessionTitle}>{session.title}</h4>
                  <div className={styles.meta}>
                    <span>{session.startTime} - {session.endTime}</span>
                    <span className={styles.dot}>•</span>
                    <span>{session.duration} mins</span>
                  </div>
                  <div className={styles.platform}>
                    {/* Platform icon placeholder based on name could go here */}
                    {session.platform} {session.status === 'Live' && <span className={styles.liveDot} />}
                  </div>
                </div>

                <div className={styles.statusBlock}>
                  <span className={`${styles.statusBadge} ${styles[session.status.toLowerCase()] || ''}`}>
                    {session.status}
                  </span>
                </div>

                <div className={styles.cardActions}>
                  <button className={styles.iconBtn} onClick={() => setViewingSession(session)} title="View Details">
                    <Eye size={18} />
                  </button>
                  <button className={styles.iconBtn} onClick={() => {
                    setEditingSession(session);
                    setIsCreateOpen(true);
                  }} title="Edit Session">
                    <Edit2 size={18} />
                  </button>
                  <div style={{ position: 'relative' }}>
                    <button 
                      className={styles.iconBtn} 
                      title="More"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === session.id ? null : session.id);
                      }}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {openMenuId === session.id && (
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        marginTop: '4px',
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        zIndex: 10,
                        minWidth: '120px',
                        overflow: 'hidden'
                      }}>
                        <button 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '10px 12px',
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            textAlign: 'left'
                          }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this session?')) {
                              await deleteSession(session.id);
                            }
                            setOpenMenuId(null);
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isCreateOpen && (
        <CreateSessionModal 
          batchId={batchId} 
          session={editingSession}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingSession(null);
          }}
          onSave={() => {
            refetch();
            setIsCreateOpen(false);
            setEditingSession(null);
          }}
        />
      )}

      {viewingSession && (
        <SessionDetailsModal
          session={viewingSession}
          students={enrolledStudents}
          onClose={() => setViewingSession(null)}
          onEdit={() => {
            setViewingSession(null);
            setEditingSession(viewingSession);
            setIsCreateOpen(true);
          }}
        />
      )}
    </div>
  );
}
