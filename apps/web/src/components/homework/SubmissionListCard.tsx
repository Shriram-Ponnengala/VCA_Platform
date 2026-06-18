import React from 'react';
import { CheckCircle2, History } from 'lucide-react';
import styles from './homework.module.css';

export interface SubmissionItem {
  id: string;
  title: string;
  score: number;
  submittedAt: string;
}

interface SubmissionListCardProps {
  items: SubmissionItem[];
  viewAllLink: string;
  viewAllText: string;
}

export const SubmissionListCard: React.FC<SubmissionListCardProps> = ({ items, viewAllLink, viewAllText }) => {
  return (
    <div className={styles.listCard}>
      <div className={styles.listCardHeader}>
        <History size={18} style={{ color: '#94a3b8' }} />
        <h2 className={styles.listCardTitle} style={{ fontSize: '1rem' }}>Recent Submissions</h2>
      </div>
      
      <div className={styles.listCardItems}>
        {items.map(item => {
          const isGoodScore = item.score >= 80;
          return (
            <div key={item.id} className={styles.subItem}>
              <div>
                <h3 className={styles.subTitle}>{item.title}</h3>
                <div className={styles.subMeta}>
                  Score: <span className={isGoodScore ? styles.scoreGreen : styles.scoreAmber}>{item.score}%</span>
                  <span className={styles.subMetaDot}>·</span>
                  {item.submittedAt}
                </div>
              </div>
              <div className={styles.subCheck}>
                <CheckCircle2 size={16} />
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.listCardFooter}>
        <a href={viewAllLink} className={styles.viewAllLink}>
          {viewAllText} <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </div>
  );
};
