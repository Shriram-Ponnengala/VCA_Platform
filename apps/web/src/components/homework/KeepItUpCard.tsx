import React from 'react';
import { Trophy } from 'lucide-react';
import styles from './homework.module.css';

interface KeepItUpCardProps {
  completedCount: number;
}

export const KeepItUpCard: React.FC<KeepItUpCardProps> = ({ completedCount }) => {
  return (
    <div className={styles.keepItUpCard}>
      <div className={styles.keepItUpContent}>
        <div className={styles.keepItUpHeader}>
          <Trophy size={18} style={{ color: '#eab308' }} />
          <h2 className={styles.keepItUpTitle}>Keep it up!</h2>
        </div>
        <p className={styles.keepItUpText}>
          You've completed <span style={{ fontWeight: 700 }}>{completedCount} homework</span> this week. Great consistency!
        </p>
      </div>
      
      <div className={styles.keepItUpGraphic}>
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
          <path d="M22 2l-6.4 6.4" />
          <path d="M22 2h-4" />
          <path d="M22 2v4" />
        </svg>
      </div>
    </div>
  );
};
