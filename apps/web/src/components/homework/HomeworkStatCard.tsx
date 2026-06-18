import React from 'react';
import styles from './homework.module.css';

interface HomeworkStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subLabel: string;
  iconBgColor?: string;
  iconColor?: string;
}

export const HomeworkStatCard: React.FC<HomeworkStatCardProps> = ({
  icon,
  label,
  value,
  subLabel,
  iconBgColor = '#eff6ff',
  iconColor = '#3b82f6',
}) => {
  return (
    <div className={styles.statCard}>
      <div 
        className={styles.statIcon}
        style={{ backgroundColor: iconBgColor, color: iconColor }}
      >
        {icon}
      </div>
      <div>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statSubLabel}>{subLabel}</div>
      </div>
    </div>
  );
};
