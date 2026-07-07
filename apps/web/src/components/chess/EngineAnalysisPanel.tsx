'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Chess } from '@vca/chess';
import { Cpu, MoreHorizontal, Plus, Minus, AlertCircle } from 'lucide-react';

const SEARCH_DEPTH = 22;
const MAX_DISPLAY_PLIES = 8; // cap shown PV at ~4 full moves; engine still searches full depth

interface EngineAnalysisPanelProps {
  fen: string;
}

interface AnalysisLine {
  rank: number;
  pv: string;
  san: string;
  score: string;
}

interface RawAnalysisLine {
  rank: number;
  pvMoves: string[];
  score: string;
}

interface EvaluationBuffer {
  depth: number;
  nps: number;
  evalScore: string;
  topLines: RawAnalysisLine[];
}

type EngineStatus = 'initializing' | 'ready' | 'analyzing' | 'error';

function parseStockfishLine(line: string, turn: 'w' | 'b') {
  if (!line.startsWith('info ')) return null;
  const parts = line.split(/\s+/);
  
  const depthIdx = parts.indexOf('depth');
  const multipvIdx = parts.indexOf('multipv');
  const scoreIdx = parts.indexOf('score');
  const pvIdx = parts.indexOf('pv');
  const npsIdx = parts.indexOf('nps');
  
  if (depthIdx === -1 || multipvIdx === -1 || scoreIdx === -1 || pvIdx === -1) {
    return null;
  }
  
  const depth = parseInt(parts[depthIdx + 1], 10);
  const multipv = parseInt(parts[multipvIdx + 1], 10);
  const nps = npsIdx !== -1 ? parseInt(parts[npsIdx + 1], 10) : 0;
  
  const scoreType = parts[scoreIdx + 1]; // 'cp' or 'mate'
  let scoreValue = parseInt(parts[scoreIdx + 2], 10);
  
  // Convert score to White's perspective
  if (turn === 'b') {
    scoreValue = -scoreValue;
  }
  
  const pvMoves = parts.slice(pvIdx + 1);
  
  return {
    depth,
    multipv,
    scoreType,
    scoreValue,
    pvMoves,
    nps
  };
}

function convertPVToSAN(fen: string, pvMoves: string[]): string[] {
  try {
    const chess = new Chess(fen);
    const sanMoves: string[] = [];
    for (const moveStr of pvMoves) {
      const from = moveStr.slice(0, 2);
      const to = moveStr.slice(2, 4);
      const promotion = moveStr.slice(4, 5) || undefined;
      
      const move = chess.move({ from, to, promotion });
      if (move) {
        sanMoves.push(move.san);
      } else {
        break; // Stop if move is invalid
      }
    }
    return sanMoves;
  } catch (e) {
    return pvMoves;
  }
}

function formatMovesWithNumbers(fen: string, sanMoves: string[]): string {
  try {
    const chess = new Chess(fen);
    let moveNumber = chess.moveNumber();
    let turn = chess.turn();
    const formatted: string[] = [];
    
    for (let i = 0; i < sanMoves.length; i++) {
      const san = sanMoves[i];
      if (turn === 'w') {
        formatted.push(`${moveNumber}. ${san}`);
        turn = 'b';
      } else {
        if (i === 0) {
          formatted.push(`${moveNumber}... ${san}`);
        } else {
          formatted.push(san);
        }
        turn = 'w';
        moveNumber++;
      }
    }
    return formatted.join(' ');
  } catch (e) {
    return sanMoves.join(' ');
  }
}

