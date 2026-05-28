'use client';

import React from 'react';
import { useStudyStore } from '../../stores/useStudyStore';
import { NotationNode } from './NotationNode';

export const NotationPanel: React.FC = () => {
  const tree = useStudyStore(state => state.tree);

  return (
    <div className="notation-panel">
      <NotationNode node={tree} depth={0} />
      
      <style>{`
        .notation-panel {
          background: rgba(30, 41, 59, 0.7);
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #f8fafc;
          font-family: monospace;
          font-size: 14px;
          line-height: 1.6;
          overflow-y: auto;
          max-height: 600px;
          flex: 1;
          min-width: 300px;
        }
        .notation-move {
          display: inline;
        }
        .move-number {
          color: #94a3b8;
          margin-left: 4px;
        }
        .move-san {
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 4px;
          transition: background 0.1s;
        }
        .move-san:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .move-san.active {
          background: #8b5cf6;
          color: white;
          font-weight: bold;
        }
        .variation-inline {
          color: #94a3b8;
        }
        .variation-block {
          margin-left: 1rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          border-left: 2px solid rgba(255, 255, 255, 0.1);
          padding-left: 0.5rem;
        }
        .move-glyphs {
          color: #38bdf8;
          font-weight: bold;
          margin-left: 2px;
        }
        .move-comment {
          display: block;
          margin-top: 4px;
          margin-bottom: 8px;
          color: rgba(255, 255, 255, 0.8);
          font-style: italic;
          background: rgba(0,0,0,0.2);
          padding: 6px 10px;
          border-radius: 6px;
          border-left: 2px solid #8b5cf6;
        }
      `}</style>
    </div>
  );
};
