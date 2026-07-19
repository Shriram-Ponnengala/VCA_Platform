import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Chessground } from 'chessground';
import { Chess, Move, parseGamifiedFen, GAMIFIED_ITEMS } from '@vca/chess';
import type { Api } from 'chessground/api';
import type { Config } from 'chessground/config';
import type { Key } from 'chessground/types';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, RefreshCw, Eraser, RotateCcw, MoreHorizontal, Lock, Clock, LayoutGrid, Copy, FileText, Eye, ArrowUpRight, Square, Pen, Wrench, ChevronDown, Upload, ArrowUpDown, Database, SkipBack, SkipForward, Smile, PlusSquare, Check, Play, Pause, Hourglass, Lightbulb } from 'lucide-react';
import type { ArrowData, MoveNode } from '@vca/types';
import { VariationData } from './VariationChooser';
import { NagBadge } from './NagBadge';
import SetupPositionModal from './SetupPositionModal';
import UploadPgnModal from './UploadPgnModal';
import { EmojiReactions } from './EmojiReactions';
import { CoachTimerRing } from './CoachTimerRing';
import { NagReactionOverlay } from './NagReactionOverlay';
import { buildPgnFromMoveTree } from '@/features/database/pgnUtils';

import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';
import './chessground.css';

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
  role?: 'admin' | 'coach' | 'student' | null;
  userId?: string;
}

interface TimerAppearance {
  opacity: number; // 40-100, glass surface alpha
  accentColor: string | null; // null = default two-tone look (orange ring / green play)
  glassTint: string | null; // null = default white glass
  size: 'small' | 'medium' | 'large';
}

// Reproduces the existing hardcoded glassy look exactly, so a coach who never opens
// "Style" sees no visual change at all.
const TIMER_APPEARANCE_DEFAULTS: TimerAppearance = {
  opacity: 55,
  accentColor: null,
  glassTint: null,
  size: 'medium',
};

// "medium" values match today's hardcoded ring/button pixel sizes exactly.
const TIMER_SIZE_PRESETS = {
  small: { ring: 44, stroke: 4, btn: 28, play: 40, icon: 11, playIcon: 14 },
  medium: { ring: 52, stroke: 5, btn: 32, play: 46, icon: 13, playIcon: 16 },
  large: { ring: 62, stroke: 6, btn: 38, play: 54, icon: 15, playIcon: 19 },
} as const;

const TIMER_ACCENT_PRESETS = ['#c8854a', '#16a34a', '#2563eb', '#7c3aed', '#e11d48'];
const TIMER_TINT_PRESETS = ['#ffffff', '#fdf0e4', '#e0f2fe', '#dcfce7', '#f3e8ff'];

function hexToRgbTriplet(hex: string): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const bigint = parseInt(full, 16) || 0xffffff;
  return `${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}`;
}

