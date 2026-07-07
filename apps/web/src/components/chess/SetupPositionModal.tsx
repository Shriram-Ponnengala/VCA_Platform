'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Chessground } from 'chessground';
import type { Api } from 'chessground/api';
import type { Config } from 'chessground/config';
import type { Key } from 'chessground/types';
import { X, Hand } from 'lucide-react';

import { parseGamifiedFen, serializeGamifiedFen, GAMIFIED_ITEMS } from '@vca/chess';

import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';

interface SetupPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fen: string) => void;
  initialFen: string;
}

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const EMPTY_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';

export default function SetupPositionModal({ isOpen, onClose, onSave, initialFen }: SetupPositionModalProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const [fen, setFen] = useState(initialFen || START_FEN);
  const [inputFen, setInputFen] = useState(fen);

  useEffect(() => {
    if (isOpen) {
      setFen(initialFen || START_FEN);
      setErrorMsg('');
    }
  }, [isOpen, initialFen]);

  useEffect(() => {
    setInputFen(fen);
  }, [fen]);

  const [activePiece, setActivePiece] = useState<string | null>('hand'); // Default to Hand
  const [toPlay, setToPlay] = useState<'w' | 'b'>('w');
  const [castling, setCastling] = useState({
    wK: true,
    wQ: true,
    bK: true,
    bQ: true
  });
  const [orientation] = useState<'white' | 'black'>('white');
  const [errorMsg, setErrorMsg] = useState('');

  const [activeTab, setActiveTab] = useState<'general' | 'gamified'>('general');
  const [standardColor, setStandardColor] = useState<'w' | 'b'>('w');
  const [targetCategory, setTargetCategory] = useState<'Food' | 'Toys' | 'Animals' | 'Rewards' | 'Emoji'>('Food');
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [blocks, setBlocks] = useState<Record<string, string>>({});

  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const fenRef = useRef(fen);

  useEffect(() => {
    fenRef.current = fen;
  }, [fen]);

  // Sync FEN state details when FEN changes
  useEffect(() => {
    try {
      const { cleanFen, targets: parsedTargets, blocks: parsedBlocks } = parseGamifiedFen(fen);
      setTargets(parsedTargets);
      setBlocks(parsedBlocks);

      const parts = cleanFen.split(' ');
      if (parts.length >= 2) {
        setToPlay(parts[1] === 'b' ? 'b' : 'w');
      }
      if (parts.length >= 3) {
        const rights = parts[2];
        setCastling({
          wK: rights.includes('K'),
          wQ: rights.includes('Q'),
          bK: rights.includes('k'),
          bQ: rights.includes('q')
        });
      }
      setErrorMsg('');
    } catch (e) {
      // Ignore
    }
  }, [fen]);

  // Mount/remount board
  useEffect(() => {
    if (!isOpen) return;

    let observer: ResizeObserver | null = null;
    let transitionTimer: NodeJS.Timeout | null = null;

    // Small delay to ensure DOM is ready and client bounding box is populated
    const timer = setTimeout(() => {
      if (boardRef.current) {
        if (cgRef.current) {
          cgRef.current.destroy();
        }

        const config: Config = {
          fen: fenRef.current.split('|')[0],
          orientation: orientation,
          coordinates: false,
          movable: {
            color: 'both',
            free: true,
            dests: undefined,
            events: {
              after: handleSetupMove
            }
          },
          drawable: {
            enabled: false
          }
        };

        cgRef.current = Chessground(boardRef.current, config);

        // Set up ResizeObserver to handle any layout shifts or resizing of the board
        observer = new ResizeObserver(() => {
          if (cgRef.current) {
            cgRef.current.redrawAll();
          }
        });
        observer.observe(boardRef.current);
      }
    }, 50);

    // Set up window resize listener
    const handleResize = () => {
      if (cgRef.current) {
        cgRef.current.redrawAll();
      }
    };
    window.addEventListener('resize', handleResize);

    // Recalculate board bounds after modal slide-up animation completes (duration 200ms)
    transitionTimer = setTimeout(() => {
      if (cgRef.current) {
        cgRef.current.redrawAll();
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (transitionTimer) {
        clearTimeout(transitionTimer);
      }
      window.removeEventListener('resize', handleResize);
      if (observer) {
        observer.disconnect();
      }
      if (cgRef.current) {
        cgRef.current.destroy();
        cgRef.current = null;
      }
    };
  }, [isOpen, orientation]);

  // If board is already initialized, update it when FEN changes
  useEffect(() => {
    if (cgRef.current && isOpen) {
      cgRef.current.set({ fen: fen.split('|')[0] });
    }
  }, [fen, isOpen]);

  // Coordinate mapping helper
  function getSquareFromCoords(clientX: number, clientY: number): Key | null {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) return null;
    
    const col = Math.floor(x / (rect.width / 8));
    const row = Math.floor(y / (rect.height / 8));
    
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const filesBlack = ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
    
    const file = orientation === 'white' ? files[col] : filesBlack[col];
    const rank = orientation === 'white' ? (8 - row) : (1 + row);
    
    return `${file}${rank}` as Key;
  }

  function handleBoardClick(e: React.MouseEvent) {
    if (activePiece === 'hand') return; // Do not place pieces when in hand mode

    e.preventDefault();
    const square = getSquareFromCoords(e.clientX, e.clientY);
    if (!square) return;

    const squareStr = square as string;
    let nextCleanFen = fen.split('|')[0];
    const newTargets = { ...targets };
    const newBlocks = { ...blocks };

    // Always clear existing gamified items on this square
    delete newTargets[squareStr];
    delete newBlocks[squareStr];

    if (activePiece) {
      const isGamified = GAMIFIED_ITEMS[activePiece] !== undefined;
      if (isGamified) {
        // Place gamified item: clear standard piece on this square
        nextCleanFen = updateSquareInFen(nextCleanFen, squareStr, null);
        const itemType = GAMIFIED_ITEMS[activePiece].type;
        if (itemType === 'target') {
          newTargets[squareStr] = activePiece;
        } else {
          newBlocks[squareStr] = activePiece;
        }
      } else {
        // Place standard piece
        nextCleanFen = updateSquareInFen(nextCleanFen, squareStr, activePiece);
      }
    } else {
      // Eraser: clear standard piece
      nextCleanFen = updateSquareInFen(nextCleanFen, squareStr, null);
    }

    const nextFen = serializeGamifiedFen(nextCleanFen, newTargets, newBlocks);
    setFen(nextFen);
  }

  function handleSetupMove(from: Key, to: Key) {
    const fromStr = from as string;
    const toStr = to as string;
    const currentFen = fenRef.current;
    const cleanFen = currentFen.split('|')[0];
    const { targets: parsedTargets, blocks: parsedBlocks } = parseGamifiedFen(currentFen);
    const newTargets = { ...parsedTargets };
    const newBlocks = { ...parsedBlocks };

    delete newTargets[toStr];
    delete newBlocks[toStr];

    const nextCleanFen = setupMovePieceInFen(cleanFen, fromStr, toStr);
    if (nextCleanFen) {
      const nextFen = serializeGamifiedFen(nextCleanFen, newTargets, newBlocks);
      setFen(nextFen);
    }
  }

  function handleCastlingToggle(key: 'wK' | 'wQ' | 'bK' | 'bQ') {
    const nextCastling = { ...castling, [key]: !castling[key] };
    setCastling(nextCastling);
    const cleanFen = fen.split('|')[0];
    const nextCleanFen = updateCastlingInFen(cleanFen, nextCastling);
    const nextFen = serializeGamifiedFen(nextCleanFen, targets, blocks);
    setFen(nextFen);
  }

  function handleTurnChange(turn: 'w' | 'b') {
    setToPlay(turn);
    const cleanFen = fen.split('|')[0];
    const nextCleanFen = updateTurnInFen(cleanFen, turn);
    const nextFen = serializeGamifiedFen(nextCleanFen, targets, blocks);
    setFen(nextFen);
  }

  function loadCustomFen(customFen: string) {
    const trimmed = customFen.trim();
    if (!trimmed) return;

    try {
      const { cleanFen, targets: parsedTargets, blocks: parsedBlocks } = parseGamifiedFen(trimmed);
      const parts = cleanFen.split(' ');
      if (parts.length < 1) {
        setErrorMsg('Invalid FEN structure');
        return;
      }

      let formattedCleanFen = cleanFen;
      if (parts.length === 1) {
        formattedCleanFen += ' w - - 0 1';
      } else if (parts.length === 2) {
        formattedCleanFen += ' - - 0 1';
      } else if (parts.length === 3) {
        formattedCleanFen += ' - 0 1';
      }

      const nextFen = serializeGamifiedFen(formattedCleanFen, parsedTargets, parsedBlocks);
      setFen(nextFen);
      setErrorMsg('');
    } catch (e) {
      setErrorMsg('Invalid FEN format');
    }
  }

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="setup-modal-overlay">
      <div className="setup-modal-card glass-panel">
        <header className="setup-modal-header">
          <h2>Setup Position</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <main className="setup-modal-body">
          <div className="setup-tabs">
            <button 
              className={`setup-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('general');
                setActivePiece('hand');
              }}
            >
              General (Standard Pieces)
            </button>
            <button 
              className={`setup-tab-btn ${activeTab === 'gamified' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('gamified');
                setActivePiece('hand');
              }}
            >
              Gamified Board
            </button>
          </div>

          <div className={`setup-grid ${activeTab === 'gamified' ? 'gamified-layout' : ''}`}>
            
            {activeTab === 'general' ? (
              <div className="palette-column">
                <span className="palette-label">White</span>
                <button 
                  onClick={() => setActivePiece('wK')} 
                  className={`palette-item ${activePiece === 'wK' ? 'active' : ''}`}
                  title="White King"
                >
                  <div className="setup-piece king white" style={{ width: '100%', height: '100%', display: 'block' }} />
                </button>
                <button 
                  onClick={() => setActivePiece('wQ')} 
                  className={`palette-item ${activePiece === 'wQ' ? 'active' : ''}`}
                  title="White Queen"
                >
                  <div className="setup-piece queen white" style={{ width: '100%', height: '100%', display: 'block' }} />
                </button>
                <button 
                  onClick={() => setActivePiece('wR')} 
                  className={`palette-item ${activePiece === 'wR' ? 'active' : ''}`}
                  title="White Rook"
                >
                  <div className="setup-piece rook white" style={{ width: '100%', height: '100%', display: 'block' }} />
                </button>
                <button 
                  onClick={() => setActivePiece('wB')} 
                  className={`palette-item ${activePiece === 'wB' ? 'active' : ''}`}
                  title="White Bishop"
                >
                  <div className="setup-piece bishop white" style={{ width: '100%', height: '100%', display: 'block' }} />
                </button>
                <button 
                  onClick={() => setActivePiece('wN')} 
                  className={`palette-item ${activePiece === 'wN' ? 'active' : ''}`}
                  title="White Knight"
                >
                  <div className="setup-piece knight white" style={{ width: '100%', height: '100%', display: 'block' }} />
                </button>
                <button 
                  onClick={() => setActivePiece('wP')} 
                  className={`palette-item ${activePiece === 'wP' ? 'active' : ''}`}
                  title="White Pawn"
                >
                  <div className="setup-piece pawn white" style={{ width: '100%', height: '100%', display: 'block' }} />
                </button>
                
                <button 
                  onClick={() => setActivePiece('hand')} 
                  className={`palette-item ${activePiece === 'hand' ? 'active' : ''}`}
                  title="Move pieces (Hand tool)"
                >
                  <Hand size={20} />
                </button>
                
                <button 
                  onClick={() => setActivePiece(null)} 
                  className={`palette-item eraser-btn ${activePiece === null ? 'active' : ''}`}
                  title="Eraser (Remove pieces)"
                >
                  <X size={20} className="text-danger" />
                </button>
              </div>
            ) : (
              <div className="gamified-palette-column">
                <div className="gamified-palette-section">
                  <span className="palette-label">Standard Pieces</span>
                  <div className="standard-toggle-buttons">
                    <button
                      onClick={() => {
                        setStandardColor('w');
                        if (activePiece && activePiece.length === 2 && ['K','Q','R','B','N','P'].includes(activePiece[1])) {
                          setActivePiece('w' + activePiece[1]);
                        }
                      }}
                      className={`toggle-btn ${standardColor === 'w' ? 'active' : ''}`}
                    >
                      White
                    </button>
                    <button
                      onClick={() => {
                        setStandardColor('b');
                        if (activePiece && activePiece.length === 2 && ['K','Q','R','B','N','P'].includes(activePiece[1])) {
                          setActivePiece('b' + activePiece[1]);
                        }
                      }}
                      className={`toggle-btn ${standardColor === 'b' ? 'active' : ''}`}
                    >
                      Black
                    </button>
                  </div>
                  <div className="gamified-pieces-grid">
                    {(['K', 'Q', 'R', 'B', 'N', 'P'] as const).map(p => {
                      const code = standardColor + p;
                      const nameMap: Record<string, string> = { K: 'King', Q: 'Queen', R: 'Rook', B: 'Bishop', N: 'Knight', P: 'Pawn' };
                      const classNameMap: Record<string, string> = { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', P: 'pawn' };
                      return (
                        <button
                          key={code}
                          onClick={() => setActivePiece(code)}
                          className={`palette-item ${activePiece === code ? 'active' : ''}`}
                          title={`${standardColor === 'w' ? 'White' : 'Black'} ${nameMap[p]}`}
                        >
                          <div className={`setup-piece ${classNameMap[p]} ${standardColor === 'w' ? 'white' : 'black'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="gamified-palette-section">
                  <span className="palette-label">Targets (Capturable)</span>
                  <div className="target-category-tabs">
                    {(['Food', 'Toys', 'Animals', 'Rewards', 'Emoji'] as const).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setTargetCategory(cat)}
                        className={`cat-tab-btn ${targetCategory === cat ? 'active' : ''}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="gamified-items-grid">
                    {Object.entries(GAMIFIED_ITEMS)
                      .filter(([_, item]) => item.type === 'target' && item.category === targetCategory)
                      .map(([code, item]) => (
                        <button
                          key={code}
                          onClick={() => setActivePiece(code)}
                          className={`palette-item gamified-item-btn ${activePiece === code ? 'active' : ''}`}
                          title={item.name}
                        >
                          <span className="emoji-display">{item.emoji}</span>
                        </button>
                      ))}
                  </div>
                </div>

                <div className="gamified-palette-section">
                  <span className="palette-label">Blocks (Impassable)</span>
                  <div className="gamified-items-grid">
                    {Object.entries(GAMIFIED_ITEMS)
                      .filter(([_, item]) => item.type === 'block')
                      .map(([code, item]) => (
                        <button
                          key={code}
                          onClick={() => setActivePiece(code)}
                          className={`palette-item gamified-item-btn ${activePiece === code ? 'active' : ''}`}
                          title={item.name}
                        >
                          <span className="emoji-display">{item.emoji}</span>
                        </button>
                      ))}
                  </div>
                </div>

                <button 
                  onClick={() => setActivePiece('hand')} 
                  className={`palette-item full-width ${activePiece === 'hand' ? 'active' : ''}`}
                  title="Move pieces (Hand tool)"
                  style={{ marginBottom: '8px' }}
                >
                  <Hand size={18} style={{ marginRight: '6px' }} />
                  <span>Hand (Move)</span>
                </button>

                <button 
                  onClick={() => setActivePiece(null)} 
                  className={`palette-item eraser-btn full-width ${activePiece === null ? 'active' : ''}`}
                  title="Eraser (Remove items)"
                >
                  <X size={18} className="text-danger" style={{ marginRight: '6px' }} />
                  <span>Eraser</span>
                </button>
              </div>
            )}

            {/* Center Column: Chessboard */}
            <div className="board-column-wrapper">
              <div 
                className="board-wrapper cburnett brown" 
                onClick={handleBoardClick}
                style={{ cursor: activePiece === null ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23ef4444\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cline x1=\'18\' y1=\'6\' x2=\'6\' y2=\'18\'%3E%3C/line%3E%3Cline x1=\'6\' y1=\'6\' x2=\'18\' y2=\'18\'%3E%3C/line%3E%3C/svg%3E") 8 8, auto' : activePiece === 'hand' ? 'grab' : 'crosshair' }}
              >
                {/* Outer frame: handles all theme styling, padding, and borders */}
                <div className="board-outer-frame board-clip" style={{ display: 'flex', width: '100%', height: '100%', boxSizing: 'border-box', position: 'relative' }}>
                  {/* Custom Frame Coordinates */}
                  <div 
                    className="custom-frame-coords ranks" 
                    style={{ flexDirection: orientation === 'white' ? 'column-reverse' : 'column' }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(rank => (
                      <div key={rank} className="coord-label">{rank}</div>
                    ))}
                  </div>
                  <div 
                    className="custom-frame-coords files" 
                    style={{ flexDirection: orientation === 'white' ? 'row' : 'row-reverse' }}
                  >
                    {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(file => (
                      <div key={file} className="coord-label">{file}</div>
                    ))}
                  </div>
                  {/* Inner element: STRICTLY the 8x8 playing area. No padding, no border, no margin. */}
                  <div 
                    className="board-inner-playing-area" 
                    style={{ width: '100%', height: '100%', padding: 0, margin: 0, border: 'none', position: 'relative' }} 
                  >
                    {/* Custom Background Grid for custom board themes */}
                    <div 
                      className="custom-board-grid-background" 
                      style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(8, 1fr)', 
                        gridTemplateRows: 'repeat(8, 1fr)', 
                        pointerEvents: 'none', 
                        zIndex: 0 
                      }}
                    >
                      {Array.from({ length: 64 }).map((_, idx) => {
                        const fileIdx = idx % 8;
                        const rankIdx = Math.floor(idx / 8);
                        const isWhite = (fileIdx + rankIdx) % 2 === 0;
                        return (
                          <div 
                            key={idx} 
                            className={isWhite ? 'custom-square-white' : 'custom-square-black'}
                            style={{
                              background: isWhite ? 'var(--board-square-light)' : 'var(--board-square-dark)'
                            }}
                          />
                        );
                      })}
                    </div>

                    {/* Chessground Mount Container */}
                    <div 
                      ref={boardRef} 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }} 
                    />

                    {/* Targets and Blocks overlays */}
                    {Object.entries(targets).map(([sq, code]) => {
                      const file = sq[0];
                      const rank = parseInt(sq[1], 10);
                      const colIdx = file.charCodeAt(0) - 97;
                      const rowIdx = 8 - rank;
                      const col = orientation === 'white' ? colIdx : 7 - colIdx;
                      const row = orientation === 'white' ? rowIdx : 7 - rowIdx;
                      const left = col * 12.5;
                      const top = row * 12.5;
                      const item = GAMIFIED_ITEMS[code];
                      if (!item) return null;
                      return (
                        <div
                          key={sq}
                          className="gamified-item target-item"
                          style={{
                            position: 'absolute',
                            left: `${left}%`,
                            top: `${top}%`,
                            width: '12.5%',
                            height: '12.5%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            zIndex: 2,
                            pointerEvents: 'none',
                            userSelect: 'none'
                          }}
                          title={item.name}
                        >
                          {item.emoji}
                        </div>
                      );
                    })}
                    {Object.entries(blocks).map(([sq, code]) => {
                      const file = sq[0];
                      const rank = parseInt(sq[1], 10);
                      const colIdx = file.charCodeAt(0) - 97;
                      const rowIdx = 8 - rank;
                      const col = orientation === 'white' ? colIdx : 7 - colIdx;
                      const row = orientation === 'white' ? rowIdx : 7 - rowIdx;
                      const left = col * 12.5;
                      const top = row * 12.5;
                      const item = GAMIFIED_ITEMS[code];
                      if (!item) return null;
                      return (
                        <div
                          key={sq}
                          className="gamified-item block-item"
                          style={{
                            position: 'absolute',
                            left: `${left}%`,
                            top: `${top}%`,
                            width: '12.5%',
                            height: '12.5%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            zIndex: 2,
                            pointerEvents: 'none',
                            userSelect: 'none'
                          }}
                          title={item.name}
                        >
                          {item.emoji}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {activeTab === 'general' ? (
              <div className="palette-column black-palette">
                <span className="palette-label">Black</span>
                <button 
                  onClick={() => setActivePiece('bK')} 
                  className={`palette-item ${activePiece === 'bK' ? 'active' : ''}`}
                  title="Black King"
                >
                  <div className="setup-piece king black" style={{ width: '100%', height: '100%', display: 'block' }} />
                </button>
                <button 
                  onClick={() => setActivePiece('bQ')} 
                  className={`palette-item ${activePiece === 'bQ' ? 'active' : ''}`}
                  title="Black Queen"
                >
                  <div className="setup-piece queen black" style={{ width: '100%', height: '100%', display: 'block' }} />
                </button>
                <button 
                  onClick={() => setActivePiece('bR')} 
                  className={`palette-item ${activePiece === 'bR' ? 'active' : ''}`}
                  title="Black Rook"
                >
                  <div className="setup-piece rook black" style={{ width: '100%', height: '100%', display: 'block' }} />
                </button>
                <button 
                  onClick={() => setActivePiece('bB')} 
                  className={`palette-item ${activePiece === 'bB' ? 'active' : ''}`}
                  title="Black Bishop"
                >
                  <div className="setup-piece bishop black" style={{ width: '100%', height: '100%', display: 'block' }} />
                </button>
                <button 
                  onClick={() => setActivePiece('bN')} 
                  className={`palette-item ${activePiece === 'bN' ? 'active' : ''}`}
                  title="Black Knight"
                >
                  <div className="setup-piece knight black" style={{ width: '100%', height: '100%', display: 'block' }} />
                </button>
                <button 
                  onClick={() => setActivePiece('bP')} 
                  className={`palette-item ${activePiece === 'bP' ? 'active' : ''}`}
                  title="Black Pawn"
                >
                  <div className="setup-piece pawn black" style={{ width: '100%', height: '100%', display: 'block' }} />
                </button>
              </div>
            ) : null}

            {/* Right Panel: Settings & Presets */}
            <div className="settings-panel">
              <div className="section-title">Castling</div>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={castling.wK} 
                    onChange={() => handleCastlingToggle('wK')} 
                  />
                  <span>White O-O</span>
                </label>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={castling.wQ} 
                    onChange={() => handleCastlingToggle('wQ')} 
                  />
                  <span>White O-O-O</span>
                </label>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={castling.bK} 
                    onChange={() => handleCastlingToggle('bK')} 
                  />
                  <span>Black O-O</span>
                </label>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={castling.bQ} 
                    onChange={() => handleCastlingToggle('bQ')} 
                  />
                  <span>Black O-O-O</span>
                </label>
              </div>

              <div className="section-title">Presets</div>
              <div className="preset-buttons">
                <button onClick={() => setFen(initialFen || START_FEN)} className="preset-btn secondary-btn">
                  Reset
                </button>
                <button 
                  onClick={() => {
                    setFen(EMPTY_FEN);
                    setTargets({});
                    setBlocks({});
                  }} 
                  className="preset-btn secondary-btn"
                >
                  Clear
                </button>
                <button 
                  onClick={() => {
                    setFen(START_FEN);
                    setTargets({});
                    setBlocks({});
                  }} 
                  className="preset-btn secondary-btn"
                >
                  Initial
                </button>
              </div>

              <div className="section-title">To Play</div>
              <select 
                value={toPlay} 
                onChange={(e) => handleTurnChange(e.target.value as 'w' | 'b')}
                className="to-play-select"
              >
                <option value="w">White</option>
                <option value="b">Black</option>
              </select>

              <div className="section-title" style={{ marginTop: '4px' }}>FEN String</div>
              <div className="fen-row">
                <div className="fen-input-wrapper">
                  <input 
                    type="text" 
                    value={inputFen} 
                    onChange={(e) => setInputFen(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        loadCustomFen(inputFen);
                      }
                    }}
                    placeholder="Paste FEN string here"
                    className="fen-input"
                  />
                  <button onClick={() => loadCustomFen(inputFen)} className="load-btn">
                    Load FEN
                  </button>
                </div>
                {errorMsg && <div className="error-message">{errorMsg}</div>}
              </div>
            </div>

          </div>
        </main>

        <footer className="setup-modal-footer">
          <button onClick={onClose} className="footer-btn cancel-btn">
            Cancel
          </button>
          <button onClick={() => { onSave(fen); onClose(); }} className="footer-btn save-btn">
            OK
          </button>
        </footer>
      </div>

      <style>{`
        .setup-piece {
          width: 100%;
          height: 100%;
          display: block;
          background-size: contain;
          background-position: center;
          background-repeat: no-repeat;
        }
        .setup-piece.pawn.white {
          background-image: var(--piece-wp, url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/wP.svg'));
        }
        .setup-piece.bishop.white {
          background-image: var(--piece-wb, url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/wB.svg'));
        }
        .setup-piece.knight.white {
          background-image: var(--piece-wn, url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/wN.svg'));
        }
        .setup-piece.rook.white {
          background-image: var(--piece-wr, url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/wR.svg'));
        }
        .setup-piece.queen.white {
          background-image: var(--piece-wq, url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/wQ.svg'));
        }
        .setup-piece.king.white {
          background-image: var(--piece-wk, url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/wK.svg'));
        }
        .setup-piece.pawn.black {
          background-image: var(--piece-bp, url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/bP.svg'));
        }
        .setup-piece.bishop.black {
          background-image: var(--piece-bb, url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/bB.svg'));
        }
        .setup-piece.knight.black {
          background-image: var(--piece-bn, url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/bN.svg'));
        }
        .setup-piece.rook.black {
          background-image: var(--piece-br, url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/bR.svg'));
        }
        .setup-piece.queen.black {
          background-image: var(--piece-bq, url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/bQ.svg'));
        }
        .setup-piece.king.black {
          background-image: var(--piece-bk, url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/bK.svg'));
        }
        .setup-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(74, 32, 24, 0.4);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease-out;
        }

        .setup-modal-card {
          width: 98%;
          max-width: 1200px;
          background: #fdf5ea;
          border: 1px solid #eedcd0;
          border-radius: 16px;
          box-shadow: 0 20px 40px -15px rgba(74, 32, 24, 0.2);
          display: flex;
          flex-direction: column;
          max-height: 98vh;
          overflow: hidden;
          animation: slideUp 0.2s ease-out;
        }

        .setup-modal-header {
          padding: 0.5rem 1rem;
          border-bottom: 1px solid #eedcd0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .setup-modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #4a2018;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: #4a2018;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 6px;
        }

        .close-btn:hover {
          color: #c8854a;
          background: rgba(45, 74, 107, 0.05);
        }

        .setup-modal-body {
          padding: 0.5rem 1rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .setup-tabs {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid #eedcd0;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }

        .setup-tab-btn {
          padding: 8px 16px;
          border: none;
          background: transparent;
          font-size: 0.9rem;
          font-weight: 600;
          color: #8b5a36;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.15s;
        }

        .setup-tab-btn:hover {
          background: rgba(200, 133, 74, 0.05);
          color: #c8854a;
        }

        .setup-tab-btn.active {
          background: #c8854a;
          color: #ffffff;
        }

        .setup-grid {
          display: grid;
          grid-template-columns: auto 1fr auto 200px;
          gap: 1rem;
          align-items: start;
        }

        .setup-grid.gamified-layout {
          grid-template-columns: 280px 1fr 200px;
        }

        .gamified-palette-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #fdf0e4;
          border: 1px solid #eedcd0;
          border-radius: 12px;
          padding: 10px;
          max-height: none;
          overflow-y: visible;
        }

        .gamified-palette-column::-webkit-scrollbar {
          width: 6px;
        }

        .gamified-palette-column::-webkit-scrollbar-thumb {
          background-color: #eedcd0;
          border-radius: 3px;
        }

        .gamified-palette-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
          border-bottom: 1px solid #eedcd0;
          padding-bottom: 8px;
        }

        .gamified-palette-section:last-of-type {
          border-bottom: none;
        }

        .standard-toggle-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
        }

        .standard-toggle-buttons .toggle-btn {
          padding: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          background: #ffffff;
          border: 1px solid #eedcd0;
          border-radius: 6px;
          cursor: pointer;
          color: #4a2018;
          transition: all 0.15s;
        }

        .standard-toggle-buttons .toggle-btn:hover {
          background: rgba(200, 133, 74, 0.05);
        }

        .standard-toggle-buttons .toggle-btn.active {
          background: #c8854a;
          color: #ffffff;
          border-color: #c8854a;
        }

        .gamified-pieces-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 4px;
        }

        .gamified-pieces-grid .palette-item {
          width: 32px;
          height: 32px;
          padding: 2px;
        }

        .target-category-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .target-category-tabs .cat-tab-btn {
          padding: 3px 6px;
          font-size: 0.7rem;
          font-weight: 600;
          background: #ffffff;
          border: 1px solid #eedcd0;
          border-radius: 6px;
          cursor: pointer;
          color: #8b5a36;
          transition: all 0.15s;
        }

        .target-category-tabs .cat-tab-btn:hover {
          background: rgba(200, 133, 74, 0.05);
        }

        .target-category-tabs .cat-tab-btn.active {
          background: #8b5a36;
          color: #ffffff;
          border-color: #8b5a36;
        }

        .gamified-items-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 4px;
          max-height: 160px;
          overflow-y: auto;
          background: #ffffff;
          border: 1px solid #eedcd0;
          border-radius: 8px;
          padding: 4px;
        }

        .gamified-items-grid::-webkit-scrollbar {
          width: 4px;
        }

        .gamified-items-grid::-webkit-scrollbar-thumb {
          background-color: #eedcd0;
          border-radius: 2px;
        }

        .gamified-item-btn {
          width: 32px !important;
          height: 32px !important;
          padding: 0 !important;
          border-radius: 6px !important;
        }

        .emoji-display {
          font-size: 1.25rem;
          line-height: 1;
        }

        .palette-item.eraser-btn.full-width {
          width: 100%;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 4px;
          font-weight: 600;
          font-size: 0.85rem;
          color: #dc2626;
        }


        .palette-column {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
          align-items: start;
          background: #fdf0e4;
          border: 1px solid #eedcd0;
          border-radius: 12px;
          padding: 10px;
        }

        .palette-label {
          grid-column: 1 / -1;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: #c8854a;
          margin-bottom: 2px;
          text-align: center;
        }

        .palette-item {
          width: 44px;
          height: 44px;
          background: #ffffff;
          border: 1.5px solid #eedcd0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3px;
        }

        .palette-item:hover {
          background: rgba(200, 133, 74, 0.05);
          border-color: #c8854a;
        }

        .palette-item.active {
          background: rgba(200, 133, 74, 0.08);
          border-color: #c8854a;
          box-shadow: 0 0 8px rgba(200, 133, 74, 0.4);
        }

        .black-palette .palette-item {
          background: #ffffff;
          border-color: #eedcd0;
        }

        .black-palette .palette-item:hover {
          background: rgba(200, 133, 74, 0.05);
          border-color: #c8854a;
        }

        .black-palette .palette-item.active {
          background: rgba(200, 133, 74, 0.08);
          border-color: #c8854a;
          box-shadow: 0 0 10px rgba(200, 133, 74, 0.6);
        }

        .eraser-btn {
          grid-column: 1 / -1;
          width: 100%;
          margin-top: 4px;
          border-color: rgba(220, 38, 38, 0.2);
        }

        .eraser-btn.active {
          background: rgba(220, 38, 38, 0.08);
          border-color: #dc2626;
          box-shadow: 0 0 8px rgba(220, 38, 38, 0.3);
        }

        .board-column-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 0;
          min-height: 434px;
        }

        .board-wrapper {
          width: 434px;
          max-width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 10px 15px -3px rgba(74, 32, 24, 0.1);
          border: 3px solid #eedcd0;
          padding: 8px;
          box-sizing: border-box;
          background: transparent;
        }

        .settings-panel {
          background: #fdf0e4;
          border: 1px solid #eedcd0;
          border-radius: 12px;
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .section-title {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #c8854a;
          border-bottom: 1px solid #eedcd0;
          padding-bottom: 4px;
          margin-bottom: 2px;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #4a2018;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-label input[type="checkbox"] {
          accent-color: #c8854a;
          cursor: pointer;
          width: 15px;
          height: 15px;
        }

        .preset-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
        }

        .preset-btn {
          padding: 5px 3px;
          font-size: 0.8rem;
          font-weight: 500;
          border-radius: 6px;
          cursor: pointer;
          border: 1px solid #eedcd0;
          background: #ffffff;
          color: #4a2018;
          transition: all 0.15s;
        }

        .preset-btn:hover {
          background: rgba(200, 133, 74, 0.08);
          border-color: #c8854a;
          color: #c8854a;
        }

        .to-play-select {
          background: #ffffff;
          border: 1px solid #eedcd0;
          border-radius: 6px;
          color: #4a2018;
          padding: 5px 8px;
          font-size: 0.85rem;
          font-family: inherit;
          cursor: pointer;
          outline: none;
        }

        .to-play-select:focus {
          border-color: #c8854a;
        }

        .fen-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .fen-input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .fen-input {
          width: 100%;
          background: #ffffff;
          border: 1px solid #eedcd0;
          border-radius: 6px;
          outline: none;
          color: #4a2018;
          font-size: 0.75rem;
          font-family: monospace;
          padding: 6px;
          box-sizing: border-box;
        }

        .load-btn {
          width: 100%;
          background: #2d4a6b;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }

        .load-btn:hover {
          background: #1d334d;
        }

        .error-message {
          color: #dc2626;
          font-size: 0.8rem;
          padding-left: 4px;
        }

        .setup-modal-footer {
          padding: 0.75rem 1.25rem;
          border-top: 1px solid #eedcd0;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .footer-btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .cancel-btn {
          background: transparent;
          border: 1px solid #eedcd0;
          color: #4a2018;
        }

        .cancel-btn:hover {
          background: rgba(45, 74, 107, 0.05);
          border-color: #c8854a;
          color: #4a2018;
        }

        .save-btn {
          background: #c8854a;
          border: none;
          color: #fff;
          box-shadow: 0 4px 10px rgba(200, 133, 74, 0.2);
        }

        .save-btn:hover {
          background: #b3643b;
          box-shadow: 0 4px 14px rgba(200, 133, 74, 0.35);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 768px) {
          .setup-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .palette-column {
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
          }
        }

        /* Ensure coordinates do not occupy layout space */
        .cg-wrap coords {
          position: absolute !important;
        }
      `}</style>
    </div>,
    document.body
  );
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function updateSquareInFen(fen: string, square: string, pieceCode: string | null): string {
  try {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const fileIdx = files.indexOf(square[0]);
    const rankIdx = 8 - parseInt(square[1], 10);

    const parts = fen.split(' ');
    const rows = parts[0].split('/');

    const rowSquares: (string | null)[] = [];
    const targetRowStr = rows[rankIdx];
    for (let i = 0; i < targetRowStr.length; i++) {
      const char = targetRowStr[i];
      if (isNaN(Number(char))) {
        rowSquares.push(char);
      } else {
        const num = Number(char);
        for (let j = 0; j < num; j++) {
          rowSquares.push(null);
        }
      }
    }

    if (pieceCode) {
      const isWhite = pieceCode[0] === 'w';
      const pieceChar = pieceCode[1];
      rowSquares[fileIdx] = isWhite ? pieceChar.toUpperCase() : pieceChar.toLowerCase();
    } else {
      rowSquares[fileIdx] = null;
    }

    let compressedRow = '';
    let emptyCount = 0;
    for (let i = 0; i < 8; i++) {
      const val = rowSquares[i];
      if (val === null) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          compressedRow += emptyCount;
          emptyCount = 0;
        }
        compressedRow += val;
      }
    }
    if (emptyCount > 0) {
      compressedRow += emptyCount;
    }

    rows[rankIdx] = compressedRow;
    parts[0] = rows.join('/');

    return parts.join(' ');
  } catch (e) {
    return fen;
  }
}

function updateCastlingInFen(fen: string, rights: { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean }): string {
  try {
    const parts = fen.split(' ');
    let rightsStr = '';
    if (rights.wK) rightsStr += 'K';
    if (rights.wQ) rightsStr += 'Q';
    if (rights.bK) rightsStr += 'k';
    if (rights.bQ) rightsStr += 'q';
    parts[2] = rightsStr || '-';
    return parts.join(' ');
  } catch (e) {
    return fen;
  }
}

function updateTurnInFen(fen: string, turn: 'w' | 'b'): string {
  try {
    const parts = fen.split(' ');
    parts[1] = turn;
    return parts.join(' ');
  } catch (e) {
    return fen;
  }
}

function setupMovePieceInFen(fen: string, from: string, to: string): string | null {
  try {
    const parts = fen.split(' ');
    const rows = parts[0].split('/');
    
    const board: (string | null)[][] = [];
    for (let r = 0; r < 8; r++) {
      const row: (string | null)[] = [];
      const fenRow = rows[r];
      for (let c = 0; c < fenRow.length; c++) {
        const char = fenRow[c];
        if (isNaN(Number(char))) {
          row.push(char);
        } else {
          const emptySquares = Number(char);
          for (let e = 0; e < emptySquares; e++) {
            row.push(null);
          }
        }
      }
      board.push(row);
    }

    const getCoords = (sq: string) => {
      const col = sq.charCodeAt(0) - 97;
      const row = 8 - Number(sq[1]);
      return { row, col };
    };

    const fromCoords = getCoords(from);
    const toCoords = getCoords(to);

    const piece = board[fromCoords.row][fromCoords.col];
    if (!piece) return null;

    board[fromCoords.row][fromCoords.col] = null;
    board[toCoords.row][toCoords.col] = piece;

    const newRows: string[] = [];
    for (let r = 0; r < 8; r++) {
      let rowStr = '';
      let emptyCount = 0;
      for (let c = 0; c < 8; c++) {
        const val = board[r][c];
        if (val === null) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            rowStr += emptyCount;
            emptyCount = 0;
          }
          rowStr += val;
        }
      }
      if (emptyCount > 0) {
        rowStr += emptyCount;
      }
      newRows.push(rowStr);
    }

    parts[0] = newRows.join('/');
    return parts.join(' ');
  } catch (e) {
    return null;
  }
}
