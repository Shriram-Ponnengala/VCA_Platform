import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  Volume2, VolumeX, X, ChevronDown, ChevronUp, Pencil, Star, Undo2, 
  Search, Smile, ThumbsUp, PartyPopper, Sparkles, HelpCircle,
  Maximize2, Minimize2, Scaling, Plus, Trash2, Check
} from 'lucide-react';
import { useEmojiPreferences } from '../../lib/hooks/useEmojiPreferences';

import { EmojiConfig, EMOJIS } from './emojis';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Smile },
  { id: 'reactions', label: 'Reactions', icon: Smile },
  { id: 'praise', label: 'Praise', icon: ThumbsUp },
  { id: 'surprise', label: 'Surprise', icon: PartyPopper },
  { id: 'fun', label: 'Fun', icon: Sparkles },
  { id: 'thinking', label: 'Thinking', icon: HelpCircle },
  { id: 'symbols', label: 'Symbols', icon: Star },
] as const;

// Web Audio API Synthesizer
let audioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSynthesizedSound(type: EmojiConfig['sound']) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    switch (type) {
      case 'thud':
        // heavy slamming impact sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.35);
        gainNode.gain.setValueAtTime(0.6, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
        
      case 'pop':
        // happy light sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
        
      case 'whoosh':
        // wave sound: sweeping pitch up with moderate decay
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.3);
        gainNode.gain.setValueAtTime(0.01, now);
        gainNode.gain.linearRampToValueAtTime(0.25, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
        
      case 'tone':
        // crying/sad: descending slide sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.55);
        gainNode.gain.setValueAtTime(0.35, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.55);
        osc.start(now);
        osc.stop(now + 0.55);
        break;
        
      case 'blips':
        // laughing: 3 quick cute beeps
        [0, 1, 2].forEach((i) => {
          const t = now + i * 0.1;
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = 'sine';
          o.frequency.setValueAtTime(450 + i * 80, t);
          g.gain.setValueAtTime(0.2, t);
          g.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
          o.start(t);
          o.stop(t + 0.08);
        });
        break;
        
      case 'snore':
        // soft sleeping snore
        osc.type = 'sine';
        // slow sweep up and down
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.linearRampToValueAtTime(130, now + 0.4);
        osc.frequency.linearRampToValueAtTime(100, now + 0.8);
        
        gainNode.gain.setValueAtTime(0.01, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.4);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        
        osc.start(now);
        osc.stop(now + 0.8);
        break;
    }
  } catch (err) {
    console.warn('Audio Synthesis Error:', err);
  }
}

interface ActiveReaction {
  id: string;
  x: number;
  y: number;
  config: EmojiConfig;
  size: number;
  isCombo?: boolean;
  comboIndex?: number;
}

interface ActiveParticle {
  id: string;
  x: number;
  y: number;
  glyph: string;
  tx: string;
  ty: string;
  scale: number;
  rotate: string;
  orbitAngle?: string;
  orbitRadius?: string;
  orbitRevAngle?: string;
  delay: string;
  duration: string;
  mode: EmojiConfig['particles']['mode'];
}

interface ActiveShockwave {
  id: string;
  x: number;
  y: number;
  size: number;
}

interface EmojiReactionsProps {
  boardWidth: number | null;
  isEmojiMode: boolean;
  onShake: (level: 'heavy' | 'medium' | 'light' | 'none') => void;
  // Allows parent to reference fire function if needed
  onRegisterFire?: (fireFn: (emoji: EmojiConfig, x?: number, y?: number) => void) => void;
  onClose: () => void;
}

