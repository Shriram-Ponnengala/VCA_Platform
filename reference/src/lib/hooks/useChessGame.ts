
import { useState, useCallback, useMemo } from 'react';
import { Chess, SQUARES } from 'chess.js';

export function useChessGame() {
  // Use a string (FEN) as the primary state to ensure perfect React reactivity
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

  // Derive the game object from the FEN
  const game = useMemo(() => new Chess(fen), [fen]);

  const makeMove = useCallback((move: any) => {
    try {
      const gameCopy = new Chess(fen);
      const result = gameCopy.move(move);
      
      if (result) {
        setFen(gameCopy.fen());
        return result;
      }
      return null;
    } catch (e) {
      return null;
    }
  }, [fen]);

  const dests = useMemo(() => {
    const d = new Map<string, string[]>();
    SQUARES.forEach(s => {
      const ms = game.moves({ square: s as any, verbose: true });
      if (ms.length) d.set(s, ms.map(m => m.to));
    });
    return d;
  }, [game]);

  const resetGame = useCallback(() => {
    setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  }, []);

  return { 
    game, 
    makeMove, 
    fen,
    dests,
    resetGame
  };
}
