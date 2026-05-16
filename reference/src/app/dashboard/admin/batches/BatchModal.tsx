'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { Batch } from '@/lib/hooks/useBatches';
import { useUsers } from '@/lib/hooks/useUsers';
import { usePrograms } from '@/lib/hooks/usePrograms';
import styles from './BatchModal.module.css';

interface BatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (batchData: Omit<Batch, 'id' | 'students' | 'history' | 'status'>) => void;
  initialData?: Batch | null;
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export function BatchModal({ isOpen, onClose, onSave, initialData }: BatchModalProps) {
  const { users, isLoaded: usersLoaded } = useUsers();
  const { programs, isLoaded: programsLoaded } = usePrograms();
  const coaches = useMemo(() => users.filter(u => u.role === 'COACH'), [users]);

  const [formData, setFormData] = useState({
    name: '',
    program: '',
    coachId: '',
    type: 'Group' as 'Group' | 'One-on-One',
    startDate: '',
    days: [] as string[],
    startTime: '',
    endTime: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          program: initialData.program || '',
          coachId: initialData.coachId || '',
          type: initialData.type || 'Group',
          startDate: initialData.startDate || '',
          days: initialData.days || [],
          startTime: initialData.startTime || '',
          endTime: initialData.endTime || ''
        });
      } else {
        setFormData({
          name: '',
          program: '',
          coachId: '',
          type: 'Group',
          startDate: '',
          days: [],
          startTime: '',
          endTime: ''
        });
      }
      setErrors({});
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, initialData]); // Removed programs/coaches from here to avoid loops during data loading

  // Separate effect to set default program/coach once data is loaded for NEW batches
  useEffect(() => {
    if (isOpen && !initialData && programs.length > 0 && coaches.length > 0 && !formData.program) {
      setFormData(prev => ({
        ...prev,
        program: prev.program || programs[0].name,
        coachId: prev.coachId || coaches[0].id
      }));
    }
  }, [isOpen, initialData, programs, coaches, formData.program]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const toggleDay = (day: string) => {
    setFormData(prev => {
      const newDays = prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day];
      
      if (errors.days && newDays.length > 0) {
        setErrors(errs => ({ ...errs, days: '' }));
      }
      return { ...prev, days: newDays };
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Required';
    if (!formData.startDate) newErrors.startDate = 'Required';
    if (formData.days.length === 0) newErrors.days = 'Select at least one day';
    if (!formData.startTime) newErrors.startTime = 'Required';
    if (!formData.endTime) newErrors.endTime = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{initialData ? 'Edit Batch' : 'Create New Batch'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.rowFull}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>BATCH NAME *</label>
              <input 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                className={styles.input} 
                placeholder="e.g. Weekend Pawn Beginners" 
              />
              {errors.name && <span className={styles.errorText}>{errors.name}</span>}
            </div>
          </div>

          <div className={styles.row2}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>PROGRAM *</label>
              <select name="program" value={formData.program} onChange={handleChange} className={styles.select}>
                {programs.map(opt => <option key={opt.id} value={opt.name}>{opt.name}</option>)}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>COACH *</label>
              <select name="coachId" value={formData.coachId} onChange={handleChange} className={styles.select}>
                {coaches.map(opt => <option key={opt.id} value={opt.id}>{opt.username}</option>)}
                {coaches.length === 0 && <option value="">No coaches found</option>}
              </select>
            </div>
          </div>

          <div className={styles.row2}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>TYPE</label>
              <select name="type" value={formData.type} onChange={handleChange} className={styles.select}>
                <option value="Group">Group</option>
                <option value="One-on-One">One-on-One</option>
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>START DATE *</label>
              <input 
                type="date" 
                name="startDate" 
                value={formData.startDate} 
                onChange={handleChange} 
                className={styles.input} 
              />
              {errors.startDate && <span className={styles.errorText}>{errors.startDate}</span>}
            </div>
          </div>

          <div className={styles.rowFull}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>DAYS OF WEEK *</label>
              <div className={styles.daysRow}>
                {DAYS.map(day => (
                  <button
                    key={day}
                    className={`${styles.dayBtn} ${formData.days.includes(day) ? styles.selected : ''}`}
                    onClick={() => toggleDay(day)}
                  >
                    {day}
                  </button>
                ))}
              </div>
              {errors.days && <span className={styles.errorText}>{errors.days}</span>}
            </div>
          </div>

          <div className={styles.row2}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>START TIME *</label>
              <input 
                type="time" 
                name="startTime" 
                value={formData.startTime} 
                onChange={handleChange} 
                className={styles.input} 
              />
              {errors.startTime && <span className={styles.errorText}>{errors.startTime}</span>}
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>END TIME *</label>
              <input 
                type="time" 
                name="endTime" 
                value={formData.endTime} 
                onChange={handleChange} 
                className={styles.input} 
              />
              {errors.endTime && <span className={styles.errorText}>{errors.endTime}</span>}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.saveBtn} onClick={handleSubmit}>
            {initialData ? 'Save Changes' : 'Create Batch'}
          </button>
        </div>
      </div>
    </div>
  );
}
