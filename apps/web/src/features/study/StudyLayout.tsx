'use client';

import React, { useEffect } from 'react';
import ChessBoard from '../chessboard/ChessBoard';
import { NotationPanel } from '../notation/NotationPanel';
import { AnnotationTools } from '../notation/AnnotationTools';
import { useStudyStore } from '../../stores/useStudyStore';

export const StudyLayout: React.FC = () => {
  // Ensure the store is initialized on client mount
  const resetGame = useStudyStore(state => state.resetGame);
  
  useEffect(() => {
    // Optionally reset or load initial state
    // resetGame();
  }, [resetGame]);

  return (
    <div className="study-layout">
      <div className="board-area">
        <ChessBoard />
      </div>
      <div className="notation-area">
        <NotationPanel />
        <AnnotationTools />
      </div>

      <style>{`
        .study-layout {
          display: flex;
          gap: 2rem;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .board-area {
          flex: 2;
          min-width: 400px;
        }
        
        .notation-area {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        @media (max-width: 800px) {
          .study-layout {
            flex-direction: column;
          }
          .board-area {
            min-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
