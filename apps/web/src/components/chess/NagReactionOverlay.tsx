import React, { useEffect, useState } from 'react';

// ── Web Audio API sound synthesizer ──────────────────────────────────────────
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

function playBrilliantSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Magical ascending chord — sparkly & triumphant
    // Base ethereal shimmer
    const shimmerFreqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    shimmerFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);
      gain.gain.setValueAtTime(0, now + i * 0.04);
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.04 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.8);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.85);
    });

    // Sparkle high ping on top
    const ping = ctx.createOscillator();
    const pingGain = ctx.createGain();
    ping.connect(pingGain);
    pingGain.connect(ctx.destination);
    ping.type = 'sine';
    ping.frequency.setValueAtTime(2093, now + 0.1); // C7 — very high ping
    pingGain.gain.setValueAtTime(0.25, now + 0.1);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    ping.start(now + 0.1);
    ping.stop(now + 0.55);

  } catch (err) {
    console.warn('NAG sound error:', err);
  }
}

function playGoodSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Warm, positive two-note chime
    const freqs = [523.25, 783.99]; // C5, G5 — perfect 5th
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(0.22, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.55);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.6);
    });

  } catch (err) {
    console.warn('NAG sound error:', err);
  }
}

function playMistakeSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Descending disappointed tone — minor slide
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);           // A4
    osc.frequency.linearRampToValueAtTime(311.13, now + 0.5); // Eb4 — minor descent
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.65);

    // Subtle "thud" below
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(150, now + 0.05);
    thud.frequency.exponentialRampToValueAtTime(0.01, now + 0.3);
    thudGain.gain.setValueAtTime(0.18, now + 0.05);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    thud.start(now + 0.05);
    thud.stop(now + 0.35);

  } catch (err) {
    console.warn('NAG sound error:', err);
  }
}

function playBlunderSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Dramatic heavy crash — descending dissonant tones with a bass impact
    // Low rumbling thud
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(120, now);
    thud.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
    thudGain.gain.setValueAtTime(0.5, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    thud.start(now);
    thud.stop(now + 0.55);

    // Dissonant descending pair
    const descFreqs = [466.16, 369.99]; // Bb4, F#4 — tritone tension
    descFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + 0.05 + i * 0.05);
      osc.frequency.linearRampToValueAtTime(freq * 0.7, now + 0.6 + i * 0.05);
      gain.gain.setValueAtTime(0.12, now + 0.05 + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65 + i * 0.05);
      osc.start(now + 0.05 + i * 0.05);
      osc.stop(now + 0.7 + i * 0.05);
    });

    // Extra low boom for drama
    const boom = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boom.connect(boomGain);
    boomGain.connect(ctx.destination);
    boom.type = 'sine';
    boom.frequency.setValueAtTime(55, now + 0.05); // very deep A1
    boomGain.gain.setValueAtTime(0.4, now + 0.05);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    boom.start(now + 0.05);
    boom.stop(now + 0.75);

  } catch (err) {
    console.warn('NAG sound error:', err);
  }
}

// ── Types & Config ─────────────────────────────────────────────────────────────
interface NagConfig {
  id: string;
  label: string;
  shortcutKey: string;
  gradient: [string, string];
  animation: 'slam' | 'rise';
  fontSize: string;
  letterSpacing: string;
  playSound: () => void;
}