export default function EngineAnalysisPanel({ fen }: EngineAnalysisPanelProps) {
  const isGamified = fen.includes('|');
  const [isEngineOn, setIsEngineOn] = useState<boolean>(false);
  const [numLines, setNumLines] = useState<number>(3);
  
  const [status, setStatus] = useState<EngineStatus>('initializing');
  const [depth, setDepth] = useState<number>(0);
  const [nps, setNps] = useState<number>(0);
  const [evalScore, setEvalScore] = useState<string>('0.0');
  const [topLines, setTopLines] = useState<AnalysisLine[]>(() =>
    Array.from({ length: 3 }, (_, i) => ({ rank: i + 1, pv: '', san: '', score: '0.00' }))
  );
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [gameOverText, setGameOverText] = useState<string>('');

  const workerRef = useRef<Worker | null>(null);
  const fenRef = useRef<string>(fen);
  const numLinesRef = useRef<number>(3);
  const isEngineOnRef = useRef<boolean>(true);
  
  // Track search state to avoid sending `position` while searching
  const isSearchingRef = useRef<boolean>(false);
  const pendingFenRef = useRef<string | null>(null);

  const analyzingFenRef = useRef<string | null>(null);
  const evaluationBufferRef = useRef<EvaluationBuffer>({
    depth: 0,
    nps: 0,
    evalScore: '0.0',
    topLines: Array.from({ length: 3 }, (_, i) => ({ rank: i + 1, pvMoves: [], score: '' }))
  });

  const [showToast, setShowToast] = useState<boolean>(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isGamified) {
      setShowToast(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setShowToast(false);
      }, 5000);
    } else {
      setShowToast(false);
    }
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [isGamified]);

  // Keep refs updated to prevent closure issues in the web worker callback
  useEffect(() => {
    fenRef.current = fen;
  }, [fen]);

  useEffect(() => {
    numLinesRef.current = numLines;
  }, [numLines]);

  useEffect(() => {
    isEngineOnRef.current = isEngineOn;
  }, [isEngineOn]);

  // Handle resizing/changing number of lines
  useEffect(() => {
    const lines = Array.from({ length: numLines }, (_, i) => ({
      rank: i + 1,
      pv: '',
      san: '',
      score: ''
    }));
    setTopLines(lines);
    evaluationBufferRef.current.topLines = Array.from({ length: numLines }, (_, i) => ({
      rank: i + 1,
      pvMoves: [],
      score: ''
    }));
  }, [numLines]);

  // Interval for flushing engine evaluations to state (4 times per second max)
  useEffect(() => {
    if (!isEngineOn || isGamified) return;

    const intervalId = setInterval(() => {
      const buf = evaluationBufferRef.current;
      setDepth(buf.depth);
      setNps(buf.nps);
      setEvalScore(buf.evalScore);
      
      const formattedLines = buf.topLines.map(line => {
        if (!line.pvMoves || line.pvMoves.length === 0) {
          return { rank: line.rank, pv: '', san: '', score: line.score };
        }
        const sanMoves = convertPVToSAN(fenRef.current, line.pvMoves).slice(0, MAX_DISPLAY_PLIES);
        const formattedPV = formatMovesWithNumbers(fenRef.current, sanMoves);
        return {
          rank: line.rank,
          pv: line.pvMoves.join(' '),
          san: formattedPV,
          score: line.score
        };
      });
      setTopLines(formattedLines);
    }, 250);

    return () => clearInterval(intervalId);
  }, [isEngineOn, isGamified]);

  // Initialize Stockfish Worker
  useEffect(() => {
    if (isGamified || !isEngineOn) {
      setStatus('ready');
      setDepth(0);
      setNps(0);
      return;
    }

    try {
      setStatus('initializing');
      const useThreads = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
      const engineFile = useThreads
        ? '/engine/stockfish-18-lite.js'
        : '/engine/stockfish-18-lite-single.js';
      const worker = new Worker(engineFile);
      workerRef.current = worker;

      worker.onmessage = (event: MessageEvent) => {
        const line = event.data;

        if (line === 'readyok') {
          setStatus('ready');
        } else if (line.startsWith('bestmove')) {
          isSearchingRef.current = false;
          if (pendingFenRef.current !== null) {
            const newFen = pendingFenRef.current;
            pendingFenRef.current = null;
            isSearchingRef.current = true;
            if (workerRef.current) {
              analyzingFenRef.current = newFen; // Update analyzing FEN
              workerRef.current.postMessage(`setoption name MultiPV value ${numLinesRef.current}`);
              workerRef.current.postMessage(`position fen ${newFen}`);
              workerRef.current.postMessage(`go depth ${SEARCH_DEPTH}`);
            }
          }
        } else if (line.startsWith('info ')) {
          if (!isEngineOnRef.current) return;
          // Ignore evaluations that don't match the FEN we are currently analyzing
          if (analyzingFenRef.current !== fenRef.current) return;

          const turn = fenRef.current.split(' ')[1] === 'b' ? 'b' : 'w';
          const parsed = parseStockfishLine(line, turn);

          if (parsed && parsed.multipv <= numLinesRef.current) {
            evaluationBufferRef.current.depth = parsed.depth;
            if (parsed.nps) {
              evaluationBufferRef.current.nps = parsed.nps;
            }
            
            // Format score
            let scoreStr = '';
            if (parsed.scoreType === 'cp') {
              const val = parsed.scoreValue / 100;
              scoreStr = (val >= 0 ? '+' : '') + val.toFixed(2);
            } else if (parsed.scoreType === 'mate') {
              scoreStr = parsed.scoreValue > 0 ? `M+${parsed.scoreValue}` : `M-${Math.abs(parsed.scoreValue)}`;
            }

            // Update topLines in buffer
            const updatedLines = [...evaluationBufferRef.current.topLines];
            while (updatedLines.length < parsed.multipv) {
              updatedLines.push({ rank: updatedLines.length + 1, pvMoves: [], score: '' });
            }
            const idx = parsed.multipv - 1;
            updatedLines[idx] = {
              rank: parsed.multipv,
              pvMoves: parsed.pvMoves,
              score: scoreStr
            };
            evaluationBufferRef.current.topLines = updatedLines.slice(0, numLinesRef.current);

            // Update main eval score in buffer from depth rank 1
            if (parsed.multipv === 1) {
              let mainEvalStr = '';
              if (parsed.scoreType === 'cp') {
                const val = parsed.scoreValue / 100;
                mainEvalStr = (val >= 0 ? '+' : '') + val.toFixed(1);
              } else if (parsed.scoreType === 'mate') {
                mainEvalStr = parsed.scoreValue > 0 ? `M+${parsed.scoreValue}` : `M-${Math.abs(parsed.scoreValue)}`;
              }
              evaluationBufferRef.current.evalScore = mainEvalStr;
            }
          }
        }
      };

      worker.onerror = () => {
        setStatus('error');
      };

      // Set up engine options
      worker.postMessage('uci');
      if (useThreads) {
        const threads = Math.min(2, navigator.hardwareConcurrency || 1);
        worker.postMessage(`setoption name Threads value ${threads}`);
      }
      worker.postMessage('setoption name Hash value 128');
      worker.postMessage(`setoption name MultiPV value ${numLinesRef.current}`);
      worker.postMessage('isready');

    } catch (e) {
      console.error('Failed to load stockfish worker:', e);
      setStatus('error');
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [isEngineOn, isGamified]);

  // Handle position/FEN updates & lines settings changes
  useEffect(() => {
    if (isGamified || status === 'error') return;
    if (!isEngineOn) {
      if (workerRef.current) {
        workerRef.current.postMessage('stop');
      }
      return;
    }

    // First check if the game is over
    try {
      const chess = new Chess(fen);
      if (chess.isGameOver()) {
        setIsGameOver(true);
        if (chess.isCheckmate()) {
          setEvalScore('#');
          const turnText = chess.turn() === 'w' ? 'Black wins (Checkmate)' : 'White wins (Checkmate)';
          setGameOverText(turnText);
          const lines = Array.from({ length: numLines }, (_, i) => ({
            rank: i + 1,
            pv: i === 0 ? turnText : '',
            san: i === 0 ? turnText : '',
            score: i === 0 ? (chess.turn() === 'w' ? '0-1' : '1-0') : ''
          }));
          setTopLines(lines);
          evaluationBufferRef.current.topLines = Array.from({ length: numLines }, (_, i) => ({
            rank: i + 1,
            pvMoves: i === 0 ? [turnText] : [],
            score: i === 0 ? (chess.turn() === 'w' ? '0-1' : '1-0') : ''
          }));
        } else if (chess.isDraw()) {
          setEvalScore('0.0');
          let drawReason = 'Draw';
          if (chess.isStalemate()) drawReason = 'Draw (Stalemate)';
          else if (chess.isThreefoldRepetition()) drawReason = 'Draw (Repetition)';
          else if (chess.isInsufficientMaterial()) drawReason = 'Draw (Insufficient Material)';
          setGameOverText(drawReason);
          const lines = Array.from({ length: numLines }, (_, i) => ({
            rank: i + 1,
            pv: i === 0 ? drawReason : '',
            san: i === 0 ? drawReason : '',
            score: i === 0 ? '1/2-1/2' : ''
          }));
          setTopLines(lines);
          evaluationBufferRef.current.topLines = Array.from({ length: numLines }, (_, i) => ({
            rank: i + 1,
            pvMoves: i === 0 ? [drawReason] : [],
            score: i === 0 ? '1/2-1/2' : ''
          }));
        }
        
        if (workerRef.current) {
          workerRef.current.postMessage('stop');
        }
        return;
      }
    } catch (e) {
      // Ignore fen parsing errors
    }

    setIsGameOver(false);
    setGameOverText('');

    if (workerRef.current && (status === 'ready' || status === 'analyzing')) {
      setStatus('analyzing');
      setDepth(0);
      setNps(0);

      // Clear the evaluation buffer for the new search
      const initialLines = Array.from({ length: numLines }, (_, i) => ({
        rank: i + 1,
        pvMoves: [],
        score: ''
      }));
      evaluationBufferRef.current = {
        depth: 0,
        nps: 0,
        evalScore: '0.0',
        topLines: initialLines
      };
      
      if (isSearchingRef.current) {
        pendingFenRef.current = fen;
        workerRef.current.postMessage('stop');
      } else {
        isSearchingRef.current = true;
        analyzingFenRef.current = fen; // Update current analyzing FEN
        workerRef.current.postMessage(`setoption name MultiPV value ${numLines}`);
        workerRef.current.postMessage(`position fen ${fen}`);
        workerRef.current.postMessage(`go depth ${SEARCH_DEPTH}`);
      }
    }
  }, [fen, status, isEngineOn, numLines, isGamified]);

  const getScoreBadgeClass = (score: string, rank: number) => {
    if (!score || score === '--') return 'badge-neutral';
    if (rank !== 1) return 'badge-neutral';
    
    if (score.startsWith('+') || score.startsWith('M+')) {
      return 'badge-white-adv';
    }
    if (score.startsWith('-') || score.startsWith('M-')) {
      return 'badge-black-adv';
    }
    return 'badge-neutral';
  };

  const formatNps = (n: number) => {
    if (!n) return '';
    if (n >= 1000000) {
      return ` · ${(n / 1000000).toFixed(1)} Mn/s`;
    }
    return ` · ${(n / 1000).toFixed(0)} Kn/s`;
  };

  if (isGamified) {
    const handleSwitchClick = () => {
      setShowToast(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setShowToast(false);
      }, 5000);
    };

    return (
      <div className="engine-analysis-container" style={{ position: 'relative' }}>
        {showToast && (
          <div className="custom-toast-overlay">
            <div className="custom-toast">
              <AlertCircle className="custom-toast-icon" size={18} />
              <span className="custom-toast-message">Engine is disabled for gamified board</span>
              <button className="custom-toast-close" onClick={() => setShowToast(false)}>&times;</button>
            </div>
          </div>
        )}
        {/* Header bar matching the user mockup */}
        <div className="engine-header">
          <div className="engine-title-group">
            <Cpu className="engine-icon" size={18} />
            <span className="engine-title">Engine</span>
          </div>
          <div className="engine-controls" onClick={handleSwitchClick} style={{ cursor: 'pointer' }}>
            <span className="engine-status-text">disabled</span>
            <label className="engine-switch disabled-switch" style={{ pointerEvents: 'none' }}>
              <input 
                type="checkbox" 
                checked={false} 
                disabled
                aria-label="Toggle Engine Analysis"
              />
              <span className="engine-slider" />
            </label>
          </div>
        </div>

        {/* Engine stats row */}
        <div className="engine-stats-row">
          <span className="engine-name-label">Stockfish 18 · NNUE</span>
        </div>

        {/* Main output lines scroll area */}
        <div className="analysis-lines-scroll">
          <div className="engine-disabled-state">
            <div className="disabled-badge">
              <AlertCircle className="engine-disabled-icon" size={28} />
            </div>
            <span className="engine-disabled-text">Engine is disabled for gamified board</span>
            <span className="engine-disabled-subtext">Interactive analysis is only available for standard chess boards.</span>
          </div>
        </div>

        <style>{`
          .custom-toast-overlay {
            position: absolute;
            top: 12px;
            left: 12px;
            right: 12px;
            z-index: 50;
            animation: slideDown 0.3s ease-out;
          }

          @keyframes slideDown {
            from {
              transform: translateY(-20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .custom-toast {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #dc2626;
            color: #ffffff;
            padding: 10px 14px;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            font-size: 0.85rem;
            font-weight: 500;
          }

          .custom-toast-icon {
            flex-shrink: 0;
          }

          .custom-toast-message {
            flex-grow: 1;
          }

          .custom-toast-close {
            background: none;
            border: none;
            color: #ffffff;
            font-size: 1.2rem;
            line-height: 1;
            cursor: pointer;
            padding: 0 4px;
            opacity: 0.8;
            transition: opacity 0.15s;
          }

          .custom-toast-close:hover {
            opacity: 1;
          }

          .engine-analysis-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            color: #334155;
            font-family: var(--font-sans), system-ui, -apple-system, sans-serif;
            background: #ffffff;
          }

          .engine-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid #f1f5f9;
          }

          .engine-title-group {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .engine-icon {
            color: #94a3b8;
          }

          .engine-title {
            font-size: 1rem;
            font-weight: 600;
            color: #0f172a;
          }

          .engine-controls {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .engine-status-text {
            font-size: 0.8rem;
            font-weight: 500;
            color: #94a3b8;
            text-transform: lowercase;
          }

          /* Switch Styling */
          .engine-switch {
            position: relative;
            display: inline-block;
            width: 40px;
            height: 22px;
          }

          .engine-switch input {
            opacity: 0;
            width: 0;
            height: 0;
          }

          .engine-slider {
            position: absolute;
            cursor: not-allowed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #e2e8f0;
            transition: .2s ease;
            border-radius: 22px;
          }

          .engine-slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .2s ease;
            border-radius: 50%;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }

          .disabled-switch {
            opacity: 0.6;
            cursor: not-allowed;
          }

          /* Stats Row */
          .engine-stats-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 16px;
            background: #f8fafc;
            border-bottom: 1px solid #f1f5f9;
            font-size: 0.75rem;
            color: #94a3b8;
            font-weight: 500;
          }

          .engine-name-label {
            color: #94a3b8;
          }

          /* Disabled State */
          .analysis-lines-scroll {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .engine-disabled-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 24px;
            text-align: center;
          }

          .disabled-badge {
            background: #f1f5f9;
            border-radius: 50%;
            padding: 16px;
            margin-bottom: 16px;
          }

          .engine-disabled-icon {
            color: #94a3b8;
          }

          .engine-disabled-text {
            font-size: 0.95rem;
            font-weight: 600;
            color: #475569;
            margin-bottom: 6px;
          }

          .engine-disabled-subtext {
            font-size: 0.8rem;
            color: #64748b;
            max-width: 240px;
            line-height: 1.4;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="engine-analysis-container">
      {/* Header bar matching the user mockup */}
      <div className="engine-header">
        <div className="engine-title-group">
          <Cpu className="engine-icon" size={18} />
          <span className="engine-title">Engine</span>
        </div>
        <div className="engine-controls">
          <span className={`engine-status-text ${isEngineOn ? 'active' : ''}`}>
            {isEngineOn ? 'on' : 'off'}
          </span>
          <label className="engine-switch">
            <input 
              type="checkbox" 
              checked={isEngineOn} 
              onChange={(e) => setIsEngineOn(e.target.checked)} 
              aria-label="Toggle Engine Analysis"
            />
            <span className="engine-slider" />
          </label>
          <button className="engine-menu-btn" title="More Options">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Engine stats row */}
      <div className="engine-stats-row">
        <span className="engine-name-label">Stockfish 18 · NNUE</span>
        {isEngineOn && !isGameOver && (
          <span className="engine-performance-label">
            depth {depth}{formatNps(nps)}
          </span>
        )}
      </div>

      {/* Lines count selector row */}
      <div className="engine-lines-row">
        <span className="lines-label">Lines</span>
        <div className="lines-control-buttons">
          <button 
            className="lines-btn" 
            onClick={() => setNumLines(prev => Math.max(1, prev - 1))} 
            disabled={numLines <= 1 || !isEngineOn}
            title="Decrease lines count"
          >
            <Minus size={13} />
          </button>
          <span className="lines-count">{numLines}</span>
          <button 
            className="lines-btn" 
            onClick={() => setNumLines(prev => Math.min(5, prev + 1))} 
            disabled={numLines >= 5 || !isEngineOn}
            title="Increase lines count"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Main output lines scroll area */}
      <div className="analysis-lines-scroll">
        {!isEngineOn ? (
          <div className="engine-off-state">
            <Cpu className="engine-off-icon animate-pulse" size={24} />
            <span className="engine-off-text">Engine is paused</span>
            <span className="engine-off-subtext">Toggle the switch above to start live analysis</span>
          </div>
        ) : isGameOver ? (
          <div className="game-over-state">
            <span className="game-over-title">Game Over</span>
            <span className="game-over-desc">{gameOverText}</span>
          </div>
        ) : (
          <div className="lines-list">
            {topLines.map((line) => (
              <div key={line.rank} className="line-item">
                <span className={`line-score-badge ${getScoreBadgeClass(line.score, line.rank)}`}>
                  {line.score || '--'}
                </span>
                <div className="line-moves">
                  {line.san ? (
                    <span className="moves-text">{line.san}</span>
                  ) : (
                    <span className="moves-empty">Calculating...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .engine-analysis-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          color: #334155;
          font-family: var(--font-sans), system-ui, -apple-system, sans-serif;
          background: #ffffff;
        }

        .engine-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .engine-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .engine-icon {
          color: #0f766e;
        }

        .engine-title {
          font-size: 1rem;
          font-weight: 600;
          color: #0f172a;
        }

        .engine-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .engine-status-text {
          font-size: 0.8rem;
          font-weight: 500;
          color: #64748b;
          text-transform: lowercase;
        }

        .engine-status-text.active {
          color: #15803d;
          font-weight: 600;
        }

        /* Switch Styling */
        .engine-switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 22px;
        }

        .engine-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .engine-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          transition: .2s ease;
          border-radius: 22px;
        }

        .engine-slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .2s ease;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }

        input:checked + .engine-slider {
          background-color: #15803d;
        }

        input:checked + .engine-slider:before {
          transform: translateX(18px);
        }

        .engine-menu-btn {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.15s;
        }

        .engine-menu-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        /* Stats Row */
        .engine-stats-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          background: #f8fafc;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
        }

        .engine-name-label {
          color: #475569;
        }

        .engine-performance-label {
          font-variant-numeric: tabular-nums;
        }

        /* Lines Row */
        .engine-lines-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .lines-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
        }

        .lines-control-buttons {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 2px 4px;
        }

        .lines-btn {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #475569;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }

        .lines-btn:hover:not(:disabled) {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .lines-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: #f8fafc;
        }

        .lines-count {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0f172a;
          min-width: 14px;
          text-align: center;
        }

        /* Lines Output */
        .analysis-lines-scroll {
          flex: 1;
          overflow-y: auto;
        }

        .lines-list {
          display: flex;
          flex-direction: column;
        }

        .line-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.15s;
        }

        .line-item:hover {
          background: #f8fafc;
        }

        .line-score-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
          min-width: 48px;
          text-align: center;
          flex-shrink: 0;
          font-variant-numeric: tabular-nums;
        }

        .badge-white-adv {
          background-color: #dcfce7;
          color: #15803d;
        }

        .badge-black-adv {
          background-color: #fee2e2;
          color: #b91c1c;
        }

        .badge-neutral {
          background-color: #f1f5f9;
          color: #475569;
        }

        .line-moves {
          font-size: 0.85rem;
          line-height: 1.5;
          flex: 1;
        }

        .moves-text {
          color: #1e293b;
          font-weight: 500;
          word-break: break-word;
        }

        .moves-empty {
          color: #94a3b8;
          font-style: italic;
        }

        /* Engine Off State */
        .engine-off-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 220px;
          padding: 24px;
          text-align: center;
        }

        .engine-off-icon {
          color: #94a3b8;
          margin-bottom: 12px;
        }

        .engine-off-text {
          font-size: 0.95rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 4px;
        }

        .engine-off-subtext {
          font-size: 0.8rem;
          color: #64748b;
          max-width: 200px;
          line-height: 1.4;
        }

        /* Game Over State */
        .game-over-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 140px;
          background: #f8fafc;
          border: 1px dashed #e2e8f0;
          border-radius: 8px;
          margin: 16px;
        }

        .game-over-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #dc2626;
          margin-bottom: 4px;
        }

        .game-over-desc {
          font-size: 0.8rem;
          color: #475569;
        }
      `}</style>
    </div>
  );
}
