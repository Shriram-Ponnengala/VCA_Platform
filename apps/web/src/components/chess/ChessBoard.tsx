import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Chessground } from 'chessground';
import { Chess, Move } from 'chess.js';
import type { Api } from 'chessground/api';
import type { Config } from 'chessground/config';
import type { Key } from 'chessground/types';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, RefreshCw, Eraser, RotateCcw, MoreHorizontal } from 'lucide-react';
import type { ArrowData, MoveNode } from '@vca/types';
import { VariationData } from './VariationChooser';
import { NagBadge } from './NagBadge';
import SetupPositionModal from './SetupPositionModal';

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
  branches?: VariationData[];
  selectedBranchIndex?: number;
  onSelectBranch?: (index: number) => void;
  onChooseBranch?: (id: string) => void;
  currentNode?: MoveNode;
  onReset?: () => void;
  onClearArrows?: () => void;
  onMoreTools?: () => void;
  isFreehand?: boolean;
  onToggleFreehand?: (freehand: boolean) => void;
  onSetupPosition?: (fen: string) => void;
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  fen, history, currentIndex, onMove,
  canNext, canPrev, onNext, onPrev, onStart, onEnd,
  onVariationUp, onVariationDown,
  arrows = [], onUpdateArrows, isLocked = false,
  branches = [], selectedBranchIndex = 0, onSelectBranch, onChooseBranch,
  currentNode,
  onReset, onClearArrows, onMoreTools,
  isFreehand = false, onToggleFreehand,
  onSetupPosition
}) => {
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [isArrowMode, setIsArrowMode] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [promotionPending, setPromotionPending] = useState<{ from: string; to: string; color: 'w' | 'b' } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);

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
  const branchesRef = useRef(branches);
  const selectedBranchIndexRef = useRef(selectedBranchIndex);
  const onChooseBranchRef = useRef(onChooseBranch);
  const isFreehandRef = useRef(isFreehand);
  const arrowsRef = useRef(arrows);

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
    branchesRef.current = branches;
    selectedBranchIndexRef.current = selectedBranchIndex;
    onChooseBranchRef.current = onChooseBranch;
    isFreehandRef.current = isFreehand;
    arrowsRef.current = arrows;
  }, [currentIndex, history, onMove, onNext, onPrev, onVariationUp, onVariationDown, onUpdateArrows, isLocked, branches, selectedBranchIndex, onChooseBranch, isFreehand, arrows]);

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
    const currentFen = historyRef.current[currentIndexRef.current];
    let chess: Chess | null = null;
    
    try {
      chess = new Chess(currentFen);
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

    let move: any = null;
    try {
      if (!chess) chess = new Chess(currentFen);
      move = chess.move({ from: orig as any, to: dest as any });
    } catch (e) {
      // Ignore invalid move error, fall back to freehand if enabled
    }
    
    if (move && chess) {
      onMoveRef.current(move, currentIndexRef.current, chess.fen());
    } else if (isFreehandRef.current) {
      const freehandResult = movePieceInFen(currentFen, orig as string, dest as string);
      if (freehandResult) {
        onMoveRef.current({
          from: orig,
          to: dest,
          promotion: 'q',
          san: freehandResult.san
        } as any, currentIndexRef.current, freehandResult.fen);
      }
    }
  };

  const handleSelectPromotion = (promotion: 'q' | 'r' | 'b' | 'n') => {
    if (!promotionPending) return;
    const { from, to } = promotionPending;
    setPromotionPending(null);

    const currentFen = historyRef.current[currentIndexRef.current];
    let chess: Chess | null = null;
    let move: any = null;
    
    try {
      chess = new Chess(currentFen);
      move = chess.move({ from: from as any, to: to as any, promotion });
    } catch (e) {
      // Ignore
    }
    
    if (move && chess) {
      onMoveRef.current(move, currentIndexRef.current, chess.fen());
    }
  };

  const handleCancelPromotion = () => {
    if (!promotionPending) return;
    setPromotionPending(null);
    if (cgRef.current) {
      const currentFen = historyRef.current[currentIndexRef.current];
      let turnColor: 'white' | 'black' = 'white';
      let dests: any = undefined;
      try {
        const chess = new Chess(currentFen);
        turnColor = chess.turn() === 'w' ? 'white' : 'black';
        dests = (isFreehandRef.current || isHighlightMode || isArrowMode) ? undefined : toDests(chess);
      } catch (e) {
        turnColor = currentFen.split(' ')[1] === 'w' ? 'white' : 'black';
      }
      cgRef.current.set({
        fen: currentFen,
        turnColor: turnColor,
        movable: {
          color: (isLockedRef.current || isHighlightMode || isArrowMode) ? undefined : (isFreehandRef.current ? 'both' : turnColor),
          free: isFreehandRef.current && !(isHighlightMode || isArrowMode),
          dests: dests,
          events: {
            after: handleMove,
          }
        }
      });
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
    if (containerRef.current) {
      if (cgRef.current) {
        cgRef.current.destroy();
        cgRef.current = null;
      }

      let turnColor: 'white' | 'black' = 'white';
      let dests: any = undefined;
      try {
        const chess = new Chess(fen);
        turnColor = chess.turn() === 'w' ? 'white' : 'black';
        dests = isFreehandRef.current ? undefined : toDests(chess);
      } catch (e) {
        turnColor = fen.split(' ')[1] === 'w' ? 'white' : 'black';
      }

      const config: Config = {
        fen: fen,
        orientation: orientation,
        coordinates: showCoordinates,
        turnColor: turnColor,
        movable: {
          color: (isLockedRef.current || isHighlightMode || isArrowMode) ? undefined : (isFreehandRef.current ? 'both' : turnColor),
          free: isFreehandRef.current && !(isHighlightMode || isArrowMode),
          dests: dests,
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
        if (branchesRef.current && branchesRef.current.length > 1) {
          const index = selectedBranchIndexRef.current || 0;
          const chosen = branchesRef.current[index];
          if (chosen && onChooseBranchRef.current) {
            onChooseBranchRef.current(chosen.id);
          } else {
            onNextRef.current();
          }
        } else {
          onNextRef.current();
        }
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
  }, [orientation, showCoordinates, isHighlightMode, isArrowMode]);

  useEffect(() => {
    if (cgRef.current) {
      let turnColor: 'white' | 'black' = 'white';
      let dests: any = undefined;
      try {
        const chess = new Chess(fen);
        turnColor = chess.turn() === 'w' ? 'white' : 'black';
        dests = (isFreehand || isHighlightMode || isArrowMode) ? undefined : toDests(chess);
      } catch (e) {
        turnColor = fen.split(' ')[1] === 'w' ? 'white' : 'black';
      }

      cgRef.current.set({
        fen: fen,
        orientation: orientation,
        coordinates: showCoordinates,
        turnColor: turnColor,
        movable: {
          color: (isLocked || isHighlightMode || isArrowMode) ? undefined : (isFreehand ? 'both' : turnColor),
          free: isFreehand && !(isHighlightMode || isArrowMode),
          dests: dests,
          events: {
            after: handleMove,
          }
        },
        drawable: {
          shapes: arrows as any,
        }
      });
    }
  }, [fen, currentIndex, isLocked, arrows, orientation, showCoordinates, isFreehand, isHighlightMode, isArrowMode]);

  const getEventCoords = (e: MouseEvent | TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY };
    } else {
      const mouseEvent = e as MouseEvent;
      return { clientX: mouseEvent.clientX, clientY: mouseEvent.clientY };
    }
  };

  const getSquareFromCoords = (clientX: number, clientY: number): Key | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) return null;
    
    const col = Math.floor(x / (rect.width / 8));
    const row = Math.floor(y / (rect.height / 8));
    
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const filesBlack = ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
    
    const file = orientation === 'white' ? files[col] : filesBlack[col];
    const rank = orientation === 'white' ? (8 - row) : (1 + row);
    
    return `${file}${rank}` as Key;
  };

  const dragStartRef = useRef<Key | null>(null);

  useEffect(() => {
    if (!containerRef.current || (!isHighlightMode && !isArrowMode)) {
      return;
    }

    const container = containerRef.current;

    const handleStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      
      const coords = getEventCoords(e);
      const square = getSquareFromCoords(coords.clientX, coords.clientY);
      if (!square) return;

      const currentArrows = arrowsRef.current || [];

      if (isHighlightMode) {
        const squareStr = square as string;
        const exists = currentArrows.some(a => a.orig === squareStr && !a.dest);
        let newArrows: ArrowData[];
        if (exists) {
          newArrows = currentArrows.filter(a => !(a.orig === squareStr && !a.dest));
        } else {
          newArrows = [...currentArrows, { orig: squareStr, dest: undefined, brush: 'green' }];
        }
        if (onUpdateArrowsRef.current) {
          onUpdateArrowsRef.current(newArrows);
        }
      } else if (isArrowMode) {
        dragStartRef.current = square;
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isArrowMode || !dragStartRef.current || !cgRef.current) return;
      e.preventDefault();

      const coords = getEventCoords(e);
      const square = getSquareFromCoords(coords.clientX, coords.clientY);
      if (!square) return;

      if (square !== dragStartRef.current) {
        cgRef.current.setAutoShapes([{
          orig: dragStartRef.current,
          dest: square,
          brush: 'green'
        }]);
      } else {
        cgRef.current.setAutoShapes([]);
      }
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      if (!isArrowMode || !dragStartRef.current) {
        dragStartRef.current = null;
        return;
      }
      e.preventDefault();

      const coords = getEventCoords(e);
      const square = getSquareFromCoords(coords.clientX, coords.clientY);
      const startSquare = dragStartRef.current;
      dragStartRef.current = null;

      if (cgRef.current) {
        cgRef.current.setAutoShapes([]);
      }

      if (square && square !== startSquare) {
        const startStr = startSquare as string;
        const endStr = square as string;
        const currentArrows = arrowsRef.current || [];
        
        const exists = currentArrows.some(a => a.orig === startStr && a.dest === endStr);
        let newArrows: ArrowData[];
        if (exists) {
          newArrows = currentArrows.filter(a => !(a.orig === startStr && a.dest === endStr));
        } else {
          newArrows = [...currentArrows, { orig: startStr, dest: endStr, brush: 'green' }];
        }
        if (onUpdateArrowsRef.current) {
          onUpdateArrowsRef.current(newArrows);
        }
      }
    };

    container.addEventListener('mousedown', handleStart);
    container.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    container.addEventListener('touchstart', handleStart, { passive: false });
    container.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd, { passive: false });

    return () => {
      container.removeEventListener('mousedown', handleStart);
      container.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);

      container.removeEventListener('touchstart', handleStart);
      container.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isHighlightMode, isArrowMode, orientation]);

  return (
    <div className="chess-container" style={boardWidth ? { maxWidth: `${boardWidth}px` } : undefined}>
      <div 
        className="board-wrapper cburnett brown" 
        style={{ 
          position: 'relative',
          width: boardWidth ? `${boardWidth}px` : undefined
        }}
      >
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
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
        <div className="nag-overlay" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 500
        }}>
          {currentNode && currentNode.glyphs && currentNode.glyphs.length > 0 && (
            <NagBadge
              node={currentNode}
              orientation={orientation}
            />
          )}
        </div>
        <div 
          className="resize-handle" 
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
        />
      </div>
      <div className="controls-wrapper">
        {showToolsMenu && (
          <>
            <div className="tools-menu-backdrop" onClick={() => setShowToolsMenu(false)} />
            <div className="tools-menu">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(fen);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="menu-item"
              >
                {copied ? 'Copied FEN!' : 'Copy FEN'}
              </button>
              <button 
                onClick={() => {
                  setShowCoordinates(c => !c);
                  setShowToolsMenu(false);
                }}
                className="menu-item"
              >
                {showCoordinates ? 'Hide Coordinates' : 'Show Coordinates'}
              </button>
              <button
                onClick={() => {
                  setIsHighlightMode(prev => {
                    const next = !prev;
                    if (next) setIsArrowMode(false);
                    return next;
                  });
                  setShowToolsMenu(false);
                }}
                className="menu-item"
                style={{ color: isHighlightMode ? '#c8854a' : 'inherit', fontWeight: isHighlightMode ? '600' : 'normal' }}
              >
                {isHighlightMode ? 'Disable Highlight' : 'Enable Highlight'}
              </button>
              <button
                onClick={() => {
                  setIsArrowMode(prev => {
                    const next = !prev;
                    if (next) setIsHighlightMode(false);
                    return next;
                  });
                  setShowToolsMenu(false);
                }}
                className="menu-item"
                style={{ color: isArrowMode ? '#c8854a' : 'inherit', fontWeight: isArrowMode ? '600' : 'normal' }}
              >
                {isArrowMode ? 'Disable Drag Arrow' : 'Enable Drag Arrow'}
              </button>
              {onToggleFreehand && (
                <button 
                  onClick={() => {
                    onToggleFreehand(!isFreehand);
                    setShowToolsMenu(false);
                  }}
                  className="menu-item"
                >
                  {isFreehand ? 'Disable Freehand' : 'Enable Freehand'}
                </button>
              )}
              {onSetupPosition && (
                <button 
                  onClick={() => {
                    setShowSetupModal(true);
                    setShowToolsMenu(false);
                  }}
                  className="menu-item"
                >
                  Setup Position
                </button>
              )}
              {onMoreTools && (
                <button 
                  onClick={() => {
                    onMoreTools();
                    setShowToolsMenu(false);
                  }}
                  className="menu-item"
                >
                  Toggle Board Lock
                </button>
              )}
            </div>
          </>
        )}
        <div className="controls">
          <div className="tools-group">
            <button onClick={() => setOrientation(o => o === 'white' ? 'black' : 'white')} className="btn-icon" title="Flip Board">
              <RefreshCw size={20} />
            </button>
            
            {onReset && (
              <button onClick={onReset} className="btn-icon" title="Reset Board">
                <RotateCcw size={20} />
              </button>
            )}
            
            {onClearArrows && (
              <button onClick={onClearArrows} className="btn-icon" title="Clear Arrows">
                <Eraser size={20} />
              </button>
            )}
            
            {onMoreTools && (
              <button 
                onClick={() => setShowToolsMenu(prev => !prev)} 
                className={`btn-icon ${(showToolsMenu || isHighlightMode || isArrowMode) ? 'active' : ''}`} 
                title="More Tools"
              >
                <MoreHorizontal size={20} />
              </button>
            )}
            <div className="control-separator" />
          </div>
          
          <div className="nav-group">
            <button onClick={onStart} className="btn-icon" title="Starting Position" disabled={!canPrev}><ChevronsLeft size={20} /></button>
            <button onClick={onPrev} className="btn-icon" title="Previous Move" disabled={!canPrev}><ChevronLeft size={20} /></button>
            <button onClick={onNext} className="btn-icon" title="Next Move" disabled={!canNext}><ChevronRight size={20} /></button>
            <button onClick={onEnd} className="btn-icon" title="Final Position" disabled={!canNext}><ChevronsRight size={20} /></button>
          </div>
          
          <div className="controls-right-spacer" />
        </div>
        {showSetupModal && (
          <SetupPositionModal
            isOpen={showSetupModal}
            onClose={() => setShowSetupModal(false)}
            onSave={(newFen) => {
              if (onSetupPosition) {
                onSetupPosition(newFen);
              }
            }}
            initialFen={fen}
          />
        )}
      </div>
      <style>{`
        .chess-container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          align-items: center;
          width: 100%;
          max-width: 600px;
        }
        .board-wrapper {
          width: min(85vh, 600px);
          max-width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
          box-sizing: border-box;
          /* frame color & padding come from --board-frame-color / --board-frame-padding via globals.css */
        }
        .resize-handle {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 18px;
          height: 18px;
          cursor: nwse-resize;
          background: linear-gradient(135deg, transparent 50%, rgba(139, 69, 19, 0.55) 50%);
          z-index: 600;
          border-bottom-right-radius: 4px;
          transition: background 0.15s;
        }
        .resize-handle:hover {
          background: linear-gradient(135deg, transparent 50%, rgba(139, 69, 19, 0.85) 50%);
        }
        .resize-handle::after {
          content: '';
          position: absolute;
          bottom: 3px;
          right: 3px;
          width: 6px;
          height: 6px;
          border-right: 2px solid rgba(139, 69, 19, 0.9);
          border-bottom: 2px solid rgba(139, 69, 19, 0.9);
        }
        .controls-wrapper {
          position: relative;
          width: 100%;
        }
        .controls {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          background: rgba(30, 41, 59, 0.7);
          padding: 0.5rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          width: 100%;
          box-sizing: border-box;
        }
        .controls-right-spacer {
          display: block;
        }
        .nav-group {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          align-items: center;
        }
        .tools-group {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-start;
          align-items: center;
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
        .btn-icon:hover:not(:disabled), .btn-icon.active {
          background: rgba(255, 255, 255, 0.1);
          color: #8b5cf6;
        }
        .btn-icon:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .control-separator {
          width: 1px;
          background: rgba(255, 255, 255, 0.15);
          margin: 0.25rem 0.25rem;
          height: 1.5rem;
        }
        .tools-menu-backdrop {
          position: fixed;
          inset: 0;
          z-index: 599;
          background: transparent;
        }
        .tools-menu {
          position: absolute;
          bottom: 100%;
          left: 0;
          margin-bottom: 8px;
          z-index: 600;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 6px;
          border-radius: 12px;
          background: #fdf5ea;
          border: 1px solid #eedcd0;
          box-shadow: 0 10px 15px -3px rgba(74, 32, 24, 0.1), 0 4px 6px -2px rgba(74, 32, 24, 0.05);
          backdrop-filter: blur(8px);
          min-width: 160px;
        }
        .menu-item {
          padding: 8px 12px;
          background: transparent;
          color: #4a2018;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.85rem;
          text-align: left;
          transition: all 0.15s;
          display: block;
          width: 100%;
        }
        .menu-item:hover {
          background: rgba(200, 133, 74, 0.05);
          color: #c8854a;
        }
        @media (max-width: 480px) {
          .controls {
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          .controls-right-spacer {
            display: none;
          }
          .control-separator {
            display: none;
          }
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
      `}</style>
    </div>
  );
};

