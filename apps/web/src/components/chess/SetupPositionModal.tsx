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

  // Theme filter for targets
  const [targetTheme, setTargetTheme] = React.useState<'all'|'food'|'toys'|'animals'|'rewards'|'emoji'>('all');
  const THEME_FILTER: Record<string, string[]|null> = {
    all: null,
    food: ['ch','ap','do','bu','st','co','pz','ca'],
    toys: ['tb','bl','ki','tr'],
    animals: ['dg','ct','rbt','pnd','fx','frg','brd'],
    rewards: ['str','trphy','mdl','gm','crn','gft'],
    emoji: ['em_smile','em_heart','em_party','em_rocket','em_unicorn','em_dino','em_ghost','em_alien'],
  };

  const filteredTargets = Object.entries(GAMIFIED_ITEMS).filter(([code, item]) => {
    if (item.type !== 'target') return false;
    const allowed = THEME_FILTER[targetTheme];
    if (!allowed) return true;
    return allowed.includes(code);
  });

  const allBlocks = Object.entries(GAMIFIED_ITEMS).filter(([, item]) => item.type === 'block');

  const PIECES = ['K','Q','R','B','N','P'] as const;
  const PIECE_CLASS: Record<string,string> = { K:'king',Q:'queen',R:'rook',B:'bishop',N:'knight',P:'pawn' };
  const PIECE_LABEL: Record<string,string> = { K:'King',Q:'Queen',R:'Rook',B:'Bishop',N:'Knight',P:'Pawn' };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="spm-overlay">
      <div className="spm-card">

        {/* ── Header ── */}
        <header className="spm-header">
          <div>
            <h2 className="spm-title">Setup Position</h2>
            <p className="spm-subtitle">Create any position by adding or removing pieces, or load a position using FEN.</p>
          </div>
          <button className="spm-close" onClick={onClose}><X size={20} /></button>
        </header>

        {/* ── Tabs ── */}
        <div className="spm-tabs">
          <button 
            className={`spm-tab ${activeTab === 'general' ? 'spm-tab-active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General (Standard Pieces)
          </button>
          <button 
            className={`spm-tab ${activeTab === 'gamified' ? 'spm-tab-active' : ''}`}
            onClick={() => setActiveTab('gamified')}
          >
            Gamified Board
          </button>
        </div>

        {/* ── 3-column body ── */}
        <div className="spm-body">

          {/* ──────── LEFT: Palette ──────── */}
          <aside className="spm-left">

            {/* PIECES */}
            <div className="spm-section">
              <div className="spm-sec-label">PIECES</div>
              {/* White row */}
              <div className="spm-pieces-row">
                {PIECES.map(p => {
                  const code = 'w'+p;
                  return (
                    <button
                      key={code}
                      title={`White ${PIECE_LABEL[p]}`}
                      onClick={() => setActivePiece(code)}
                      className={`spm-piece-btn ${activePiece === code ? 'spm-active' : ''}`}
                    >
                      <div className={`setup-piece ${PIECE_CLASS[p]} white`} />
                    </button>
                  );
                })}
              </div>
              {/* Black row */}
              <div className="spm-pieces-row">
                {PIECES.map(p => {
                  const code = 'b'+p;
                  return (
                    <button
                      key={code}
                      title={`Black ${PIECE_LABEL[p]}`}
                      onClick={() => setActivePiece(code)}
                      className={`spm-piece-btn ${activePiece === code ? 'spm-active' : ''}`}
                    >
                      <div className={`setup-piece ${PIECE_CLASS[p]} black`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ADD BY THEME */}
            {activeTab === 'gamified' && (
              <div className="spm-section">
              <div className="spm-sec-label">ADD BY THEME</div>
              <div className="spm-theme-chips">
                {(['all','food','toys','animals','rewards','emoji'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTargetTheme(t)}
                    className={`spm-chip ${targetTheme === t ? 'spm-chip-active' : ''}`}
                  >
                    {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <div className="spm-icon-grid">
                {filteredTargets.map(([code, item]) => (
                  <button
                    key={code}
                    title={item.name}
                    onClick={() => setActivePiece(code)}
                    className={`spm-icon-btn ${activePiece === code ? 'spm-active' : ''}`}
                  >
                    <span className="spm-emoji">{item.emoji}</span>
                  </button>
                ))}
                </div>
              </div>
            )}

            {/* BLOCKS */}
            {activeTab === 'gamified' && (
              <div className="spm-section">
              <div className="spm-sec-label">BLOCKS</div>
              <div className="spm-icon-grid">
                {allBlocks.map(([code, item]) => (
                  <button
                    key={code}
                    title={item.name}
                    onClick={() => setActivePiece(code)}
                    className={`spm-icon-btn ${activePiece === code ? 'spm-active' : ''}`}
                  >
                    <span className="spm-emoji">{item.emoji}</span>
                  </button>
                ))}
                </div>
              </div>
            )}

            {/* TOOLS */}
            <div className="spm-section">
              <div className="spm-sec-label">TOOLS</div>
              <div className="spm-tools-row">
                <button
                  title="Move pieces"
                  onClick={() => setActivePiece('hand')}
                  className={`spm-tool-btn ${activePiece === 'hand' ? 'spm-tool-active' : ''}`}
                >
                  <Hand size={14} /> Move
                </button>
                <button
                  title="Erase piece"
                  onClick={() => setActivePiece(null)}
                  className={`spm-tool-btn spm-tool-erase ${activePiece === null ? 'spm-tool-active spm-tool-erase-active' : ''}`}
                >
                  <X size={14} /> Erase
                </button>
                <button
                  title="Clear all pieces"
                  onClick={() => { setFen(EMPTY_FEN); setTargets({}); setBlocks({}); }}
                  className="spm-tool-btn spm-tool-clear"
                >
                  Clear Board
                </button>
              </div>
            </div>

            {/* How to use */}
            <div className="spm-help">
              <div className="spm-help-title">ⓘ How to use</div>
              <ul className="spm-help-list">
                <li>Click a piece to add it to the board</li>
                <li>Click on the board to place the piece</li>
                <li>Use Erase or Right-click to remove</li>
                <li>Use Clear Board to start over</li>
              </ul>
            </div>

          </aside>

          {/* ──────── CENTER: Board ──────── */}
          <div className="spm-center">
            <div
              className="spm-board-wrapper cburnett brown"
              onClick={handleBoardClick}
              style={{ cursor: activePiece === null
                ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23ef4444\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cline x1=\'18\' y1=\'6\' x2=\'6\' y2=\'18\'%3E%3C/line%3E%3Cline x1=\'6\' y1=\'6\' x2=\'18\' y2=\'18\'%3E%3C/line%3E%3C/svg%3E") 8 8, auto'
                : activePiece === 'hand' ? 'grab' : 'crosshair'
              }}
            >
              <div className="board-outer-frame board-clip" style={{ display:'flex', width:'100%', height:'100%', boxSizing:'border-box', position:'relative' }}>
                <div className="custom-frame-coords ranks" style={{ flexDirection: orientation === 'white' ? 'column-reverse' : 'column' }}>
                  {[1,2,3,4,5,6,7,8].map(rank => (
                    <div key={rank} className="coord-label">{rank}</div>
                  ))}
                </div>
                <div className="custom-frame-coords files" style={{ flexDirection: orientation === 'white' ? 'row' : 'row-reverse' }}>
                  {['a','b','c','d','e','f','g','h'].map(file => (
                    <div key={file} className="coord-label">{file}</div>
                  ))}
                </div>
                <div className="board-inner-playing-area" style={{ width:'100%', height:'100%', padding:0, margin:0, border:'none', position:'relative' }}>
                  {/* Board grid background */}
                  <div className="custom-board-grid-background" style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', display:'grid', gridTemplateColumns:'repeat(8,1fr)', gridTemplateRows:'repeat(8,1fr)', pointerEvents:'none', zIndex:0 }}>
                    {Array.from({length:64}).map((_,idx) => {
                      const fi = idx%8, ri = Math.floor(idx/8);
                      return <div key={idx} className={(fi+ri)%2===0?'custom-square-white':'custom-square-black'} style={{ background:(fi+ri)%2===0?'var(--board-square-light)':'var(--board-square-dark)' }} />;
                    })}
                  </div>
                  {/* Chessground mount */}
                  <div ref={boardRef} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', zIndex:1 }} />
                  {/* Target overlays */}
                  {Object.entries(targets).map(([sq,code]) => {
                    const fi2 = sq.charCodeAt(0)-97, rk = parseInt(sq[1],10);
                    const col = orientation==='white'?fi2:7-fi2, row = orientation==='white'?8-rk:rk-1;
                    const item = GAMIFIED_ITEMS[code]; if(!item) return null;
                    return (
                      <div key={sq} style={{ position:'absolute', left:`${col*12.5}%`, top:`${row*12.5}%`, width:'12.5%', height:'12.5%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', zIndex:2, pointerEvents:'none', userSelect:'none' }} title={item.name}>
                        {item.emoji}
                      </div>
                    );
                  })}
                  {/* Block overlays */}
                  {Object.entries(blocks).map(([sq,code]) => {
                    const fi2 = sq.charCodeAt(0)-97, rk = parseInt(sq[1],10);
                    const col = orientation==='white'?fi2:7-fi2, row = orientation==='white'?8-rk:rk-1;
                    const item = GAMIFIED_ITEMS[code]; if(!item) return null;
                    return (
                      <div key={sq} style={{ position:'absolute', left:`${col*12.5}%`, top:`${row*12.5}%`, width:'12.5%', height:'12.5%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', zIndex:2, pointerEvents:'none', userSelect:'none' }} title={item.name}>
                        {item.emoji}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ──────── RIGHT: Options ──────── */}
          <aside className="spm-right">

            {/* CASTLING */}
            <div className="spm-section">
              <div className="spm-sec-label">CASTLING</div>
              <div className="spm-checks">
                {([['wK','White O-O'],['wQ','White O-O-O'],['bK','Black O-O'],['bQ','Black O-O-O']] as const).map(([key,label]) => (
                  <label key={key} className="spm-check-label">
                    <input type="checkbox" checked={castling[key]} onChange={() => handleCastlingToggle(key)} className="spm-checkbox" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* PRESETS */}
            <div className="spm-section">
              <div className="spm-sec-label">PRESETS</div>
              <div className="spm-presets">
                <button onClick={() => { setFen(initialFen || START_FEN); setTargets({}); setBlocks({}); }} className="spm-preset-btn">
                  Current Position
                </button>
                <button onClick={() => { setFen(EMPTY_FEN); setTargets({}); setBlocks({}); }} className="spm-preset-btn">
                  Empty Board
                </button>
                <button onClick={() => { setFen(START_FEN); setTargets({}); setBlocks({}); }} className="spm-preset-btn">
                  Starting Position
                </button>
              </div>
            </div>

            {/* SIDE TO MOVE */}
            <div className="spm-section">
              <div className="spm-sec-label">SIDE TO MOVE</div>
              <select value={toPlay} onChange={e => handleTurnChange(e.target.value as 'w'|'b')} className="spm-select">
                <option value="w">White</option>
                <option value="b">Black</option>
              </select>
            </div>

            {/* FEN */}
            <div className="spm-section spm-fen-section">
              <div className="spm-sec-label">FEN (Optional)</div>
              <input
                type="text"
                value={inputFen}
                onChange={e => setInputFen(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter') loadCustomFen(inputFen); }}
                placeholder="Enter FEN string"
                className="spm-fen-input"
              />
              {errorMsg && <div className="spm-error">{errorMsg}</div>}
              <button onClick={() => loadCustomFen(inputFen)} className="spm-load-btn">
                Load FEN
              </button>
            </div>

          </aside>
        </div>

        {/* ── Footer ── */}
        <footer className="spm-footer">
          <button onClick={onClose} className="spm-btn-cancel">Cancel</button>
          <button onClick={() => { onSave(fen); onClose(); }} className="spm-btn-ok">OK</button>
        </footer>
      </div>

      <style>{`
        /* ─── Piece SVGs (unchanged) ─── */
        .setup-piece { width:100%; height:100%; display:block; background-size:contain; background-position:center; background-repeat:no-repeat; }
        .setup-piece.pawn.white   { background-image: var(--piece-wp,  url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/wP.svg')); }
        .setup-piece.bishop.white { background-image: var(--piece-wb,  url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/wB.svg')); }
        .setup-piece.knight.white { background-image: var(--piece-wn,  url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/wN.svg')); }
        .setup-piece.rook.white   { background-image: var(--piece-wr,  url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/wR.svg')); }
        .setup-piece.queen.white  { background-image: var(--piece-wq,  url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/wQ.svg')); }
        .setup-piece.king.white   { background-image: var(--piece-wk,  url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/wK.svg')); }
        .setup-piece.pawn.black   { background-image: var(--piece-bp,  url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/bP.svg')); }
        .setup-piece.bishop.black { background-image: var(--piece-bb,  url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/bB.svg')); }
        .setup-piece.knight.black { background-image: var(--piece-bn,  url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/bN.svg')); }
        .setup-piece.rook.black   { background-image: var(--piece-br,  url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/bR.svg')); }
        .setup-piece.queen.black  { background-image: var(--piece-bq,  url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/bQ.svg')); }
        .setup-piece.king.black   { background-image: var(--piece-bk,  url('https://lichess1.org/assets/_L5MIdy/piece/cburnett/bK.svg')); }

        /* ─── Modal shell ─── */
        .spm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(30, 15, 8, 0.55);
          backdrop-filter: blur(6px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: spmFadeIn 0.18s ease-out;
        }
        .spm-card {
          width: 98%;
          max-width: 1160px;
          height: 90vh;
          max-height: 90vh;
          background: #fdf6ec;
          border: 1px solid #e4cdb7;
          border-radius: 16px;
          box-shadow: 0 24px 60px -10px rgba(74,32,18,0.25);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: spmSlideUp 0.18s ease-out;
        }

        /* ─── Header ─── */
        .spm-header {
          padding: 14px 20px 10px;
          border-bottom: 1px solid #e4cdb7;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-shrink: 0;
        }
        .spm-title { margin:0; font-size:1.2rem; font-weight:700; color:#3b1c0c; }
        .spm-subtitle { margin:2px 0 0; font-size:0.78rem; color:#9a6040; }
        .spm-close {
          background: transparent; border: none; color: #7a4020; cursor: pointer;
          padding: 4px; border-radius: 6px; transition: all 0.15s; display:flex; align-items:center;
        }
        .spm-close:hover { background: rgba(200,133,74,0.12); color: #c8854a; }

        /* ─── Tabs ─── */
        .spm-tabs {
          display: flex;
          gap: 6px;
          padding: 8px 20px 0;
          border-bottom: 1px solid #e4cdb7;
          background: #fdf6ec;
          flex-shrink: 0;
        }
        .spm-tab {
          padding: 8px 16px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #9a6040;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.15s;
          margin-bottom: -1px;
        }
        .spm-tab:hover { color: #7a4020; }
        .spm-tab-active { color: #3b1c0c; border-bottom-color: #c8854a; }

        /* ─── 3-column body ─── */
        .spm-body {
          display: grid;
          grid-template-columns: 256px 1fr 210px;
          gap: 10px;
          padding: 10px 14px;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        /* ─── Left/Right panels ─── */
        .spm-left, .spm-right {
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow-y: auto;
          padding-right: 2px;
        }
        .spm-left::-webkit-scrollbar, .spm-right::-webkit-scrollbar { width: 4px; }
        .spm-left::-webkit-scrollbar-thumb, .spm-right::-webkit-scrollbar-thumb { background: #e4cdb7; border-radius: 2px; }

        /* ─── Section ─── */
        .spm-section {
          background: #faeee0;
          border: 1px solid #e4cdb7;
          border-radius: 10px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .spm-sec-label {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #c8854a;
          margin-bottom: 1px;
        }

        /* ─── Pieces ─── */
        .spm-pieces-row {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 4px;
        }
        .spm-piece-btn {
          aspect-ratio: 1/1;
          background: #fff;
          border: 1.5px solid #e4cdb7;
          border-radius: 7px;
          cursor: pointer;
          padding: 3px;
          transition: all 0.12s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .spm-piece-btn:hover { border-color: #c8854a; background: rgba(200,133,74,0.06); }
        .spm-piece-btn.spm-active { border-color: #c8854a; background: rgba(200,133,74,0.12); box-shadow: 0 0 0 2px rgba(200,133,74,0.25); }

        /* ─── Theme chips ─── */
        .spm-theme-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .spm-chip {
          padding: 3px 8px;
          font-size: 0.7rem;
          font-weight: 600;
          border: 1px solid #e4cdb7;
          border-radius: 20px;
          background: #fff;
          color: #7a4020;
          cursor: pointer;
          transition: all 0.12s;
        }
        .spm-chip:hover { background: rgba(200,133,74,0.08); border-color: #c8854a; }
        .spm-chip.spm-chip-active { background: #7a4020; color: #fff; border-color: #7a4020; }

        /* ─── Icon grids (targets / blocks) ─── */
        .spm-icon-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 4px;
        }
        .spm-icon-btn {
          aspect-ratio: 1/1;
          background: #fff;
          border: 1.5px solid #e4cdb7;
          border-radius: 7px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.12s;
          padding: 0;
        }
        .spm-icon-btn:hover { border-color: #c8854a; background: rgba(200,133,74,0.06); }
        .spm-icon-btn.spm-active { border-color: #c8854a; background: rgba(200,133,74,0.12); box-shadow: 0 0 0 2px rgba(200,133,74,0.25); }
        .spm-emoji { font-size: 1.1rem; line-height: 1; }

        /* ─── Tools ─── */
        .spm-tools-row {
          display: flex;
          gap: 5px;
        }
        .spm-tool-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 6px 4px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1.5px solid #e4cdb7;
          border-radius: 7px;
          background: #fff;
          color: #3b1c0c;
          cursor: pointer;
          transition: all 0.12s;
        }
        .spm-tool-btn:hover { border-color: #c8854a; background: rgba(200,133,74,0.08); }
        .spm-tool-btn.spm-tool-active { background: #c8854a; color: #fff; border-color: #c8854a; }
        .spm-tool-erase { color: #c0392b; }
        .spm-tool-erase:hover { border-color: #e74c3c; background: rgba(231,76,60,0.06); }
        .spm-tool-erase.spm-tool-erase-active { background: #e74c3c; color: #fff; border-color: #e74c3c; }
        .spm-tool-clear { color: #7a4020; }

        /* ─── Help box ─── */
        .spm-help {
          background: rgba(200,133,74,0.06);
          border: 1px solid #e4cdb7;
          border-radius: 8px;
          padding: 8px 10px;
          margin-top: auto;
        }
        .spm-help-title { font-size: 0.72rem; font-weight: 700; color: #7a4020; margin-bottom: 4px; }
        .spm-help-list { margin: 0; padding-left: 14px; display: flex; flex-direction: column; gap: 2px; }
        .spm-help-list li { font-size: 0.68rem; color: #9a6040; }

        /* ─── Center board ─── */
        .spm-center {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 0;
          min-width: 0;
        }
        .spm-board-wrapper {
          height: 100%;
          max-height: 100%;
          aspect-ratio: 1/1;
          width: auto;
          max-width: 100%;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 8px 24px -4px rgba(74,32,18,0.15);
          border: 3px solid #c8a882;
          padding: 8px;
          box-sizing: border-box;
          background: transparent;
        }

        /* ─── Right: options ─── */
        .spm-right { justify-content: space-between; }
        .spm-checks { display: flex; flex-direction: column; gap: 5px; }
        .spm-check-label { display:flex; align-items:center; gap:7px; font-size:0.82rem; color:#3b1c0c; cursor:pointer; user-select:none; }
        .spm-checkbox { accent-color: #c8854a; width:14px; height:14px; cursor:pointer; }

        .spm-presets { display:flex; flex-direction:column; gap:4px; }
        .spm-preset-btn {
          width: 100%;
          padding: 6px 8px;
          font-size: 0.8rem;
          font-weight: 500;
          background: #fff;
          border: 1px solid #e4cdb7;
          border-radius: 7px;
          color: #3b1c0c;
          cursor: pointer;
          transition: all 0.12s;
          text-align: left;
        }
        .spm-preset-btn:hover { background: rgba(200,133,74,0.08); border-color: #c8854a; color: #7a4020; }

        .spm-select {
          width: 100%;
          padding: 6px 8px;
          font-size: 0.82rem;
          font-family: inherit;
          background: #fff;
          border: 1px solid #e4cdb7;
          border-radius: 7px;
          color: #3b1c0c;
          cursor: pointer;
          outline: none;
        }
        .spm-select:focus { border-color: #c8854a; }

        .spm-fen-section { gap: 5px; }
        .spm-fen-input {
          width: 100%;
          box-sizing: border-box;
          padding: 6px 8px;
          font-size: 0.72rem;
          font-family: monospace;
          background: #fff;
          border: 1px solid #e4cdb7;
          border-radius: 7px;
          color: #3b1c0c;
          outline: none;
        }
        .spm-fen-input:focus { border-color: #c8854a; }
        .spm-error { font-size: 0.72rem; color: #c0392b; }
        .spm-load-btn {
          width: 100%;
          padding: 7px;
          font-size: 0.82rem;
          font-weight: 700;
          background: #7a4020;
          color: #fff;
          border: none;
          border-radius: 7px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .spm-load-btn:hover { background: #5e3018; }

        /* ─── Footer ─── */
        .spm-footer {
          padding: 10px 18px;
          border-top: 1px solid #e4cdb7;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-shrink: 0;
        }
        .spm-btn-cancel {
          padding: 7px 18px;
          font-size: 0.85rem;
          font-weight: 600;
          background: transparent;
          border: 1px solid #e4cdb7;
          border-radius: 8px;
          color: #3b1c0c;
          cursor: pointer;
          transition: all 0.12s;
        }
        .spm-btn-cancel:hover { background: rgba(200,133,74,0.08); border-color: #c8854a; }
        .spm-btn-ok {
          padding: 7px 22px;
          font-size: 0.85rem;
          font-weight: 700;
          background: #c8854a;
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(200,133,74,0.3);
          transition: all 0.12s;
        }
        .spm-btn-ok:hover { background: #a66b38; box-shadow: 0 4px 14px rgba(200,133,74,0.4); }

        /* ─── Animations ─── */
        @keyframes spmFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes spmSlideUp { from { transform:translateY(16px); opacity:0; } to { transform:translateY(0); opacity:1; } }

        /* ─── Board coordinate helpers (unchanged) ─── */
        .cg-wrap coords { position: absolute !important; }
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
