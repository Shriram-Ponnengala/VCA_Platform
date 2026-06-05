// apps/web/src/components/chess/NagBadge.tsx
import React from 'react';

import type { MoveNode } from '@vca/types';

interface NagBadgeProps {
  node: MoveNode;
  orientation?: 'white' | 'black';
}

const NAG_MAP: Record<string, { label: string, color: string }> = {
  '!!': { label: '!!', color: 'var(--nag-brilliant, #1baba4)' },
  '!': { label: '!', color: 'var(--nag-good, #96b92a)' },
  '!?': { label: '!?', color: 'var(--nag-interesting, #f1a91e)' },
  '?!': { label: '?!', color: 'var(--nag-dubious, #ee6b24)' },
  '?': { label: '?', color: 'var(--nag-mistake, #df5353)' },
  '??': { label: '??', color: 'var(--nag-blunder, #ba3529)' },
  '=': { label: '=', color: 'var(--nag-equal, #8a8a8a)' },
  '∞': { label: '∞', color: 'var(--nag-unclear, #9333ea)' },
  '⩲': { label: '⩲', color: 'var(--nag-w-slightly-better, #4f46e5)' },
  '⩱': { label: '⩱', color: 'var(--nag-b-slightly-better, #06b6d4)' },
  '±': { label: '±', color: 'var(--nag-w-better, #2563eb)' },
  '∓': { label: '∓', color: 'var(--nag-b-better, #0891b2)' },
  '+-': { label: '+-', color: 'var(--nag-w-winning, #1d4ed8)' },
  '-+': { label: '-+', color: 'var(--nag-b-winning, #6d28d9)' }
};

function deriveToSquare(san: string, turn: 'w' | 'b') {
  if (san.startsWith('O-O-O')) return turn === 'w' ? 'c1' : 'c8';
  if (san.startsWith('O-O')) return turn === 'w' ? 'g1' : 'g8';
  const match = san.match(/[a-h][1-8]/g);
  return match ? match[match.length - 1] : '';
}

export const NagBadge: React.FC<NagBadgeProps> = ({ node, orientation = 'white' }) => {
  const glyphs = node.glyphs || [];
  const validGlyphs = glyphs.filter(g => NAG_MAP[g]);
  if (!validGlyphs.length) return null;
  
  const square = node.to || deriveToSquare(node.san, node.turn);
  
  if (!square || square.length < 2) {
    // FALLBACK DEBUG RENDER
    return (
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: 'white', color: 'red', padding: '10px', zIndex: 1000
      }}>
        Missing Square! SAN: "{node.san}" TO: "{node.to}"
      </div>
    );
  }

  const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0..7
  const rank = parseInt(square[1], 10) - 1; // 0..7
  
  const x = orientation === 'white' ? file : 7 - file;
  const y = orientation === 'white' ? 7 - rank : rank;
  
  const baseLeft = (x + 1) * 12.5;
  const baseTop = y * 12.5;

  return (
    <>
      {validGlyphs.map((nag, index) => {
        const nagData = NAG_MAP[nag];
        const horizontalOffset = index * 26;
        
        return (
          <div
            key={nag}
            style={{
              position: 'absolute',
              top: `${baseTop}%`,
              left: `calc(${baseLeft}% + ${horizontalOffset - (validGlyphs.length - 1) * 13}px)`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10000 + index,
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: nagData.color,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              border: '1.5px solid rgba(0, 0, 0, 0.4)'
            }}
          >
            {nagData.label}
          </div>
        );
      })}
    </>
  );
};
