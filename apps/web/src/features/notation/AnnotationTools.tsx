'use client';

import React, { useState, useEffect } from 'react';
import { useStudyStore } from '../../stores/useStudyStore';
import { findNode, updateNode } from '../../lib/treeUtils';

const MOVE_EVALS = [
  { symbol: '!', label: 'Good move' },
  { symbol: '?', label: 'Mistake' },
  { symbol: '!!', label: 'Brilliant move' },
  { symbol: '??', label: 'Blunder' },
  { symbol: '!?', label: 'Interesting move' },
  { symbol: '?!', label: 'Dubious move' },
];

const POS_EVALS = [
  { symbol: '=', label: 'Equal position' },
  { symbol: '∞', label: 'Unclear position' },
  { symbol: '⩲', label: 'White is slightly better' },
  { symbol: '⩱', label: 'Black is slightly better' },
  { symbol: '±', label: 'White is better' },
  { symbol: '∓', label: 'Black is better' },
  { symbol: '+-', label: 'White is winning' },
  { symbol: '-+', label: 'Black is winning' },
];

export const AnnotationTools: React.FC = () => {
  const { tree, currentNodeId, addComment } = useStudyStore();
  const currentNode = findNode(tree, currentNodeId);
  
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    setCommentText(currentNode?.comment || '');
  }, [currentNodeId, currentNode?.comment]);

  if (!currentNode || currentNode.id === 'root') {
    return (
      <div className="annotation-tools empty">
        <p>Make a move to add comments or annotations.</p>
        <style>{`
          .annotation-tools.empty {
            margin-top: 1rem;
            padding: 1rem;
            background: rgba(30, 41, 59, 0.7);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: rgba(255,255,255,0.4);
            text-align: center;
            font-size: 0.9rem;
          }
        `}</style>
      </div>
    );
  }

  const handleSaveComment = () => {
    if (currentNode.comment !== commentText) {
      addComment(currentNode.id, commentText);
    }
  };

  const toggleGlyph = (symbol: string, category: 'MOVE' | 'POS') => {
    const currentGlyphs = currentNode.glyphs || [];
    
    // Determine which symbols belong to which category
    const categorySymbols = category === 'MOVE' 
      ? MOVE_EVALS.map(g => g.symbol) 
      : POS_EVALS.map(g => g.symbol);

    const isAlreadySelected = currentGlyphs.includes(symbol);

    // Remove ALL symbols from the current category to enforce max 1 per category
    let newGlyphs = currentGlyphs.filter(g => !categorySymbols.includes(g));

    // If it wasn't already selected, add it
    if (!isAlreadySelected) {
      newGlyphs.push(symbol);
    }

    // Ensure Move Evaluation symbols always come before Position Evaluation symbols
    const moveSymbols = MOVE_EVALS.map(g => g.symbol);
    newGlyphs.sort((a, b) => {
      const aIsMove = moveSymbols.includes(a);
      const bIsMove = moveSymbols.includes(b);
      if (aIsMove && !bIsMove) return -1;
      if (!aIsMove && bIsMove) return 1;
      return 0;
    });
    
    useStudyStore.setState(state => {
       const newTree = updateNode(state.tree, currentNode.id, { glyphs: newGlyphs });
       return newTree ? { tree: newTree } : state;
    });
  };

  const hasGlyph = (symbol: string) => (currentNode.glyphs || []).includes(symbol);

  return (
    <div className="annotation-tools">
      <div className="comment-editor">
        <textarea 
          placeholder="Add a comment to this move..."
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          onBlur={handleSaveComment}
        />
      </div>

      <div className="glyphs-grid">
        <div className="glyphs-column">
          {MOVE_EVALS.map(g => (
            <button 
              key={g.symbol}
              className={`glyph-row-btn ${hasGlyph(g.symbol) ? 'active' : ''}`}
              onClick={() => toggleGlyph(g.symbol, 'MOVE')}
            >
              <span className="glyph-symbol">{g.symbol}</span>
              <span className="glyph-label">{g.label}</span>
            </button>
          ))}
        </div>
        <div className="glyphs-column">
          {POS_EVALS.map(g => (
            <button 
              key={g.symbol}
              className={`glyph-row-btn ${hasGlyph(g.symbol) ? 'active' : ''}`}
              onClick={() => toggleGlyph(g.symbol, 'POS')}
            >
              <span className="glyph-symbol">{g.symbol}</span>
              <span className="glyph-label">{g.label}</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .annotation-tools {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(15, 23, 42, 0.9);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .comment-editor textarea {
          width: 100%;
          min-height: 80px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          border-radius: 8px;
          padding: 10px;
          resize: vertical;
          font-family: inherit;
          font-size: 0.9rem;
        }
        .comment-editor textarea:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.5);
        }

        .glyphs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          background: rgba(0,0,0,0.2);
          padding: 12px;
          border-radius: 8px;
        }

        .glyphs-column {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .glyph-row-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          background: transparent;
          border: none;
          color: #94a3b8;
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
        }

        .glyph-row-btn:hover {
          background: rgba(255,255,255,0.05);
          color: #e2e8f0;
        }

        .glyph-row-btn.active {
          background: rgba(139, 92, 246, 0.2);
          color: #fff;
        }

        .glyph-row-btn.active .glyph-symbol {
          color: #a78bfa;
        }

        .glyph-symbol {
          font-weight: 800;
          font-size: 1.1rem;
          width: 24px;
          text-align: center;
          color: #cbd5e1;
        }

        .glyph-label {
          font-size: 0.85rem;
          flex: 1;
        }
      `}</style>
    </div>
  );
};
