'use client';

import React, { useEffect, useRef } from 'react';
import { Chessground } from 'chessground';
import { Chess, Move } from 'chess.js';
import type { Api } from 'chessground/api';
import type { Config } from 'chessground/config';
import type { Key } from 'chessground/types';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import type { ArrowData } from '@vca/types';

import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';

interface ChessBoardProps {
  fen: string;
  history: string[];
  currentIndex: number;
  onMove: (move: Move, index: number, after: string) => void;
  canNext: boolean;
  canPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
  onStart: () => void;
  onEnd: () => void;
  onVariationUp?: () => void;
  onVariationDown?: () => void;
  arrows?: ArrowData[];
  onUpdateArrows?: (arrows: ArrowData[]) => void;
  isLocked?: boolean;
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  fen, history, currentIndex, onMove,
  canNext, canPrev, onNext, onPrev, onStart, onEnd,
  onVariationUp, onVariationDown,
  arrows = [], onUpdateArrows, isLocked = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);

  // Refs to avoid stale closures in the event listener
  const currentIndexRef = useRef(currentIndex);
  const historyRef = useRef(history);
  const onMoveRef = useRef(onMove);
  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);
  const onVariationUpRef = useRef(onVariationUp);
  const onVariationDownRef = useRef(onVariationDown);
  const onUpdateArrowsRef = useRef(onUpdateArrows);
  const isLockedRef = useRef(isLocked);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
    historyRef.current = history;
    onMoveRef.current = onMove;
    onNextRef.current = onNext;
    onPrevRef.current = onPrev;
    onVariationUpRef.current = onVariationUp;
    onVariationDownRef.current = onVariationDown;
    onUpdateArrowsRef.current = onUpdateArrows;
    isLockedRef.current = isLocked;
  }, [currentIndex, history, onMove, onNext, onPrev, onVariationUp, onVariationDown, onUpdateArrows, isLocked]);

  const toDests = (chess: Chess) => {
    const dests = new Map();
    if (isLockedRef.current) return dests; // No moves allowed if locked
    
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
    const chess = new Chess(historyRef.current[currentIndexRef.current]);
    const move = chess.move({ from: orig, to: dest, promotion: 'q' });
    if (move) {
      onMoveRef.current(move, currentIndexRef.current, chess.fen());
    }
  };

  const handleDraw = (shapes: any[]) => {
    if (onUpdateArrowsRef.current) {
      // Extract necessary data from shapes (DrawShape)
      const mappedArrows: ArrowData[] = shapes.map(s => ({
        orig: s.orig,
        dest: s.dest,
        brush: s.brush
      }));
      onUpdateArrowsRef.current(mappedArrows);
    }
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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrevRef.current();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNextRef.current();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onVariationUpRef.current?.();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onVariationDownRef.current?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (cgRef.current) {
        cgRef.current.destroy();
        cgRef.current = null;
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (cgRef.current) {
      const chess = new Chess(fen);
      // Force the board to match the FEN prop, even if it hasn't changed
      // (This reverts illegal or unconfirmed optimistic moves)
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
  }, [fen, currentIndex, isLocked, arrows]);

  return (
    <div className="chess-container">
      <div className="board-wrapper cburnett brown">
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="controls">
        <button onClick={onStart} className="btn-icon" title="Starting Position" disabled={!canPrev}><ChevronsLeft size={20} /></button>
        <button onClick={onPrev} className="btn-icon" title="Previous Move" disabled={!canPrev}><ChevronLeft size={20} /></button>
        <button onClick={onNext} className="btn-icon" title="Next Move" disabled={!canNext}><ChevronRight size={20} /></button>
        <button onClick={onEnd} className="btn-icon" title="Final Position" disabled={!canNext}><ChevronsRight size={20} /></button>
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
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
          border: 4px solid rgba(255, 255, 255, 0.08);
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
      `}</style>
    </div>
  );
};

export default ChessBoard;
