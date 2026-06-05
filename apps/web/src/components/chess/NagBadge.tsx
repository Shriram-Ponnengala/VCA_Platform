// apps/web/src/components/chess/NagBadge.tsx
import React from 'react';

import type { MoveNode } from '@vca/types';

interface NagBadgeProps {
  node: MoveNode;
  orientation?: 'white' | 'black';
}

// On-board badge visual config — matches the reference image
const NAG_BADGE: Record<string, {
  symbol: string;
  bg: string;
  shadow: string;
  fontSize: string;
}> = {
  '!!': {
    symbol: '!!',
    bg: 'radial-gradient(circle at 38% 32%, #a855f7 0%, #7c3aed 55%, #5b21b6 100%)',
    shadow: 'rgba(124, 58, 237, 0.6)',
    fontSize: '13px',
  },
  '!': {
    symbol: '!',
    bg: 'radial-gradient(circle at 38% 32%, #22c55e 0%, #16a34a 55%, #15803d 100%)',
    shadow: 'rgba(22, 163, 74, 0.6)',
    fontSize: '18px',
  },
  '!?': {
    symbol: '!?',
    bg: 'radial-gradient(circle at 38% 32%, #38bdf8 0%, #0284c7 55%, #0369a1 100%)',
    shadow: 'rgba(2, 132, 199, 0.6)',
    fontSize: '12px',
  },
  '?!': {
    symbol: '?!',
    bg: 'radial-gradient(circle at 38% 32%, #fbbf24 0%, #d97706 55%, #b45309 100%)',
    shadow: 'rgba(217, 119, 6, 0.6)',
    fontSize: '12px',
  },
  '?': {
    symbol: '?',
    bg: 'radial-gradient(circle at 38% 32%, #fb923c 0%, #ea580c 55%, #c2410c 100%)',
    shadow: 'rgba(234, 88, 12, 0.6)',
    fontSize: '18px',
  },
  '??': {
    symbol: '??',
    bg: 'radial-gradient(circle at 38% 32%, #f87171 0%, #dc2626 55%, #991b1b 100%)',
    shadow: 'rgba(220, 38, 38, 0.6)',
    fontSize: '13px',
  },
  // Positional symbols
  '=':  { symbol: '=',  bg: 'radial-gradient(circle at 38% 32%, #9ca3af 0%, #6b7280 100%)', shadow: 'rgba(107,114,128,0.5)', fontSize: '15px' },
  '∞':  { symbol: '∞',  bg: 'radial-gradient(circle at 38% 32%, #c084fc 0%, #9333ea 100%)', shadow: 'rgba(147,51,234,0.5)', fontSize: '15px' },
  '⩲':  { symbol: '⩲',  bg: 'radial-gradient(circle at 38% 32%, #818cf8 0%, #4f46e5 100%)', shadow: 'rgba(79,70,229,0.5)', fontSize: '13px' },
  '⩱':  { symbol: '⩱',  bg: 'radial-gradient(circle at 38% 32%, #22d3ee 0%, #06b6d4 100%)', shadow: 'rgba(6,182,212,0.5)', fontSize: '13px' },
  '±':  { symbol: '±',  bg: 'radial-gradient(circle at 38% 32%, #60a5fa 0%, #2563eb 100%)', shadow: 'rgba(37,99,235,0.5)', fontSize: '15px' },
  '∓':  { symbol: '∓',  bg: 'radial-gradient(circle at 38% 32%, #22d3ee 0%, #0891b2 100%)', shadow: 'rgba(8,145,178,0.5)', fontSize: '15px' },
  '+-': { symbol: '+-', bg: 'radial-gradient(circle at 38% 32%, #3b82f6 0%, #1d4ed8 100%)', shadow: 'rgba(29,78,216,0.5)', fontSize: '11px' },
  '-+': { symbol: '-+', bg: 'radial-gradient(circle at 38% 32%, #a78bfa 0%, #6d28d9 100%)', shadow: 'rgba(109,40,217,0.5)', fontSize: '11px' },
};

function deriveToSquare(san: string, turn: 'w' | 'b') {
  if (san.startsWith('O-O-O')) return turn === 'w' ? 'c1' : 'c8';
  if (san.startsWith('O-O')) return turn === 'w' ? 'g1' : 'g8';
  const match = san.match(/[a-h][1-8]/g);
  return match ? match[match.length - 1] : '';
}

export const NagBadge: React.FC<NagBadgeProps> = ({ node, orientation = 'white' }) => {
  const glyphs = node.glyphs || [];
  const validGlyphs = glyphs.filter(g => NAG_BADGE[g]);
  if (!validGlyphs.length) return null;

  const square = node.to || deriveToSquare(node.san, node.turn);

  if (!square || square.length < 2) {
    return (
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: 'white', color: 'red', padding: '10px', zIndex: 1000
      }}>
        Missing Square! SAN: &quot;{node.san}&quot; TO: &quot;{node.to}&quot;
      </div>
    );
  }

  const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0..7
  const rank = parseInt(square[1], 10) - 1;               // 0..7

  const x = orientation === 'white' ? file : 7 - file;
  const y = orientation === 'white' ? 7 - rank : rank;

  // Position badge at top-right corner of the destination square
  const baseLeft = (x + 1) * 12.5; // right edge %
  const baseTop  = y * 12.5;        // top edge %

  const BADGE_SIZE = 32;

  return (
    <>
      {validGlyphs.map((nag, index) => {
        const cfg = NAG_BADGE[nag];
        const offset = index * (BADGE_SIZE + 2);

        return (
          <div
            key={nag}
            style={{
              position: 'absolute',
              top: `${baseTop}%`,
              left: `calc(${baseLeft}% - ${BADGE_SIZE / 2}px + ${offset}px)`,
              transform: 'translate(-50%, -30%)',
              zIndex: 10000 + index,
              width: `${BADGE_SIZE}px`,
              height: `${BADGE_SIZE}px`,
              borderRadius: '50%',
              background: cfg.bg,
              // Glossy inner highlight + drop shadow
              boxShadow: `0 0 0 2.5px rgba(255,255,255,0.3) inset, 0 4px 10px ${cfg.shadow}, 0 1px 3px rgba(0,0,0,0.5)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: '900',
              fontSize: cfg.fontSize,
              fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
              letterSpacing: '-0.5px',
              userSelect: 'none',
              pointerEvents: 'none',
              lineHeight: 1,
            }}
          >
            {cfg.symbol}
          </div>
        );
      })}
    </>
  );
};
