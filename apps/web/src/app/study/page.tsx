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
          background: #0f172a;
          background-image:
            radial-gradient(circle at 0% 0%, rgba(139,92,246,.15) 0%, transparent 50%),
            radial-gradient(circle at 100% 100%, rgba(139,92,246,.10) 0%, transparent 50%);
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 2rem;
          color: #f8fafc;
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
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255,255,255,.1);
        }

        .logo { display: flex; align-items: center; gap: .75rem; }
        .logo h1 {
          font-size: 1.6rem;
          font-weight: 700;
          background: linear-gradient(135deg, #fff 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }
        .text-primary { color: #8b5cf6; }

        .badge {
          font-size: 0.75rem;
          background: rgba(139,92,246,0.2);
          color: #a78bfa;
          padding: 2px 8px;
          border-radius: 12px;
          border: 1px solid rgba(139,92,246,0.3);
        }

        .main-content {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