function movePieceInFen(fen: string, from: string, to: string): { fen: string; san: string; pieceType: string; color: 'w' | 'b' } | null {
  try {
    const parts = fen.split(' ');
    const rows = parts[0].split('/');
    
    const board: (string | null)[][] = [];
    for (let r = 0; r < 8; r++) {
      const row: (string | null)[] = [];
      const fenRow = rows[r];
      for (let c = 0; c < fenRow.length; c++) {
        const char = fenRow[c];
        if (isNaN(Number(char))) {
          row.push(char);
        } else {
          const emptySquares = Number(char);
          for (let e = 0; e < emptySquares; e++) {
            row.push(null);
          }
        }
      }
      board.push(row);
    }

    const getCoords = (sq: string) => {
      const col = sq.charCodeAt(0) - 97;
      const row = 8 - Number(sq[1]);
      return { row, col };
    };

    const fromCoords = getCoords(from);
    const toCoords = getCoords(to);

    const piece = board[fromCoords.row][fromCoords.col];
    if (!piece) return null;

    board[fromCoords.row][fromCoords.col] = null;
    board[toCoords.row][toCoords.col] = piece;

    const newRows: string[] = [];
    for (let r = 0; r < 8; r++) {
      let rowStr = '';
      let emptyCount = 0;
      for (let c = 0; c < 8; c++) {
        const val = board[r][c];
        if (val === null) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            rowStr += emptyCount;
            emptyCount = 0;
          }
          rowStr += val;
        }
      }
      if (emptyCount > 0) {
        rowStr += emptyCount;
      }
      newRows.push(rowStr);
    }

    parts[0] = newRows.join('/');
    
    // Toggle active turn color
    parts[1] = parts[1] === 'w' ? 'b' : 'w';
    if (parts[1] === 'w' && parts[5]) {
      parts[5] = String(parseInt(parts[5], 10) + 1);
    }
    const newFen = parts.join(' ');
    
    const uPiece = piece.toUpperCase();
    const san = `${uPiece === 'P' ? '' : uPiece}${from}-${to}`;
    const color = piece === piece.toUpperCase() ? 'w' : 'b';

    return {
      fen: newFen,
      san,
      pieceType: uPiece.toLowerCase(),
      color
    };
  } catch (e) {
    return null;
  }
}

export default ChessBoard;
