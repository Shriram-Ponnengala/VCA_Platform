'use client';

import { useRouter } from 'next/navigation';
import { Users, Layers, GraduationCap } from 'lucide-react';
import { useStudents } from '@/lib/hooks/useStudents';
import { useBatches } from '@/lib/hooks/useBatches';
import { useCoaches } from '@/lib/hooks/useCoaches';
import styles from './Dashboard.module.css';

export default function AdminDashboard() {
  const router = useRouter();
  const { students } = useStudents();
  const { batches } = useBatches();
  const { coaches } = useCoaches();

  const stats = [
    { label: 'Total Students', value: students.length.toString(), icon: Users, href: '/dashboard/admin/students' },
    { label: 'Active Batches', value: batches.length.toString(), icon: Layers, href: '/dashboard/admin/batches' },
    { label: 'Academy Coaches', value: coaches.length.toString(), icon: GraduationCap, href: '/dashboard/admin/coaches' },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Welcome back to the academy</p>
      </header>

      <div className={styles.statsGrid}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div 
              key={i} 
              className={styles.statCard} 
              onClick={() => router.push(stat.href)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.statHeader}>
                <div className={styles.statIconWrapper}>
                  <Icon size={20} />
                </div>
                <div className={styles.statDecoration}>
                  <Icon size={64} className={styles.bgIcon} />
                </div>
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statValue}>{stat.value}</h3>
                <p className={styles.statLabel}>{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
