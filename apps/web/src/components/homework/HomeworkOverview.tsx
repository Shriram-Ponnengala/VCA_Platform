import React from 'react';
import { Home, ChevronRight, Bell, ChevronDown, FileText, CheckCircle2, FileWarning, BarChart2 } from 'lucide-react';
import { HomeworkStatCard } from './HomeworkStatCard';
import { HomeworkListCard, HomeworkItem } from './HomeworkListCard';
import { SubmissionListCard, SubmissionItem } from './SubmissionListCard';
import { KeepItUpCard } from './KeepItUpCard';
import styles from './homework.module.css';

// --- MOCK DATA ---
const statsMock = {
  assigned: 8,
  completed: 5,
  pending: 3,
  averageScore: 82,
};

const todaysHomeworkMock: HomeworkItem[] = [
  {
    id: '1',
    title: 'Tactical Combinations – Forks',
    type: 'puzzles',
    description: 'Solve 15 puzzles on forks in 1-2 moves',
    dueDate: 'Due today, 8:00 PM',
    durationMins: 20,
    problemCount: 15,
    progress: 60,
    status: 'pending',
  },
  {
    id: '2',
    title: 'Game Analysis',
    type: 'study',
    description: 'Analyze the given game and answer the questions',
    dueDate: 'Due today, 9:00 PM',
    durationMins: 30,
    progress: 100,
    status: 'completed',
  }
];

const upcomingHomeworkMock: HomeworkItem[] = [
  {
    id: '3',
    title: 'Endgame Practice – King & Pawn',
    type: 'study',
    description: 'Learn key positions and solve exercises',
    dueDate: 'Tomorrow, 8:00 PM',
    durationMins: 30,
    progress: 0,
    status: 'assigned',
  },
  {
    id: '4',
    title: 'Opening Repertoire – Italian Game',
    type: 'lesson',
    description: 'Watch the video and complete the quiz',
    dueDate: 'Jun 18, 2026, 8:00 PM',
    durationMins: 25,
    progress: 0,
    status: 'assigned',
  },
  {
    id: '5',
    title: 'Mixed Practice',
    type: 'puzzles',
    description: 'Solve 20 mixed puzzles (1-3 moves)',
    dueDate: 'Jun 20, 2026, 8:00 PM',
    durationMins: 25,
    progress: 0,
    status: 'assigned',
  }
];

const recentSubmissionsMock: SubmissionItem[] = [
  { id: 's1', title: 'Tactical Combinations – Pins', score: 90, submittedAt: 'Jun 12, 7:45 PM' },
  { id: 's2', title: 'Mate in 1', score: 100, submittedAt: 'Jun 11, 6:30 PM' },
  { id: 's3', title: 'Opening Quiz – Ruy Lopez', score: 70, submittedAt: 'Jun 10, 8:10 PM' },
  { id: 's4', title: 'Fork Finder – Level 2', score: 85, submittedAt: 'Jun 9, 5:20 PM' },
  { id: 's5', title: 'Pawn Endgames', score: 95, submittedAt: 'Jun 8, 7:00 PM' },
];

export const HomeworkOverview: React.FC = () => {
  return (
    <div className={styles.overviewContainer}>
      <div className={styles.contentWrapper}>
        
        {/* HEADER */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Homework</h1>
            <p className={styles.pageSubtitle}>Practice, learn and improve every day.</p>
          </div>
          
          <div className={styles.headerActions}>
            <button className={styles.iconButton}>
              <Bell size={18} />
              <span className={styles.badge}>
                3
              </span>
            </button>
          </div>
        </div>

        {/* STATS ROW */}
        <div className={styles.statsGrid}>
          <HomeworkStatCard 
            icon={<FileText size={20} />}
            label="Assigned"
            value={statsMock.assigned}
            subLabel="Total homework"
            iconBgColor="#eff6ff"
            iconColor="#3b82f6"
          />
          <HomeworkStatCard 
            icon={<CheckCircle2 size={20} />}
            label="Completed"
            value={statsMock.completed}
            subLabel="This week"
            iconBgColor="#f0fdf4"
            iconColor="#22c55e"
          />
          <HomeworkStatCard 
            icon={<FileWarning size={20} />}
            label="Pending"
            value={statsMock.pending}
            subLabel="Needs attention"
            iconBgColor="#fffbeb"
            iconColor="#f59e0b"
          />
          <HomeworkStatCard 
            icon={<BarChart2 size={20} />}
            label="Average Score"
            value={`${statsMock.averageScore}%`}
            subLabel="This week"
            iconBgColor="#faf5ff"
            iconColor="#a855f7"
          />
        </div>

        {/* MAIN CONTENT GRID */}
        <div className={styles.mainGrid}>
          
          {/* LEFT COLUMN */}
          <div className={styles.mainColumn}>
            <HomeworkListCard
              title="Today's Homework"
              count={todaysHomeworkMock.length}
              items={todaysHomeworkMock}
              viewAllLink="#"
              viewAllText="View all assigned homework"
            />
            
            <HomeworkListCard
              title="Upcoming Homework"
              count={upcomingHomeworkMock.length}
              items={upcomingHomeworkMock}
              viewAllLink="#"
              viewAllText="View all upcoming homework"
              isUpcoming={true}
            />
          </div>

          {/* RIGHT COLUMN */}
          <div className={styles.mainColumn}>
            <SubmissionListCard
              items={recentSubmissionsMock}
              viewAllLink="#"
              viewAllText="View all submissions"
            />
            <KeepItUpCard completedCount={statsMock.completed} />
          </div>

        </div>

      </div>
    </div>
  );
};
