'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  ChevronsLeft, 
  ChevronLeft, 
  ChevronsRight, 
  Loader2 
} from 'lucide-react';
import { parsePgnToMoveTree } from '@/features/database/pgnUtils';
import { MoveNode } from '@vca/types';

interface GameCardProps {
  game: {
    id: string;
    orderIndex: number;
    chapterName: string;
    result: string | null;
    initialFen: string | null;
    headers?: any;
  };
  idx: number;
  onLoadPgn: (pgn: string) => void;
  onLoadFen?: (fen: string) => void;
  isStudent?: boolean;
  isShared?: boolean;
  onContextMenu?: (e: React.MouseEvent, gameId: string, name: string) => void;
}

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// A lightweight, high-performance HTML/CSS Chessboard thumbnail
function BoardThumbnail({ fen }: { fen: string }) {
  const board = useMemo(() => {
    const boardPart = (fen || START_FEN).split(' ')[0];
    const ranks = boardPart.split('/');
    const tempBoard: (string | null)[][] = [];

    for (let r = 0; r < 8; r++) {
      const row: (string | null)[] = [];
      const rankStr = ranks[r] || '8';
      for (let c = 0; c < rankStr.length; c++) {
        const char = rankStr[c];
        if (/\d/.test(char)) {
          const emptyCount = parseInt(char, 10);
          for (let e = 0; e < emptyCount; e++) {
            row.push(null);
          }
        } else {
          row.push(char);
        }
      }
      tempBoard.push(row);
    }
    return tempBoard;
  }, [fen]);

  const getPieceUrl = (char: string) => {
    const color = char === char.toUpperCase() ? 'w' : 'b';
    const type = char.toUpperCase();
    return `https://lichess1.org/assets/_L5MIdy/piece/cburnett/${color}${type}.svg`;
  };

  return (
    <div className="mini-chessboard">
      {board.map((row, rIdx) => 
        row.map((piece, cIdx) => {
          const isLight = (rIdx + cIdx) % 2 === 0;
          const bg = isLight ? '#eedcd0' : '#c8854a';
          return (
            <div 
              key={`${rIdx}-${cIdx}`}
              className="mini-square"
              style={{ backgroundColor: bg }}
            >
              {piece && (
                <img 
                  src={getPieceUrl(piece)} 
                  alt={piece}
                  className="mini-piece"
                />
              )}
            </div>
          );
        })
      )}
      <style jsx>{`
        .mini-chessboard {
          width: 140px;
          height: 140px;
          display: grid;
          grid-template-columns: repeat(8, 12.5%);
          grid-template-rows: repeat(8, 12.5%);
          border: 1.5px solid #eedcd0;
          border-radius: 6px;
          overflow: hidden;
          user-select: none;
          flex-shrink: 0;
        }
        .mini-square {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          width: 100%;
          height: 100%;
        }
        .mini-piece {
          width: 92%;
          height: 92%;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

export default function GameCard({ game, idx, onLoadPgn, onLoadFen, isStudent, isShared, onContextMenu }: GameCardProps) {
  const [isPgnOpen, setIsPgnOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Game data state
  const [fullPgn, setFullPgn] = useState<string | null>(null);
  const [mainline, setMainline] = useState<MoveNode[]>([]);
  const [startFen, setStartFen] = useState(game.initialFen || START_FEN);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1); // -1 = start position

  // Headers extraction
  const headers = game.headers || {};
  const white = headers.White || '';
  const black = headers.Black || '';
  const gameTitle = white && black ? `${white} - ${black}` : game.chapterName;

  const dateStr = headers.Date || '????.??.??';
  const siteStr = headers.Site ? `, ${headers.Site}` : '';
  const eventStr = headers.Event && headers.Event !== '?' && headers.Event !== 'Untitled' ? ` (${headers.Event})` : '';
  const subtitle = `${dateStr}${siteStr}${eventStr}`;

  // Fetch and parse PGN details
  const fetchAndParseGame = async () => {
    setLoading(true);
    setHasError(false);
    try {
      const res = await fetch(`/api/database/games/${game.id}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setFullPgn(data.pgn || '');

      const parsed = parsePgnToMoveTree(data.pgn || '');
      const nodes = parsed.nodes || {};
      const rootId = parsed.rootId || 'root';

      const rootNode = nodes[rootId];
      if (rootNode) {
        setStartFen(rootNode.fen || game.initialFen || START_FEN);
      }

      // Build mainline moves
      const tempMainline: MoveNode[] = [];
      let currId = rootId;
      while (nodes[currId] && nodes[currId].children && nodes[currId].children.length > 0) {
        const nextId = nodes[currId].children[0];
        const nextNode = nodes[nextId];
        if (!nextNode) break;
        tempMainline.push(nextNode);
        currId = nextId;
      }
      setMainline(tempMainline);
    } catch (e) {
      console.error('Failed to load PGN details:', e);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  // Toggle PGN expanded state
  const handleTogglePgn = () => {
    const nextState = !isPgnOpen;
    setIsPgnOpen(nextState);
    if (nextState && !fullPgn) {
      fetchAndParseGame();
    }
  };

  // Determine current active FEN for thumbnail
  const activeFen = useMemo(() => {
    if (currentMoveIndex === -1) {
      return startFen;
    }
    const move = mainline[currentMoveIndex];
    return move ? move.fen : startFen;
  }, [currentMoveIndex, startFen, mainline]);

  // Navigate board thumbnail
  const goFirst = () => setCurrentMoveIndex(-1);
  const goPrev = () => setCurrentMoveIndex(prev => Math.max(-1, prev - 1));
  const goNext = () => setCurrentMoveIndex(prev => Math.min(mainline.length - 1, prev + 1));
  const goLast = () => setCurrentMoveIndex(mainline.length - 1);

  // Load PGN into main classroom board
  const handleLoadGame = async () => {
    if (isStudent) return;
    if (fullPgn) {
      onLoadPgn(fullPgn);
    } else {
      setLoading(true);
      try {
        const res = await fetch(`/api/database/games/${game.id}`);
        if (res.ok) {
          const data = await res.json();
          setFullPgn(data.pgn || '');
          onLoadPgn(data.pgn || '');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  // Load navigated FEN into main classroom board
  const handleLoadFen = () => {
    if (isStudent || !onLoadFen) return;
    onLoadFen(activeFen);
  };

  // Render PGN move list text block
  const renderPgnList = () => {
    if (loading) {
      return (
        <div className="pgn-loading">
          <Loader2 className="animate-spin" size={16} />
          <span>Loading moves...</span>
        </div>
      );
    }

    if (hasError) {
      return <div className="pgn-error-text">Could not load moves</div>;
    }

    if (mainline.length === 0) {
      return <div className="pgn-empty-text">No moves</div>;
    }

    // Format moves list beautifully
    let formattedText = '';
    mainline.forEach((m, i) => {
      if (m.turn === 'w') {
        formattedText += `${m.moveNumber}. ${m.san} `;
      } else {
        if (i === 0) {
          formattedText += `${m.moveNumber}... ${m.san} `;
        } else {
          formattedText += `${m.san} `;
        }
      }
    });

    return <div className="pgn-moves-text">{formattedText.trim()}</div>;
  };

  return (
    <div 
      className="game-card"
      data-context-entity-id={game.id}
      data-context-entity-name={gameTitle}
      data-context-entity-type="game"
      data-context-shared={isShared ? 'true' : 'false'}
      onContextMenu={(e) => {
        if (onContextMenu) {
          onContextMenu(e, game.id, gameTitle);
        }
      }}
    >
      {/* Left Thumbnail */}
      <BoardThumbnail fen={activeFen} />

      {/* Right Details & Controls */}
      <div className="card-right-panel">
        <h3 className="game-title" title={`${idx}. ${gameTitle}`}>{idx}. {gameTitle}</h3>
        <p className="game-subtitle">{subtitle}</p>

        <hr className="card-divider" />

        {/* Collapsible PGN header */}
        <button className="pgn-toggle-header" onClick={handleTogglePgn}>
          <span className="arrow-icon">{isPgnOpen ? '▼' : '►'}</span>
          <span className="pgn-label">PGN</span>
        </button>

        {/* Expanded PGN Moves */}
        {isPgnOpen && (
          <div className="pgn-expanded-panel">
            {renderPgnList()}
          </div>
        )}

        {/* Navigation Buttons Row */}
        <div className="nav-buttons-row">
          <button 
            className="nav-btn" 
            onClick={goFirst} 
            disabled={currentMoveIndex <= -1 || loading}
            title="First Move"
          >
            {"|<"}
          </button>
          <button 
            className="nav-btn" 
            onClick={goPrev} 
            disabled={currentMoveIndex <= -1 || loading}
            title="Previous Move"
          >
            {"<"}
          </button>
          <button 
            className="nav-btn" 
            onClick={goNext} 
            disabled={currentMoveIndex >= mainline.length - 1 || loading}
            title="Next Move"
          >
            {">"}
          </button>
          <button 
            className="nav-btn" 
            onClick={goLast} 
            disabled={currentMoveIndex >= mainline.length - 1 || loading}
            title="Last Move"
          >
            {">|"}
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="action-buttons-row">
          <button 
            className={`action-btn load-game-btn ${isStudent ? 'disabled' : ''}`}
            onClick={handleLoadGame}
            disabled={loading || isStudent}
          >
            {loading && !fullPgn ? <Loader2 className="animate-spin inline-block mr-1" size={12} /> : null}
            Load game
          </button>
          <button 
            className={`action-btn load-fen-btn ${isStudent ? 'disabled' : ''}`}
            onClick={handleLoadFen}
            disabled={loading || isStudent || !onLoadFen}
          >
            Load fen
          </button>
        </div>
      </div>

      <style jsx>{`
        .game-card {
          display: flex;
          gap: 16px;
          background: #ffffff;
          border: 1px solid #eedcd0;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(74, 32, 24, 0.04);
        }
        .card-right-panel {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0; /* Prevents text overflow breaking layout */
        }
        .game-title {
          font-family: var(--font-serif);
          font-size: 0.95rem;
          font-weight: 700;
          color: #2d4a6b;
          margin: 0 0 2px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .game-subtitle {
          font-size: 0.78rem;
          color: #7a625d;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .card-divider {
          border: 0;
          border-top: 1.5px solid #fdf5ea;
          margin: 10px 0;
        }
        .pgn-toggle-header {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          padding: 0;
          margin: 0 0 8px 0;
          cursor: pointer;
          color: #4a2018;
          font-weight: 600;
          font-size: 0.8rem;
          outline: none;
          text-align: left;
          width: fit-content;
        }
        .arrow-icon {
          font-size: 0.68rem;
          color: #7a625d;
          display: inline-block;
          line-height: 1;
        }
        .pgn-label {
          color: #4a2018;
          letter-spacing: 0.03em;
        }
        .pgn-toggle-header:hover .pgn-label {
          color: #c8854a;
        }
        .pgn-expanded-panel {
          background: #fdf5ea;
          border: 1px solid #eedcd0;
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 12px;
          font-size: 0.8rem;
          line-height: 1.4;
          color: #4a2018;
          word-break: break-word;
          max-height: 100px;
          overflow-y: auto;
        }
        .pgn-loading {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #7a625d;
        }
        .pgn-empty-text {
          color: #7a625d;
          font-style: italic;
        }
        .pgn-error-text {
          color: #ef4444;
          font-style: italic;
        }
        .pgn-moves-text {
          font-family: inherit;
          font-weight: 500;
        }
        .nav-buttons-row {
          display: flex;
          gap: 6px;
          margin-bottom: 14px;
        }
        .nav-btn {
          min-width: 32px;
          height: 28px;
          background: #fdf5ea;
          border: 1px solid #eedcd0;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #4a2018;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          outline: none;
        }
        .nav-btn:hover:not(:disabled) {
          background: #eedcd0;
          border-color: #c8854a;
          color: #c8854a;
        }
        .nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .action-buttons-row {
          display: flex;
          gap: 8px;
        }
        .action-btn {
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          outline: none;
        }
        .load-game-btn {
          background: #2d4a6b;
          color: #ffffff;
          border: 1px solid #2d4a6b;
        }
        .load-game-btn:hover:not(:disabled) {
          background: #1e334d;
          border-color: #1e334d;
        }
        .load-fen-btn {
          background: #c8854a;
          color: #ffffff;
          border: 1px solid #c8854a;
        }
        .load-fen-btn:hover:not(:disabled) {
          background: #b27339;
          border-color: #b27339;
        }
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .action-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
