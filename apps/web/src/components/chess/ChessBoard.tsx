import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Chessground } from 'chessground';
import { Chess, Move, parseGamifiedFen, GAMIFIED_ITEMS } from '@vca/chess';
import type { Api } from 'chessground/api';
import type { Config } from 'chessground/config';
import type { Key } from 'chessground/types';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, RefreshCw, Eraser, RotateCcw, MoreHorizontal, Lock, Clock, LayoutGrid, Copy, FileText, Eye, ArrowUpRight, Square, Pen, Wrench, ChevronDown, Upload, ArrowUpDown, Database, SkipBack, SkipForward, Smile, PlusSquare, Check } from 'lucide-react';
import type { ArrowData, MoveNode } from '@vca/types';
import { VariationData } from './VariationChooser';
import { NagBadge } from './NagBadge';
import SetupPositionModal from './SetupPositionModal';
import UploadPgnModal from './UploadPgnModal';
import { EmojiReactions } from './EmojiReactions';
import { NagReactionOverlay } from './NagReactionOverlay';

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
  nodes?: Record<string, MoveNode>;
  onReset?: () => void;
  onClearArrows?: () => void;
  onMoreTools?: () => void;
  isFreehand?: boolean;
  onToggleFreehand?: (freehand: boolean) => void;
  onSetupPosition?: (fen: string) => void;
  onNullMove?: () => void;
  onUploadPgn?: (pgnText: string) => void;
  onSaveToDb?: () => void;
  onUpdatePgn?: () => void;
  onCreateNewPgn?: () => void;
  chapterCount?: number;
  activeChapterIndex?: number;
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
  onToggleLock?: (locked: boolean) => void;
  hideSocialFeatures?: boolean;
  moveRejectedAt?: number;
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  fen, history, currentIndex, onMove,
  canNext, canPrev, onNext, onPrev, onStart, onEnd,
  onVariationUp, onVariationDown,
  arrows = [], onUpdateArrows, isLocked = false,
  branches = [], selectedBranchIndex = 0, onSelectBranch, onChooseBranch,
  currentNode, nodes,
  onReset, onClearArrows, onMoreTools,
  isFreehand = false, onToggleFreehand,
  onSetupPosition,
  onNullMove,
  onUploadPgn,
  onSaveToDb,
  onUpdatePgn,
  onCreateNewPgn,
  chapterCount = 0,
  activeChapterIndex = -1,
  onNextChapter,
  onPrevChapter,
  onToggleLock,
  hideSocialFeatures = false,
  moveRejectedAt = 0,
}) => {
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const { cleanFen, targets, blocks } = React.useMemo(() => {
    try {
      return parseGamifiedFen(fen);
    } catch {
      return { cleanFen: fen || '', targets: {}, blocks: {} };
    }
  }, [fen]);
  const [copiedAction, setCopiedAction] = useState<'pgn' | 'fen' | null>(null);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [isArrowMode, setIsArrowMode] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showUploadPgnModal, setShowUploadPgnModal] = useState(false);
  const [promotionPending, setPromotionPending] = useState<{ from: string; to: string; color: 'w' | 'b' } | null>(null);
  const [isEmojiMode, setIsEmojiMode] = useState(false);
  const [shakeClass, setShakeClass] = useState<'heavy' | 'medium' | 'light' | 'none'>('none');
  const [userShowClocks, setUserShowClocks] = useState(true);

  useEffect(() => {
    if (isFreehand) {
      setIsEmojiMode(false);
    }
  }, [isFreehand]);

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

  // ── Scroll to navigate moves ──────────────────────────────────────────────
  useEffect(() => {
    const boardEl = containerRef.current?.closest('.board-wrapper') as HTMLElement | null;
    if (!boardEl) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) {
        // scroll down → next move
        onNext?.();
      } else {
        // scroll up → prev move
        onPrev?.();
      }
    };

    boardEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => boardEl.removeEventListener('wheel', handleWheel);
  }, [onNext, onPrev]);

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
        dests = (isFreehandRef.current || isHighlightMode || isArrowMode || isEmojiMode) ? undefined : toDests(chess);
      } catch (e) {
        turnColor = currentFen.split(' ')[1] === 'w' ? 'white' : 'black';
      }
      cgRef.current.set({
        fen: currentFen,
        turnColor: turnColor,
        movable: {
          color: (isLockedRef.current || isHighlightMode || isArrowMode || isEmojiMode) ? undefined : (isFreehandRef.current ? 'both' : turnColor),
          free: isFreehandRef.current && !(isHighlightMode || isArrowMode || isEmojiMode),
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
        dests = (isFreehandRef.current || isHighlightMode || isArrowMode || isEmojiMode) ? undefined : toDests(chess);
      } catch (e) {
        turnColor = cleanFen.split(' ')[1] === 'w' ? 'white' : 'black';
      }

      const lastMove = (currentNode?.from && currentNode?.to && !currentNode?.isNull && currentNode?.san !== '--')
        ? [currentNode.from as Key, currentNode.to as Key]
        : undefined;

      const config: Config = {
        fen: cleanFen,
        orientation: orientation,
        coordinates: false, // Disabled native coords, rendering our own in the frame
        turnColor: turnColor,
        lastMove: lastMove,
        movable: {
          color: (isLockedRef.current || isHighlightMode || isArrowMode || isEmojiMode) ? undefined : (isFreehandRef.current ? 'both' : turnColor),
          free: isFreehandRef.current && !(isHighlightMode || isArrowMode || isEmojiMode),
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
      window.removeEventListener('resize', handleResize);
      if (observer) {
        observer.disconnect();
      }
      clearTimeout(mountTimer);
    };
  }, [orientation, showCoordinates, isHighlightMode, isArrowMode]);

  useEffect(() => {
    if (cgRef.current) {
      let turnColor: 'white' | 'black' = 'white';
      let dests: any = undefined;
      try {
        console.log("[ChessBoard] Loading FEN:", fen);
        const chess = new Chess(fen);
        console.log("[ChessBoard] Chess loaded. Turn:", chess.turn(), "Added kings:", (chess as any).addedKings);
        turnColor = chess.turn() === 'w' ? 'white' : 'black';
        dests = (isFreehand || isHighlightMode || isArrowMode || isEmojiMode) ? undefined : toDests(chess);
        console.log("[ChessBoard] Computed dests size:", dests ? dests.size : 0);
      } catch (e: any) {
        console.error("[ChessBoard] Error loading Chess with FEN:", fen, e);
        turnColor = cleanFen.split(' ')[1] === 'w' ? 'white' : 'black';
      }

      const lastMove = (currentNode?.from && currentNode?.to && !currentNode?.isNull && currentNode?.san !== '--')
        ? [currentNode.from as Key, currentNode.to as Key]
        : undefined;

      cgRef.current.set({
        fen: cleanFen,
        orientation: orientation,
        coordinates: false, // Disabled native coords, rendering our own in the frame
        turnColor: turnColor,
        lastMove: lastMove,
        movable: {
          color: (isLocked || isHighlightMode || isArrowMode || isEmojiMode) ? undefined : (isFreehand ? 'both' : turnColor),
          free: isFreehand && !(isHighlightMode || isArrowMode || isEmojiMode),
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
  }, [fen, currentIndex, isLocked, arrows, orientation, showCoordinates, isFreehand, isHighlightMode, isArrowMode, isEmojiMode, currentNode, moveRejectedAt]);

  // ── Clock logic ─────────────────────────────────────────────────────────
  const [whiteClock, setWhiteClock] = useState<string | null>(null);
  const [blackClock, setBlackClock] = useState<string | null>(null);
  const [whiteDelta, setWhiteDelta] = useState<string | null>(null);
  const [blackDelta, setBlackDelta] = useState<string | null>(null);
  const [activeClockColor, setActiveClockColor] = useState<'white' | 'black'>('white');
  const [showClocks, setShowClocks] = useState(false);

  useEffect(() => {
    if (!currentNode || !nodes) {
      setWhiteClock(null);
      setBlackClock(null);
      setWhiteDelta(null);
      setBlackDelta(null);
      setShowClocks(false);
      return;
    }

    let wClock: string | null = null;
    let bClock: string | null = null;
    let wPrevClock: string | null = null;
    let bPrevClock: string | null = null;
    
    // 1. Trace backward to find the last recorded clock for each player up to the current position
    let curr: MoveNode | undefined = currentNode;
    while (curr && curr.id !== 'root') {
      if (curr.turn === 'w') {
        if (!wClock && curr.clk) wClock = curr.clk;
        else if (wClock && !wPrevClock && curr.clk) wPrevClock = curr.clk;
      } else if (curr.turn === 'b') {
        if (!bClock && curr.clk) bClock = curr.clk;
        else if (bClock && !bPrevClock && curr.clk) bPrevClock = curr.clk;
      }
      curr = curr.parentId ? nodes[curr.parentId] : undefined;
    }

    // 2. If we still don't have a clock for a player (e.g. at starting position), scan forward along the mainline
    if (!wClock || !bClock) {
      let forwardNode = currentNode;
      while (forwardNode && forwardNode.children && forwardNode.children.length > 0) {
        const nextId = forwardNode.children[0];
        const nextNode = nodes[nextId];
        if (!nextNode) break;
        if (nextNode.turn === 'w' && !wClock && nextNode.clk) {
          wClock = nextNode.clk;
        } else if (nextNode.turn === 'b' && !bClock && nextNode.clk) {
          bClock = nextNode.clk;
        }
        if (wClock && bClock) break;
        forwardNode = nextNode;
      }
    }

    setWhiteClock(wClock);
    setBlackClock(bClock);

    const calcDelta = (currTime: string | null, prevTime: string | null) => {
      if (!currTime || !prevTime) return null;
      const parseTime = (t: string) => {
        const parts = t.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return 0;
      };
      const diff = parseTime(prevTime) - parseTime(currTime);
      if (diff <= 0) return null;
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      return `+${m > 0 ? `${m}:` : '0:'}${s.toString().padStart(2, '0')}`;
    };

    setWhiteDelta(currentNode.turn === 'w' ? calcDelta(wClock, wPrevClock) : null);
    setBlackDelta(currentNode.turn === 'b' ? calcDelta(bClock, bPrevClock) : null);

    let turnColor: 'white' | 'black' = 'white';
    try {
      const chess = new Chess(currentNode.fen);
      turnColor = chess.turn() === 'w' ? 'white' : 'black';
    } catch {
      turnColor = currentNode.fen.split(' ')[1] === 'w' ? 'white' : 'black';
    }
    setActiveClockColor(turnColor);

    const hasAnyClock = nodes ? Object.values(nodes).some(n => !!n.clk) : false;
    setShowClocks(hasAnyClock && userShowClocks);
  }, [currentNode, nodes, userShowClocks]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger shortcuts if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.shiftKey) return; // Shift + key is reserved for Emoji Reactions
      
      const key = e.key.toLowerCase();
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd) {
        if (key === 's') {
          e.preventDefault();
          if (onSaveToDb) onSaveToDb();
        } else if (key === 'c') {
          // Only copy PGN if no text is selected on the page
          const selection = window.getSelection()?.toString();
          if (!selection) {
            e.preventDefault();
            try {
              const chess = new Chess();
              history.slice(0, currentIndex + 1).forEach(san => { try { chess.move(san); } catch(err){} });
              navigator.clipboard.writeText(chess.pgn());
            } catch(err) {
              navigator.clipboard.writeText(history.slice(0, currentIndex + 1).join(' '));
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        }
        return;
      }

      switch (e.key) {
        case 'PageUp':
          if (onPrevChapter) { e.preventDefault(); onPrevChapter(); }
          break;
        case 'PageDown':
          if (onNextChapter) { e.preventDefault(); onNextChapter(); }
          break;
        case 'ArrowLeft':
          if (canPrev) { e.preventDefault(); onPrev(); }
          break;
        case 'ArrowRight':
          if (canNext) { e.preventDefault(); onNext(); }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          setOrientation(o => o === 'white' ? 'black' : 'white');
          break;
        case 'r':
        case 'R':
          if (onReset) { e.preventDefault(); onReset(); }
          break;
        case 's':
        case 'S':
          if (onSetupPosition) { e.preventDefault(); setShowSetupModal(true); }
          break;
        case 'u':
        case 'U':
          if (onUploadPgn) { e.preventDefault(); setShowUploadPgnModal(true); }
          break;
        case 'n':
        case 'N':
          if (onNullMove) { e.preventDefault(); onNullMove(); }
          break;
        case 'l':
        case 'L':
          if (onToggleLock) { e.preventDefault(); onToggleLock(!isLocked); }
          break;
        case 'o':
        case 'O':
          e.preventDefault();
          setShowCoordinates(prev => !prev);
          break;
        case 'a':
        case 'A':
          e.preventDefault();
          setIsArrowMode(prev => {
            const next = !prev;
            if (next) setIsHighlightMode(false);
            return next;
          });
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          setIsHighlightMode(prev => {
            const next = !prev;
            if (next) setIsArrowMode(false);
            return next;
          });
          break;
        case 'd':
        case 'D':
          if (onToggleFreehand) { e.preventDefault(); onToggleFreehand(!isFreehand); }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onPrevChapter, onNextChapter, canPrev, canNext, onPrev, onNext,
    onReset, onSetupPosition, onUploadPgn, onSaveToDb, onUpdatePgn, onCreateNewPgn, onNullMove,
    onToggleLock, isLocked, onToggleFreehand, isFreehand,
    history, currentIndex
  ]);

  const fenParts = (fen || '').trim().split(/\s+/);
  const activeColor = fenParts.length > 1 ? fenParts[1] : 'w';
  const toPlay = activeColor === 'b' ? 'black' : 'white';

  return (
    <div className="chess-container" style={boardWidth ? { maxWidth: `${boardWidth}px` } : undefined}>
      <div 
        className={`board-wrapper cburnett brown ${
          shakeClass === 'heavy' ? 'shake-heavy' :
          shakeClass === 'medium' ? 'shake-medium' :
          shakeClass === 'light' ? 'shake-light' : ''
        }`} 
        style={{ 
          position: 'relative',
          width: boardWidth ? `${boardWidth}px` : undefined
        }}
      >
        {/* Outer frame: handles all theme styling, padding, and borders */}
        <div className="board-outer-frame board-clip" style={{ display: 'flex', width: '100%', height: '100%', boxSizing: 'border-box', position: 'relative' }}>
          {/* Custom Frame Coordinates */}
          {showCoordinates && (
            <>
              {/* Ranks (1-8) - Left side */}
              <div 
                className="custom-frame-coords ranks" 
                style={{ flexDirection: orientation === 'white' ? 'column-reverse' : 'column' }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(rank => (
                  <div key={rank} className="coord-label">{rank}</div>
                ))}
              </div>
              {/* Files (a-h) - Bottom side */}
              <div 
                className="custom-frame-coords files" 
                style={{ flexDirection: orientation === 'white' ? 'row' : 'row-reverse' }}
              >
                {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(file => (
                  <div key={file} className="coord-label">{file}</div>
                ))}
              </div>
            </>
          )}
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

            {/* Targets and Blocks overlays */}
            {Object.entries(targets).map(([sq, code]) => {
              const file = sq[0];
              const rank = parseInt(sq[1], 10);
              const colIdx = file.charCodeAt(0) - 97;
              const rowIdx = 8 - rank;
              const col = orientation === 'white' ? colIdx : 7 - colIdx;
              const row = orientation === 'white' ? rowIdx : 7 - rowIdx;
              const left = col * 12.5;
              const top = row * 12.5;
              const item = GAMIFIED_ITEMS[code];
              if (!item) return null;
              return (
                <div
                  key={sq}
                  className="gamified-item target-item"
                  style={{
                    position: 'absolute',
                    left: `${left}%`,
                    top: `${top}%`,
                    width: '12.5%',
                    height: '12.5%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'min(2.2rem, 5vw)',
                    zIndex: 2,
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                  title={item.name}
                >
                  {item.emoji}
                </div>
              );
            })}
            {Object.entries(blocks).map(([sq, code]) => {
              const file = sq[0];
              const rank = parseInt(sq[1], 10);
              const colIdx = file.charCodeAt(0) - 97;
              const rowIdx = 8 - rank;
              const col = orientation === 'white' ? colIdx : 7 - colIdx;
              const row = orientation === 'white' ? rowIdx : 7 - rowIdx;
              const left = col * 12.5;
              const top = row * 12.5;
              const item = GAMIFIED_ITEMS[code];
              if (!item) return null;
              return (
                <div
                  key={sq}
                  className="gamified-item block-item"
                  style={{
                    position: 'absolute',
                    left: `${left}%`,
                    top: `${top}%`,
                    width: '12.5%',
                    height: '12.5%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'min(2.2rem, 5vw)',
                    zIndex: 2,
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                  title={item.name}
                >
                  {item.emoji}
                </div>
              );
            })}
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

        {/* EmojiReactions is OUTSIDE board-clip so the floating panel isn't clipped */}
        <EmojiReactions
          boardWidth={boardWidth}
          isEmojiMode={isEmojiMode}
          onShake={setShakeClass}
          onClose={() => setIsEmojiMode(false)}
        />

        <NagReactionOverlay
          boardWidth={boardWidth}
          onShake={setShakeClass}
        />

        {/* Active side indicator circle dot */}
        <div 
          className="turn-indicator"
          style={{
            backgroundColor: toPlay === 'white' ? '#ffffff' : '#000000',
            border: `1.5px solid ${toPlay === 'white' ? '#000000' : '#ffffff'}`
          }}
          title={`${toPlay === 'white' ? 'White' : 'Black'} to play`}
        />

        {showClocks && (
          <div className="chess-clocks-container">
            {/* Black Clock */}
            <div className={`chess-clock chess-clock-black ${orientation === 'white' ? 'clock-top' : 'clock-bottom'} ${activeClockColor === 'black' ? 'clock-active' : ''}`}>
              <div className="clock-label">
                <span className="clock-color-dot" style={{ background: '#333' }}></span>
                Black {activeClockColor === 'black' && blackDelta && <span className="clock-delta">{blackDelta}</span>}
              </div>
              <div className="clock-time">{blackClock || '-:--'}</div>
            </div>
            {/* White Clock */}
            <div className={`chess-clock chess-clock-white ${orientation === 'white' ? 'clock-bottom' : 'clock-top'} ${activeClockColor === 'white' ? 'clock-active' : ''}`}>
              <div className="clock-label">
                <span className="clock-color-dot" style={{ background: '#eee' }}></span>
                White {activeClockColor === 'white' && whiteDelta && <span className="clock-delta">{whiteDelta}</span>}
              </div>
              <div className="clock-time">{whiteClock || '-:--'}</div>
            </div>
          </div>
        )}

        {/* nag-overlay is OUTSIDE board-clip so badges are never clipped */}
        <div className="nag-overlay" style={{
          position: 'absolute',
          top: 'var(--board-frame-padding)',
          left: 'var(--board-frame-padding)',
          right: 'var(--board-frame-padding)',
          bottom: 'var(--board-frame-padding)',
          pointerEvents: 'none',
          zIndex: 500
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
              <div className="tools-menu-header">Tools</div>

              <div className="tools-grid-container">
                {/* BOARD */}
                <div className="tools-grid-column">
                  <div className="tools-section-label">BOARD</div>
                  {onMoreTools && (
                    <div className="tools-menu-row tools-menu-row-clickable" onClick={() => { onMoreTools(); }}>
                      <span className="tools-row-icon"><Lock size={15} /></span>
                      <span className="tools-row-label">Board Lock</span>
                      <button
                        className={`tools-toggle ${isLocked ? 'tools-toggle-on' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onMoreTools(); }}
                        aria-label="Toggle Board Lock"
                      >
                        <span className="tools-toggle-knob" />
                      </button>
                    </div>
                  )}
                  <div className="tools-menu-row tools-menu-row-clickable" onClick={() => setUserShowClocks(prev => !prev)}>
                    <span className="tools-row-icon"><Clock size={15} /></span>
                    <span className="tools-row-label">Show Clocks</span>
                    <button
                      className={`tools-toggle ${userShowClocks ? 'tools-toggle-on' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setUserShowClocks(prev => !prev); }}
                      aria-label="Toggle Clocks"
                    >
                      <span className="tools-toggle-knob" />
                    </button>
                  </div>
                  {onSetupPosition && (
                    <button
                      className="tools-menu-row tools-row-btn"
                      onClick={() => { setShowSetupModal(true); setShowToolsMenu(false); }}
                    >
                      <span className="tools-row-icon"><LayoutGrid size={15} /></span>
                      <span className="tools-row-label">Setup Position</span>
                    </button>
                  )}
                  {onUploadPgn && (
                    <button
                      className="tools-menu-row tools-row-btn"
                      onClick={() => { setShowUploadPgnModal(true); setShowToolsMenu(false); }}
                    >
                      <span className="tools-row-icon"><Upload size={15} /></span>
                      <span className="tools-row-label">Upload PGN</span>
                    </button>
                  )}
                  {onUpdatePgn && (
                    <button
                      className="tools-menu-row tools-row-btn"
                      onClick={() => { onUpdatePgn(); setShowToolsMenu(false); }}
                    >
                      <span className="tools-row-icon"><Check size={15} /></span>
                      <span className="tools-row-label">Save Changes</span>
                    </button>
                  )}
                  {onSaveToDb && (
                    <button
                      className="tools-menu-row tools-row-btn"
                      onClick={() => { onSaveToDb(); setShowToolsMenu(false); }}
                    >
                      <span className="tools-row-icon"><Database size={15} /></span>
                      <span className="tools-row-label">Save As New Game</span>
                    </button>
                  )}
                  {onCreateNewPgn && (
                    <button
                      className="tools-menu-row tools-row-btn"
                      onClick={() => { onCreateNewPgn(); setShowToolsMenu(false); }}
                    >
                      <span className="tools-row-icon"><PlusSquare size={15} /></span>
                      <span className="tools-row-label">New PGN (Clear)</span>
                    </button>
                  )}
                  {onNullMove && (
                    <button
                      className="tools-menu-row tools-row-btn"
                      onClick={() => { onNullMove(); setShowToolsMenu(false); }}
                    >
                      <span className="tools-row-icon" style={{ fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '15px' }}>∅</span>
                      <span className="tools-row-label">Null Move (Pass)</span>
                    </button>
                  )}
                </div>

                {/* COPY */}
                <div className="tools-grid-column">
                  <div className="tools-section-label">COPY</div>
                  <button
                    className="tools-menu-row tools-row-btn"
                    onClick={() => {
                      try {
                        const chess = new Chess();
                        const moves = history ? history.slice(0, currentIndex + 1) : [];
                        moves.forEach(san => { try { chess.move(san); } catch(e){} });
                        const pgnString = chess.pgn();
                        if (pgnString) {
                          navigator.clipboard.writeText(pgnString);
                        } else {
                          navigator.clipboard.writeText(moves.join(' '));
                        }
                      } catch(e) {
                        const moves = history ? history.slice(0, currentIndex + 1) : [];
                        navigator.clipboard.writeText(moves.join(' '));
                      }
                      setCopiedAction('pgn');
                      setTimeout(() => setCopiedAction(null), 2000);
                    }}
                  >
                    <span className="tools-row-icon"><FileText size={15} /></span>
                    <span className="tools-row-label">{copiedAction === 'pgn' ? 'Copied!' : 'Copy PGN'}</span>
                  </button>
                  <button
                    className="tools-menu-row tools-row-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(fen);
                      setCopiedAction('fen');
                      setTimeout(() => setCopiedAction(null), 2000);
                    }}
                  >
                    <span className="tools-row-icon"><Copy size={15} /></span>
                    <span className="tools-row-label">{copiedAction === 'fen' ? 'Copied!' : 'Copy FEN'}</span>
                  </button>
                </div>

                {/* VIEW */}
                <div className="tools-grid-column">
                  <div className="tools-section-label">VIEW</div>
                  <div className="tools-menu-row tools-menu-row-clickable" onClick={() => setShowCoordinates(prev => !prev)}>
                    <span className="tools-row-icon"><Eye size={15} /></span>
                    <span className="tools-row-label">Show Coordinates</span>
                    <button
                      className={`tools-toggle ${showCoordinates ? 'tools-toggle-on' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setShowCoordinates(prev => !prev); }}
                      aria-label="Toggle Coordinates"
                    >
                      <span className="tools-toggle-knob" />
                    </button>
                  </div>
                </div>

                {/* ANNOTATION TOOLS */}
                <div className="tools-grid-column">
                  <div className="tools-section-label">ANNOTATION TOOLS</div>
                  <div className="tools-menu-row tools-menu-row-clickable" onClick={() => {
                      setIsArrowMode(prev => {
                        const next = !prev;
                        if (next) setIsHighlightMode(false);
                        return next;
                      });
                    }}>
                    <span className="tools-row-icon"><ArrowUpRight size={15} /></span>
                    <span className="tools-row-label">Arrow</span>
                    <button
                      className={`tools-toggle ${isArrowMode ? 'tools-toggle-on' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setIsArrowMode(prev => { const next = !prev; if (next) setIsHighlightMode(false); return next; }); }}
                      aria-label="Toggle Arrow Mode"
                    >
                      <span className="tools-toggle-knob" />
                    </button>
                  </div>
                  <div className="tools-menu-row tools-menu-row-clickable" onClick={() => {
                      setIsHighlightMode(prev => {
                        const next = !prev;
                        if (next) setIsArrowMode(false);
                        return next;
                      });
                    }}>
                    <span className="tools-row-icon"><Square size={15} /></span>
                    <span className="tools-row-label">Highlight Square</span>
                    <button
                      className={`tools-toggle ${isHighlightMode ? 'tools-toggle-on' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setIsHighlightMode(prev => { const next = !prev; if (next) setIsArrowMode(false); return next; }); }}
                      aria-label="Toggle Highlight Mode"
                    >
                      <span className="tools-toggle-knob" />
                    </button>
                  </div>
                  {!hideSocialFeatures && onToggleFreehand && (
                    <div className="tools-menu-row tools-menu-row-clickable" onClick={() => { onToggleFreehand(!isFreehand); }}>
                      <span className="tools-row-icon"><Pen size={15} /></span>
                      <span className="tools-row-label">Freehand</span>
                      <button
                        className={`tools-toggle ${isFreehand ? 'tools-toggle-on' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onToggleFreehand(!isFreehand); }}
                        aria-label="Toggle Freehand"
                      >
                        <span className="tools-toggle-knob" />
                      </button>
                    </div>
                  )}
                  {!hideSocialFeatures && (
                    <div className="tools-menu-row tools-menu-row-clickable" onClick={() => {
                        setIsEmojiMode(prev => {
                          const next = !prev;
                          if (next) {
                            setIsArrowMode(false);
                            setIsHighlightMode(false);
                            if (onToggleFreehand && isFreehand) {
                              onToggleFreehand(false);
                            }
                          }
                          return next;
                        });
                      }}>
                      <span className="tools-row-icon"><Smile size={15} /></span>
                      <span className="tools-row-label">Emoji Reactions</span>
                      <button
                        className={`tools-toggle ${isEmojiMode ? 'tools-toggle-on' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setIsEmojiMode(prev => { const next = !prev; if (next) { setIsArrowMode(false); setIsHighlightMode(false); if (onToggleFreehand && isFreehand) onToggleFreehand(false); } return next; }); }}
                        aria-label="Toggle Emoji Mode"
                      >
                        <span className="tools-toggle-knob" />
                      </button>
                    </div>
                  )}
                  {onClearArrows && (
                    <button
                      className="tools-menu-row tools-row-btn"
                      onClick={() => { onClearArrows(); setShowToolsMenu(false); }}
                    >
                      <span className="tools-row-icon"><Eraser size={15} /></span>
                      <span className="tools-row-label">Clear Annotations</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        <div className="controls">

          {/* Left group: Undo / Redo / Clear — icon + label */}
          <div className="tools-group">
            {onReset && (
              <button onClick={onReset} className="btn-labeled" title="Reset Board">
                <RefreshCw size={19} />
                <span className="btn-label">Reset</span>
              </button>
            )}

            <button
              onClick={() => setOrientation(o => o === 'white' ? 'black' : 'white')}
              className="btn-labeled"
              title="Flip Board"
            >
              <ArrowUpDown size={19} />
              <span className="btn-label">Flip</span>
            </button>

            <div className="control-separator" />
          </div>

          {/* Centre: nav buttons and game nav buttons grouped together for the middle grid column */}
          <div className="nav-center-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="nav-group">
              <button onClick={onStart} className="btn-nav-card" title="First Move" disabled={!canPrev}>
                <ChevronsLeft size={20} />
              </button>
              <button onClick={onPrev} className="btn-nav-card" title="Previous Move" disabled={!canPrev}>
                <ChevronLeft size={20} />
              </button>
              <button onClick={onNext} className="btn-nav-card" title="Next Move" disabled={!canNext}>
                <ChevronRight size={20} />
              </button>
              <button onClick={onEnd} className="btn-nav-card" title="Last Move" disabled={!canNext}>
                <ChevronsRight size={20} />
              </button>
            </div>

            {/* Game Nav (always visible, disabled if 1 or 0 games) */}
            <div className="control-separator" />
            <div className="game-nav-group">
              <button 
                onClick={onPrevChapter} 
                className="btn-nav-card game-nav-btn" 
                title={chapterCount > 1 ? `Previous game (${activeChapterIndex + 1} of ${chapterCount})` : "Previous game"} 
                disabled={chapterCount <= 1 || activeChapterIndex <= 0}
              >
                <SkipBack size={18} />
              </button>
              <button 
                onClick={onNextChapter} 
                className="btn-nav-card game-nav-btn" 
                title={chapterCount > 1 ? `Next game (${activeChapterIndex + 1} of ${chapterCount})` : "Next game"} 
                disabled={chapterCount <= 1 || activeChapterIndex >= chapterCount - 1}
              >
                <SkipForward size={18} />
              </button>
            </div>
          </div>

          {/* Right: Tools button */}
          <div className="tools-right">
            <div className="control-separator" />
            {onMoreTools && (
              <button
                onClick={() => setShowToolsMenu(prev => !prev)}
                className={`btn-tools-new ${(showToolsMenu || isHighlightMode || isArrowMode || isFreehand || isLocked) ? 'active' : ''}`}
                title="Tools"
              >
                <Wrench size={16} className="tools-wrench" />
                <span className="btn-tools-label">Tools</span>
                <ChevronDown size={14} className={`tools-chevron ${showToolsMenu ? 'open' : ''}`} />
              </button>
            )}
          </div>

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
        {showUploadPgnModal && (
          <UploadPgnModal
            isOpen={showUploadPgnModal}
            onClose={() => setShowUploadPgnModal(false)}
            onUpload={(pgnText) => {
              if (onUploadPgn) {
                onUploadPgn(pgnText);
              }
            }}
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
          overflow: visible;  /* allow NAG badges to bleed past the board edge */
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
          box-sizing: border-box;
          /* frame color & padding come from --board-frame-color / --board-frame-padding via globals.css */
        }
        .turn-indicator {
          position: absolute;
          bottom: 8px;
          left: 8px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          z-index: 600;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
          pointer-events: none;
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }
        .chess-clocks-container {
          position: absolute;
          top: 0;
          right: -130px;
          bottom: 0;
          width: 120px;
          pointer-events: none;
          z-index: 50;
        }
        .chess-clock {
          position: absolute;
          width: 100%;
          background: #2a3547;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 8px 12px;
          box-sizing: border-box;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          gap: 4px;
          color: #fff;
          transition: top 0.3s, bottom 0.3s, border-color 0.2s, background 0.2s;
        }
        .chess-clock.clock-active {
          border-color: #c8854a;
          background: #344156;
        }
        .clock-top {
          top: 0;
        }
        .clock-bottom {
          bottom: 0;
        }
        .clock-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #94a3b8;
          white-space: nowrap;
        }
        .clock-color-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 1px solid #000;
          flex-shrink: 0;
        }
        .clock-time {
          font-size: 1.5rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }
        .clock-delta {
          margin-left: auto;
          font-size: 0.7rem;
          color: #fbbf24;
        }
        @media (max-width: 850px) {
          .chess-clocks-container {
            right: 0;
            width: auto;
            left: 0;
          }
          .chess-clock {
            right: 0;
            width: auto;
            min-width: 100px;
            padding: 4px 8px;
          }
          .clock-top {
            top: -55px;
          }
          .clock-bottom {
            bottom: -55px;
          }
        }
        /* board-clip: inner div that clips the chessground squares */
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
          grid-template-columns: auto 1fr auto;
          align-items: center;
          background: #2a3547;
          padding: 0.6rem 0.75rem;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          width: 100%;
          box-sizing: border-box;
          gap: 0;
        }
        .tools-group {
          display: flex;
          gap: 0;
          justify-content: flex-start;
          align-items: center;
        }
        .tools-right {
          display: flex;
          gap: 0;
          justify-content: flex-end;
          align-items: center;
        }
        .nav-group {
          display: flex;
          gap: 6px;
          justify-content: center;
          align-items: center;
        }
        .game-nav-group {
          display: flex;
          gap: 6px;
          justify-content: center;
          align-items: center;
        }
        .game-nav-btn {
          color: #c8854a !important;
        }
        .game-nav-btn:hover:not(:disabled) {
          color: #e6a05e !important;
        }
        /* Labeled buttons: Undo / Redo / Clear */
        .btn-labeled {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 6px 14px;
          background: transparent;
          color: rgba(255,255,255,0.75);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: inherit;
          min-width: 52px;
        }
        .btn-labeled:hover:not(:disabled) {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }
        .btn-labeled:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .btn-label {
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.01em;
          line-height: 1;
        }
        /* Nav card buttons */
        .btn-nav-card {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.85);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.25);
        }
        .btn-nav-card:hover:not(:disabled) {
          background: rgba(255,255,255,0.15);
          color: #fff;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .btn-nav-card:disabled {
          opacity: 0.25;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        /* Tools button (right side) */
        .btn-tools-new {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 5px;
          padding: 7px 14px;
          background: transparent;
          color: rgba(255,255,255,0.8);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: inherit;
          font-size: 0.82rem;
          font-weight: 600;
        }
        .btn-tools-new:hover {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }
        .btn-tools-new.active {
          background: rgba(255,255,255,0.08);
          color: #c8854a;
        }
        .btn-tools-new .tools-wrench {
          color: inherit;
          flex-shrink: 0;
        }
        .btn-tools-new .btn-tools-label {
          font-family: inherit;
          display: flex;
          align-items: center;
          line-height: 1;
          margin-top: 1px;
        }
        .btn-tools-new .tools-chevron {
          transition: transform 0.2s ease, color 0.2s ease;
          opacity: 0.7;
          color: inherit;
        }
        .btn-tools-new .tools-chevron.open {
          transform: rotate(180deg);
        }
        /* keep btn-icon for any remaining usages */
        .btn-icon {
          padding: 0.4rem 0.75rem;
          background: transparent;
          color: #f8fafc;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }
        .btn-icon:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: #c8854a; }
        .btn-icon:disabled { opacity: 0.3; cursor: not-allowed; }
        .control-separator {
          width: 1px;
          background: rgba(255, 255, 255, 0.12);
          margin: 0 8px;
          height: 28px;
          align-self: center;
        }
        .tools-menu-backdrop {
          position: fixed;
          inset: 0;
          z-index: 599;
          background: transparent;
        }
        /* New grouped tools menu */
        .tools-menu {
          position: absolute;
          bottom: calc(100% + 10px);
          right: 0;
          z-index: 600;
          display: flex;
          flex-direction: column;
          padding: 0;
          border-radius: 14px;
          background: #ffffff;
          border: 1px solid #e8ddd5;
          box-shadow: 0 20px 40px -8px rgba(74, 32, 24, 0.18), 0 8px 16px -4px rgba(74, 32, 24, 0.08);
          min-width: 520px;
          overflow: hidden;
          animation: menuIn 0.18s cubic-bezier(0.34, 1.2, 0.64, 1);
          transform-origin: bottom right;
        }
        .tools-grid-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .tools-grid-column {
          padding: 8px 0;
          display: flex;
          flex-direction: column;
        }
        .tools-grid-column:nth-child(odd) {
          border-right: 1px solid #f0e8e0;
        }
        .tools-grid-column:nth-child(-n+2) {
          border-bottom: 1px solid #f0e8e0;
        }
        @keyframes menuIn {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .tools-menu-header {
          padding: 12px 16px 10px;
          font-size: 0.82rem;
          font-weight: 700;
          color: #1a1a1a;
          letter-spacing: 0.01em;
          border-bottom: 1px solid #f0e8e0;
          background: #fdf8f4;
          text-align: center;
        }
        .tools-section-label {
          padding: 8px 16px 4px;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: #c8854a;
          text-transform: uppercase;
        }
        .tools-section-divider {
          height: 1px;
          background: #f0e8e0;
          margin: 4px 0;
        }
        .tools-menu-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          cursor: default;
          transition: background 0.12s ease;
        }
        .tools-menu-row:hover {
          background: #fdf5ea;
        }
        .tools-menu-row-clickable {
          cursor: pointer;
        }
        .tools-row-btn {
          background: transparent;
          border: none;
          width: 100%;
          text-align: left;
          font-family: inherit;
          cursor: pointer;
        }
        .tools-row-icon {
          display: flex;
          align-items: center;
          color: #7a5a45;
          flex-shrink: 0;
          width: 18px;
        }
        .tools-row-label {
          flex: 1;
          font-size: 0.85rem;
          font-weight: 500;
          color: #2a1a12;
          line-height: 1;
        }
        /* Toggle switch */
        .tools-toggle {
          position: relative;
          width: 38px;
          height: 22px;
          border-radius: 11px;
          background: #d5c8be;
          border: none;
          cursor: pointer;
          padding: 0;
          flex-shrink: 0;
          transition: background 0.22s ease;
          outline: none;
        }
        .tools-toggle.tools-toggle-on {
          background: #c8854a;
        }
        .tools-toggle-knob {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          transition: transform 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);
          display: block;
        }
        .tools-toggle.tools-toggle-on .tools-toggle-knob {
          transform: translateX(16px);
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

        /* Chess Board Shaking Animations */
        .shake-heavy {
          animation: shake-heavy-anim 0.45s cubic-bezier(.36,.07,.19,.97) both;
          transform: translate3d(0, 0, 0);
        }
        .shake-light {
          animation: shake-light-anim 0.35s cubic-bezier(.36,.07,.19,.97) both;
          transform: translate3d(0, 0, 0);
        }

        @keyframes shake-heavy-anim {
          10%, 90% { transform: translate3d(-6px, -4px, 0) rotate(-1.5deg); }
          20%, 80% { transform: translate3d(8px, 6px, 0) rotate(2deg); }
          30%, 50%, 70% { transform: translate3d(-10px, -8px, 0) rotate(-2.5deg); }
          40%, 60% { transform: translate3d(10px, 8px, 0) rotate(2.5deg); }
        }

        @keyframes shake-light-anim {
          10%, 90% { transform: translate3d(-2px, -1px, 0) rotate(-0.5deg); }
          20%, 80% { transform: translate3d(3px, 2px, 0) rotate(0.5deg); }
          30%, 50%, 70% { transform: translate3d(-4px, -3px, 0) rotate(-1deg); }
          40%, 60% { transform: translate3d(4px, 3px, 0) rotate(1deg); }
        }

        /* Custom Frame Coordinates */
        .custom-frame-coords {
          position: absolute;
          display: flex;
          pointer-events: none;
          background: var(--board-coords-color, var(--primary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          color: var(--board-coords-color, var(--primary));
          font-family: var(--font-sans, sans-serif);
          font-weight: 600;
          font-size: clamp(10px, calc(var(--board-frame-padding) * 0.65), 14px);
          z-index: 10;
        }
        .custom-frame-coords.ranks {
          top: var(--board-frame-padding);
          bottom: var(--board-frame-padding);
          left: 0;
          width: var(--board-frame-padding);
        }
        .custom-frame-coords.files {
          left: var(--board-frame-padding);
          right: var(--board-frame-padding);
          bottom: 0;
          height: var(--board-frame-padding);
          text-transform: lowercase;
        }
        .custom-frame-coords .coord-label {
          flex: 1 1 auto;
          display: flex;
          align-items: center;
          justify-content: center;
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
