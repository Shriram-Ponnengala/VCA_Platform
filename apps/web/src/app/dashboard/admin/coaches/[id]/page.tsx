'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useCoaches } from '@/lib/hooks/useCoaches';
import { useBatches } from '@/lib/hooks/useBatches';
import { generateBatchSlug } from '@/lib/utils/urlUtils';
import { AddCoachModal } from '../AddCoachModal';
import { ConfirmModal } from '@vca/ui';
import styles from './coachDetail.module.css';

export default function CoachProfilePage() {
  const params = useParams();
  const router = useRouter();
  
  const { coaches, isLoaded: coachesLoaded, updateCoach, deleteCoach } = useCoaches();
  const { batches, isLoaded: batchesLoaded } = useBatches();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const coachId = params.id as string;
  const coach = coaches.find(c => c.id === coachId);

  if (!coachesLoaded || !batchesLoaded) return <div className={styles.container}>Loading...</div>;

  if (!coach) {
    return (
      <div className={styles.container}>
        <h2>Coach not found</h2>
      </div>
    );
  }

  // Derived Data for this coach
  const coachBatches = batches.filter(b => b.coach === coach.name);

  const handleEditSave = (data: any) => {
    updateCoach(coach.id, data);
    setIsEditModalOpen(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.actions}>
          <button className={styles.editBtn} onClick={() => setIsEditModalOpen(true)}>Edit Coach</button>
          <button className={styles.deleteBtn} onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className={styles.profilePanel}>
        <div className={styles.leftProfile}>
          {coach.photo ? (
            <img src={coach.photo} alt={coach.name} className={styles.avatar} />
          ) : (
            <div className={styles.avatar}>{coach.initials}</div>
          )}
          <div className={styles.profileInfo}>
            <h1 className={styles.name}>{coach.name}</h1>
            <p className={styles.role}>CHESS COACH</p>
            <p className={styles.specialization}>"{coach.specialization}"</p>
          </div>
        </div>
        
        <div className={styles.rightProfile}>
          <div className={styles.contactItem}>
            <Mail size={18} className={styles.contactIcon} />
            <span>{coach.email}</span>
          </div>
          <div className={styles.contactItem}>
            <Phone size={18} className={styles.contactIcon} />
            <span>{coach.phone}</span>
          </div>
          {(coach.city || coach.country) && (
            <div className={styles.contactItem}>
              <MapPin size={18} className={styles.contactIcon} />
              <span>{coach.city ? `${coach.city}, ` : ''}{coach.country}</span>
            </div>
          )}
          {coach.dob && (
            <div className={styles.contactItem}>
              <Calendar size={18} className={styles.contactIcon} />
              <span>DOB: {coach.dob}</span>
            </div>
          )}
          <div className={styles.memberSince}>
            Member Since: {new Date(coach.memberSince).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className={styles.tabContent}>
        <div className={styles.overviewStats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Batches</span>
            <span className={styles.statValue}>{coachBatches.length}</span>
          </div>
        </div>

          <h3 className={styles.sectionTitle}>Active Batches ({coachBatches.length})</h3>
          <div className={styles.batchList}>
            {coachBatches.map(batch => (
              <div key={batch.id} className={styles.batchCard} onClick={() => router.push(`/dashboard/admin/batches/${generateBatchSlug(batch.id, batch.name, batches)}`)}>
                <div className={styles.batchHeader}>
                  <h4 className={styles.batchName}>{batch.name}</h4>
                  <span className={styles.batchBadge}>{batch.program.split(' ')[0]}</span>
                </div>
                <div className={styles.batchDetails}>
                  <span>{batch.days.join(', ')} • {batch.startTime} - {batch.endTime}</span>
                  <span>{batch.students.length} Students</span>
                </div>
              </div>
            ))}
            {coachBatches.length === 0 && (
              <p style={{ color: '#94a3b8' }}>This coach is not currently assigned to any batches.</p>
            )}
          </div>
        </div>

      <AddCoachModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSave={handleEditSave}
        initialData={coach}
      />

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          try {
            await deleteCoach(coach.id);
            router.push('/dashboard/admin/coaches');
          } catch (error) {
            console.error('Delete failed:', error);
          }
          setShowDeleteConfirm(false);
        }}
        title="Delete Coach"
        message={`Delete ${coach?.name || ''}? This coach will be removed from all assigned batches. This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
