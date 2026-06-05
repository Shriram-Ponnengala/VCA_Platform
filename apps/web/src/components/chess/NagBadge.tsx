// apps/web/src/components/chess/NagBadge.tsx
import React from 'react';
import type { MoveNode } from '@vca/types';

interface NagBadgeProps {
  node: MoveNode;
  orientation?: 'white' | 'black';
}

// Matches the reference image exactly
const NAG_MAP: Record<string, {
  label: string;
  bg: string;       // circle fill gradient
  glow: string;     // drop shadow color
  textColor: string;
}> = {
  '!!': {
    label: '!!',
    bg: 'radial-gradient(circle at 38% 38%, #8b5cf6, #6d28d9)',
    glow: 'rgba(109, 40, 217, 0.7)',
    textColor: '#fff',
  },
  '!': {
    label: '!',
    bg: 'radial-gradient(circle at 38% 38%, #34d399, #059669)',
    glow: 'rgba(5, 150, 105, 0.7)',
    textColor: '#fff',
  },
  '!?': {
    label: '!?',
    bg: 'radial-gradient(circle at 38% 38%, #60a5fa, #2563eb)',
    glow: 'rgba(37, 99, 235, 0.7)',
    textColor: '#fff',
  },
  '?!': {
    label: '?!',
    bg: 'radial-gradient(circle at 38% 38%, #fcd34d, #d97706)',
    glow: 'rgba(217, 119, 6, 0.7)',
    textColor: '#fff',
  },
  '?': {
    label: '?',
    bg: 'radial-gradient(circle at 38% 38%, #fb923c, #ea580c)',
    glow: 'rgba(234, 88, 12, 0.7)',
    textColor: '#fff',
  },
  '??': {
    label: '??',
    bg: 'radial-gradient(circle at 38% 38%, #f87171, #dc2626)',
    glow: 'rgba(220, 38, 38, 0.7)',
    textColor: '#fff',
  },
  // Position evals – smaller, neutral style
  '=':  { label: '=',  bg: 'radial-gradient(circle at 38% 38%, #9ca3af, #6b7280)', glow: 'rgba(107,114,128,0.5)', textColor: '#fff' },
  '∞':  { label: '∞',  bg: 'radial-gradient(circle at 38% 38%, #c084fc, #9333ea)', glow: 'rgba(147,51,234,0.5)', textColor: '#fff' },
  '⩲':  { label: '⩲',  bg: 'radial-gradient(circle at 38% 38%, #818cf8, #4f46e5)', glow: 'rgba(79,70,229,0.5)', textColor: '#fff' },
  '⩱':  { label: '⩱',  bg: 'radial-gradient(circle at 38% 38%, #38bdf8, #0284c7)', glow: 'rgba(2,132,199,0.5)', textColor: '#fff' },
  '±':  { label: '±',  bg: 'radial-gradient(circle at 38% 38%, #60a5fa, #1d4ed8)', glow: 'rgba(29,78,216,0.5)', textColor: '#fff' },
  '∓':  { label: '∓',  bg: 'radial-gradient(circle at 38% 38%, #22d3ee, #0e7490)', glow: 'rgba(14,116,144,0.5)', textColor: '#fff' },
  '+-': { label: '+-', bg: 'radial-gradient(circle at 38% 38%, #93c5fd, #1e40af)', glow: 'rgba(30,64,175,0.5)', textColor: '#fff' },
  '-+': { label: '-+', bg: 'radial-gradient(circle at 38% 38%, #a78bfa, #5b21b6)', glow: 'rgba(91,33,182,0.5)', textColor: '#fff' },
};

function deriveToSquare(san: string, turn: 'w' | 'b') {
  if (san.startsWith('O-O-O')) return turn === 'w' ? 'c1' : 'c8';
  if (san.startsWith('O-O'))   return turn === 'w' ? 'g1' : 'g8';
  const match = san.match(/[a-h][1-8]/g);
  return match ? match[match.length - 1] : '';
}

export const NagBadge: React.FC<NagBadgeProps> = ({ node, orientation = 'white' }) => {
  const glyphs = node.glyphs || [];
  const validGlyphs = glyphs.filter(g => NAG_MAP[g]);
  if (!validGlyphs.length) return null;

  const square = node.to || deriveToSquare(node.san, node.turn);

  if (!square || square.length < 2) {
    return (
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white', color: 'red', padding: '10px', zIndex: 1000
      }}>
        Missing Square! SAN: "{node.san}" TO: "{node.to}"
      </div>
    );
  }

  const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0..7
  const rank = parseInt(square[1], 10) - 1;               // 0..7

  const x = orientation === 'white' ? file     : 7 - file;
  const y = orientation === 'white' ? 7 - rank : rank;

  const baseLeft = (x + 1) * 12.5;
  const baseTop  = y * 12.5;

  return (
    <>
      {validGlyphs.map((nag, index) => {
        const n = NAG_MAP[nag];
        const horizontalOffset = index * 30;
        const isLong = nag.length > 1; // !!, ??, !?, ?!
        const size = 36;

        return (
          <div
            key={nag}
            style={{
              position: 'absolute',
              top: `${baseTop}%`,
              left: `calc(${baseLeft}% + ${horizontalOffset - (validGlyphs.length - 1) * 15}px)`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10000 + index,
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              background: n.bg,
              color: n.textColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: isLong ? '13px' : '17px',
              fontFamily: '"Inter", "Segoe UI", sans-serif',
              letterSpacing: isLong ? '-0.5px' : '0',
              boxShadow: `0 0 0 2.5px rgba(255,255,255,0.55), 0 4px 12px ${n.glow}, 0 1px 3px rgba(0,0,0,0.4)`,
              userSelect: 'none',
              pointerEvents: 'none',
              lineHeight: 1,
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            {n.label}
          </div>
        );
      })}
    </>
  );
};
