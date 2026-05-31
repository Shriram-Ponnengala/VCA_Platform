'use client';

import React from 'react';
import { X, Calendar, Clock, Video, Edit2, ExternalLink, Users, FileText, CheckCircle2 } from 'lucide-react';
import { Session } from '@/lib/hooks/useSessions';
import styles from './Modal.module.css';

interface SessionDetailsModalProps {
  session: Session;
  students: any[];
  onClose: () => void;
  onEdit: () => void;
}

export function SessionDetailsModal({ session, students, onClose, onEdit }: SessionDetailsModalProps) {
  const d = new Date(session.date);
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className={styles.overlay}>
      <div className={styles.detailsModal}>
        <div className={styles.detailsHeader}>
          <div className={styles.detailsTitleRow}>
            <h2>{session.title}</h2>
            <span className={`${styles.statusBadge} ${styles[session.status.toLowerCase()] || ''}`}>
              {session.status}
            </span>
          </div>
          
          <div className={styles.detailsActions}>
            <button className={styles.joinBtn} onClick={() => window.open(session.meetingLink || '', '_blank')} disabled={!session.meetingLink}>
              Join <ExternalLink size={14} />
            </button>
            <button className={styles.actionBtn} onClick={onEdit}>
              <Edit2 size={14} /> Edit
            </button>
            <button className={styles.iconActionBtn} onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className={styles.metaRow}>
          <div className={styles.metaItem}>
            <Calendar size={16} /> {dateStr}
          </div>
          <div className={styles.metaItem}>
            <Clock size={16} /> {session.startTime} - {session.endTime} ({session.duration} mins)
          </div>
          <div className={styles.metaItem}>
            <Video size={16} /> {session.platform}
          </div>
        </div>

        <div className={styles.detailsContent}>
          <div className={styles.detailsLeft}>
            <div className={styles.section}>
              <h3>Topic / Description</h3>
              <p>{session.description || 'No description provided.'}</p>
            </div>

            <div className={styles.section}>
              <h3>Agenda</h3>
              {session.agenda && session.agenda.length > 0 ? (
                <ul className={styles.agendaList}>
                  {session.agenda.map((item, idx) => (
                    <li key={idx}>
                      <CheckCircle2 size={16} className={styles.checkIcon} /> {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.emptyText}>No agenda items.</p>
              )}
            </div>
          </div>

          <div className={styles.detailsRight}>
            <div className={styles.section}>
              <h3><Users size={16} /> Students ({students.length})</h3>
              <div className={styles.studentList}>
                {students.map(student => (
                  <div key={student.id} className={styles.studentItem}>
                    <div className={styles.avatar}>
                      <User size={16} />
                    </div>
                    <div>
                      <div className={styles.studentName}>{student.name}</div>
                      <div className={styles.studentEmail}>{student.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h3><FileText size={16} /> Attachments (0)</h3>
              <button className={styles.addAttachmentBtn}>+ Add Attachment</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const User = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
