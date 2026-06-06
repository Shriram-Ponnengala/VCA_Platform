// apps/web/src/components/chess/NagBadge.tsx
import React from 'react';
import type { MoveNode } from '@vca/types';

interface NagBadgeProps {
  node: MoveNode;
  orientation?: 'white' | 'black';
}

// ── Badge designs matching the reference image ──────────────────────────────
// Each entry defines: the symbol displayed, the gradient colors, and an
// optional font-size override so the "!" / "?" glyphs appear slightly bigger.
const NAG_BOARD: Record<string, {
  label: string;
  gradient: [string, string];
  fontSize?: string;
  letterSpacing?: string;
}> = {
  '!!': {
    label: '!!',
    gradient: ['#8b5cf6', '#6d28d9'],   // purple — Brilliant
    fontSize: '26px',
    letterSpacing: '-1.5px',
  },
  '!': {
    label: '!',
    gradient: ['#22c55e', '#15803d'],   // green — Good
    fontSize: '30px',
  },
  '!?': {
    label: '!?',
    gradient: ['#3b82f6', '#1d4ed8'],   // blue — Interesting
    fontSize: '23px',
    letterSpacing: '-0.5px',
  },
  '?!': {
    label: '?!',
    gradient: ['#f59e0b', '#b45309'],   // gold — Dubious
    fontSize: '23px',
    letterSpacing: '-0.5px',
  },
  '?': {
    label: '?',
    gradient: ['#f97316', '#c2410c'],   // orange — Mistake
    fontSize: '30px',
  },
  '??': {
    label: '??',
    gradient: ['#ef4444', '#b91c1c'],   // red — Blunder
    fontSize: '24px',
    letterSpacing: '-1.5px',
  },
  // positional glyphs — smaller pill, neutral grey
  '=':  { label: '=',  gradient: ['#6b7280', '#4b5563'] },
  '∞':  { label: '∞',  gradient: ['#9333ea', '#7e22ce'] },
  '⩲':  { label: '⩲', gradient: ['#4f46e5', '#3730a3'] },
  '⩱':  { label: '⩱', gradient: ['#06b6d4', '#0e7490'] },
  '±':  { label: '±',  gradient: ['#2563eb', '#1e40af'] },
  '∓':  { label: '∓',  gradient: ['#0891b2', '#0e7490'] },
  '+-': { label: '+-', gradient: ['#1d4ed8', '#1e3a8a'] },
  '-+': { label: '-+', gradient: ['#6d28d9', '#4c1d95'] },
};

// ── Square → board position ──────────────────────────────────────────────────
function deriveToSquare(san: string, turn: 'w' | 'b') {
  if (san.startsWith('O-O-O')) return turn === 'w' ? 'c1' : 'c8';
  if (san.startsWith('O-O'))   return turn === 'w' ? 'g1' : 'g8';
  const match = san.match(/[a-h][1-8]/g);
  return match ? match[match.length - 1] : '';
}

// ── Component ────────────────────────────────────────────────────────────────
export const NagBadge: React.FC<NagBadgeProps> = ({ node, orientation = 'white' }) => {
  const glyphs = node.glyphs || [];
  const validGlyphs = glyphs.filter(g => NAG_BOARD[g]);
  if (!validGlyphs.length) return null;

  const square = node.to || deriveToSquare(node.san, node.turn);

  if (!square || square.length < 2) {
    return (
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white', color: 'red', padding: '8px', zIndex: 1000,
      }}>
        Missing Square: &quot;{node.san}&quot;
      </div>
    );
  }

  const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0..7
  const rank = parseInt(square[1], 10) - 1;               // 0..7

  const x = orientation === 'white' ? file     : 7 - file;
  const y = orientation === 'white' ? 7 - rank : rank;

  // Position: top-right corner of the target square
  const baseLeft = (x + 1) * 12.5;  // right edge of square (%)
  const baseTop  = y * 12.5;         // top edge of square (%)

  const BADGE_SIZE = 34; // px

  return (
    <>
      {validGlyphs.map((nag, index) => {
        const d = NAG_BOARD[nag];
        // Stack multiple badges horizontally, anchored to top-right of square
        const offsetX = index * (BADGE_SIZE + 3);

        return (
          <div
            key={nag}
            style={{
              position: 'absolute',
              // Anchor to top-right corner of the square, offset badge centre
              top:  `calc(${baseTop}% - ${BADGE_SIZE / 2}px)`,
              left: `calc(${baseLeft}% - ${BADGE_SIZE / 2}px + ${offsetX}px)`,
              zIndex: 10000 + index,

              // Circle
              width:        `${BADGE_SIZE}px`,
              height:       `${BADGE_SIZE}px`,
              borderRadius: '50%',

              // Gradient fill — NO border
              background: `radial-gradient(circle at 38% 32%, ${d.gradient[0]}, ${d.gradient[1]})`,
              border:     'none',

              // Text
              color:          '#fff',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontWeight:     '900',
              fontFamily:     "'Georgia', serif",
              fontSize:       d.fontSize ?? '14px',
              letterSpacing:  d.letterSpacing ?? '0',
              lineHeight:     '1',
              userSelect:     'none',

              // Depth
              boxShadow: '0 3px 10px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.3)',

              // Subtle inner highlight
              WebkitTextStroke: '0.2px rgba(255,255,255,0.3)',
            }}
          >
            {d.label}
          </div>
        );
      })}
    </>
  );
};
