import React from 'react';

interface CoachTimerRingProps {
  mode: 'countdown' | 'countup';
  displayMs: number;
  totalMs: number; // countdown target; ignored in countup mode
  timeLabel: string; // pre-formatted "MM:SS"
  size?: number;
  strokeWidth?: number;
  accentColor?: string; // coach customization override for the "normal" stage; amber/red stay universal warning colors
}

const RING_TRACK_COLOR = 'rgba(74, 32, 24, 0.1)'; // faint brand-foreground track for a light glass surface
const RING_COLOR_NORMAL = '#c8854a'; // brand orange
const RING_COLOR_AMBER = '#f59e0b';
const RING_COLOR_RED = '#ef4444';

// Color-stage cutoffs, expressed as the fraction of the ring still visible.
const AMBER_AT = 0.30;
const RED_AT = 0.10;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function CoachTimerRing({ mode, displayMs, totalMs, timeLabel, size = 76, strokeWidth = 6, accentColor }: CoachTimerRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // `visibleFraction` is the single source of truth the arc is drawn from:
  // 0 = ring fully empty, 1 = ring fully closed. Countdown drains it from 1 -> 0
  // (visibleFraction *is* time-remaining / total-time). Stopwatch has no total to
  // drain against, so instead it fills 0 -> 1 across each 60s lap and resets —
  // a moving indicator of elapsed time rather than a countdown.
  let visibleFraction: number;
  let colorStage: 'normal' | 'amber' | 'red';

  if (mode === 'countdown') {
    visibleFraction = totalMs > 0 ? clamp01(displayMs / totalMs) : 0;
    colorStage = visibleFraction < RED_AT ? 'red' : visibleFraction < AMBER_AT ? 'amber' : 'normal';
  } else {
    visibleFraction = (displayMs % 60000) / 60000;
    colorStage = 'normal';
  }

  const ringColor = colorStage === 'red' ? RING_COLOR_RED : colorStage === 'amber' ? RING_COLOR_AMBER : (accentColor || RING_COLOR_NORMAL);

  // Full circumference is the dash pattern; pushing strokeDashoffset forward hides
  // that much of the stroke. offset 0 => whole ring drawn, offset === circumference
  // => nothing drawn. -90deg rotation moves the seam to 12 o'clock so it reads like
  // a clock face draining/filling clockwise instead of starting at 3 o'clock.
  const dashOffset = circumference * (1 - visibleFraction);

  return (
    <div className="vca-timer-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="vca-timer-ring-svg">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={RING_TRACK_COLOR} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="vca-timer-ring-arc"
        />
      </svg>
      <span className="vca-timer-ring-label" style={{ fontSize: `${Math.max(9, size * 0.185)}px` }}>{timeLabel}</span>
    </div>
  );
}
