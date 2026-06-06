// apps/web/src/components/chess/NagBadge.tsx
import React from 'react';
import type { MoveNode } from '@vca/types';

interface NagBadgeProps {
  node: MoveNode;
  orientation?: 'white' | 'black';
}

// Exact colors & symbols matching the reference image
const NAG_MAP: Record<string, { label: string; bg: string; fontSize: string }> = {
  '!!': { label: '!!', bg: '#7c3aed', fontSize: '15px' },   // Brilliant — purple
  '!':  { label: '!',  bg: '#16a34a', fontSize: '18px' },   // Good move — green
  '!?': { label: '!?', bg: '#2563eb', fontSize: '14px' },   // Interesting — blue
  '?!': { label: '?!', bg: '#d97706', fontSize: '14px' },   // Dubious — amber/gold
  '?':  { label: '?',  bg: '#ea580c', fontSize: '18px' },   // Mistake — orange
  '??': { label: '??', bg: '#dc2626', fontSize: '15px' },   // Blunder — red
  // positional (retain simple styling)
  '=':  { label: '=',  bg: '#8a8a8a', fontSize: '16px' },
  '∞':  { label: '∞',  bg: '#9333ea', fontSize: '16px' },
  '⩲':  { label: '⩲',  bg: '#4f46e5', fontSize: '14px' },
  '⩱':  { label: '⩱',  bg: '#06b6d4', fontSize: '14px' },
  '±':  { label: '±',  bg: '#2563eb', fontSize: '16px' },
  '∓':  { label: '∓',  bg: '#0891b2', fontSize: '16px' },
  '+-': { label: '+-', bg: '#1d4ed8', fontSize: '13px' },
  '-+': { label: '-+', bg: '#6d28d9', fontSize: '13px' },
};

function deriveToSquare(san: string, turn: 'w' | 'b') {
  if (san.startsWith('O-O-O')) return turn === 'w' ? 'c1' : 'c8';
  if (san.startsWith('O-O')) return turn === 'w' ? 'g1' : 'g8';
  const match = san.match(/[a-h][1-8]/g);
  return match ? match[match.length - 1] : '';
}

const BADGE_SIZE = 36; // px — circle diameter

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

  const x = orientation === 'white' ? file : 7 - file;
  const y = orientation === 'white' ? 7 - rank : rank;

  // Position badge at top-right corner of the destination square
  const squarePct = 12.5; // 100/8
  const left = (x + 1) * squarePct; // right edge of square (%)
  const top  =  y      * squarePct; // top edge of square (%)

  return (
    <>
      {validGlyphs.map((nag, index) => {
        const d = NAG_MAP[nag];
        const horizontalOffset = index * (BADGE_SIZE - 6); // slight overlap for multiple badges

        return (
          <div
            key={nag}
            style={{
              position: 'absolute',
              top: `${top}%`,
              left: `calc(${left}% + ${horizontalOffset - (validGlyphs.length - 1) * ((BADGE_SIZE - 6) / 2)}px)`,
              transform: 'translate(-50%, -40%)',
              zIndex: 10000 + index,

              /* Circle */
              width:  `${BADGE_SIZE}px`,
              height: `${BADGE_SIZE}px`,
              borderRadius: '50%',
              backgroundColor: d.bg,

              /* No border — as requested */
              border: 'none',
              outline: 'none',

              /* Symbol */
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: d.fontSize,
              fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
              letterSpacing: '-0.5px',
              lineHeight: '1',

              /* Subtle shadow for readability on any board */
              boxShadow: '0 2px 8px rgba(0,0,0,0.45)',

              /* Smooth appear */
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            {d.label}
          </div>
        );
      })}
    </>
  );
};