export const EmojiReactions: React.FC<EmojiReactionsProps> = ({
  boardWidth,
  isEmojiMode,
  onShake,
  onRegisterFire,
  onClose
}) => {
  const {
    preferences,
    activeEmojis,
    favouriteEmojis,
    mostUsed,
    incrementUsage,
    toggleFavourite,
    updateFavourites,
    updateShortcut,
    addCustomEmoji,
    deleteEmoji,
    resetToDefaults
  } = useEmojiPreferences();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Add Custom Emoji Modal State ──
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGlyph, setNewGlyph] = useState('🔥');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'reactions' | 'praise' | 'surprise' | 'fun' | 'thinking' | 'symbols'>('reactions');
  const [newShortcut, setNewShortcut] = useState('');
  const [newSound, setNewSound] = useState<EmojiConfig['sound']>('pop');

  const handleAddEmojiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGlyph.trim()) return;
    const cleanGlyph = newGlyph.trim();
    const cleanName = (newName.trim() || 'Custom Emoji').toLowerCase();
    const cleanShortcut = newShortcut.trim().toUpperCase();
    const id = `custom_${Date.now()}`;

    const newEmojiConfig: EmojiConfig = {
      id,
      glyph: cleanGlyph,
      name: cleanName,
      shortcutKey: cleanShortcut,
      category: [newCategory],
      animation: 'giggle',
      shakeLevel: 'light',
      shock: false,
      burst: true,
      flash: 'none',
      sound: newSound,
      particles: {
        glyphs: [cleanGlyph, '✨', '⭐'],
        count: 12,
        mode: 'rise'
      }
    };

    addCustomEmoji(newEmojiConfig);
    if (cleanShortcut) {
      updateShortcut(id, cleanShortcut);
    }
    setIsAddModalOpen(false);
    setNewGlyph('🔥');
    setNewName('');
    setNewShortcut('');
  };

  // ── Resizing State (Resets to default state on reload/unmount) ──
  const DEFAULT_PANEL_WIDTH = 620;
  const DEFAULT_GRID_HEIGHT = 200;
  const [panelWidth, setPanelWidth] = useState<number>(DEFAULT_PANEL_WIDTH);
  const [gridHeight, setGridHeight] = useState<number>(DEFAULT_GRID_HEIGHT);
  const [isEnlarged, setIsEnlarged] = useState(false);

  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ startX: 0, startY: 0, startW: DEFAULT_PANEL_WIDTH, startH: DEFAULT_GRID_HEIGHT });

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: panelWidth,
      startH: gridHeight
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaX = moveEvent.clientX - resizeStartRef.current.startX;
      const deltaY = resizeStartRef.current.startY - moveEvent.clientY;

      const newWidth = Math.min(Math.max(resizeStartRef.current.startW + deltaX * 1.8, 380), 920);
      const newHeight = Math.min(Math.max(resizeStartRef.current.startH + deltaY * 1.5, 140), 480);

      setPanelWidth(newWidth);
      setGridHeight(newHeight);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [panelWidth, gridHeight]);

  const togglePanelSize = useCallback(() => {
    if (isEnlarged) {
      setPanelWidth(DEFAULT_PANEL_WIDTH);
      setGridHeight(DEFAULT_GRID_HEIGHT);
      setIsEnlarged(false);
    } else {
      setPanelWidth(780);
      setGridHeight(320);
      setIsEnlarged(true);
    }
  }, [isEnlarged]);
  
  const [selectedEmoji, setSelectedEmoji] = useState<EmojiConfig>(EMOJIS[0]);
  const [isMuted, setIsMuted] = useState(false);

  const filteredEmojis = React.useMemo(() => {
    let result = activeEmojis;
    if (activeCategory !== 'all') {
      result = result.filter(e => e.category?.includes(activeCategory as any));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(e => 
        e.name.toLowerCase().includes(q) || 
        e.glyph.includes(q) ||
        e.id.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeEmojis, activeCategory, searchQuery]);
  const [reactions, setReactions] = useState<ActiveReaction[]>([]);
  const [particles, setParticles] = useState<ActiveParticle[]>([]);
  const [shockwaves, setShockwaves] = useState<ActiveShockwave[]>([]);
  const [flashType, setFlashType] = useState<'white' | 'red' | 'none'>('none');
  const [comboCount, setComboCount] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  
  const lastTriggerRef = useRef<number>(0);
  const comboCountRef = useRef<number>(0);
  const comboTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Panel drag state ─────────────────────────────────────────────────────
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null);
  const isPanelDraggingRef = useRef(false);
  const panelDragStartRef = useRef({ mouseX: 0, mouseY: 0, panelX: 0, panelY: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const handlePanelDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isPanelDraggingRef.current = true;

    // Get current panel position to start from
    const rect = panelRef.current?.getBoundingClientRect();
    const startX = rect ? rect.left : e.clientX - 200;
    const startY = rect ? rect.top : e.clientY - 50;

    panelDragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panelX: startX,
      panelY: startY,
    };

    const onMove = (ev: MouseEvent) => {
      if (!isPanelDraggingRef.current) return;
      const dx = ev.clientX - panelDragStartRef.current.mouseX;
      const dy = ev.clientY - panelDragStartRef.current.mouseY;
      setPanelPos({
        x: panelDragStartRef.current.panelX + dx,
        y: panelDragStartRef.current.panelY + dy,
      });
    };

    const onUp = () => {
      isPanelDraggingRef.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  // Reset panel position and state when emoji mode is turned off
  useEffect(() => {
    if (!isEmojiMode) {
      setPanelPos(null);
      setIsExpanded(false);
      setIsEditing(false);
    }
  }, [isEmojiMode]);

  const handleShortcutChange = (id: string, e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const key = e.key.toUpperCase();
    if (key.match(/^[A-Z0-9]$/)) {
      updateShortcut(id, key);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      updateShortcut(id, '');
    }
  };

  // ── Grid drag-to-scroll state ────────────────────────────────────────────
  const gridRef = useRef<HTMLDivElement>(null);
  const isGridDraggingRef = useRef(false);
  const gridDragStartRef = useRef({ x: 0, y: 0, scrollTop: 0, scrollLeft: 0 });
  const isGridDraggedRef = useRef(false);

  const handleGridMouseDown = useCallback((e: React.MouseEvent) => {
    if (!gridRef.current) return;
    isGridDraggingRef.current = true;
    isGridDraggedRef.current = false;
    gridDragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollTop: gridRef.current.scrollTop,
      scrollLeft: gridRef.current.scrollLeft,
    };
    gridRef.current.style.cursor = 'grabbing';
    gridRef.current.style.userSelect = 'none';
  }, []);

  const handleGridMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isGridDraggingRef.current || !gridRef.current) return;
    const dy = e.clientY - gridDragStartRef.current.y;
    if (Math.abs(dy) > 5) {
      isGridDraggedRef.current = true;
    }
    gridRef.current.scrollTop = gridDragStartRef.current.scrollTop - dy;
  }, []);

  const handleGridMouseUpOrLeave = useCallback(() => {
    isGridDraggingRef.current = false;
    if (gridRef.current) {
      gridRef.current.style.cursor = '';
      gridRef.current.style.userSelect = '';
    }
  }, []);

  // Sound play handler
  const playSound = useCallback((soundType: EmojiConfig['sound']) => {
    if (isMuted) return;
    playSynthesizedSound(soundType);
  }, [isMuted]);

  // Main fire engine function
  const fire = useCallback((emoji: EmojiConfig, clickX?: number, clickY?: number) => {
    // Determine coordinates
    let baseX = 0;
    let baseY = 0;
    
    if (clickX !== undefined && clickY !== undefined) {
      baseX = clickX;
      baseY = clickY;
    } else {
      // center of the board
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        baseX = rect.width / 2;
        baseY = rect.height / 2;
      } else {
        const defaultWidth = boardWidth || 500;
        baseX = defaultWidth / 2;
        baseY = defaultWidth / 2;
      }
    }

    const currentWidth = boardWidth || 500;
    const emojiSize = (currentWidth / 8) * 2.7;

    // 1. Calculate Combo Counter
    const nowTime = Date.now();
    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
    }

    let currentCombo = 1;
    if (nowTime - lastTriggerRef.current < 1300) {
      currentCombo = comboCountRef.current + 1;
    } else {
      currentCombo = 1;
    }

    comboCountRef.current = currentCombo;
    setComboCount(currentCombo);
    setShowCombo(currentCombo > 1);
    lastTriggerRef.current = nowTime;

    comboTimerRef.current = setTimeout(() => {
      setShowCombo(false);
      setComboCount(0);
      comboCountRef.current = 0;
    }, 1300);

    // 2. Compute diagonal side offset for combos matching PROPOSED (SIDE FLOAT UP)
    const isCombo = currentCombo > 1;
    let comboOffsetX = 0;
    let comboOffsetY = 0;

    if (isCombo) {
      // Step sequentially along a diagonal line from bottom-left to top-right
      const maxSteps = 5;
      const stepIndex = (currentCombo - 1) % maxSteps;
      const diagFactor = stepIndex - (maxSteps - 1) / 2; // -2, -1, 0, 1, 2

      const stepDistX = Math.min(emojiSize * 0.45, 38);
      const stepDistY = Math.min(emojiSize * 0.55, 48);

      comboOffsetX = diagFactor * stepDistX;
      comboOffsetY = -diagFactor * stepDistY;
    }

    const x = baseX + comboOffsetX;
    const y = baseY + comboOffsetY;
    const reactionId = `${Date.now()}-${Math.random()}`;

    // 3. Add reaction emoji element
    // Combo emojis float upwards and fade out
    const reactionDuration = isCombo ? 1400 : (emoji.animation === 'slam' ? 1500 : 1200);
    setReactions((prev) => [
      ...prev,
      {
        id: reactionId,
        x,
        y,
        config: emoji,
        size: emojiSize,
        isCombo,
        comboIndex: currentCombo,
      }
    ]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== reactionId));
    }, reactionDuration);

    // 4. Play sound & update usage
    playSound(emoji.sound);
    incrementUsage(emoji.id);

    // 5. Shake effect
    if (emoji.shakeLevel !== 'none') {
      onShake(emoji.shakeLevel);
      setTimeout(() => onShake('none'), 500);
    }

    // 6. Flash effect
    if (emoji.flash !== 'none') {
      setFlashType(emoji.flash);
      setTimeout(() => setFlashType('none'), 150);
    }

    // 7. Shockwave
    if (emoji.shock) {
      const shockwaveId = `${Date.now()}-${Math.random()}`;
      const shockwaveSize = currentWidth * 0.45;
      setShockwaves((prev) => [...prev, { id: shockwaveId, x, y, size: shockwaveSize }]);
      setTimeout(() => {
        setShockwaves((prev) => prev.filter((s) => s.id !== shockwaveId));
      }, 600);
    }

    // 8. Generate Particles at the offset position
    const { glyphs, count, mode } = emoji.particles;
    const newParticles: ActiveParticle[] = [];

    if (isCombo) {
      const sparkles = ['✨', '⭐', '💫', '⚡'];
      for (let s = 0; s < 3; s++) {
        newParticles.push({
          id: `${Date.now()}-streak-${s}-${Math.random()}`,
          x: x - s * 10,
          y: y + s * 14,
          glyph: sparkles[s % sparkles.length],
          tx: `${35 + s * 20}px`,
          ty: `-${60 + s * 25}px`,
          scale: 0.6 + Math.random() * 0.4,
          rotate: '30deg',
          delay: `${s * 0.04}s`,
          duration: '1.0s',
          mode: 'rise',
        });
      }
    }

    for (let i = 0; i < count; i++) {
      const pId = `${Date.now()}-${i}-${Math.random()}`;
      const glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
      const sizeScale = 0.5 + Math.random() * 0.7; // random scaling
      const delay = `${Math.random() * 0.15}s`;
      const duration = `${0.8 + Math.random() * 0.6}s`;
      
      let tx = '0px';
      let ty = '0px';
      let rotate = '0deg';
      
      // mode calculations
      let orbitAngle = '0deg';
      let orbitRadius = '0px';
      let orbitRevAngle = '0deg';

      if (mode === 'burst') {
        const angle = Math.random() * Math.PI * 2;
        const distance = 40 + Math.random() * (currentWidth * 0.35);
        tx = `${Math.cos(angle) * distance}px`;
        ty = `${Math.sin(angle) * distance}px`;
        rotate = `${Math.random() * 360}deg`;
      } else if (mode === 'rain') {
        const spreadX = (Math.random() - 0.5) * emojiSize;
        tx = `${spreadX}px`;
        ty = `${100 + Math.random() * (currentWidth * 0.4)}px`;
        rotate = `${(Math.random() - 0.5) * 60}deg`;
      } else if (mode === 'rise') {
        const spreadX = (Math.random() - 0.5) * (emojiSize * 1.2);
        tx = `${spreadX}px`;
        ty = `-${100 + Math.random() * (currentWidth * 0.4)}px`;
        rotate = `${(Math.random() - 0.5) * 90}deg`;
      } else if (mode === 'orbit') {
        const spiralRotations = 1.5 + Math.random() * 2; // times around
        const radius = 30 + Math.random() * (currentWidth * 0.3);
        const startAngle = Math.random() * 360;
        const endAngle = startAngle + spiralRotations * 360;
        
        orbitAngle = `${endAngle}deg`;
        orbitRadius = `${radius}px`;
        orbitRevAngle = `${-endAngle}deg`;
        
        tx = '0px';
        ty = '0px';
        rotate = '0deg';
      }

      newParticles.push({
        id: pId,
        x,
        y,
        glyph,
        tx,
        ty,
        scale: sizeScale,
        rotate,
        orbitAngle: mode === 'orbit' ? orbitAngle : undefined,
        orbitRadius: mode === 'orbit' ? orbitRadius : undefined,
        orbitRevAngle: mode === 'orbit' ? orbitRevAngle : undefined,
        delay,
        duration,
        mode
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);
    
    // Cleanup particles
    setTimeout(() => {
      const ids = new Set(newParticles.map(p => p.id));
      setParticles((prev) => prev.filter(p => !ids.has(p.id)));
    }, 1500);

  }, [boardWidth, playSound, onShake]);

  // Register the fire function for parent access
  useEffect(() => {
    if (onRegisterFire) {
      onRegisterFire(fire);
    }
  }, [fire, onRegisterFire]);

  // Global keydown keyboard listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Check if typing in a text field
      const activeEl = document.activeElement;
      const isTyping = 
        activeEl?.tagName === 'INPUT' || 
        activeEl?.tagName === 'TEXTAREA' || 
        activeEl?.hasAttribute('contenteditable') ||
        (activeEl as HTMLElement)?.isContentEditable;
        
      if (isTyping) return;

      if (e.shiftKey) {
        const letter = e.key.toUpperCase();
        const codeLetter = e.code ? e.code.replace('Key', '').toUpperCase() : '';
        // Only match emojis that have a non-empty shortcutKey (single source of truth)
        const matched = activeEmojis.find(
          (em) => em.shortcutKey !== '' && (em.shortcutKey === letter || em.shortcutKey === codeLetter)
        );
        if (matched) {
          e.preventDefault();
          e.stopPropagation();
          fire(matched);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
    };
  }, [fire]);

  // Mouse click handler when emoji mode is active
  const handleBoardMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEmojiMode) return;
    e.preventDefault();
    e.stopPropagation();
    console.log('Emoji MouseDown triggered on overlay');

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    fire(selectedEmoji, x, y);
  };

  const handleBoardTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isEmojiMode) return;
    e.preventDefault();
    e.stopPropagation();
    console.log('Emoji TouchStart triggered on overlay');

    if (e.touches.length > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;

      fire(selectedEmoji, x, y);
    }
  };

  return (
    <>
      {/* 1. Transparent interactive overlay strictly inside ChessBoard wrapper */}
      <div 
        ref={containerRef}
        className="emoji-board-overlay"
        onMouseDown={handleBoardMouseDown}
        onTouchStart={handleBoardTouchStart}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 490,
          pointerEvents: isEmojiMode ? 'auto' : 'none',
          overflow: 'hidden',
          cursor: isEmojiMode ? 'crosshair' : 'default'
        }}
      >
        {/* Screen flash elements */}
        {flashType === 'white' && <div className="flash-screen flash-white" />}
        {flashType === 'red' && <div className="flash-screen flash-red" />}

        {/* Shockwave expanders */}
        {shockwaves.map((sw) => (
          <div
            key={sw.id}
            className="expanding-shockwave"
            style={{
              left: sw.x,
              top: sw.y,
              width: sw.size,
              height: sw.size,
            }}
          />
        ))}

        {/* Emojis reacting */}
        {reactions.map((r) => (
          <div
            key={r.id}
            className={`reacting-emoji ${r.isCombo ? 'emoji-combo-float' : `emoji-anim-${r.config.animation}`}`}
            style={{
              left: r.x,
              top: r.y,
              width: r.size,
              height: r.size,
              fontSize: `${r.size * 0.7}px`,
            }}
          >
            {r.config.glyph}
          </div>
        ))}

        {/* Active particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className={`reaction-particle particle-mode-${p.mode}`}
            style={{
              left: p.x,
              top: p.y,
              fontSize: `${22 * p.scale}px`,
              animationDelay: p.delay,
              animationDuration: p.duration,
              // css custom properties
              ['--tx' as any]: p.tx,
              ['--ty' as any]: p.ty,
              ['--target-scale' as any]: p.scale,
              ['--target-rotate' as any]: p.rotate,
              ['--orbit-angle' as any]: p.orbitAngle || '0deg',
              ['--orbit-radius' as any]: p.orbitRadius || '0px',
              ['--orbit-rev-angle' as any]: p.orbitRevAngle || '0deg',
            }}
          >
            {p.glyph}
          </div>
        ))}

        {/* Golden Diagonal Combo Light Beam */}
        {showCombo && comboCount > 1 && (
          <div className="emoji-combo-light-beam" />
        )}

        {/* Combo Counter UI */}
        {showCombo && comboCount > 1 && (
          <div key={comboCount} className="emoji-combo-badge animate-combo">
            COMBO x{comboCount}
          </div>
        )}
      </div>

      {/* 2. Floating Panel (Only visible if Emoji mode is active) */}
      {isEmojiMode && (
        <div
          ref={panelRef}
          className="emoji-floating-panel"
          data-emoji-panel="true"
          onWheel={(e) => e.stopPropagation()}
          style={{
            width: `${panelWidth}px`,
            ...(panelPos ? {
              position: 'fixed',
              left: panelPos.x,
              top: panelPos.y,
              bottom: 'auto',
              transform: 'none',
            } : {})
          }}
        >
          {/* Top-Right Corner Drag Resizer */}
          <div
            className="panel-corner-resizer"
            onMouseDown={handleResizeMouseDown}
            title="Drag to resize panel"
          >
            <Scaling size={13} />
          </div>

          {/* ── Drag handle (top centre) ── */}
          <div
            className="panel-drag-handle"
            onMouseDown={handlePanelDragStart}
            title="Drag to move"
          >
            <span className="drag-dots" />
          </div>

          {/* Header */}
          <div className="panel-header">
            <span className="panel-title">EMOJIS</span>
            <div className="header-actions">
              <button
                className={`icon-btn ${isSearchOpen ? 'active' : ''}`}
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  if (isSearchOpen) setSearchQuery('');
                }}
                title="Search Emojis"
              >
                <Search size={16} />
              </button>
              <button
                className={`icon-btn ${isEditing ? 'active' : ''}`}
                onClick={() => setIsEditing(!isEditing)}
                title={isEditing ? 'Exit Edit Mode' : 'Edit Favourites & Shortcuts'}
              >
                <Pencil size={16} />
              </button>
              <button 
                className={`icon-btn ${isMuted ? 'muted' : ''}`}
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <button
                className={`icon-btn ${isEnlarged ? 'active' : ''}`}
                onClick={togglePanelSize}
                title={isEnlarged ? 'Restore Default Size' : 'Resize / Enlarge Panel'}
              >
                {isEnlarged ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button 
                className="icon-btn close-btn"
                onClick={onClose}
                title="Close Emojis"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Search Row */}
          {isSearchOpen && (
            <div className="search-bar-row">
              <Search size={14} className="search-icon" />
              <input 
                type="text"
                placeholder="Search any emoji..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                autoFocus
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          {/* Category Tabs */}
          <div className="category-tabs-container">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  className={`category-tab ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCategory(cat.id);
                  }}
                >
                  <div className="tab-icon-wrapper">
                    <Icon size={18} />
                  </div>
                  <span className="tab-label">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Emoji Grid */}
          <div
            ref={gridRef}
            className="emoji-grid"
            style={{ maxHeight: `${gridHeight}px` }}
            onWheel={(e) => e.stopPropagation()}
            onMouseDown={handleGridMouseDown}
            onMouseMove={handleGridMouseMove}
            onMouseUp={handleGridMouseUpOrLeave}
            onMouseLeave={handleGridMouseUpOrLeave}
          >
            {filteredEmojis.map((emoji) => (
              <div key={emoji.id} className="emoji-grid-cell">
                {isEditing && (
                  <button
                    className="trash-btn"
                    onClick={(e) => { e.stopPropagation(); deleteEmoji(emoji.id); }}
                    title={`Delete ${emoji.name}`}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
                <button
                  className={`emoji-btn ${selectedEmoji.id === emoji.id ? 'selected' : ''} ${isEditing ? 'editing' : ''}`}
                  onClick={(e) => {
                    if (isGridDraggedRef.current) return;
                    if (isEditing) return;
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedEmoji(emoji);
                    fire(emoji);
                  }}
                  title={`${emoji.name}${emoji.shortcutKey ? ` (Shift+${emoji.shortcutKey})` : ''}`}
                >
                  <span className="emoji-glyph">{emoji.glyph}</span>
                  {isEditing ? (
                    <input
                      className="shortcut-input"
                      value={emoji.shortcutKey}
                      onChange={() => {}}
                      onKeyDown={(e) => handleShortcutChange(emoji.id, e)}
                      placeholder="-"
                      maxLength={1}
                    />
                  ) : (
                    emoji.shortcutKey && <span className="shortcut-badge">⇧{emoji.shortcutKey}</span>
                  )}
                </button>
                {isEditing && (
                  <button
                    className={`star-btn ${preferences.favourites.includes(emoji.id) ? 'starred' : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggleFavourite(emoji.id); }}
                    title={preferences.favourites.includes(emoji.id) ? 'Remove Favourite' : 'Mark Favourite'}
                  >
                    <Star size={11} fill={preferences.favourites.includes(emoji.id) ? 'currentColor' : 'none'} />
                  </button>
                )}
              </div>
            ))}

            {isEditing && (
              <div className="emoji-grid-cell add-emoji-cell">
                <button
                  className="emoji-btn add-btn"
                  onClick={() => setIsAddModalOpen(true)}
                  title="Add custom emoji"
                >
                  <Plus size={18} />
                  <span className="add-text">Add</span>
                </button>
              </div>
            )}

            {filteredEmojis.length === 0 && !isEditing && (
              <div className="no-emojis-found">
                No emojis found for "{searchQuery}"
              </div>
            )}
          </div>

          {isEditing && (
            <div className="edit-mode-footer">
              <div className="edit-info">
                <Pencil size={13} /> Edit mode: click 🗑️ to delete, ★ for favourites, remap shortcuts
              </div>
              <div className="edit-footer-actions">
                <button
                  className="add-emoji-action-btn"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus size={14} /> Add Emoji
                </button>
                <button
                  className="reset-defaults-action-btn"
                  onClick={() => resetToDefaults()}
                  title="Reset all emojis & shortcuts to defaults"
                >
                  <Undo2 size={14} /> Reset Defaults
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Custom Emoji Modal */}
      {isAddModalOpen && (
        <div className="add-emoji-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="add-emoji-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Emoji</h3>
              <button type="button" className="close-modal-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddEmojiSubmit} className="add-emoji-form">
              <div className="form-group">
                <label>Emoji Symbol / Glyph</label>
                <input
                  type="text"
                  className="form-input emoji-glyph-input"
                  value={newGlyph}
                  onChange={(e) => setNewGlyph(e.target.value)}
                  placeholder="e.g. 🚀"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rocket"
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Category</label>
                  <select
                    className="form-select"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                  >
                    <option value="reactions">Reactions</option>
                    <option value="praise">Praise</option>
                    <option value="surprise">Surprise</option>
                    <option value="fun">Fun</option>
                    <option value="thinking">Thinking</option>
                    <option value="symbols">Symbols</option>
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label>Shortcut Key</label>
                  <input
                    type="text"
                    className="form-input shortcut-input-field"
                    value={newShortcut}
                    onChange={(e) => setNewShortcut(e.target.value.toUpperCase())}
                    placeholder="e.g. K"
                    maxLength={1}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Sound Effect</label>
                <select
                  className="form-select"
                  value={newSound}
                  onChange={(e) => setNewSound(e.target.value as any)}
                >
                  <option value="pop">Pop (Happy/Light)</option>
                  <option value="blips">Blips (Beeps/Laughing)</option>
                  <option value="thud">Thud (Slam/Impact)</option>
                  <option value="whoosh">Whoosh (Sweep)</option>
                  <option value="tone">Tone (Melodic Slide)</option>
                  <option value="snore">Snore (Soft)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  <Plus size={16} /> Add Emoji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styled JSX for Premium Visuals and Glassmorphism */}
      <style>{`
        .emoji-board-overlay {
          user-select: none;
        }

        /* Flashes */
        .flash-screen {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 10;
          animation: fade-out-flash 0.15s ease-out forwards;
        }
        .flash-white {
          background: rgba(255, 255, 255, 0.55);
        }
        .flash-red {
          background: rgba(239, 68, 68, 0.45);
        }
        @keyframes fade-out-flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        /* Shockwaves */
        .expanding-shockwave {
          position: absolute;
          border: 4px solid rgba(255, 255, 255, 0.7);
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0);
          pointer-events: none;
          animation: shockwave-expand 0.55s cubic-bezier(0.1, 0.8, 0.25, 1) forwards;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.35);
        }
        @keyframes shockwave-expand {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
            border-width: 1px;
          }
        }

        /* Reacting Emojis */
        .reacting-emoji {
          position: absolute;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 5;
          text-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.25));
        }

        /* Emoji Animation Styles */
        .emoji-combo-float {
          animation: emoji-combo-float-anim 1.4s cubic-bezier(0.15, 0.85, 0.35, 1) forwards;
          filter: drop-shadow(0 0 10px #f59e0b) drop-shadow(0 0 20px #fbbf24) drop-shadow(0 4px 10px rgba(0,0,0,0.5)) !important;
        }
        @keyframes emoji-combo-float-anim {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) scale(0.4) rotate(-10deg);
            opacity: 0;
          }
          18% {
            transform: translate(-50%, -50%) translate(20px, -35px) scale(1.25) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) translate(65px, -110px) scale(1.06) rotate(6deg);
            opacity: 1;
          }
          80% {
            transform: translate(-50%, -50%) translate(110px, -185px) scale(0.9) rotate(3deg);
            opacity: 0.85;
          }
          100% {
            transform: translate(-50%, -50%) translate(145px, -245px) scale(0.75) rotate(0deg);
            opacity: 0;
          }
        }

        .emoji-combo-light-beam {
          position: absolute;
          top: 5%;
          right: 15%;
          width: 120px;
          height: 90%;
          background: linear-gradient(
            135deg,
            rgba(251, 191, 36, 0) 0%,
            rgba(251, 191, 36, 0.12) 30%,
            rgba(245, 158, 11, 0.28) 50%,
            rgba(251, 191, 36, 0.12) 70%,
            rgba(251, 191, 36, 0) 100%
          );
          transform: rotate(-35deg);
          pointer-events: none;
          z-index: 3;
          border-radius: 50px;
          filter: blur(14px);
          animation: combo-beam-pulse 0.8s ease-in-out infinite alternate;
        }
        @keyframes combo-beam-pulse {
          0% { opacity: 0.35; transform: rotate(-35deg) scaleX(0.85); }
          100% { opacity: 0.85; transform: rotate(-35deg) scaleX(1.15); }
        }
        .emoji-anim-slam {
          animation: emoji-slam 1.5s cubic-bezier(0.2, 0.9, 0.25, 1) forwards;
        }
        .emoji-anim-angry {
          animation: emoji-angry 0.8s ease-in-out infinite alternate;
        }
        .emoji-anim-giggle {
          animation: emoji-giggle 1.0s cubic-bezier(0.35, 1.6, 0.5, 1) forwards;
        }
        .emoji-anim-droop {
          animation: emoji-droop 1.2s ease-in forwards;
        }
        .emoji-anim-wag {
          animation: emoji-wag 0.8s ease-in-out infinite alternate;
        }
        .emoji-anim-bob {
          animation: emoji-bob 1.2s ease-in-out infinite alternate;
        }
        .emoji-anim-spin {
          animation: emoji-spin 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .emoji-anim-zip {
          animation: emoji-zip 1.0s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .emoji-anim-rise {
          animation: emoji-rise 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes emoji-slam {
          0% {
            transform: translate(-50%, -50%) translateY(-180px) scale(3.5);
            opacity: 0;
          }
          20% {
            transform: translate(-50%, -50%) translateY(0) scale(0.8);
            opacity: 1;
          }
          40% {
            transform: translate(-50%, -50%) translateY(-22px) scale(1.15);
          }
          60% {
            transform: translate(-50%, -50%) translateY(0) scale(0.9);
          }
          80% {
            transform: translate(-50%, -50%) translateY(-6px) scale(1.02);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
        }

        @keyframes emoji-angry {
          0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          12% { transform: translate(-50%, -50%) scale(1.08) rotate(-9deg); }
          25% { transform: translate(-50%, -50%) scale(1.08) rotate(9deg); }
          37% { transform: translate(-50%, -50%) scale(1.08) rotate(-9deg); }
          50% { transform: translate(-50%, -50%) scale(1.08) rotate(9deg); }
          75% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
        }

        @keyframes emoji-giggle {
          0% { transform: translate(-50%, -50%) translateY(0) scale(0.2); opacity: 0; }
          20% { transform: translate(-50%, -50%) translateY(-15px) rotate(-6deg) scale(1.15); opacity: 1; }
          40% { transform: translate(-50%, -50%) translateY(0) rotate(6deg) scale(0.95); }
          60% { transform: translate(-50%, -50%) translateY(-8px) rotate(-4deg) scale(1.08); }
          80% { transform: translate(-50%, -50%) translateY(0) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) translateY(-5px) scale(0.9); opacity: 0; }
        }

        @keyframes emoji-droop {
          0% { transform: translate(-50%, -50%) translateY(-30px) scale(0.5); opacity: 0; }
          20% { transform: translate(-50%, -50%) translateY(0) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) translateY(18px) scale(0.92) rotate(-5deg); opacity: 0.95; }
          100% { transform: translate(-50%, -50%) translateY(45px) scale(0.8); opacity: 0; }
        }

        @keyframes emoji-wag {
          0%, 100% { transform: translate(-50%, -50%) rotate(-12deg) scale(1); }
          50% { transform: translate(-50%, -50%) rotate(12deg) scale(1.1); }
        }

        @keyframes emoji-bob {
          0%, 100% { transform: translate(-50%, -50%) translateY(0) scale(0.95); }
          50% { transform: translate(-50%, -50%) translateY(-12px) scale(1.06); }
        }

        @keyframes emoji-spin {
          0%   { transform: translate(-50%, -50%) scale(0.4) rotate(0deg); opacity: 0; }
          15%  { transform: translate(-50%, -50%) scale(1.1) rotate(90deg); opacity: 1; }
          40%  { transform: translate(-50%, -50%) scale(1) rotate(180deg); }
          65%  { transform: translate(-50%, -50%) scale(1.05) rotate(270deg); }
          85%  { transform: translate(-50%, -50%) scale(0.95) rotate(360deg); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(0.7) rotate(400deg); opacity: 0; }
        }

        @keyframes emoji-zip {
          0%   { transform: translate(-50%, -50%) translateX(-60px) scale(0.5); opacity: 0; }
          15%  { transform: translate(-50%, -50%) translateX(0) scale(1.15); opacity: 1; }
          50%  { transform: translate(-50%, -50%) translateX(0) scale(1); opacity: 1; }
          80%  { transform: translate(-50%, -50%) translateX(50px) scale(0.85); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) translateX(80px) scale(0.6); opacity: 0; }
        }

        @keyframes emoji-rise {
          0%   { transform: translate(-50%, -50%) translateY(30px) scale(0.5); opacity: 0; }
          20%  { transform: translate(-50%, -50%) translateY(0) scale(1.05); opacity: 1; }
          60%  { transform: translate(-50%, -50%) translateY(-8px) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) translateY(-25px) scale(0.85); opacity: 0; }
        }

        /* Particle base */
        .reaction-particle {
          position: absolute;
          transform: translate(-50%, -50%) scale(0);
          pointer-events: none;
          z-index: 4;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          will-change: transform, opacity;
        }

        /* Particle modes */
        .particle-mode-burst {
          animation: particle-burst-anim 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .particle-mode-rain {
          animation: particle-rain-anim 1.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .particle-mode-rise {
          animation: particle-rise-anim 1.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .particle-mode-orbit {
          animation: particle-orbit-anim 1.3s cubic-bezier(0.1, 0.7, 0.25, 1) forwards;
        }

        @keyframes particle-burst-anim {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) scale(0);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(var(--target-scale)) rotate(var(--target-rotate));
            opacity: 0;
          }
        }

        @keyframes particle-rain-anim {
          0% {
            transform: translate(-50%, -50%) translate(var(--tx), -20px) scale(0);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(var(--target-scale)) rotate(var(--target-rotate));
            opacity: 0;
          }
        }

        @keyframes particle-rise-anim {
          0% {
            transform: translate(-50%, -50%) translate(var(--tx), 10px) scale(0);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(var(--target-scale)) rotate(var(--target-rotate));
            opacity: 0;
          }
        }

        @keyframes particle-orbit-anim {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) translate(0) rotate(0deg) scale(0);
            opacity: 0;
          }
          15% {
            opacity: 0.95;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--orbit-angle)) translate(var(--orbit-radius)) rotate(var(--orbit-rev-angle)) scale(var(--target-scale));
            opacity: 0;
          }
        }

        /* Combo Badge */
        .emoji-combo-badge {
          position: absolute;
          top: 15px;
          left: 15px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          font-weight: 800;
          font-size: 1.15rem;
          padding: 6px 14px;
          border-radius: 20px;
          box-shadow: 0 4px 15px rgba(217, 119, 6, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.25);
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          z-index: 100;
          pointer-events: none;
          font-family: var(--font-sans), sans-serif;
        }
        .animate-combo {
          animation: combo-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes combo-pop {
          0% { transform: scale(0.65) rotate(-6deg); opacity: 0; }
          50% { transform: scale(1.18) rotate(4deg); }
          100% { transform: scale(1) rotate(-3deg); opacity: 1; }
        }

        /* Floating Select Panel (Redesigned Warm Beige Aesthetic) */
        .emoji-floating-panel {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #FDFBF7;
          border: 1.5px solid #EADBCA;
          border-radius: 22px;
          padding: 18px 22px;
          width: 620px;
          max-width: 95vw;
          box-shadow: 0 16px 40px rgba(90, 60, 30, 0.14), 0 2px 10px rgba(0, 0, 0, 0.03);
          z-index: 600;
          display: flex;
          flex-direction: column;
          gap: 14px;
          font-family: var(--font-sans), system-ui, -apple-system, sans-serif;
          user-select: none;
          overflow: auto;
          min-width: 240px;
          min-height: 120px;
          box-sizing: border-box;
        }

        /* ── Top-Right Corner Drag Resizer ── */
        .panel-corner-resizer {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: nesw-resize;
          color: #A08C7C;
          background: transparent;
          transition: all 0.15s ease;
          z-index: 10;
        }
        .panel-corner-resizer:hover {
          background: #F4EDE2;
          color: #C86D3B;
          transform: scale(1.1);
        }

        /* ── Drag handle ── */
        .panel-drag-handle {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px 0 6px;
          cursor: grab;
          user-select: none;
          margin: -8px -8px 0;
        }
        .panel-drag-handle:active {
          cursor: grabbing;
        }
        .drag-dots {
          display: inline-block;
          width: 34px;
          height: 4px;
          background: #E0D4C5;
          border-radius: 4px;
          transition: background 0.15s;
        }
        .panel-drag-handle:hover .drag-dots {
          background: #C8B5A2;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 2px;
          flex-shrink: 0;
          flex-wrap: nowrap;
          gap: 8px;
        }

        .panel-title {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: #4A3728;
          text-transform: uppercase;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #F4EDE2;
          border: none;
          color: #7C6552;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .icon-btn:hover {
          background: #E9DEC9;
          color: #4A3728;
        }
        .icon-btn.active {
          background: #C86D3B;
          color: #FFFFFF;
        }
        .icon-btn.muted {
          color: #DC2626;
        }

        /* Search Bar */
        .search-bar-row {
          display: flex;
          align-items: center;
          background: #FFFFFF;
          border: 1.5px solid #EADBCA;
          border-radius: 14px;
          padding: 8px 14px;
          gap: 10px;
        }
        .search-icon {
          color: #A08C7C;
        }
        .search-input {
          border: none;
          outline: none;
          background: transparent;
          width: 100%;
          font-size: 13px;
          color: #4A3728;
        }
        .clear-search-btn {
          border: none;
          background: #F4EDE2;
          color: #7C6552;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        /* Category Tabs */
        .category-tabs-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          overflow-x: auto;
          padding: 2px 0;
        }

        .category-tab {
          flex: 1;
          min-width: 66px;
          background: transparent;
          border: none;
          padding: 8px 6px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #6E5A4B;
        }

        .category-tab:hover {
          background: #F2EAE0;
        }

        .category-tab.active {
          background: #C86D3B;
          color: #FFFFFF;
          box-shadow: 0 4px 14px rgba(200, 109, 59, 0.28);
        }

        .tab-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tab-label {
          font-size: 11px;
          font-weight: 600;
        }

        /* Emoji Grid */
        .emoji-grid {
          display: grid;
          grid-template-columns: repeat(8, minmax(52px, 1fr));
          gap: 8px;
          max-height: 260px;
          overflow-y: auto;
          overflow-x: auto;
          padding: 4px;
          scroll-behavior: smooth;
          /* Ensure the grid is at least wide enough to hold 8 columns at min-width */
          min-width: min-content;
        }

        .emoji-grid-cell {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .emoji-btn {
          width: 100%;
          height: 50px;
          background: #FFFFFF;
          border: 1.5px solid #EEE6DB;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          cursor: pointer;
          position: relative;
          transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 2px 6px rgba(100, 70, 40, 0.04);
        }

        .emoji-btn:hover:not(.editing) {
          transform: translateY(-2px) scale(1.06);
          border-color: #D8C6B2;
          box-shadow: 0 6px 14px rgba(100, 70, 40, 0.1);
        }

        .emoji-btn.selected {
          border: 2.5px solid #C86D3B;
          background: #FFFBF7;
          box-shadow: 0 4px 12px rgba(200, 109, 59, 0.2);
        }

        .shortcut-badge {
          position: absolute;
          bottom: 2px;
          right: 4px;
          font-size: 9px;
          font-weight: 700;
          color: #A08C7C;
          background: rgba(244, 237, 226, 0.9);
          padding: 1px 3px;
          border-radius: 4px;
        }

        .star-btn {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #FFFFFF;
          border: 1px solid #EADBCA;
          border-radius: 50%;
          color: #A08C7C;
          cursor: pointer;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          padding: 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .star-btn:hover, .star-btn.starred {
          color: #C86D3B;
          border-color: #C86D3B;
        }

        .shortcut-input {
          background: #F4EDE2;
          border: 1px solid #C86D3B;
          border-radius: 4px;
          color: #4A3728;
          font-size: 10px;
          font-weight: 700;
          text-align: center;
          width: 24px;
          height: 16px;
          padding: 0;
          position: absolute;
          bottom: 3px;
          right: 3px;
          text-transform: uppercase;
        }

        .no-emojis-found {
          grid-column: 1 / -1;
          text-align: center;
          padding: 24px;
          font-size: 13px;
          color: #7C6552;
        }

        .trash-btn {
          position: absolute;
          top: -4px;
          left: -4px;
          background: #FFFFFF;
          border: 1.5px solid #FCA5A5;
          border-radius: 50%;
          color: #EF4444;
          cursor: pointer;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          padding: 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: all 0.15s ease;
        }
        .trash-btn:hover {
          background: #EF4444;
          color: #FFFFFF;
          border-color: #EF4444;
          transform: scale(1.1);
        }

        .emoji-btn.add-btn {
          border: 2px dashed #C86D3B;
          background: #FAF0E4;
          color: #C86D3B;
          flex-direction: column;
          gap: 2px;
        }
        .emoji-btn.add-btn:hover {
          background: #F4EDE2;
          transform: translateY(-2px) scale(1.06);
        }
        .add-text {
          font-size: 10px;
          font-weight: 700;
        }

        .edit-mode-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #F4EDE2;
          border-radius: 12px;
          padding: 8px 14px;
          gap: 12px;
          font-size: 11px;
          color: #6E5A4B;
        }

        .edit-info {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
        }

        .edit-footer-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .add-emoji-action-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #C86D3B;
          color: #FFFFFF;
          border: none;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .add-emoji-action-btn:hover {
          background: #B55C2A;
        }

        .reset-defaults-action-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #FFFFFF;
          border: 1.5px solid #EADBCA;
          color: #7C6552;
          padding: 5px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .reset-defaults-action-btn:hover {
          background: #E9DEC9;
          color: #4A3728;
        }

        /* Add Emoji Modal Overlay */
        .add-emoji-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(45, 30, 20, 0.45);
          backdrop-filter: blur(4px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .add-emoji-modal {
          background: #FDFBF7;
          border: 1.5px solid #EADBCA;
          border-radius: 20px;
          width: 380px;
          max-width: 95vw;
          box-shadow: 0 20px 40px rgba(70, 45, 25, 0.2);
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          font-family: var(--font-sans), system-ui, sans-serif;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: #4A3728;
        }

        .close-modal-btn {
          border: none;
          background: #F4EDE2;
          color: #7C6552;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .add-emoji-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .form-group label {
          font-size: 11px;
          font-weight: 700;
          color: #6E5A4B;
        }

        .form-input, .form-select {
          background: #FFFFFF;
          border: 1.5px solid #EADBCA;
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 13px;
          color: #4A3728;
          outline: none;
        }
        .form-input:focus, .form-select:focus {
          border-color: #C86D3B;
        }

        .emoji-glyph-input {
          font-size: 22px;
          text-align: center;
        }

        .shortcut-input-field {
          text-transform: uppercase;
          text-align: center;
        }

        .form-row {
          display: flex;
          gap: 12px;
        }
        .flex-1 { flex: 1; }

        .modal-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 8px;
        }

        .btn-cancel {
          background: #F4EDE2;
          border: none;
          color: #7C6552;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-submit {
          background: #C86D3B;
          border: none;
          color: #FFFFFF;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }





        /* Custom scrollbar for emoji list */
        .emoji-grid::-webkit-scrollbar {
          width: 5px;
        }
        .emoji-grid::-webkit-scrollbar-track {
          background: #F4EDE2;
          border-radius: 3px;
        }
        .emoji-grid::-webkit-scrollbar-thumb {
          background: #C86D3B;
          border-radius: 3px;
        }

        /* Custom scrollbar for the panel itself (when resized small) */
        .emoji-floating-panel::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .emoji-floating-panel::-webkit-scrollbar-track {
          background: #F4EDE2;
          border-radius: 3px;
        }
        .emoji-floating-panel::-webkit-scrollbar-thumb {
          background: #C8A988;
          border-radius: 3px;
        }
        .emoji-floating-panel::-webkit-scrollbar-thumb:hover {
          background: #C86D3B;
        }
        .emoji-floating-panel::-webkit-scrollbar-corner {
          background: #F4EDE2;
        }
        
        @media (max-width: 540px) {
          .emoji-grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }
      `}</style>
    </>
  );
};
