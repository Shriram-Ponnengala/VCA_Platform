import React, { useEffect, useRef, useState } from 'react';
import { Chess, Move } from '@vca/chess';
import { Chessground } from 'chessground';
import type { Api } from 'chessground/api';
import type { Config } from 'chessground/config';
import { ArrowLeft, Clock, Star, Heart, Lightbulb, Eye, CheckCircle2, XCircle, ChevronRight, FileText } from 'lucide-react';
import styles from './boardPuzzleSolver.module.css';

import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';

const PUZZLE = {
  id: '1',
  fen: 'r1bqk2r/ppp2ppp/2n5/2b5/2B5/2N2N2/PPP2PPP/R1BQK2R w KQkq - 0 1', // standard opening
  solution: ['Bxf7+', 'Kxf7', 'Qxd8'], // Fake solution for UI testing
  topic: 'Forks',
  difficulty: 'Medium',
  points: 10,
  timeLimit: 150, // 2:30
  hints: ['Look for a move that attacks two pieces at the same time.', 'Can you attack the king?'],
  explanation: 'The bishop sacrifices itself to open the d-file, allowing the queen to win the enemy queen.',
  orientation: 'white' as const
};

type PuzzleState = 'idle' | 'correct' | 'wrong' | 'completed' | 'failed';

