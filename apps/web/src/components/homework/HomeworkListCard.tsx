import React from 'react';
import { Calendar, Clock, LayoutGrid, ChevronRight, Play, BookOpen } from 'lucide-react';
import styles from './homework.module.css';

export interface HomeworkItem {
  id: string;
  title: string;
  type: 'puzzles' | 'study' | 'lesson';
  description: string;
  dueDate: string;
  durationMins: number;
  problemCount?: number;
  progress: number;
  status: 'assigned' | 'completed' | 'pending';
}

interface HomeworkListCardProps {
  title: string;
  count: number;
  items: HomeworkItem[];
  viewAllLink: string;
  viewAllText: string;
  isUpcoming?: boolean;
}

const CircularProgress = ({ progress, total }: { progress: number, total?: number }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressRingWrapper}>
        <svg className={styles.progressRingSvg} viewBox="0 0 60 60">
          <circle
            className={styles.progressRingBg}
            strokeWidth="4"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="30"
            cy="30"
          />
          <circle
            className={styles.progressRingFill}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="30"
            cy="30"
          />
        </svg>
        <div className={styles.progressText}>
          {progress}%
        </div>
      </div>
      <div className={styles.progressLabel}>
        {progress === 100 ? 'Submitted' : (total ? `${Math.round((progress / 100) * total)} / ${total}` : 'In progress')}
      </div>
    </div>
  );
};

const getTypeStyles = (type: HomeworkItem['type']) => {
  switch (type) {
    case 'puzzles': return { tag: styles.typeTagPuzzles, iconClass: styles.iconPuzzles, icon: <LayoutGrid size={20} /> };
    case 'study': return { tag: styles.typeTagStudy, iconClass: styles.iconStudy, icon: <BookOpen size={20} /> };
    case 'lesson': return { tag: styles.typeTagLesson, iconClass: styles.iconLesson, icon: <Play size={20} /> };
  }
};

export const HomeworkListCard: React.FC<HomeworkListCardProps> = ({
  title, count, items, viewAllLink, viewAllText, isUpcoming = false
}) => {
  return (
    <div className={styles.listCard}>
      <div className={styles.listCardHeader}>
        <h2 className={styles.listCardTitle}>{title}</h2>
        <span className={styles.listCardCount}>{count}</span>
      </div>
      
      <div className={styles.listCardItems}>
        {items.map(item => {
          const typeStyle = getTypeStyles(item.type);
          
          return (
            <div key={item.id} className={styles.listItem}>
              <div className={`${styles.listItemIcon} ${typeStyle.iconClass}`}>
                {typeStyle.icon}
              </div>
              
              <div className={styles.listItemContent}>
                <div className={styles.listItemHeader}>
                  <h3 className={styles.listItemTitle}>{item.title}</h3>
                  <span className={`${styles.typeTag} ${typeStyle.tag}`}>
                    {item.type}
                  </span>
                </div>
                <p className={styles.listItemDesc}>{item.description}</p>
                
                <div className={styles.listItemMeta}>
                  <div className={styles.metaItem}>
                    <Calendar size={14} />
                    <span>{item.dueDate}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <Clock size={14} />
                    <span>{item.durationMins} mins</span>
                  </div>
                  {item.problemCount && (
                    <div className={styles.metaItem}>
                      <LayoutGrid size={14} />
                      <span>{item.problemCount} problems</span>
                    </div>
                  )}
                </div>
              </div>

              {!isUpcoming ? (
                <div className={styles.listItemRight}>
                  <CircularProgress progress={item.progress} total={item.problemCount} />
                  <ChevronRight size={20} className={styles.chevron} />
                </div>
              ) : (
                <div className={styles.upcomingRight}>
                  <div>
                     <div className={styles.upcomingDate}>{item.dueDate.split(',')[0]}</div>
                     <div className={styles.upcomingTime}>{item.dueDate.split(',')[1] || item.dueDate}</div>
                  </div>
                  <ChevronRight size={20} className={styles.chevron} />
                </div>
              )}
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