function lightenHex(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const bigint = parseInt(full, 16) || 0;
  const r = Math.min(255, ((bigint >> 16) & 255) + amount);
  const g = Math.min(255, ((bigint >> 8) & 255) + amount);
  const b = Math.min(255, (bigint & 255) + amount);
  return `rgb(${r}, ${g}, ${b})`;
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
  role = null,
  userId,
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
  const [showLastMove, setShowLastMove] = useState(true);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [isArrowMode, setIsArrowMode] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showUploadPgnModal, setShowUploadPgnModal] = useState(false);
  const [promotionPending, setPromotionPending] = useState<{ from: string; to: string; color: 'w' | 'b' } | null>(null);
  const [isEmojiMode, setIsEmojiMode] = useState(false);
  const [shakeClass, setShakeClass] = useState<'heavy' | 'medium' | 'light' | 'none'>('none');
  const [userShowClocks, setUserShowClocks] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);

  // Coach-only timer states & logic
  const isCoachOrAdmin = role !== 'student';
  const [showTimerWidget, setShowTimerWidget] = useState(false);
  const [timerMode, setTimerMode] = useState<'countdown' | 'countup'>('countdown');
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStartTimestamp, setTimerStartTimestamp] = useState<number>(0);
  const [timerElapsedMs, setTimerElapsedMs] = useState<number>(0);
  const [countdownTotalMs, setCountdownTotalMs] = useState<number>(60000); // 1 minute default
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isTimeUpFlash, setIsTimeUpFlash] = useState(false);
  const [showCustomFields, setShowCustomFields] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('1');
  const [customSeconds, setCustomSeconds] = useState('00');
  const [displayMs, setDisplayMs] = useState(60000);
  // The pill (ring + play/pause/reset/sound/close) is always visible once the widget is
  // shown. "Expanded" only toggles a separate mode+duration popover anchored beside it —
  // running always closes that popover so it never lingers over the board mid-countdown.
  const [isTimerExpanded, setIsTimerExpanded] = useState(false);
  const [timerPanelPos, setTimerPanelPos] = useState<{ top: number; left: number } | null>(null);
  const timerPillRef = useRef<HTMLDivElement>(null);
  const timerPanelRef = useRef<HTMLDivElement>(null);

  // Drag offset is ephemeral, session-only state — it's never written anywhere persistent,
  // and gets reset to {0,0} every time the widget is (re)shown, so the default top-left
  // CSS position (see .vca-coach-timer-widget) is always what a fresh open lands on.
  const [timerDragOffset, setTimerDragOffset] = useState({ x: 0, y: 0 });
  const [isDraggingTimer, setIsDraggingTimer] = useState(false);
  const timerDragStartRef = useRef<{
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
    defaultLeft: number;
    defaultTop: number;
    minLeftBound: number;
  } | null>(null);

  useEffect(() => {
    if (timerRunning) setIsTimerExpanded(false);
  }, [timerRunning]);

  useEffect(() => {
    if (showTimerWidget) setTimerDragOffset({ x: 0, y: 0 });
  }, [showTimerWidget]);

  // Per-coach appearance customization (opacity/accent/tint/size). Device-local only —
  // there's no per-user backend preference store in this app, so this persists to
  // localStorage keyed by userId rather than syncing across devices.
  const timerAppearanceStorageKey = `vca_timer_appearance_${userId || 'anon'}`;
  const [timerAppearance, setTimerAppearance] = useState<TimerAppearance>(() => {
    if (typeof window === 'undefined') return TIMER_APPEARANCE_DEFAULTS;
    try {
      const saved = window.localStorage.getItem(timerAppearanceStorageKey);
      return saved ? { ...TIMER_APPEARANCE_DEFAULTS, ...JSON.parse(saved) } : TIMER_APPEARANCE_DEFAULTS;
    } catch {
      return TIMER_APPEARANCE_DEFAULTS;
    }
  });
  const [timerPanelTab, setTimerPanelTab] = useState<'timer' | 'style'>('timer');

  // userId often resolves asynchronously (after a join/auth fetch) later than this
  // component's first render, so re-load once the real key is known.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(timerAppearanceStorageKey);
      setTimerAppearance(saved ? { ...TIMER_APPEARANCE_DEFAULTS, ...JSON.parse(saved) } : TIMER_APPEARANCE_DEFAULTS);
    } catch {
      setTimerAppearance(TIMER_APPEARANCE_DEFAULTS);
    }
  }, [timerAppearanceStorageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(timerAppearanceStorageKey, JSON.stringify(timerAppearance));
    } catch {
      // best-effort; a private/full storage just means this session's tweaks don't persist
    }
  }, [timerAppearance, timerAppearanceStorageKey]);

  const timerSizePreset = TIMER_SIZE_PRESETS[timerAppearance.size];
  const timerGlassBackground = `rgba(${timerAppearance.glassTint ? hexToRgbTriplet(timerAppearance.glassTint) : '255, 255, 255'}, ${timerAppearance.opacity / 100})`;
  const timerPlayBtnStyle: React.CSSProperties = {
    width: timerSizePreset.play,
    height: timerSizePreset.play,
    ...(timerAppearance.accentColor
      ? { background: `linear-gradient(135deg, ${lightenHex(timerAppearance.accentColor, 28)}, ${timerAppearance.accentColor})` }
      : {}),
  };
  const timerMoreBtnStyle: React.CSSProperties = {
    width: timerSizePreset.btn,
    height: timerSizePreset.btn,
    ...(isTimerExpanded && timerAppearance.accentColor
      ? { background: timerAppearance.accentColor, borderColor: timerAppearance.accentColor }
      : {}),
  };
  const timerResetBtnStyle: React.CSSProperties = { width: timerSizePreset.btn, height: timerSizePreset.btn };

  const TIMER_PANEL_WIDTH = 216;
  const TIMER_PANEL_GAP = 10;

  // Same idea as the codebase's other flip-positioning context menus (see
  // DatabasePanel's contextmenu handler): measure the anchor, prefer one side,
  // flip to the other if it doesn't fit, then clamp fully on-screen. Here the
  // anchor is the pill (which itself sits just outside the board, near the
  // sidebar) rather than a click point, and we only ever consider right/below —
  // left would put the panel behind the sidebar.
  const computeTimerPanelPosition = useCallback(() => {
    const pillEl = timerPillRef.current;
    if (!pillEl) return null;
    const rect = pillEl.getBoundingClientRect();
    const estimatedHeight = timerMode === 'countdown' ? (showCustomFields ? 220 : 172) : 96;

    let left = rect.right + TIMER_PANEL_GAP; // preferred: open to the right, toward the board
    let top = rect.top;

    const fitsRight = left + TIMER_PANEL_WIDTH <= window.innerWidth - TIMER_PANEL_GAP;
    if (!fitsRight) {
      // flip downward instead of ever falling back to the left (sidebar side)
      left = rect.left;
      top = rect.bottom + TIMER_PANEL_GAP;
    }

    left = Math.max(left, rect.left); // never drift left of the pill itself
    if (left + TIMER_PANEL_WIDTH > window.innerWidth - TIMER_PANEL_GAP) {
      left = window.innerWidth - TIMER_PANEL_WIDTH - TIMER_PANEL_GAP;
    }
    top = Math.max(TIMER_PANEL_GAP, Math.min(top, window.innerHeight - estimatedHeight - TIMER_PANEL_GAP));

    return { top, left };
  }, [timerMode, showCustomFields]);

  const handleToggleTimerPanel = () => {
    setIsTimerExpanded(prev => {
      const next = !prev;
      if (next) setTimerPanelPos(computeTimerPanelPosition());
      return next;
    });
  };

  const handleTimerDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    const start = timerDragStartRef.current;
    const pillEl = timerPillRef.current;
    if (!start || !pillEl) return;
    if ('touches' in e) e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaX = clientX - start.startClientX;
    const deltaY = clientY - start.startClientY;

    const EDGE_MARGIN = 8;
    const pillWidth = pillEl.offsetWidth;
    const pillHeight = pillEl.offsetHeight;

    // Clamp in absolute screen space: never left of the actual sidebar edge (measured at
    // drag-start, not assumed from the pill's own default spot — the default position can
    // sit well clear of the sidebar, and that shouldn't artificially cap how far left the
    // pill is allowed to travel) and never past the other three viewport edges.
    const minLeft = start.minLeftBound;
    const maxLeft = Math.max(minLeft, window.innerWidth - pillWidth - EDGE_MARGIN);
    const minTop = EDGE_MARGIN;
    const maxTop = Math.max(minTop, window.innerHeight - pillHeight - EDGE_MARGIN);

    const proposedLeft = Math.min(Math.max(start.defaultLeft + start.startOffsetX + deltaX, minLeft), maxLeft);
    const proposedTop = Math.min(Math.max(start.defaultTop + start.startOffsetY + deltaY, minTop), maxTop);

    setTimerDragOffset({
      x: proposedLeft - start.defaultLeft,
      y: proposedTop - start.defaultTop,
    });
  }, []);

  const handleTimerDragEnd = useCallback(() => {
    timerDragStartRef.current = null;
    setIsDraggingTimer(false);
    document.removeEventListener('mousemove', handleTimerDragMove);
    document.removeEventListener('mouseup', handleTimerDragEnd);
    document.removeEventListener('touchmove', handleTimerDragMove);
    document.removeEventListener('touchend', handleTimerDragEnd);
    // The panel doesn't track the pill live mid-drag; snap it to the new spot once the drag settles.
    setIsTimerExpanded(current => {
      if (current) setTimerPanelPos(computeTimerPanelPosition());
      return current;
    });
  }, [handleTimerDragMove, computeTimerPanelPosition]);

  const handleTimerDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return; // let button clicks (play/reset/more) behave normally
    const pillEl = timerPillRef.current;
    if (!pillEl) return;

    const rect = pillEl.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Real sidebar edge, not the pill's own default position — the default resting spot can
    // sit further right than strictly necessary (e.g. aligned to a board rank), which would
    // otherwise cap leftward dragging well before it actually reaches the sidebar.
    const sidebarEl = document.querySelector('[data-app-sidebar]') as HTMLElement | null;
    const minLeftBound = (sidebarEl ? sidebarEl.getBoundingClientRect().right : 0) + 8;

    timerDragStartRef.current = {
      startClientX: clientX,
      startClientY: clientY,
      startOffsetX: timerDragOffset.x,
      startOffsetY: timerDragOffset.y,
      defaultLeft: rect.left - timerDragOffset.x,
      defaultTop: rect.top - timerDragOffset.y,
      minLeftBound,
    };
    setIsDraggingTimer(true);

    document.addEventListener('mousemove', handleTimerDragMove);
    document.addEventListener('mouseup', handleTimerDragEnd);
    document.addEventListener('touchmove', handleTimerDragMove, { passive: false });
    document.addEventListener('touchend', handleTimerDragEnd);
  }, [timerDragOffset, handleTimerDragMove, handleTimerDragEnd]);

  useEffect(() => {
    if (!isTimerExpanded) return;
    const recalc = () => setTimerPanelPos(computeTimerPanelPosition());
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [isTimerExpanded, computeTimerPanelPosition]);

  useEffect(() => {
    if (!isTimerExpanded) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (timerPanelRef.current?.contains(target)) return;
      if (timerPillRef.current?.contains(target)) return;
      setIsTimerExpanded(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isTimerExpanded]);

  // Precise drift-free interval timer logic
  useEffect(() => {
    let intervalId: any = null;

    if (timerRunning) {
      intervalId = setInterval(() => {
        const currentElapsed = timerElapsedMs + (Date.now() - timerStartTimestamp);

        if (timerMode === 'countdown') {
          const remaining = Math.max(0, countdownTotalMs - currentElapsed);
          setDisplayMs(remaining);

          if (remaining <= 0) {
            setTimerRunning(false);
            setTimerElapsedMs(countdownTotalMs);
            setIsTimeUpFlash(true);

            // Play synthesized audio bells on countdown expiration via Web Audio API
            if (soundEnabled) {
              try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const now = ctx.currentTime;

                // High pitch chime A5 (880Hz)
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(880, now);
                gain1.gain.setValueAtTime(0.15, now);
                gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                osc1.connect(gain1);
                gain1.connect(ctx.destination);
                osc1.start(now);
                osc1.stop(now + 0.5);

                // Harmony chime C#6 (1109.73Hz)
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(1109.73, now + 0.15);
                gain2.gain.setValueAtTime(0.15, now + 0.15);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.start(now + 0.15);
                osc2.stop(now + 0.65);
              } catch (e) {
                console.error('AudioContext warning chimes failed to play:', e);
              }
            }
          }
        } else {
          // Count up stopwatch
          setDisplayMs(currentElapsed);
        }
      }, 50); // 50ms tick frequency for high accuracy and response
    } else {
      if (timerMode === 'countdown') {
        setDisplayMs(Math.max(0, countdownTotalMs - timerElapsedMs));
      } else {
        setDisplayMs(timerElapsedMs);
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timerRunning, timerStartTimestamp, timerElapsedMs, timerMode, countdownTotalMs, soundEnabled]);

  const handleStartTimer = () => {
    if (!timerRunning) {
      setIsTimeUpFlash(false);
      setTimerStartTimestamp(Date.now());
      setTimerRunning(true);
    }
  };

  const handlePauseTimer = () => {
    if (timerRunning) {
      const sessionElapsed = Date.now() - timerStartTimestamp;
      setTimerElapsedMs(prev => prev + sessionElapsed);
      setTimerRunning(false);
    }
  };

  const handleResetTimer = () => {
    setTimerRunning(false);
    setTimerElapsedMs(0);
    setIsTimeUpFlash(false);
    if (timerMode === 'countdown') {
      setDisplayMs(countdownTotalMs);
    } else {
      setDisplayMs(0);
    }
  };

  const handleSetPresetMs = (ms: number) => {
    setTimerRunning(false);
    setTimerElapsedMs(0);
    setCountdownTotalMs(ms);
    setDisplayMs(ms);
    setIsTimeUpFlash(false);
  };

  const handleSetCustomTime = () => {
    const mins = Math.max(0, parseInt(customMinutes) || 0);
    const secs = Math.max(0, Math.min(59, parseInt(customSeconds) || 0));
    const totalMs = (mins * 60 + secs) * 1000;
    if (totalMs > 0) {
      handleSetPresetMs(totalMs);
      setShowCustomFields(false);
    }
  };

  useEffect(() => {
    if (isFreehand) {
      setIsEmojiMode(false);
    }
  }, [isFreehand]);

  useEffect(() => {
    const handleBranding = () => {
      setAnimationKey(prev => prev + 1);
    };
    window.addEventListener('vca-branding-updated', handleBranding);
    return () => {
      window.removeEventListener('vca-branding-updated', handleBranding);
    };
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const lastMovedFenRef = useRef<string>('');
  const prevFenRef = useRef<string>('');

  // Chessground caches the board's bounding rect for click/drag hit-testing and only
  // re-measures when told to. Layout can still be settling (fonts, CSS transitions,
  // branding CSS vars applied post-mount) when a single redrawAll() fires, leaving it
  // with a stale rect that quietly maps clicks to the wrong square. Chaining through
  // two animation frames ensures we re-measure only after the browser has actually
  // finished painting the current layout.
  const scheduleRedraw = useCallback(() => {
    requestAnimationFrame(() => {
      cgRef.current?.redrawAll();
      requestAnimationFrame(() => {
        cgRef.current?.redrawAll();
      });
    });
  }, []);

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
    scheduleRedraw();
  }, [boardWidth, scheduleRedraw]);

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
      if ((e.target as Element)?.closest('[data-emoji-panel="true"]')) {
        return;
      }
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
      lastMovedFenRef.current = chess.fen();
      onMoveRef.current(move, currentIndexRef.current, chess.fen());
    } else if (isFreehandRef.current) {
      const freehandResult = movePieceInFen(currentFen, orig as string, dest as string);
      if (freehandResult) {
        lastMovedFenRef.current = freehandResult.fen;
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
      lastMovedFenRef.current = chess.fen();
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

      const animStyle = typeof document !== 'undefined'
        ? (document.documentElement.getAttribute('data-piece-animation') || 'standard')
        : 'standard';

      const config: Config = {
        fen: cleanFen,
        orientation: orientation,
        coordinates: false, // Disabled native coords, rendering our own in the frame
        turnColor: turnColor,
        lastMove: showLastMove ? lastMove : undefined,
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
          enabled: animStyle !== 'none' && animStyle !== 'teleport',
          duration: animStyle === 'bounce' ? 300 : (animStyle === 'arcade' ? 250 : 200),
        },
      };

      cgRef.current = Chessground(containerRef.current, config);
    }

    // Set up ResizeObserver to recalculate board bounds on container size changes
    let observer: ResizeObserver | null = null;
    if (containerRef.current) {
      observer = new ResizeObserver(() => {
        scheduleRedraw();
      });
      observer.observe(containerRef.current);
    }

    // Set up window resize listener
    const handleResize = () => {
      scheduleRedraw();
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, { passive: true });

    // Re-measure once web fonts finish loading — swapping fonts can reflow the
    // board frame after chessground already cached its bounds.
    document.fonts?.ready?.then(() => scheduleRedraw());

    // Re-measure if the frame padding CSS var changes (e.g. branding settings
    // applying `--board-frame-padding` on :root after this board has mounted).
    const rootStyleObserver = new MutationObserver(() => scheduleRedraw());
    rootStyleObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

    // Initial delay recalculation to handle any mounting shifts/transitions
    const mountTimer = setTimeout(() => {
      scheduleRedraw();
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
      window.removeEventListener('scroll', handleResize);
      if (observer) {
        observer.disconnect();
      }
      rootStyleObserver.disconnect();
      clearTimeout(mountTimer);
    };
  }, [orientation, showCoordinates, isHighlightMode, isArrowMode, scheduleRedraw]);

  // Watchdog: ResizeObserver only reacts to width/height changes, not position.
  // Anything that shifts the board on the page without resizing it (a sidebar
  // owned by some unrelated ancestor, a reflow from content this component has
  // no visibility into, etc.) leaves chessground's cached bounds stale with no
  // event to hook into. Poll the container's actual rect and force a re-measure
  // whenever it drifts from what we last saw — cheap, and catches drift from any
  // cause instead of chasing individual triggers one at a time.
  useEffect(() => {
    const lastRect = { top: 0, left: 0, width: 0, height: 0 };
    const interval = setInterval(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (
        rect.top !== lastRect.top ||
        rect.left !== lastRect.left ||
        rect.width !== lastRect.width ||
        rect.height !== lastRect.height
      ) {
        lastRect.top = rect.top;
        lastRect.left = rect.left;
        lastRect.width = rect.width;
        lastRect.height = rect.height;
        cgRef.current?.redrawAll();
      }
    }, 400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (cgRef.current) {
      const fenChanged = cleanFen !== prevFenRef.current;
      prevFenRef.current = cleanFen;

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

      const animStyle = typeof document !== 'undefined'
        ? (document.documentElement.getAttribute('data-piece-animation') || 'standard')
        : 'standard';

      const config: any = {
        orientation: orientation,
        coordinates: false, // Disabled native coords, rendering our own in the frame
        turnColor: turnColor,
        lastMove: showLastMove ? lastMove : undefined,
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
        },
        animation: {
          enabled: animStyle !== 'none' && animStyle !== 'teleport',
          duration: animStyle === 'bounce' ? 300 : (animStyle === 'arcade' ? 250 : 200),
        }
      };

      if (cleanFen !== lastMovedFenRef.current) {
        config.fen = cleanFen;
      } else {
        // Reset the ref since we matched it once
        lastMovedFenRef.current = '';
      }

      let vanishEl: HTMLElement | null = null;
      let trailEl: HTMLElement | null = null;
      const fromSq = currentNode?.from;
      const dest = lastMove?.[1];

      // a. On move (BEFORE redrawing Chessground): clone the origin piece
      if (fenChanged && lastMove && animStyle === 'teleport' && containerRef.current && fromSq && dest) {
        const originPiece = findPieceAtSquare(containerRef.current, fromSq, orientation);
        console.log(`[ChessBoard] Teleport: Origin piece found at ${fromSq}:`, originPiece);
        if (originPiece) {
          const bgImage = window.getComputedStyle(originPiece).backgroundImage;
          const boardInner = containerRef.current.querySelector('.board-inner-playing-area') || containerRef.current;

          const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
          const fromCol = orientation === 'white' ? files.indexOf(fromSq[0]) : 7 - files.indexOf(fromSq[0]);
          const fromRow = orientation === 'white' ? 8 - parseInt(fromSq[1]) : parseInt(fromSq[1]) - 1;
          
          const toCol = orientation === 'white' ? files.indexOf(dest[0]) : 7 - files.indexOf(dest[0]);
          const toRow = orientation === 'white' ? 8 - parseInt(dest[1]) : parseInt(dest[1]) - 1;

          const dx = toCol - fromCol;
          const dy = toRow - fromRow;
          const len = Math.hypot(dx, dy);
          const ux = len > 0 ? dx / len : 0;
          const uy = len > 0 ? dy / len : 0;

          const boardRect = containerRef.current.getBoundingClientRect();
          const squareSize = boardRect.width / 8;
          const tx = ux * (squareSize * 0.4);
          const ty = uy * (squareSize * 0.4);

          // Create temporary vanish element at origin
          vanishEl = document.createElement('div');
          vanishEl.className = 'vca-teleport-vanish';
          vanishEl.style.backgroundImage = bgImage;
          vanishEl.style.left = `${fromCol * 12.5}%`;
          vanishEl.style.top = `${fromRow * 12.5}%`;
          vanishEl.style.width = '12.5%';
          vanishEl.style.height = '12.5%';

          // Create temporary directional trail element at origin
          trailEl = document.createElement('div');
          trailEl.className = 'vca-teleport-trail';
          trailEl.style.backgroundImage = bgImage;
          trailEl.style.left = `${fromCol * 12.5}%`;
          trailEl.style.top = `${fromRow * 12.5}%`;
          trailEl.style.width = '12.5%';
          trailEl.style.height = '12.5%';
          trailEl.style.setProperty('--tx', `${tx}px`);
          trailEl.style.setProperty('--ty', `${ty}px`);

          boardInner.appendChild(vanishEl);
          boardInner.appendChild(trailEl);
          console.log(`[ChessBoard] Teleport: Origin vanish and trail overlay created successfully.`);
        }
      }

      // b. Call Chessground move with animation duration 0 (instant placement)
      cgRef.current.set(config);

      // c. On next frame, query the destination piece element and run pop-in
      if (fenChanged && lastMove && animStyle === 'teleport' && containerRef.current && dest) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!containerRef.current) return;
            const pieceEl = findPieceAtSquare(containerRef.current, dest, orientation);
            console.log(`[ChessBoard] Teleport: Destination piece found at ${dest} after redraw:`, pieceEl);
            if (pieceEl) {
              if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                console.log(`[ChessBoard] Teleport skipped due to prefers-reduced-motion`);
                return;
              }
              pieceEl.classList.add('vca-teleport-piece');
              console.log(`[ChessBoard] Added teleport class to destination piece. classes:`, pieceEl.className);

              // d. Clean up overlays and classes
              setTimeout(() => {
                if (vanishEl) vanishEl.remove();
                if (trailEl) trailEl.remove();
                if (pieceEl) pieceEl.classList.remove('vca-teleport-piece');
                console.log(`[ChessBoard] Teleport: Cleaned up overlays and classes.`);
              }, 250);
            } else {
              console.warn(`[ChessBoard] Teleport: Destination piece at ${dest} not found!`);
              setTimeout(() => {
                if (vanishEl) vanishEl.remove();
                if (trailEl) trailEl.remove();
              }, 250);
            }
          });
        });
      }

      // Trigger bounce if bounce animation is enabled
      if (fenChanged && lastMove && animStyle === 'bounce') {
        const destSq = lastMove[1];
        console.log(`[ChessBoard] Bounce check: cleanFen Changed. dest: ${destSq}, orientation: ${orientation}`);
        setTimeout(() => {
          if (containerRef.current) {
            const pieceEl = findPieceAtSquare(containerRef.current, destSq, orientation);
            console.log(`[ChessBoard] Bounce target piece element found:`, pieceEl);
            if (pieceEl) {
              if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                console.log(`[ChessBoard] Bounce skipped due to prefers-reduced-motion`);
                return;
              }
              // Ensure we don't clobber layout/transform. Adding a class that animates margin-top is additive.
              pieceEl.classList.add('vca-bouncing-piece');
              console.log(`[ChessBoard] Added bouncing class to piece. style:`, pieceEl.getAttribute('style'));
              setTimeout(() => {
                pieceEl.classList.remove('vca-bouncing-piece');
                console.log(`[ChessBoard] Removed bouncing class from piece`);
              }, 180);
            }
          }
        }, 200); // Trigger after Chessground slide animation ends
      }
      // A move can change the height of sibling UI (move list, clock display,
      // NAG badge, branch chooser) and shift the board's position on the page
      // without resizing the board itself — ResizeObserver only reacts to size
      // changes, not position, so it misses this. Force a re-measure here too.
      scheduleRedraw();
    }
  }, [fen, currentIndex, isLocked, arrows, orientation, showCoordinates, showLastMove, isFreehand, isHighlightMode, isArrowMode, isEmojiMode, currentNode, moveRejectedAt, scheduleRedraw, animationKey]);

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

  const generatePgn = useCallback(() => {
    try {
      if (nodes && currentNode) {
        let rootNodeId: string | null = null;
        let curr = currentNode;
        while (curr.parentId && nodes[curr.parentId]) {
          curr = nodes[curr.parentId];
        }
        rootNodeId = curr.id;

        if (rootNodeId && nodes[rootNodeId]) {
          const rootFen = nodes[rootNodeId].fen?.split('|')[0] || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
          const tags: Record<string, string> = {};
          if (rootFen !== "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") {
            tags['SetUp'] = '1';
            tags['FEN'] = rootFen;
          }
          const pgnString = buildPgnFromMoveTree(nodes, rootNodeId, tags);
          if (pgnString) return pgnString;
        }
      }
      
      return history ? history.slice(0, currentIndex + 1).join('\n') : '';
    } catch(e) {
      console.error('Error generating PGN:', e);
      return history ? history.slice(0, currentIndex + 1).join('\n') : '';
    }
  }, [nodes, currentNode, history, currentIndex]);

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
            navigator.clipboard.writeText(generatePgn());
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

  const timerTimeLabel = (() => {
    const totalSecs = Math.ceil(displayMs / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  })();

  return (
    <div className="chess-container" style={boardWidth ? { maxWidth: `${boardWidth}px` } : undefined}>
      <div 
        className={`board-wrapper cburnett brown ${
          shakeClass === 'heavy' ? 'shake-heavy' :
          shakeClass === 'medium' ? 'shake-medium' :
          shakeClass === 'light' ? 'shake-light' : ''
        } ${isTimeUpFlash ? 'vca-board-flash' : ''}`} 
        style={{ 
          position: 'relative',
          width: boardWidth ? `${boardWidth}px` : undefined
        }}
      >
        {showTimerWidget && isCoachOrAdmin && (
          <div
            className={`vca-coach-timer-widget vca-timer-pill-collapsed ${isDraggingTimer ? 'vca-timer-dragging' : ''}`}
            ref={timerPillRef}
            style={{
              background: timerGlassBackground,
              transform: (timerDragOffset.x || timerDragOffset.y)
                ? `translate(${timerDragOffset.x}px, ${timerDragOffset.y}px)`
                : undefined
            }}
            onMouseDown={handleTimerDragStart}
            onTouchStart={handleTimerDragStart}
          >
            <button
              className={`vca-timer-btn vca-timer-pill-btn ${isTimerExpanded ? 'vca-timer-pill-btn-active' : ''}`}
              style={timerMoreBtnStyle}
              onClick={handleToggleTimerPanel}
              title={isTimerExpanded ? "Close setup" : "Mode & duration"}
            >
              <MoreHorizontal size={timerSizePreset.icon} />
            </button>

            <CoachTimerRing
              mode={timerMode}
              displayMs={displayMs}
              totalMs={countdownTotalMs}
              timeLabel={timerTimeLabel}
              size={timerSizePreset.ring}
              strokeWidth={timerSizePreset.stroke}
              accentColor={timerAppearance.accentColor || undefined}
            />

            {timerRunning ? (
              <button className="vca-timer-btn vca-timer-pill-btn vca-timer-play-btn" style={timerPlayBtnStyle} onClick={handlePauseTimer} title="Pause">
                <Pause size={timerSizePreset.playIcon} />
              </button>
            ) : (
              <button className="vca-timer-btn vca-timer-pill-btn vca-timer-play-btn" style={timerPlayBtnStyle} onClick={handleStartTimer} title="Start" disabled={timerMode === 'countdown' && displayMs <= 0}>
                <Play size={timerSizePreset.playIcon} />
              </button>
            )}

            <button className="vca-timer-btn vca-timer-pill-btn" style={timerResetBtnStyle} onClick={handleResetTimer} title="Reset">
              <RotateCcw size={timerSizePreset.icon} />
            </button>
          </div>
        )}

        {showTimerWidget && isCoachOrAdmin && isTimerExpanded && timerPanelPos && (
          <div
            className="vca-timer-settings-popover"
            ref={timerPanelRef}
            style={{ position: 'fixed', top: timerPanelPos.top, left: timerPanelPos.left, width: TIMER_PANEL_WIDTH, background: timerGlassBackground }}
          >
            <div className="vca-timer-panel-tabs">
              <button
                className={`vca-timer-panel-tab ${timerPanelTab === 'timer' ? 'active' : ''}`}
                onClick={() => setTimerPanelTab('timer')}
              >
                Timer
              </button>
              <button
                className={`vca-timer-panel-tab ${timerPanelTab === 'style' ? 'active' : ''}`}
                onClick={() => setTimerPanelTab('style')}
              >
                Style
              </button>
            </div>

            {timerPanelTab === 'timer' && (
              <>
                <div className="vca-timer-mode-selector">
                  <button
                    className={`vca-timer-mode-btn ${timerMode === 'countdown' ? 'active' : ''}`}
                    onClick={() => { setTimerMode('countdown'); handleResetTimer(); }}
                  >
                    Countdown
                  </button>
                  <button
                    className={`vca-timer-mode-btn ${timerMode === 'countup' ? 'active' : ''}`}
                    onClick={() => { setTimerMode('countup'); handleResetTimer(); }}
                  >
                    Stopwatch
                  </button>
                </div>

                {timerMode === 'countdown' && (
                  <>
                    <span className="vca-timer-popover-label">Duration</span>

                    <div className="vca-timer-presets">
                      {[
                        { label: '30s', ms: 30000 },
                        { label: '1m', ms: 60000 },
                        { label: '2m', ms: 120000 },
                        { label: '5m', ms: 300000 },
                      ].map(({ label, ms }) => (
                        <span
                          key={ms}
                          className={`vca-timer-preset-tag ${!showCustomFields && countdownTotalMs === ms ? 'active' : ''}`}
                          onClick={() => { handleSetPresetMs(ms); setShowCustomFields(false); }}
                        >
                          {label}
                        </span>
                      ))}
                    </div>

                    <span
                      className={`vca-timer-custom-toggle ${showCustomFields ? 'active' : ''}`}
                      onClick={() => setShowCustomFields(prev => !prev)}
                    >
                      Custom…
                    </span>

                    {showCustomFields && (
                      <div className="vca-timer-custom-row">
                        <input
                          type="text"
                          pattern="[0-9]*"
                          value={customMinutes}
                          onChange={(e) => setCustomMinutes(e.target.value.replace(/\D/g, '').slice(0, 3))}
                          className="vca-timer-custom-input"
                          placeholder="Min"
                        />
                        <span>m</span>
                        <input
                          type="text"
                          pattern="[0-9]*"
                          value={customSeconds}
                          onChange={(e) => setCustomSeconds(e.target.value.replace(/\D/g, '').slice(0, 2))}
                          className="vca-timer-custom-input"
                          placeholder="Sec"
                        />
                        <span>s</span>
                        <button className="vca-timer-btn vca-timer-btn-primary" style={{ marginLeft: 'auto', padding: '4px 10px' }} onClick={handleSetCustomTime}>
                          Set
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {timerPanelTab === 'style' && (
              <div className="vca-timer-style-section">
                <div className="vca-timer-style-row">
                  <span className="vca-timer-popover-label">Opacity</span>
                  <span className="vca-timer-style-value">{timerAppearance.opacity}%</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={100}
                  value={timerAppearance.opacity}
                  onChange={(e) => setTimerAppearance(prev => ({ ...prev, opacity: Number(e.target.value) }))}
                  className="vca-timer-slider"
                />

                <span className="vca-timer-popover-label">Accent Color</span>
                <div className="vca-timer-swatch-row">
                  <button
                    className={`vca-timer-swatch vca-timer-swatch-default ${!timerAppearance.accentColor ? 'active' : ''}`}
                    onClick={() => setTimerAppearance(prev => ({ ...prev, accentColor: null }))}
                    title="Default"
                  />
                  {TIMER_ACCENT_PRESETS.map(color => (
                    <button
                      key={color}
                      className={`vca-timer-swatch ${timerAppearance.accentColor === color ? 'active' : ''}`}
                      style={{ background: color }}
                      onClick={() => setTimerAppearance(prev => ({ ...prev, accentColor: color }))}
                      title={color}
                    />
                  ))}
                  <input
                    type="color"
                    className="vca-timer-color-input"
                    value={timerAppearance.accentColor || '#c8854a'}
                    onChange={(e) => setTimerAppearance(prev => ({ ...prev, accentColor: e.target.value }))}
                    title="Custom color"
                  />
                </div>

                <span className="vca-timer-popover-label">Glass Tint</span>
                <div className="vca-timer-swatch-row">
                  <button
                    className={`vca-timer-swatch vca-timer-swatch-default ${!timerAppearance.glassTint ? 'active' : ''}`}
                    onClick={() => setTimerAppearance(prev => ({ ...prev, glassTint: null }))}
                    title="Default"
                  />
                  {TIMER_TINT_PRESETS.map(color => (
                    <button
                      key={color}
                      className={`vca-timer-swatch ${timerAppearance.glassTint === color ? 'active' : ''}`}
                      style={{ background: color }}
                      onClick={() => setTimerAppearance(prev => ({ ...prev, glassTint: color }))}
                      title={color}
                    />
                  ))}
                  <input
                    type="color"
                    className="vca-timer-color-input"
                    value={timerAppearance.glassTint || '#ffffff'}
                    onChange={(e) => setTimerAppearance(prev => ({ ...prev, glassTint: e.target.value }))}
                    title="Custom color"
                  />
                </div>

                <span className="vca-timer-popover-label">Size</span>
                <div className="vca-timer-mode-selector">
                  {(['small', 'medium', 'large'] as const).map(sizeOption => (
                    <button
                      key={sizeOption}
                      className={`vca-timer-mode-btn ${timerAppearance.size === sizeOption ? 'active' : ''}`}
                      onClick={() => setTimerAppearance(prev => ({ ...prev, size: sizeOption }))}
                    >
                      {sizeOption[0].toUpperCase() + sizeOption.slice(1)}
                    </button>
                  ))}
                </div>

                <span
                  className="vca-timer-custom-toggle"
                  onClick={() => setTimerAppearance(TIMER_APPEARANCE_DEFAULTS)}
                >
                  Reset to default
                </span>
              </div>
            )}
          </div>
        )}
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

        {/* Time's up banner overlay */}
        {isTimeUpFlash && (
          <div className="vca-time-up-overlay" style={{
            position: 'absolute',
            inset: 'var(--board-frame-padding, 0)',
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 900,
            animation: 'fadeIn 0.2s ease-out',
            pointerEvents: 'none'
          }}>
            <div className="vca-time-up-text" style={{
              color: '#ffffff',
              fontSize: 'clamp(2rem, 8vw, 3.5rem)',
              fontWeight: 800,
              fontFamily: 'inherit',
              textShadow: '0 4px 12px rgba(0,0,0,0.6)',
              animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              Time's Up!
            </div>
          </div>
        )}

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
                {/* Column 1 */}
                <div className="tools-grid-column">
                  {/* SECTION 1: BOARD */}
                  <div className="tools-section-label">BOARD</div>
                  <div className="tools-section-divider" style={{ margin: '4px 16px 8px 16px' }} />
                  
                  {onSetupPosition && (
                    <button
                      className="tools-menu-row tools-row-btn"
                      onClick={() => { setShowSetupModal(true); setShowToolsMenu(false); }}
                    >
                      <span className="tools-row-icon"><LayoutGrid size={15} /></span>
                      <span className="tools-row-label">Setup Position</span>
                    </button>
                  )}
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
                  <button
                    className="tools-menu-row tools-row-btn"
                    onClick={() => {
                      setOrientation(o => o === 'white' ? 'black' : 'white');
                      setShowToolsMenu(false);
                    }}
                  >
                    <span className="tools-row-icon"><ArrowUpDown size={15} /></span>
                    <span className="tools-row-label">Flip Board</span>
                  </button>
                  {onNullMove && (
                    <button
                      className="tools-menu-row tools-row-btn"
                      onClick={() => { onNullMove(); setShowToolsMenu(false); }}
                    >
                      <span className="tools-row-icon" style={{ fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '15px' }}>∅</span>
                      <span className="tools-row-label">Null Move (Pass)</span>
                    </button>
                  )}

                  <div style={{ height: '16px' }} />

                  {/* SECTION 3: ANNOTATION TOOLS */}
                  <div className="tools-section-label">ANNOTATION TOOLS</div>
                  <div className="tools-section-divider" style={{ margin: '4px 16px 8px 16px' }} />
                  
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

                {/* Column 2 */}
                <div className="tools-grid-column">
                  {/* SECTION 2: DISPLAY */}
                  <div className="tools-section-label">DISPLAY</div>
                  <div className="tools-section-divider" style={{ margin: '4px 16px 8px 16px' }} />
                  
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
                  {isCoachOrAdmin && (
                    <div className="tools-menu-row tools-menu-row-clickable" onClick={() => setShowTimerWidget(prev => !prev)}>
                      <span className="tools-row-icon"><Hourglass size={15} /></span>
                      <span className="tools-row-label">Coach Timer</span>
                      <button
                        className={`tools-toggle ${showTimerWidget ? 'tools-toggle-on' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setShowTimerWidget(prev => !prev); }}
                        aria-label="Toggle Coach Timer"
                      >
                        <span className="tools-toggle-knob" />
                      </button>
                    </div>
                  )}
                  <div className="tools-menu-row tools-menu-row-clickable" onClick={() => setShowLastMove(prev => !prev)}>
                    <span className="tools-row-icon"><Lightbulb size={15} /></span>
                    <span className="tools-row-label">Highlight Last Move</span>
                    <button
                      className={`tools-toggle ${showLastMove ? 'tools-toggle-on' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setShowLastMove(prev => !prev); }}
                      aria-label="Toggle Highlight Last Move"
                    >
                      <span className="tools-toggle-knob" />
                    </button>
                  </div>

                  <div style={{ height: '16px' }} />

                  {/* SECTION 4: FILE */}
                  <div className="tools-section-label">FILE</div>
                  <div className="tools-section-divider" style={{ margin: '4px 16px 8px 16px' }} />
                  
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
                  <button
                    className="tools-menu-row tools-row-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(generatePgn());
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

const findPieceAtSquare = (boardEl: HTMLElement, square: string, orientation: 'white' | 'black') => {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const col = orientation === 'white' 
    ? files.indexOf(square[0]) 
    : 7 - files.indexOf(square[0]);
  const row = orientation === 'white' 
    ? 8 - parseInt(square[1]) 
    : parseInt(square[1]) - 1;

  const playingArea = boardEl.querySelector('.board-inner-playing-area') || boardEl;
  const boardRect = playingArea.getBoundingClientRect();
  const squareSize = boardRect.width / 8;
  const expectedX = boardRect.left + col * squareSize + squareSize / 2;
  const expectedY = boardRect.top + row * squareSize + squareSize / 2;

  let closestPiece: HTMLElement | null = null;
  let minDistance = Infinity;

  const pieces = boardEl.querySelectorAll('piece');
  pieces.forEach(p => {
    const pRect = p.getBoundingClientRect();
    const pCenterX = pRect.left + pRect.width / 2;
    const pCenterY = pRect.top + pRect.height / 2;
    const dist = Math.hypot(pCenterX - expectedX, pCenterY - expectedY);
    if (dist < minDistance && dist < squareSize) {
      minDistance = dist;
      closestPiece = p as HTMLElement;
    }
  });

  return closestPiece;
};

export default ChessBoard;
