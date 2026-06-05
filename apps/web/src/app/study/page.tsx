import React from 'react';
import { StudyLayout } from '../../features/study/StudyLayout';
import { Zap } from 'lucide-react';

export default function StudyPage() {
  return (
    <div className="page-wrapper">
      <div className="app-container">
        <header className="header">
          <div className="logo">
            <Zap size={28} className="text-primary" fill="currentColor" />
            <h1>VCA Study Mode</h1>
            <span className="badge">Frontend Only</span>
          </div>
        </header>

        <main className="main-content">
          <StudyLayout />
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

        .page-wrapper {
          min-height: 100vh;
          background: #fdf0e4;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 2rem;
          color: #4a2018;
          font-family: 'Outfit', sans-serif;
        }

        .app-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
          max-width: 1200px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: #2d4a6b;
          border-radius: 12px;
          color: #ffffff;
        }

        .logo { display: flex; align-items: center; gap: .75rem; }
        .logo h1 {
          font-size: 1.6rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }
        .text-primary { color: #c8854a; }

        .badge {
          font-size: 0.75rem;
          background: rgba(255,255,255,0.1);
          color: #ffffff;
          padding: 2px 8px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .main-content {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
