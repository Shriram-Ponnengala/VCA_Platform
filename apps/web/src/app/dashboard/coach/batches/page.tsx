'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Users, Clock, Calendar, ChevronRight } from 'lucide-react';
import { Badge } from '@vca/ui';
import { useBatches } from '@/lib/hooks/useBatches';
import styles from './batches.module.css';

export default function BatchesPage() {
  const router = useRouter();
  const { batches, isLoaded } = useBatches();

  if (!isLoaded) return <div className={styles.container}>Loading...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>My Batches</h1>
          <p className={styles.subtitle}>View your assigned batches</p>
        </div>
      </header>

      <div className={styles.grid}>
        {batches.length === 0 ? (
          <p style={{ color: '#64748b' }}>You have no assigned batches.</p>
        ) : batches.map((batch) => (
          <div 
            key={batch.id} 
            className={styles.card}
            onClick={() => router.push(`/dashboard/coach/batches/${batch.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.cardHeader}>
              <Badge variant="active">{(batch.program || 'UNKNOWN').split(' ')[0]}</Badge>
              <Badge variant="active">{batch.status}</Badge>
            </div>
            
            <div className={styles.batchPrimary}>
              <h3 className={styles.batchName}>{batch.name}</h3>
              <p className={styles.coachName}>{batch.coach}</p>
            </div>

            <div className={styles.divider} />

            <div className={styles.details}>
              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>
                  <Users size={16} />
                  <span>Students</span>
                </div>
                <span className={styles.detailValue}>{batch.students?.length || 0}</span>
              </div>
              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>
                  <Clock size={16} />
                  <span>Time</span>
                </div>
                <span className={styles.detailValue}>{batch.startTime} - {batch.endTime}</span>
              </div>

              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>
                  <Calendar size={16} />
                  <span>Days</span>
                </div>
                <div className={styles.dayPills}>
                  {batch.days.map(day => (
                    <span key={day} className={styles.dayPill}>{day}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <button className={styles.arrowBtn}>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
