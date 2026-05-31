'use client';

import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon } from 'lucide-react';
import { Session } from '@/lib/hooks/useSessions';
import styles from './Modal.module.css';

interface CreateSessionModalProps {
  batchId: string;
  session?: Session | null;
  onClose: () => void;
  onSave: () => void;
}

export function CreateSessionModal({ batchId, session, onClose, onSave }: CreateSessionModalProps) {
  const [title, setTitle] = useState(session?.title || '');
  const [date, setDate] = useState(session?.date ? session.date.substring(0, 10) : '');
  const [startTime, setStartTime] = useState(session?.startTime || '');
  const [duration, setDuration] = useState(session?.duration || 60);
  const [platform, setPlatform] = useState(session?.platform || 'Zoom');
  const [meetingLink, setMeetingLink] = useState(session?.meetingLink || '');
  const [description, setDescription] = useState(session?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parseTime = (timeStr: string) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    
    // Default to today for diff logic
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d.getTime();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const totalMinutes = startTime.split(':').reduce((acc, val, i) => acc + Number(val) * (i === 0 ? 60 : 1), 0) + duration;
      const endHours = Math.floor(totalMinutes / 60) % 24;
      const endMins = totalMinutes % 60;
      const calculatedEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

      const payload = {
        title, date, startTime, endTime: calculatedEndTime, duration, platform, meetingLink, description,
        status: session?.status || 'Upcoming'
      };

      const url = session 
        ? `/api/sessions/${session.id}` 
        : `/api/sessions/batch/${batchId}`;
      const method = session ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSave();
      } else {
        alert('Failed to save session');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving session');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>{session ? 'Edit Session' : 'Create New Session'}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Session Title *</label>
            <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Opening Principles" />
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Date *</label>
              <input required type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>Start Time *</label>
              {/* Using text for HH:MM AM/PM or time type depending on preference. Design shows text format or time picker */}
              <input required type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Duration *</label>
            <select required value={duration} onChange={e => setDuration(Number(e.target.value))}>
              <option value={30}>30 mins</option>
              <option value={45}>45 mins</option>
              <option value={60}>60 mins</option>
              <option value={90}>90 mins</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Platform *</label>
            <select required value={platform} onChange={e => setPlatform(e.target.value)}>
              <option value="Zoom">Zoom</option>
              <option value="Google Meet">Google Meet</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Meeting Link *</label>
            <div className={styles.inputWithIcon}>
              <input required type="url" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://..." />
              <LinkIcon size={16} className={styles.inputIcon} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Topic / Description</label>
            <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Session description..."></textarea>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
