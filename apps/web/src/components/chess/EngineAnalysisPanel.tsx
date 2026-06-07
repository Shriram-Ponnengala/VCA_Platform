'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';

interface EngineAnalysisPanelProps {
  fen: string;
}

interface AnalysisLine {
  rank: number;
  pv: string;
  san: string;
  score: string;
}

type EngineStatus = 'initializing' | 'ready' | 'analyzing' | 'error';

function parseStockfishLine(line: string, turn: 'w' | 'b') {
  if (!line.startsWith('info ')) return null;
  const parts = line.split(/\s+/);
  
  const depthIdx = parts.indexOf('depth');
  const multipvIdx = parts.indexOf('multipv');
  const scoreIdx = parts.indexOf('score');
  const pvIdx = parts.indexOf('pv');
  
  if (depthIdx === -1 || multipvIdx === -1 || scoreIdx === -1 || pvIdx === -1) {
    return null;
  }
  
  const depth = parseInt(parts[depthIdx + 1], 10);
  const multipv = parseInt(parts[multipvIdx + 1], 10);
  
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
    pvMoves
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
  const [status, setStatus] = useState<EngineStatus>('initializing');
  const [depth, setDepth] = useState<number>(0);
  const [evalScore, setEvalScore] = useState<string>('0.0');
  const [topLines, setTopLines] = useState<AnalysisLine[]>([
    { rank: 1, pv: '', san: '', score: '0.00' },
    { rank: 2, pv: '', san: '', score: '0.00' },
    { rank: 3, pv: '', san: '', score: '0.00' }
  ]);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [gameOverText, setGameOverText] = useState<string>('');

  const workerRef = useRef<Worker | null>(null);
  const fenRef = useRef<string>(fen);

  // Keep FEN ref updated so message listener always has the latest position
  useEffect(() => {
    fenRef.current = fen;
  }, [fen]);

  // Initialize Stockfish Worker
  useEffect(() => {
    try {
      setStatus('initializing');
      const worker = new Worker('/stockfish.js');
      workerRef.current = worker;

      worker.onmessage = (event: MessageEvent) => {
        const line = event.data;

        if (line === 'readyok') {
          setStatus('ready');
        } else if (line.startsWith('info ')) {
          const chess = new Chess(fenRef.current);
          const parsed = parseStockfishLine(line, chess.turn());

          if (parsed && parsed.multipv <= 3) {
            setDepth(parsed.depth);
            
            // Format score
            let scoreStr = '';
            if (parsed.scoreType === 'cp') {
              const val = parsed.scoreValue / 100;
              scoreStr = (val >= 0 ? '+' : '') + val.toFixed(2);
            } else if (parsed.scoreType === 'mate') {
              scoreStr = parsed.scoreValue > 0 ? `M+${parsed.scoreValue}` : `M-${Math.abs(parsed.scoreValue)}`;
            }

            // Convert and format PV
            const sanMoves = convertPVToSAN(fenRef.current, parsed.pvMoves);
            const formattedPV = formatMovesWithNumbers(fenRef.current, sanMoves);

            setTopLines(prev => {
              const updated = [...prev];
              const idx = parsed.multipv - 1;
              updated[idx] = {
                rank: parsed.multipv,
                pv: parsed.pvMoves.join(' '),
                san: formattedPV,
                score: scoreStr
              };
              return updated;
            });

            // Update main eval score from depth rank 1
            if (parsed.multipv === 1) {
              let mainEvalStr = '';
              if (parsed.scoreType === 'cp') {
                const val = parsed.scoreValue / 100;
                mainEvalStr = (val >= 0 ? '+' : '') + val.toFixed(1);
              } else if (parsed.scoreType === 'mate') {
                mainEvalStr = parsed.scoreValue > 0 ? `M+${parsed.scoreValue}` : `M-${Math.abs(parsed.scoreValue)}`;
              }
              setEvalScore(mainEvalStr);
            }
          }
        }
      };

      worker.onerror = () => {
        setStatus('error');
      };

      // Set up engine options
      worker.postMessage('uci');
      worker.postMessage('setoption name MultiPV value 3');
      worker.postMessage('isready');

    } catch (e) {
      console.error('Failed to load stockfish worker:', e);
      setStatus('error');
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Handle position/FEN updates
  useEffect(() => {
    if (status === 'error') return;

    // First check if the game is over
    try {
      const chess = new Chess(fen);
      if (chess.isGameOver()) {
        setIsGameOver(true);
        if (chess.isCheckmate()) {
          setEvalScore('#');
          const turnText = chess.turn() === 'w' ? 'Black wins (Checkmate)' : 'White wins (Checkmate)';
          setGameOverText(turnText);
          setTopLines([
            { rank: 1, pv: '', san: turnText, score: chess.turn() === 'w' ? '0-1' : '1-0' },
            { rank: 2, pv: '', san: '', score: '' },
            { rank: 3, pv: '', san: '', score: '' }
          ]);
        } else if (chess.isDraw()) {
          setEvalScore('0.0');
          let drawReason = 'Draw';
          if (chess.isStalemate()) drawReason = 'Draw (Stalemate)';
          else if (chess.isThreefoldRepetition()) drawReason = 'Draw (Repetition)';
          else if (chess.isInsufficientMaterial()) drawReason = 'Draw (Insufficient Material)';
          setGameOverText(drawReason);
          setTopLines([
            { rank: 1, pv: '', san: drawReason, score: '1/2-1/2' },
            { rank: 2, pv: '', san: '', score: '' },
            { rank: 3, pv: '', san: '', score: '' }
          ]);
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
      workerRef.current.postMessage('stop');
      workerRef.current.postMessage(`position fen ${fen}`);
      workerRef.current.postMessage('go depth 18');
    }
  }, [fen, status]);

  const getStatusText = () => {
    switch (status) {
      case 'initializing': return 'Initializing Engine...';
      case 'ready': return 'Ready';
      case 'analyzing': return isGameOver ? 'Finished' : `Analyzing (Depth ${depth})`;
      case 'error': return 'Engine Error';
      default: return '';
    }
  };

  return (
    <div className="engine-analysis-container">
      <div className="engine-header">
        <div className="engine-title-row">
          <span className="engine-title">Engine Analysis</span>
          <span className={`engine-status-badge ${status}`}>
            {getStatusText()}
          </span>
        </div>
        {!isGameOver && (
          <div className="engine-stats">
            <div className="stat-box">
              <span className="stat-label">Evaluation</span>
              <span className={`stat-value ${evalScore.startsWith('-') ? 'black-advantage' : 'white-advantage'}`}>
                {evalScore}
              </span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Search Depth</span>
              <span className="stat-value">{depth} / 18</span>
            </div>
          </div>
        )}
      </div>

      <div className="analysis-lines-scroll">
        {isGameOver ? (
          <div className="game-over-state">
            <span className="game-over-title">Game Over</span>
            <span className="game-over-desc">{gameOverText}</span>
          </div>
        ) : (
          <div className="lines-list">
            {topLines.map((line) => (
              <div key={line.rank} className="line-item">
                <div className="line-item-header">
                  <span className="line-rank">#{line.rank}</span>
                  <span className="line-score">{line.score || '--'}</span>
                </div>
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
          color: #4a2018;
          font-family: inherit;
        }

        .engine-header {
          border-bottom: 1px solid #eedcd0;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }

        .engine-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .engine-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #2d4a6b;
        }

        .engine-status-badge {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 12px;
          text-transform: capitalize;
          border: 1px solid transparent;
        }

        .engine-status-badge.initializing {
          background: rgba(251, 191, 36, 0.1);
          color: #d97706;
          border-color: rgba(251, 191, 36, 0.2);
        }

        .engine-status-badge.ready {
          background: rgba(74, 222, 128, 0.1);
          color: #16a34a;
          border-color: rgba(74, 222, 128, 0.2);
        }

        .engine-status-badge.analyzing {
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
          border-color: rgba(59, 130, 246, 0.2);
        }

        .engine-status-badge.error {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          border-color: rgba(239, 68, 68, 0.2);
        }

        .engine-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .stat-box {
          background: #fdf5ea;
          border: 1px solid #eedcd0;
          border-radius: 8px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-label {
          font-size: 0.72rem;
          color: rgba(74, 32, 24, 0.6);
          margin-bottom: 2px;
          font-weight: 500;
        }

        .stat-value {
          font-size: 1.1rem;
          font-weight: 700;
        }

        .stat-value.white-advantage {
          color: #2d4a6b;
        }

        .stat-value.black-advantage {
          color: #c8854a;
        }

        .analysis-lines-scroll {
          flex: 1;
          overflow-y: auto;
          padding-right: 4px;
        }

        .game-over-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 120px;
          background: #fdf5ea;
          border: 1px dashed #eedcd0;
          border-radius: 12px;
        }

        .game-over-title {
          font-size: 1rem;
          font-weight: 700;
          color: #ef4444;
          margin-bottom: 4px;
        }

        .game-over-desc {
          font-size: 0.85rem;
          color: rgba(74, 32, 24, 0.7);
        }

        .lines-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 250px;
        }

        .line-item {
          background: #ffffff;
          border: 1px solid #eedcd0;
          border-radius: 8px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          box-shadow: 0 2px 4px rgba(45, 74, 107, 0.02);
        }

        .line-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #fdf5ea;
          padding-bottom: 4px;
        }

        .line-rank {
          font-size: 0.78rem;
          font-weight: 700;
          color: #c8854a;
        }

        .line-score {
          font-size: 0.82rem;
          font-weight: 700;
          color: #2d4a6b;
          background: #fdf5ea;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .line-moves {
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .moves-text {
          color: #4a2018;
          font-weight: 500;
          word-break: break-word;
        }

        .moves-empty {
          color: rgba(74, 32, 24, 0.4);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
