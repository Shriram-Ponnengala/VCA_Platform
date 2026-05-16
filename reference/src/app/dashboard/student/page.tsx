'use client';

import { useRouter } from 'next/navigation';
import { Award } from 'lucide-react';
import { useBatches } from '@/lib/hooks/useBatches';
import styles from './student.module.css';

export default function StudentDashboard() {
  const router = useRouter();
  const { batches, isLoaded } = useBatches();

  const stats = [
    { label: 'My Level', value: 'Intermediate', icon: Award, color: '#f59e0b' },
    { label: 'Total Classes', value: batches.length.toString(), icon: Award, color: '#3b82f6' },
  ];

  if (!isLoaded) return <div className={styles.container}>Loading dashboard...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.statsGrid}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: `${stat.color}10`, color: stat.color }}>
                <Icon size={24} />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>{stat.label}</p>
                <h3 className={styles.statValue}>{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.myClasses}>
        <h2 className={styles.sectionTitle}>My Classes</h2>
        <div className={styles.classList}>
          {batches.map(batch => (
            <div key={batch.id} className={styles.classCard}>
              <h4>{batch.name}</h4>
              <p>{batch.coach} • {batch.startTime}</p>
            </div>
          ))}
          {batches.length === 0 && <p className={styles.emptyText}>You are not enrolled in any classes.</p>}
        </div>
      </div>
    </div>
  );
}