export const BoardPuzzleSolver: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  
  const [game, setGame] = useState(new Chess(PUZZLE.fen));
  const [puzzleState, setPuzzleState] = useState<PuzzleState>('idle');
  const [score, setScore] = useState(40);
  const [attempts, setAttempts] = useState(3);
  const [timeLeft, setTimeLeft] = useState(PUZZLE.timeLimit);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [userMove, setUserMove] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showSolutionUsed, setShowSolutionUsed] = useState(false);

  // Timer
  useEffect(() => {
    if (puzzleState === 'completed' || puzzleState === 'failed') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [puzzleState]);

  // Init Board
  useEffect(() => {
    if (containerRef.current && !cgRef.current) {
      cgRef.current = Chessground(containerRef.current, {
        fen: PUZZLE.fen,
        orientation: PUZZLE.orientation,
        turnColor: PUZZLE.orientation,
        movable: {
          color: PUZZLE.orientation,
          free: false,
          events: {
            after: handleMove
          }
        }
      });
    }
  }, []);

  const handleMove = (orig: string, dest: string, metadata: any) => {
    const cg = cgRef.current;
    if (!cg) return;

    const gameCopy = new Chess(game.fen());
    
    try {
      // Handle potential promotion
      const moves = gameCopy.moves({ verbose: true });
      const moveOpts = moves.find(m => m.from === orig && m.to === dest);
      
      let moveObj;
      if (moveOpts && moveOpts.promotion) {
        moveObj = gameCopy.move({ from: orig, to: dest, promotion: 'q' });
      } else {
        moveObj = gameCopy.move({ from: orig, to: dest });
      }

      setGame(gameCopy);
      setUserMove(moveObj.san);

      // Check if move matches solution
      const expectedSan = PUZZLE.solution[currentMoveIndex];
      
      if (moveObj.san === expectedSan) {
        // Correct Move
        setPuzzleState(currentMoveIndex === PUZZLE.solution.length - 1 ? 'completed' : 'correct');
        setScore(prev => prev + (currentMoveIndex === PUZZLE.solution.length - 1 ? PUZZLE.points : 0));
        cg.set({ movable: { color: undefined } }); // lock board
      } else {
        // Wrong Move
        setPuzzleState('wrong');
        setAttempts(prev => Math.max(0, prev - 1));
        cg.set({ movable: { color: undefined } }); // lock board temporarily
      }
    } catch (e) {
      // Invalid move, revert
      cg.set({ fen: game.fen() });
    }
  };

  const handleTryAgain = () => {
    if (attempts === 0) {
      setPuzzleState('failed');
      return;
    }
    
    // Revert board to last correct state
    const gameCopy = new Chess(PUZZLE.fen);
    for (let i = 0; i < currentMoveIndex; i++) {
      gameCopy.move(PUZZLE.solution[i]);
    }
    setGame(gameCopy);
    setUserMove(null);
    setPuzzleState('idle');
    
    if (cgRef.current) {
      cgRef.current.set({
        fen: gameCopy.fen(),
        turnColor: PUZZLE.orientation,
        movable: { color: PUZZLE.orientation }
      });
    }
  };

  const handleNextQuestion = () => {
    if (currentMoveIndex < PUZZLE.solution.length - 1) {
      // Opponent makes their move
      const opponentMoveSan = PUZZLE.solution[currentMoveIndex + 1];
      const gameCopy = new Chess(game.fen());
      const moveObj = gameCopy.move(opponentMoveSan);
      
      setGame(gameCopy);
      setCurrentMoveIndex(prev => prev + 2);
      setPuzzleState('idle');
      setUserMove(null);

      if (cgRef.current) {
        cgRef.current.set({
          fen: gameCopy.fen(),
          turnColor: PUZZLE.orientation,
          lastMove: [moveObj.from, moveObj.to],
          movable: { color: PUZZLE.orientation }
        });
      }
    } else {
      // Go to next puzzle logic (mocked)
      alert("Moving to next puzzle!");
    }
  };

  const handleHint = (index: number, cost: number) => {
    setHintsUsed(Math.max(hintsUsed, index + 1));
    setScore(prev => Math.max(0, prev - cost));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.solverContainer}>
      <div className={styles.solverWrapper}>
        
        {/* Top Bar */}
        <div className={styles.topBar}>
          <div className={styles.topLeft}>
            <button className={styles.backButton}>
              <ArrowLeft size={20} />
            </button>
            <div className={styles.breadcrumb}>
              <span>Homework</span>
              <ChevronRight size={14} />
              <span className={styles.breadcrumbCurrent}>Tactics Mastery - {PUZZLE.topic}</span>
            </div>
          </div>

          <div className={styles.topRight}>
            <div className={styles.topStat}>
              <Clock size={18} color="#3b82f6" />
              <div className={styles.topStatLabel}>
                <span className={styles.topStatValue}>{formatTime(timeLeft)}</span>
                <span>Time Left</span>
              </div>
            </div>
            <div className={styles.topStat}>
              <Star size={18} color="#eab308" fill="#eab308" />
              <div className={styles.topStatLabel}>
                <span className={styles.topStatValue}>{score}</span>
                <span>Score</span>
              </div>
            </div>
            <div className={styles.topStat}>
              <Heart size={18} color="#ef4444" fill="#ef4444" />
              <div className={styles.topStatLabel}>
                <span className={styles.topStatValue}>{attempts}/3</span>
                <span>Attempts</span>
              </div>
            </div>
            <button className={styles.submitBtn}>
              Submit
            </button>
          </div>
        </div>

        {/* 3 Columns */}
        <div className={styles.grid3Col}>
          
          {/* Left: Board */}
          <div className={styles.boardContainer}>
             <div className={styles.boardWrapper} ref={containerRef}></div>
          </div>

          {/* Middle: Interaction / Feedback */}
          <div className={styles.middleCol}>
            
            {puzzleState === 'idle' && (
              <>
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Question 4 / 12</span>
                    <span className={styles.tagBlue}>Board Puzzle</span>
                  </div>
                  <div className={styles.questionPrompt}>White to move and win.</div>
                  <div className={styles.questionSub}>Find the best move.</div>
                </div>

                <div className={styles.card}>
                  <div className={styles.cardTitle} style={{ marginBottom: '0.5rem' }}>Your Move</div>
                  <div className={styles.questionSub}>Make your move on the board and click Submit</div>
                  <div className={`${styles.yourMoveBox} ${userMove ? styles.hasMove : ''}`}>
                    {userMove || '?'}
                  </div>
                </div>

                <div className={styles.card}>
                  <div className={styles.cardTitle} style={{ marginBottom: '1rem' }}>Help</div>
                  <div className={styles.helpList}>
                    <button 
                      className={styles.helpBtn} 
                      onClick={() => handleHint(0, 2)}
                      disabled={hintsUsed > 0}
                    >
                      <span><Lightbulb size={16} color={hintsUsed > 0 ? "#eab308" : "currentColor"} /> Hint 1</span>
                      <span className={styles.ptsBadge}>-2 pts</span>
                    </button>
                    {hintsUsed > 0 && <div className={styles.questionSub} style={{ padding: '0 0.5rem' }}>{PUZZLE.hints[0]}</div>}
                    
                    <button 
                      className={styles.helpBtn} 
                      onClick={() => handleHint(1, 3)}
                      disabled={hintsUsed > 1}
                    >
                      <span><Lightbulb size={16} color={hintsUsed > 1 ? "#eab308" : "currentColor"} /> Hint 2</span>
                      <span className={styles.ptsBadge}>-3 pts</span>
                    </button>
                    {hintsUsed > 1 && <div className={styles.questionSub} style={{ padding: '0 0.5rem' }}>{PUZZLE.hints[1]}</div>}
                    
                    <button 
                      className={styles.helpBtn}
                      disabled={attempts > 0}
                    >
                      <span><Eye size={16} /> Show Solution</span>
                      <span className={styles.ptsBadge}>0 pts</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Correct Panel */}
            {(puzzleState === 'correct' || puzzleState === 'completed') && (
              <div className={styles.correctPanel}>
                <div className={styles.correctHeader}>
                  <CheckCircle2 size={24} />
                  Correct!
                </div>
                <div className={styles.questionPrompt}>Excellent! You found the winning move.</div>
                <div className={styles.correctMove}>{userMove}</div>
                {puzzleState === 'completed' && <div className={styles.questionSub}>{PUZZLE.explanation}</div>}
                <div className={styles.correctPts}>+{PUZZLE.points} Points</div>
                
                <button className={styles.btnPrimary} onClick={handleNextQuestion}>
                  Next Question
                </button>
                {puzzleState === 'completed' && (
                  <button className={styles.btnOutline}>
                    Explanation
                  </button>
                )}
              </div>
            )}

            {/* Wrong Panel */}
            {(puzzleState === 'wrong' || puzzleState === 'failed') && (
              <div className={styles.wrongPanel}>
                <div className={styles.wrongHeader}>
                  <XCircle size={24} />
                  Not quite!
                </div>
                <div className={styles.questionPrompt}>Not the best move.</div>
                <div className={styles.questionSub}>That's not the winning idea.</div>
                
                <div style={{ margin: '1.5rem 0' }}>
                  <div className={styles.cardTitle}>Try again!</div>
                  <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem' }}>
                    <span className={styles.questionSub} style={{ marginRight: '0.5rem' }}>Attempts left:</span>
                    {[1, 2, 3].map(i => (
                      <Heart key={i} size={16} color={i <= attempts ? "#ef4444" : "#fecaca"} fill={i <= attempts ? "#ef4444" : "transparent"} />
                    ))}
                  </div>
                </div>

                <div className={styles.wrongTip}>
                  <div className={styles.cardTitle} style={{ marginBottom: '0.5rem' }}>Tip</div>
                  <div className={styles.questionSub}>{PUZZLE.hints[0]}</div>
                </div>

                <button className={styles.btnOutline} onClick={handleTryAgain} style={{ marginTop: '1.5rem' }}>
                  Try Again
                </button>
              </div>
            )}

          </div>

          {/* Right: Info */}
          <div className={styles.rightCol}>
            
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={18} /> Progress
                </span>
              </div>
              
              <div className={styles.progressGrid}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => {
                  let nodeClass = styles.nodePending;
                  if (num < 4) nodeClass = styles.nodeCompleted;
                  if (num === 4) nodeClass = styles.nodeCurrent;

                  return (
                    <div key={num} className={`${styles.progressNode} ${nodeClass}`}>
                      {num}
                    </div>
                  );
                })}
              </div>

              <div className={styles.progressLegend}>
                <div className={styles.legendItem}><div className={`${styles.legendDot} ${styles.nodeCompleted}`}></div> Completed</div>
                <div className={styles.legendItem}><div className={`${styles.legendDot} ${styles.nodeCurrent}`}></div> Current</div>
                <div className={styles.legendItem}><div className={`${styles.legendDot} ${styles.nodePending}`}></div> Pending</div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} /> Puzzle Info
                </span>
              </div>
              
              <div className={styles.infoList}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Topic</span>
                  <span className={styles.infoValue}>{PUZZLE.topic}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Difficulty</span>
                  <span className={`${styles.infoValue} ${styles.diffMedium}`}>{PUZZLE.difficulty}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Points</span>
                  <span className={styles.infoValue}>{PUZZLE.points}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Average Time</span>
                  <span className={styles.infoValue}>2:30</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
