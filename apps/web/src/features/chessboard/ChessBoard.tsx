'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Chessground } from 'chessground';
import { Chess } from '@vca/chess';
import type { Api } from 'chessground/api';
import type { Config } from 'chessground/config';
import type { Key } from 'chessground/types';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';

import { useStudyStore } from '../../stores/useStudyStore';
import { findNode } from '../../lib/treeUtils';

interface ChessBoardProps {
  isLocked?: boolean;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ isLocked = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const [promotionPending, setPromotionPending] = useState<{ from: string; to: string; color: 'w' | 'b' } | null>(null);

  const [boardWidth, setBoardWidth] = useState<number | null>(null);
  const resizeStartRef = useRef<{ x: number; width: number } | null>(null);

  const handleResizeMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!resizeStartRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - resizeStartRef.current.x;
    let newWidth = resizeStartRef.current.width + deltaX;
    newWidth = Math.max(280, Math.min(800, newWidth));
    setBoardWidth(newWidth);
  }, []);

  useEffect(() => {
    if (cgRef.current) {
      cgRef.current.redrawAll();
    }
  }, [boardWidth]);

  const handleResizeEnd = useCallback(() => {
    resizeStartRef.current = null;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    document.removeEventListener('touchmove', handleResizeMove);
    document.removeEventListener('touchend', handleResizeEnd);
  }, [handleResizeMove]);

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current) return;
    const boardWrapper = containerRef.current.closest('.board-wrapper');
    if (!boardWrapper) return;
    
    const initialWidth = boardWrapper.getBoundingClientRect().width;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    
    resizeStartRef.current = {
      x: clientX,
      width: initialWidth
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    document.addEventListener('touchmove', handleResizeMove, { passive: false });
    document.addEventListener('touchend', handleResizeEnd);
  }, [handleResizeMove, handleResizeEnd]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.removeEventListener('touchmove', handleResizeMove);
      document.removeEventListener('touchend', handleResizeEnd);
    };
  }, [handleResizeMove, handleResizeEnd]);

  const { tree, currentNodeId, playMove, goNext, goPrev, goStart, goEnd, addArrows } = useStudyStore();
  const currentNode = findNode(tree, currentNodeId);
  const fen = currentNode?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  // Note: Chessground uses 'orig', 'dest', 'brush'
  const arrows = currentNode?.arrows?.map(a => ({ orig: a.from, dest: a.to, brush: a.color })) || [];

  const isLockedRef = useRef(isLocked);
  const fenRef = useRef(fen);
  const playMoveRef = useRef(playMove);
  const addArrowsRef = useRef(addArrows);
  const currentNodeIdRef = useRef(currentNodeId);

  useEffect(() => {
    isLockedRef.current = isLocked;
    fenRef.current = fen;
    playMoveRef.current = playMove;
    addArrowsRef.current = addArrows;
    currentNodeIdRef.current = currentNodeId;
  }, [isLocked, fen, playMove, addArrows, currentNodeId]);

  const toDests = (chess: Chess) => {
    const dests = new Map();
    if (isLockedRef.current) return dests;
    
    const squares = [
      'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8',
      'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
      'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
      'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
      'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
      'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
      'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
      'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'
    ];
    squares.forEach(s => {
      const ms = chess.moves({ square: s as any, verbose: true });
      if (ms.length) dests.set(s, ms.map(m => m.to));
    });
    return dests;
  };

  const handleMove = (orig: Key, dest: Key) => {
    let chess: Chess | null = null;
    try {
      chess = new Chess(fenRef.current);
      const moves = chess.moves({ square: orig as any, verbose: true });
      const isPromo = moves.some(m => m.to === dest && m.promotion);
      if (isPromo) {
        setPromotionPending({
          from: orig as string,
          to: dest as string,
          color: chess.turn()
        });
        return;
      }
    } catch (e) {
      // Ignore
    }

    playMoveRef.current(orig, dest);
  };

  const handleSelectPromotion = (promotion: 'q' | 'r' | 'b' | 'n') => {
    if (!promotionPending) return;
    const { from, to } = promotionPending;
    setPromotionPending(null);
    playMoveRef.current(from, to, promotion);
  };

  const handleCancelPromotion = () => {
    if (!promotionPending) return;
    setPromotionPending(null);
    if (cgRef.current) {
      const chess = new Chess(fenRef.current);
      cgRef.current.set({
        fen: fenRef.current,
        turnColor: chess.turn() === 'w' ? 'white' : 'black',
        movable: {
          color: chess.turn() === 'w' ? 'white' : 'black',
          dests: toDests(chess),
          events: {
            after: handleMove,
          }
        }
      });
    }
  };

  const handleDraw = (shapes: any[]) => {
    const mappedArrows = shapes.map(s => ({
      from: s.orig,
      to: s.dest,
      color: s.brush || 'green'
    }));
    addArrowsRef.current(currentNodeIdRef.current, mappedArrows);
  };

  useEffect(() => {
    if (containerRef.current && !cgRef.current) {
      const chess = new Chess(fen);
      const config: Config = {
        fen: fen,
        orientation: 'white',
        turnColor: chess.turn() === 'w' ? 'white' : 'black',
        movable: {
          color: chess.turn() === 'w' ? 'white' : 'black',
          free: false,
          dests: toDests(chess),
          events: {
            after: handleMove,
          },
        },
        drawable: {
          enabled: true,
          visible: true,
          eraseOnClick: false,
          onChange: handleDraw,
          shapes: arrows as any,
        },
        animation: {
          enabled: true,
          duration: 200,
        },
      };

      cgRef.current = Chessground(containerRef.current, config);
    }

    // Set up ResizeObserver to recalculate board bounds on container size changes
    let observer: ResizeObserver | null = null;
    if (containerRef.current) {
      observer = new ResizeObserver(() => {
        if (cgRef.current) {
          cgRef.current.redrawAll();
        }
      });
      observer.observe(containerRef.current);
    }

    // Set up window resize listener
    const handleResize = () => {
      if (cgRef.current) {
        cgRef.current.redrawAll();
      }
    };
    window.addEventListener('resize', handleResize);

    // Initial delay recalculation to handle any mounting shifts/transitions
    const mountTimer = setTimeout(() => {
      if (cgRef.current) {
        cgRef.current.redrawAll();
      }
    }, 150);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        goStart();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        goEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (cgRef.current) {
        cgRef.current.destroy();
        cgRef.current = null;
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      if (observer) {
        observer.disconnect();
      }
      clearTimeout(mountTimer);
    };
  }, []);

  useEffect(() => {
    if (cgRef.current) {
      const chess = new Chess(fen);
      cgRef.current.set({
        fen: fen,
        turnColor: chess.turn() === 'w' ? 'white' : 'black',
        movable: {
          color: chess.turn() === 'w' ? 'white' : 'black',
          dests: toDests(chess),
          events: {
            after: handleMove,
          }
        },
        drawable: {
          shapes: arrows as any,
        }
      });
    }
  }, [fen, isLocked, arrows]);

  return (
    <div className="chess-container" style={boardWidth ? { maxWidth: `${boardWidth}px` } : undefined}>
      <div 
        className="board-wrapper cburnett brown" 
        style={{ 
          position: 'relative',
          width: boardWidth ? `${boardWidth}px` : undefined
        }}
      >
        {/* Outer frame: handles all theme styling, padding, and borders */}
        <div className="board-outer-frame board-clip" style={{ display: 'flex', width: '100%', height: '100%', boxSizing: 'border-box' }}>
          {/* Inner element: STRICTLY the 8x8 playing area. No padding, no border, no margin. */}
          <div 
            className="board-inner-playing-area" 
            style={{ width: '100%', height: '100%', padding: 0, margin: 0, border: 'none', position: 'relative' }} 
          >
            {/* Custom Background Grid for custom board themes */}
            <div 
              className="custom-board-grid-background" 
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(8, 1fr)', 
                gridTemplateRows: 'repeat(8, 1fr)', 
                pointerEvents: 'none', 
                zIndex: 0 
              }}
            >
              {Array.from({ length: 64 }).map((_, idx) => {
                const fileIdx = idx % 8;
                const rankIdx = Math.floor(idx / 8);
                const isWhite = (fileIdx + rankIdx) % 2 === 0;
                return (
                  <div 
                    key={idx} 
                    className={isWhite ? 'custom-square-white' : 'custom-square-black'}
                    style={{
                      background: isWhite ? 'var(--board-square-light)' : 'var(--board-square-dark)'
                    }}
                  />
                );
              })}
            </div>

            {/* Chessground Mount Container */}
            <div 
              ref={containerRef} 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }} 
            />
          </div>
        </div>
        {promotionPending && (
          <div className="promotion-overlay">
            <div className="promotion-card">
              <h3 className="promotion-title">Select Promotion</h3>
              <div className="promotion-options">
                {(['q', 'r', 'b', 'n'] as const).map((piece) => (
                  <button
                    key={piece}
                    className="promo-btn"
                    onClick={() => handleSelectPromotion(piece)}
                  >
                    <div
                      className="promo-piece"
                      style={{
                        backgroundImage: `var(--piece-${promotionPending.color}${piece})`
                      }}
                    />
                  </button>
                ))}
              </div>
              <button className="promo-cancel-btn" onClick={handleCancelPromotion}>
                Cancel
              </button>
            </div>
          </div>
        )}
        <div 
          className="resize-handle" 
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
        />
      </div>
      <div className="controls">
        <button onClick={goStart} className="btn-icon" title="Starting Position"><ChevronsLeft size={20} /></button>
        <button onClick={goPrev} className="btn-icon" title="Previous Move"><ChevronLeft size={20} /></button>
        <button onClick={goNext} className="btn-icon" title="Next Move"><ChevronRight size={20} /></button>
        <button onClick={goEnd} className="btn-icon" title="Final Position"><ChevronsRight size={20} /></button>
      </div>
      <style>{`
        .chess-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          align-items: center;
          width: 100%;
          max-width: 600px;
        }
        .board-wrapper {
          width: min(85vh, 600px);
          max-width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 8px;
          overflow: visible;  /* allow badges or elements to bleed past the edge if needed */
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
          box-sizing: border-box;
          /* frame color & padding come from --board-frame-color / --board-frame-padding via globals.css */
        }
        .board-clip {
          width: 100%;
          height: 100%;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }
        .resize-handle {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 18px;
          height: 18px;
          cursor: nwse-resize;
          background: linear-gradient(135deg, transparent 50%, rgba(255, 255, 255, 0.25) 50%);
          z-index: 600;
          border-bottom-right-radius: 4px;
          transition: background 0.15s;
        }
        .resize-handle:hover {
          background: linear-gradient(135deg, transparent 50%, rgba(255, 255, 255, 0.55) 50%);
        }
        .resize-handle::after {
          content: '';
          position: absolute;
          bottom: 3px;
          right: 3px;
          width: 6px;
          height: 6px;
          border-right: 2px solid rgba(255, 255, 255, 0.7);
          border-bottom: 2px solid rgba(255, 255, 255, 0.7);
        }
        .controls {
          display: flex;
          gap: 0.5rem;
          background: rgba(30, 41, 59, 0.7);
          padding: 0.5rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .btn-icon {
          padding: 0.5rem 1rem;
          background: transparent;
          color: #f8fafc;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-icon:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          color: #8b5cf6;
        }
        .btn-icon:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .promotion-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(74, 32, 24, 0.45);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .promotion-card {
          background: #fdf5ea;
          border: 3px solid #4a2018;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
          max-width: 90%;
          box-sizing: border-box;
          animation: scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .promotion-title {
          font-family: inherit;
          font-size: 1.2rem;
          font-weight: 700;
          color: #4a2018;
          margin: 0;
          text-align: center;
        }
        .promotion-options {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
        }
        .promo-btn {
          width: 72px;
          height: 72px;
          background: rgba(238, 220, 208, 0.4);
          border: 2px solid #eedcd0;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 4px;
        }
        .promo-btn:hover {
          background: #eedcd0;
          border-color: #c8854a;
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(200, 133, 74, 0.2);
        }
        .promo-btn:active {
          transform: translateY(0);
        }
        .promo-piece {
          width: 100%;
          height: 100%;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
        }
        .promo-cancel-btn {
          background: #4a2018;
          color: #fdf5ea;
          border: none;
          padding: 0.5rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(74, 32, 24, 0.2);
        }
        .promo-cancel-btn:hover {
          background: #c8854a;
          box-shadow: 0 4px 8px rgba(200, 133, 74, 0.3);
        }

        /* Ensure coordinates do not occupy layout space */
        .cg-wrap coords {
          position: absolute !important;
        }
      `}</style>
    </div>
  );
};

export default ChessBoard;