const NAGS: NagConfig[] = [
  {
    id: 'brilliant',
    label: '!!',
    shortcutKey: 'Digit1', // Shift + 1
    gradient: ['#8b5cf6', '#6d28d9'], // purple — Brilliant
    animation: 'slam',
    fontSize: '120px',
    letterSpacing: '-8px',
    playSound: playBrilliantSound,
  },
  {
    id: 'good',
    label: '!',
    shortcutKey: 'Digit2', // Shift + 2
    gradient: ['#22c55e', '#15803d'], // green — Good
    animation: 'rise',
    fontSize: '140px',
    letterSpacing: '0px',
    playSound: playGoodSound,
  },
  {
    id: 'mistake',
    label: '?',
    shortcutKey: 'Digit3', // Shift + 3
    gradient: ['#f97316', '#c2410c'], // orange — Mistake
    animation: 'rise',
    fontSize: '140px',
    letterSpacing: '0px',
    playSound: playMistakeSound,
  },
  {
    id: 'blunder',
    label: '??',
    shortcutKey: 'Digit4', // Shift + 4
    gradient: ['#ef4444', '#b91c1c'], // red — Blunder
    animation: 'slam',
    fontSize: '120px',
    letterSpacing: '-8px',
    playSound: playBlunderSound,
  }
];

interface ActiveNag {
  id: string;
  config: NagConfig;
  size: number;
}

interface NagReactionOverlayProps {
  boardWidth: number | null;
  onShake: (level: 'heavy' | 'medium' | 'light' | 'none') => void;
}

export const NagReactionOverlay: React.FC<NagReactionOverlayProps> = ({ boardWidth, onShake }) => {
  const [activeNags, setActiveNags] = useState<ActiveNag[]>([]);

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
        const code = e.code; // 'Digit1', 'Digit2', etc.
        const matched = NAGS.find((nag) => nag.shortcutKey === code);
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
  }, []);

  const fire = (config: NagConfig) => {
    const currentWidth = boardWidth || 500;
    // Scaled down by 1.3x from 0.55
    const size = currentWidth * 0.423; 
    const reactionId = `${Date.now()}-${Math.random()}`;

    setActiveNags((prev) => [...prev, { id: reactionId, config, size }]);

    // Play evaluation-specific sound
    config.playSound();

    if (config.animation === 'slam') {
      onShake('heavy');
      setTimeout(() => onShake('none'), 500);
    }

    setTimeout(() => {
      setActiveNags((prev) => prev.filter((r) => r.id !== reactionId));
    }, 1500);
  };

  return (
    <div 
      className="nag-reaction-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 510,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      {activeNags.map((nag) => (
        <div
          key={nag.id}
          className={`massive-nag anim-${nag.config.animation}`}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${nag.size}px`,
            height: `${nag.size}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle at 38% 32%, ${nag.config.gradient[0]}, ${nag.config.gradient[1]})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '900',
            fontFamily: "'Georgia', serif",
            fontSize: nag.config.fontSize,
            letterSpacing: nag.config.letterSpacing,
            lineHeight: '1',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)',
            WebkitTextStroke: '1px rgba(255,255,255,0.4)',
          }}
        >
          {nag.config.label}
        </div>
      ))}

      <style>{`
        .massive-nag {
          transform-origin: center center;
          /* Base transform centering handled by left: 50%, top: 50% and translate in keyframes */
        }

        .anim-slam {
          animation: massive-slam 1.5s cubic-bezier(0.2, 0.9, 0.25, 1) forwards;
        }

        .anim-rise {
          animation: massive-rise 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes massive-slam {
          0% {
            transform: translate(-50%, -50%) scale(3.5);
            opacity: 0;
            filter: blur(10px);
          }
          15% {
            transform: translate(-50%, -50%) scale(0.9);
            opacity: 1;
            filter: blur(0px);
          }
          25% {
            transform: translate(-50%, -50%) scale(1.05);
          }
          35% {
            transform: translate(-50%, -50%) scale(1);
          }
          85% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
          }
        }

        @keyframes massive-rise {
          0% {
            transform: translate(-50%, calc(-50% + 80px)) scale(0.5);
            opacity: 0;
            filter: blur(5px);
          }
          15% {
            transform: translate(-50%, -50%) scale(1.05);
            opacity: 1;
            filter: blur(0px);
          }
          30% {
            transform: translate(-50%, calc(-50% - 10px)) scale(1);
          }
          85% {
            transform: translate(-50%, calc(-50% - 20px)) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, calc(-50% - 40px)) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
