'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChessBoard from '@/components/chess/ChessBoard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Toast } from '@vca/ui';
import { History, Zap, RotateCcw, Wifi, WifiOff, Users, User, Lock, Unlock, MessageSquare, Send, Eraser, ArrowLeft, Star, ArrowUp, Scissors, Database, Trash2, BookOpen } from 'lucide-react';
import { useChessRoom } from '@/lib/hooks/useChessRoom';
import { MoveNode, ChatMessage } from '@vca/types';
import EngineAnalysisPanel from '@/components/chess/EngineAnalysisPanel';
import DatabasePanel from '@/components/chess/DatabasePanel';
import ChapterCard from '@/components/chess/ChapterCard';

const featureFlags = {
  participants: false,
  chat: false,
  engineAnalysis: true
};

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export default function ClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.batchId as string;
  const ROOM_ID = `batch_${batchId}`;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | undefined>(undefined);

  // Validate join
  useEffect(() => {
    fetch(`/api/classrooms/${batchId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (!data.allowed) {
          setError(data.error || 'Access denied');
        } else {
          console.log('Current logged-in user role:', data.role);
          setUserRole(data.role);
          setToken(data.token);
        }
        setIsLoading(false);
      })
      .catch(err => {
        setError('Error joining classroom');
        setIsLoading(false);
      });
  }, [batchId]);

  const handleContextMenu = (e: React.MouseEvent, nodeId: string) => {
    if (!isCoachOrAdmin) return;
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      nodeId
    });
  };

  const handleMakeMainline = (nodeId: string) => {
    promoteToMainline(nodeId);
    setContextMenu(null);
  };

  const handlePromoteVariation = (nodeId: string) => {
    promoteVariation(nodeId);
    setContextMenu(null);
  };

  const handleDeleteSubsequent = (nodeId: string) => {
    deleteSubsequentMoves(nodeId);
    setContextMenu(null);
  };

  const handleDeletePrevious = (nodeId: string) => {
    deletePreviousMoves(nodeId);
    setContextMenu(null);
  };

  const handleDeleteMove = (nodeId: string) => {
    deleteMove(nodeId);
    setContextMenu(null);
  };

  const { 
    nodes, currentNodeId, participants, isConnected, isReady, isLocked, isFreehand, chatHistory,
    chapters, activeChapterIndex, loadPgn, selectChapter,
    makeMove, makeNullMove, navigate, resetBoard, updateArrows, clearArrows, toggleLock, toggleFreehand, sendChatMessage,
    setupPosition, promoteToMainline, promoteVariation, deleteSubsequentMoves, deletePreviousMoves, deleteMove
  } = useChessRoom(ROOM_ID, token, { enabled: !!token });

  const [userRole, setUserRole] = useState<'admin' | 'coach' | 'student' | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [dbNav, setDbNav] = useState<{ games: any[], currentIndex: number } | null>(null);

  const handleGamesContextLoaded = useCallback((games: any[], currentIndex: number) => {
     setDbNav(games.length > 0 ? { games, currentIndex } : null);
  }, []);

  const isCoachOrAdmin = userRole !== 'student';

  const [activeTab, setActiveTab] = useState<string>('history');
  // Auto switch to chapters tab when chapters are loaded
  useEffect(() => {
    if (chapters && chapters.length > 0) {
      setActiveTab('chapters');
    } else {
      setActiveTab('history');
    }
  }, [chapters?.length]);
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveGameName, setSaveGameName] = useState('');
  const [savingGame, setSavingGame] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const handleSaveToDb = () => {
    setSaveGameName(`Classroom Game - ${new Date().toLocaleDateString()}`);
    setShowSaveModal(true);
  };

  const confirmSaveToDb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveGameName.trim()) return;
    setSavingGame(true);
    try {
      const { buildPgnFromMoveTree } = await import('@/features/database/pgnUtils');
      const pgn = buildPgnFromMoveTree(nodes, 'root');
      
      const res = await fetch('/api/database/collections/save-classroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveGameName.trim(),
          pgnText: pgn
        })
      });
      if (res.ok) {
        setToast({ message: 'Classroom game successfully saved to My DB!', type: 'success' });
        setShowSaveModal(false);
      } else {
        let errorMsg = 'Failed to save game';
        try {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        } catch {
          errorMsg = `Server error: ${res.status} ${res.statusText || ''}`;
        }
        setToast({ message: errorMsg, type: 'error' });
      }
    } catch (err: any) {
      console.error(err);
      setToast({ message: 'Error saving game: ' + err.message, type: 'error' });
    } finally {
      setSavingGame(false);
    }
  };

  const scrollToBottom = () => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [chatHistory, activeTab]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendChatMessage(chatInput.trim());
      setChatInput('');
    }
  };

  // ── Navigation helpers ────────────────────────────────────────────────────
  const getPathToRoot = (nodeId: string, tree: Record<string, MoveNode>): string[] => {
    if (!tree || !nodeId || !tree[nodeId]) return [START_FEN];
    
    const path: string[] = [];
    let curr = tree[nodeId];
    while (curr) {
      path.unshift(curr.fen);
      curr = curr.parentId ? tree[curr.parentId] : (null as any);
    }
    return path;
  };

  const gameHistory = useMemo(
    () => getPathToRoot(currentNodeId, nodes),
    [nodes, currentNodeId]
  );

  const currentNode = nodes[currentNodeId];

  // If loading or error, show fallback UI
  if (isLoading) {
    return (
      <div className="page-wrapper" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: 'white' }}>Joining Classroom...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper" style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ color: '#ef4444' }}>{error}</h2>
        <button onClick={() => router.back()} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', borderRadius: '8px', cursor: 'pointer', border: 'none' }}>
          Go Back
        </button>
      </div>
    );
  }

  if (!currentNode) return null; // Safe guard during init

  const canGoNext = currentNode.children.length > 0;
  const canGoPrev = currentNode.parentId !== null;
  const numBranches = currentNode.children.length;

  const handleNext = () => {
    if (canGoNext) {
      const safeIdx = Math.min(selectedVariationIndex, numBranches - 1);
      navigate(currentNode.children[safeIdx]);
      setSelectedVariationIndex(0);
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      navigate(currentNode.parentId!);
      setSelectedVariationIndex(0);
    }
  };

  const handleStart = () => { navigate('root'); setSelectedVariationIndex(0); };

  const handleEnd = () => {
    let curr = currentNode;
    while (curr.children.length > 0) curr = nodes[curr.children[0]];
    navigate(curr.id);
    setSelectedVariationIndex(0);
  };

  const handleVariationUp = () => {
    if (numBranches > 1)
      setSelectedVariationIndex(i => (i - 1 + numBranches) % numBranches);
  };
  const handleVariationDown = () => {
    if (numBranches > 1)
      setSelectedVariationIndex(i => (i + 1) % numBranches);
  };

  // ── Move handler — emit to server from current node ─────────────
  const handleMove = (move: any, _index: number, _after: string) => {
    makeMove(move.from, move.to, move.promotion ?? 'q', currentNodeId);
  };

  // ── Move history tree renderer ────────────────────────────────────────────
  const InlineVariation = ({ nodeId }: { nodeId: string }) => {
    const node = nodes[nodeId];
    if (!node || node.children.length === 0) return null;

    const elements: React.JSX.Element[] = [];
    let currId = node.children[0];
    let parentNode = node;

    while (currId) {
      const curr = nodes[currId];
      const targetId = curr.id;
      elements.push(
        <React.Fragment key={curr.id}>
          <span className="pgn-num">{curr.moveNumber}{curr.turn === 'w' ? '.' : '...'}</span>
          <button
            className={`m-btn inline-btn ${currentNodeId === curr.id ? 'active' : ''}`}
            onClick={() => navigate(curr.id)}
            onContextMenu={(e) => handleContextMenu(e, targetId)}
          >
            {curr.san}
            {curr.glyphs?.map(g => <span key={g} className="nag-glyph">{g}</span>)}
          </button>
          {curr.comment && <span className="inline-comment">{curr.comment}</span>}
          {parentNode.children.length > 1 && parentNode.children[0] === currId && (
            <React.Fragment>
              {parentNode.children.slice(1).map(vId => (
                <div key={vId} className="variation-block">
                  <span className="pgn-num">{nodes[vId].moveNumber}{nodes[vId].turn === 'w' ? '.' : '...'}</span>
                  <button
                    className={`m-btn inline-btn ${currentNodeId === vId ? 'active' : ''}`}
                    onClick={() => navigate(vId)}
                    onContextMenu={(e) => handleContextMenu(e, vId)}
                  >
                    {nodes[vId].san}
                    {nodes[vId].glyphs?.map(g => <span key={g} className="nag-glyph">{g}</span>)}
                  </button>
                  {nodes[vId].comment && <span className="inline-comment">{nodes[vId].comment}</span>}
                  <InlineVariation nodeId={vId} />
                </div>
              ))}
            </React.Fragment>
          )}
        </React.Fragment>
      );
      if (curr.children.length > 0) {
        parentNode = curr;
        currId = curr.children[0];
      } else break;
    }
    return <span className="inline-variation-line">{elements}</span>;
  };

  const renderMoveTree = (nodeId: string): React.JSX.Element[] => {
    const node = nodes[nodeId];
    if (!node || node.children.length === 0) return [];

    const elements: React.JSX.Element[] = [];
    const children = node.children;
    const mainId = children[0];
    const mainNode = nodes[mainId];

    if (mainNode.turn === 'w') {
      const blackId = mainNode.children.length > 0 && nodes[mainNode.children[0]].turn === 'b'
        ? mainNode.children[0] : null;
      const blackNode = blackId ? nodes[blackId] : null;
      const hasWhiteVars = children.length > 1;
      const hasBlackVars = mainNode.children.length > 1;
      const whiteComment = mainNode.comment;
      const breaksLayout = hasWhiteVars || !!whiteComment;

      if (!breaksLayout) {
        elements.push(
          <div key={mainId} className="main-row">
            <span className="m-num">{mainNode.moveNumber}.</span>
            <button className={`m-btn ${currentNodeId === mainId ? 'active' : ''}`} onClick={() => navigate(mainId)} onContextMenu={(e) => handleContextMenu(e, mainId)}>
              {mainNode.san}
              {mainNode.glyphs?.map(g => <span key={g} className="nag-glyph">{g}</span>)}
            </button>
            {blackNode
              ? <button className={`m-btn ${currentNodeId === blackId ? 'active' : ''}`} onClick={() => navigate(blackId!)} onContextMenu={(e) => handleContextMenu(e, blackId!)}>
                  {blackNode.san}
                  {blackNode.glyphs?.map(g => <span key={g} className="nag-glyph">{g}</span>)}
                </button>
              : <span className="m-placeholder">...</span>}
          </div>
        );
        if (blackNode?.comment) {
          elements.push(<div key={`comm-${blackId}`} className="move-comment">{blackNode.comment}</div>);
        }
        if (hasBlackVars) {
          mainNode.children.slice(1).forEach(vId => {
            const vNode = nodes[vId];
            elements.push(
              <div key={vId} className="variation-block">
                <span className="pgn-num">{vNode.moveNumber}...</span>
                <button className={`m-btn inline-btn ${currentNodeId === vId ? 'active' : ''}`} onClick={() => navigate(vId)} onContextMenu={(e) => handleContextMenu(e, vId)}>
                  {vNode.san}
                  {vNode.glyphs?.map(g => <span key={g} className="nag-glyph">{g}</span>)}
                </button>
                {vNode.comment && <span className="inline-comment">{vNode.comment}</span>}
                <InlineVariation nodeId={vId} />
              </div>
            );
          });
        }
        elements.push(...renderMoveTree(blackId || mainId));
      } else {
        elements.push(
          <div key={mainId} className="main-row">
            <span className="m-num">{mainNode.moveNumber}.</span>
            <button className={`m-btn ${currentNodeId === mainId ? 'active' : ''}`} onClick={() => navigate(mainId)} onContextMenu={(e) => handleContextMenu(e, mainId)}>
              {mainNode.san}
              {mainNode.glyphs?.map(g => <span key={g} className="nag-glyph">{g}</span>)}
            </button>
            <span className="m-placeholder">...</span>
          </div>
        );
        if (whiteComment) {
          elements.push(<div key={`comm-${mainId}`} className="move-comment">{whiteComment}</div>);
        }
        children.slice(1).forEach(vId => {
          const vNode = nodes[vId];
          if (vNode.san.trim().toLowerCase() === mainNode.san.trim().toLowerCase()) return;
          elements.push(
            <div key={vId} className="variation-block">
              <span className="pgn-num">{vNode.moveNumber}.</span>
              <button className={`m-btn inline-btn ${currentNodeId === vId ? 'active' : ''}`} onClick={() => navigate(vId)} onContextMenu={(e) => handleContextMenu(e, vId)}>
                {vNode.san}
                {vNode.glyphs?.map(g => <span key={g} className="nag-glyph">{g}</span>)}
              </button>
              {vNode.comment && <span className="inline-comment">{vNode.comment}</span>}
              <InlineVariation nodeId={vId} />
            </div>
          );
        });
        if (blackNode) {
          elements.push(
            <div key={blackId} className="main-row">
              <span className="m-num">{blackNode.moveNumber}...</span>
              <span className="m-placeholder">...</span>
              <button className={`m-btn ${currentNodeId === blackId ? 'active' : ''}`} onClick={() => navigate(blackId!)} onContextMenu={(e) => handleContextMenu(e, blackId!)}>
                {blackNode.san}
                {blackNode.glyphs?.map(g => <span key={g} className="nag-glyph">{g}</span>)}
              </button>
            </div>
          );
          if (blackNode.comment) {
            elements.push(<div key={`comm-${blackId}`} className="move-comment">{blackNode.comment}</div>);
          }
        }
        if (blackNode && hasBlackVars) {
          mainNode.children.slice(1).forEach(vId => {
            const vNode = nodes[vId];
            elements.push(
              <div key={vId} className="variation-block">
                <span className="pgn-num">{vNode.moveNumber}...</span>
                <button className={`m-btn inline-btn ${currentNodeId === vId ? 'active' : ''}`} onClick={() => navigate(vId)} onContextMenu={(e) => handleContextMenu(e, vId)}>
                  {vNode.san}
                  {vNode.glyphs?.map(g => <span key={g} className="nag-glyph">{g}</span>)}
                </button>
                {vNode.comment && <span className="inline-comment">{vNode.comment}</span>}
                <InlineVariation nodeId={vId} />
              </div>
            );
          });
        }
        elements.push(...renderMoveTree(blackId || mainId));
      }
    } else {
      elements.push(
        <div key={mainId} className="main-row">
          <span className="m-num">{mainNode.moveNumber}...</span>
          <span className="m-placeholder">...</span>
          <button className={`m-btn ${currentNodeId === mainId ? 'active' : ''}`} onClick={() => navigate(mainId)} onContextMenu={(e) => handleContextMenu(e, mainId)}>
            {mainNode.san}
            {mainNode.glyphs?.map(g => <span key={g} className="nag-glyph">{g}</span>)}
          </button>
        </div>
      );
      if (mainNode.comment) {
        elements.push(<div key={`comm-${mainId}`} className="move-comment">{mainNode.comment}</div>);
      }
      elements.push(...renderMoveTree(mainId));
    }
    return elements;
  };

  // ── Derive the FEN to show on the board ───────────────────────────────────
  const displayFen = currentNode?.fen ?? START_FEN;
  const boardFen = displayFen;

  return (
    <div className="page-wrapper">
      <div className="app-container">

        {/* ── Header ── */}
        <header className="header">
          <div className="logo">
            <button onClick={() => router.back()} className="header-btn" style={{ marginRight: '1rem', padding: '6px' }}>
              <ArrowLeft size={18} />
            </button>
            <h1>VCA Classroom</h1>
            <div className={`conn-badge ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{isConnected ? (isReady ? 'Live' : 'Syncing…') : 'Offline'}</span>
            </div>
          </div>
          <div className="header-right">
            <div className="room-badge">
              <Users size={14} />
              <span>Class: {batchId.substring(0, 8)}...</span>
            </div>
            
            <button
              className={`header-btn ${isLocked ? 'locked' : 'unlocked'}`}
              onClick={() => toggleLock(!isLocked)}
              title={isLocked ? "Unlock Moves" : "Lock Moves (Analysis Mode)"}
            >
              {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
              {isLocked ? 'Unlock' : 'Lock'}
            </button>
            
            <button
              className="header-btn"
              onClick={() => clearArrows()}
              title="Clear Arrows on current move"
            >
              <Eraser size={14} />
              Clear Arrows
            </button>

            <button
              className="reset-btn"
              onClick={() => setShowResetConfirm(true)}
              title="Reset board for all players"
              disabled={!isConnected}
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </header>

        {/* ── Main layout ── */}
        <main className="main-content">
          <section className="board-section">
            <ChessBoard
              fen={boardFen}
              history={gameHistory}
              currentIndex={gameHistory.length - 1}
              onMove={handleMove}
              canNext={canGoNext}
              canPrev={canGoPrev}
              onNext={handleNext}
              onPrev={handlePrev}
              onStart={handleStart}
              onEnd={handleEnd}
              onVariationUp={handleVariationUp}
              onVariationDown={handleVariationDown}
              arrows={currentNode?.arrows || []}
              onUpdateArrows={updateArrows}
              isLocked={isLocked}
              onSetupPosition={setupPosition}
              onNullMove={isCoachOrAdmin ? () => makeNullMove() : undefined}
              onUploadPgn={isCoachOrAdmin ? (pgn) => { setDbNav(null); loadPgn(pgn); } : undefined}
              onSaveToDb={userRole?.toUpperCase() === 'COACH' ? handleSaveToDb : undefined}
              onToggleLock={toggleLock}
              isFreehand={isFreehand}
              onToggleFreehand={isCoachOrAdmin ? toggleFreehand : undefined}
              onReset={isCoachOrAdmin ? () => setShowResetConfirm(true) : undefined}
              onClearArrows={isCoachOrAdmin ? clearArrows : undefined}
              chapterCount={dbNav ? dbNav.games.length : (chapters?.length || 0)}
              activeChapterIndex={dbNav ? dbNav.currentIndex : activeChapterIndex}
              onNextChapter={() => {
                if (dbNav && dbNav.currentIndex < dbNav.games.length - 1) {
                  const nextIndex = dbNav.currentIndex + 1;
                  const nextGame = dbNav.games[nextIndex];
                  if (nextGame) {
                     setDbNav({ ...dbNav, currentIndex: nextIndex });
                     fetch(`/api/database/games/${nextGame.id}`)
                       .then(res => res.json())
                       .then(data => {
                          if (data.pgn) loadPgn(data.pgn);
                       })
                       .catch(console.error);
                  }
                } else if (!dbNav && chapters && activeChapterIndex < chapters.length - 1) {
                  selectChapter(activeChapterIndex + 1);
                }
              }}
              onPrevChapter={() => {
                if (dbNav && dbNav.currentIndex > 0) {
                  const prevIndex = dbNav.currentIndex - 1;
                  const prevGame = dbNav.games[prevIndex];
                  if (prevGame) {
                     setDbNav({ ...dbNav, currentIndex: prevIndex });
                     fetch(`/api/database/games/${prevGame.id}`)
                       .then(res => res.json())
                       .then(data => {
                          if (data.pgn) loadPgn(data.pgn);
                       })
                       .catch(console.error);
                  }
                } else if (!dbNav && activeChapterIndex > 0) {
                  selectChapter(activeChapterIndex - 1);
                }
              }}
            />
          </section>

          <section className="sidebar">
            <div className="tabs-container">
              <button 
                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <History size={16} /> History
              </button>
              {chapters && chapters.length > 0 && (
                <button 
                  className={`tab-btn ${activeTab === 'chapters' ? 'active' : ''}`}
                  onClick={() => setActiveTab('chapters')}
                >
                  <BookOpen size={16} /> Chapters
                </button>
              )}
              {featureFlags.participants && (
                <button 
                  className={`tab-btn ${activeTab === 'participants' ? 'active' : ''}`}
                  onClick={() => setActiveTab('participants')}
                >
                  <Users size={16} /> Participants
                </button>
              )}
              {featureFlags.chat && (
                <button 
                  className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                  onClick={() => setActiveTab('chat')}
                >
                  <MessageSquare size={16} /> Chat
                </button>
              )}
              {featureFlags.engineAnalysis && (
                <button 
                  className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
                  onClick={() => setActiveTab('analysis')}
                >
                  <Zap size={16} /> Engine Analysis
                </button>
              )}
              <button 
                className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
                onClick={() => setActiveTab('database')}
              >
                <Database size={16} /> Database
              </button>
            </div>

            <div className="sidebar-panel glass-panel">
              {activeTab === 'history' ? (
                <div className="history-content">

                  <div className="history-scroll-area">
                    {nodes['root']?.comment && (
                      <div className="move-comment" style={{ marginBottom: '8px' }}>
                        {nodes['root'].comment}
                      </div>
                    )}
                    {nodes['root']?.children.length === 0
                      ? <p className="empty-state">No moves yet. Make a move to start!</p>
                      : renderMoveTree('root')
                    }
                  </div>
                </div>
              ) : activeTab === 'chapters' ? (
                <div className="chapters-content" style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: 'calc(100vh - 180px)', overflowY: 'auto' }}>
                  <div className="panel-header" style={{ marginBottom: '8px' }}>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#4a2018' }}>Study Chapters ({chapters?.length || 0})</h2>
                  </div>
                  <div className="chapters-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {chapters?.map((ch, idx) => (
                      <ChapterCard
                        key={idx}
                        chapter={ch}
                        idx={idx + 1}
                        isActive={activeChapterIndex === idx}
                        onSelect={() => selectChapter(idx)}
                        onLoadFen={setupPosition}
                        isStudent={userRole?.toUpperCase() === 'STUDENT'}
                      />
                    ))}
                  </div>
                </div>
              ) : activeTab === 'participants' && featureFlags.participants ? (
                <div className="participants-content">
                  <div className="panel-header">
                    <h2>Connected Users ({participants.length})</h2>
                  </div>
                  {participants.length === 0 ? (
                    <p className="empty-state">No participants connected.</p>
                  ) : (
                    <div className="participants-list">
                      {participants.map(p => (
                        <div key={p.id} className="participant-item">
                          <div className="participant-avatar">
                            <User size={16} />
                          </div>
                          <span className="participant-name">{p.name}</span>
                          <span className="status-dot online"></span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : activeTab === 'chat' && featureFlags.chat ? (
                <div className="chat-content">
                  <div className="chat-messages">
                    {(chatHistory || []).length === 0 ? (
                      <p className="empty-state">No messages yet. Say hi!</p>
                    ) : (
                      (chatHistory || []).map((msg: ChatMessage) => (
                        <div key={msg.id} className="chat-message">
                          <div className="chat-msg-header">
                            <span className="chat-msg-name">{msg.username}</span>
                            <span className="chat-msg-time">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="chat-msg-text">{msg.message}</div>
                        </div>
                      ))
                    )}
                    <div ref={chatMessagesEndRef} />
                  </div>
                  <form className="chat-input-form" onSubmit={handleSendChat}>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="chat-input"
                    />
                    <button type="submit" className="chat-send-btn" disabled={!chatInput.trim()}>
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              ) : activeTab === 'analysis' && featureFlags.engineAnalysis ? (
                <EngineAnalysisPanel fen={boardFen} />
              ) : activeTab === 'database' ? (
                <DatabasePanel 
                  onLoadPgn={isCoachOrAdmin ? (pgn) => { loadPgn(pgn); } : () => {}} 
                  onLoadFen={isCoachOrAdmin ? setupPosition : () => {}} 
                  role={userRole} 
                  onGamesContextLoaded={handleGamesContextLoaded}
                  activeGameId={dbNav?.games[dbNav.currentIndex]?.id || null}
                />
              ) : null}
            </div>
          </section>
        </main>
      </div>

      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset board?"
        message="This will clear all moves and reset the board for everyone in the room. This action cannot be undone."
        confirmText="Reset"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          resetBoard();
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />

      {showSaveModal && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }} onClick={() => setShowSaveModal(false)}>
          <div style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '400px',
            border: '1px solid #eedcd0',
            color: '#4a2018'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: '600' }}>Save to My DB</h3>
            <form onSubmit={confirmSaveToDb}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '500' }}>Game Name:</label>
                <input
                  type="text"
                  required
                  value={saveGameName}
                  onChange={e => setSaveGameName(e.target.value)}
                  style={{
                    border: '1px solid #eedcd0',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    outline: 'none',
                    color: '#4a2018'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  style={{
                    border: 'none',
                    background: '#eedcd0',
                    color: '#4a2018',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGame}
                  style={{
                    border: 'none',
                    background: '#c8854a',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {savingGame ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {contextMenu && (
        <>
          <div 
            className="context-menu-backdrop" 
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          {(() => {
            const clickedNode = nodes[contextMenu.nodeId];
            if (!clickedNode) return null;
            const parentNode = clickedNode.parentId ? nodes[clickedNode.parentId] : null;
            const isMainline = parentNode ? parentNode.children[0] === clickedNode.id : true;
            const canMakeMainline = parentNode && !isMainline;
            const canPromote = parentNode && parentNode.children.indexOf(clickedNode.id) > 0;
            const canDeleteSubsequent = clickedNode.children.length > 0;
            const canDeletePrevious = clickedNode.id !== 'root';

            return (
              <div 
                className="context-menu" 
                style={{ top: contextMenu.y, left: contextMenu.x }}
              >
                <div className="context-menu-header">
                  {clickedNode.moveNumber}{clickedNode.turn === 'w' ? '.' : '...'} {clickedNode.san}
                </div>
                <div className="context-menu-list">
                  <button
                    className="context-menu-item"
                    disabled={!canMakeMainline}
                    onClick={() => handleMakeMainline(clickedNode.id)}
                  >
                    <Star size={14} />
                    <span>Make mainline</span>
                  </button>
                  <button
                    className="context-menu-item"
                    disabled={!canPromote}
                    onClick={() => handlePromoteVariation(clickedNode.id)}
                  >
                    <ArrowUp size={14} />
                    <span>Promote variation</span>
                  </button>
                  <button
                    className="context-menu-item danger"
                    disabled={!canDeleteSubsequent}
                    onClick={() => handleDeleteSubsequent(clickedNode.id)}
                  >
                    <Eraser size={14} />
                    <span>Delete remaining moves</span>
                  </button>
                  <button
                    className="context-menu-item danger"
                    disabled={!canDeletePrevious}
                    onClick={() => handleDeletePrevious(clickedNode.id)}
                  >
                    <Scissors size={14} />
                    <span>Delete previous moves</span>
                  </button>
                  <button
                    className="context-menu-item danger"
                    disabled={clickedNode.id === 'root'}
                    onClick={() => handleDeleteMove(clickedNode.id)}
                  >
                    <Trash2 size={14} />
                    <span>Delete move</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

        .page-wrapper {
          min-height: 100vh;
          background: #fdf0e4;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 2rem;
          color: #4a2018;
          font-family: 'Outfit', sans-serif;
        }

        .app-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
          max-width: 1200px;
        }

        /* ── Header ── */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: #2d4a6b;
          border-radius: 12px;
          color: #ffffff;
        }
        .logo { display: flex; align-items: center; gap: .75rem; }
        .logo h1 {
          font-size: 1.6rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }
        .text-primary { color: #c8854a; }

        .conn-badge {
          display: flex; align-items: center; gap: 5px;
          font-size: .72rem; font-weight: 600; padding: 3px 10px;
          border-radius: 20px; border: 1px solid;
          margin-left: 10px;
        }
        .conn-badge.connected  { color: #4ade80; border-color: rgba(74,222,128,.3); background: rgba(74,222,128,.08); }
        .conn-badge.disconnected { color: #f87171; border-color: rgba(248,113,113,.3); background: rgba(248,113,113,.08); }

        .header-right { display: flex; align-items: center; gap: .75rem; }
        .room-badge {
          display: flex; align-items: center; gap: 5px;
          font-size: .75rem; color: rgba(255, 255, 255, 0.7);
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.1);
          padding: 4px 10px; border-radius: 8px;
        }
        .header-btn {
          display: flex; align-items: center; gap: 5px;
          font-size: .78rem; font-weight: 600;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.1);
          color: #ffffff; padding: 5px 12px; border-radius: 8px;
          cursor: pointer; transition: all .15s;
        }
        .header-btn:hover { background: rgba(255,255,255,.1); }
        .header-btn.locked { color: #fbbf24; border-color: rgba(251,191,36,.3); background: rgba(251,191,36,.1); }
        .header-btn.unlocked { color: #4ade80; border-color: rgba(74,222,128,.3); background: rgba(74,222,128,.1); }

        .reset-btn {
          display: flex; align-items: center; gap: 5px;
          font-size: .78rem; font-weight: 600;
          background: rgba(239,68,68,.1);
          border: 1px solid rgba(239,68,68,.3);
          color: #f87171; padding: 5px 12px; border-radius: 8px;
          cursor: pointer; transition: all .15s;
        }
        .reset-btn:hover:not(:disabled) { background: rgba(239,68,68,.2); }
        .reset-btn:disabled { opacity: .4; cursor: not-allowed; }

        /* ── Main layout ── */
        .main-content {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 2rem;
        }
        @media (max-width: 1100px) {
          .main-content { grid-template-columns: 1fr; }
        }

        .glass-panel {
          background: #ffffff;
          border: 1px solid #eedcd0;
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 8px 32px rgba(45, 74, 107, 0.08);
          color: #4a2018;
        }

        .board-section {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 600px;
        }

        /* ── Sidebar ── */
        .sidebar { display: flex; flex-direction: column; gap: 0; }
        
        .tabs-container {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: #fdf5ea;
          border-radius: 12px 12px 0 0;
          border: 1.5px solid #c8a882;
          border-bottom: none;
          margin-bottom: -1px;
          z-index: 1;
          position: relative;
          box-shadow: 0 -1px 0 0 #c8a882 inset;
        }
        
        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 0;
          background: transparent;
          border: none;
          color: rgba(74, 32, 24, 0.6);
          font-size: 0.9rem;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .tab-btn:hover {
          color: #4a2018;
          background: rgba(74, 32, 24, 0.05);
        }
        
        .tab-btn.active {
          color: #4a2018;
          background: #ffffff;
          box-shadow: none;
          border-bottom: 2px solid #c8854a;
          border-radius: 8px 8px 0 0;
        }

        .sidebar-panel { 
          height: 600px; 
          display: flex; 
          flex-direction: column; 
          border-top-left-radius: 0;
          padding: 1.5rem;
        }

        .history-content, .participants-content, .chat-content {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .history-scroll-area {
          flex: 1; overflow-y: auto;
          padding-right: .5rem;
          font-size: .82rem;
        }

        .empty-state {
          color: rgba(45, 74, 107, 0.6);
          font-size: .85rem;
          text-align: center;
          margin-top: 2rem;
        }

        .participants-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .participant-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: #fdf5ea;
          border-radius: 8px;
          border: 1px solid #eedcd0;
        }

        .participant-avatar {
          width: 28px;
          height: 28px;
          background: rgba(45, 74, 107, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4a2018;
        }

        .participant-name {
          flex: 1;
          font-size: 0.9rem;
          font-weight: 500;
          color: #4a2018;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-dot.online {
          background: #4ade80;
          box-shadow: 0 0 8px rgba(74,222,128,.4);
        }

        /* ── Chat UI ── */
        .chat-messages {
          flex: 1; overflow-y: auto;
          display: flex; flex-direction: column; gap: 12px;
          padding-right: .5rem;
        }
        .chat-message {
          display: flex; flex-direction: column; gap: 4px;
        }
        .chat-msg-header {
          display: flex; justify-content: space-between; align-items: center;
        }
        .chat-msg-name {
          font-size: .8rem; font-weight: 600; color: #c8854a;
        }
        .chat-msg-time {
          font-size: .7rem; color: rgba(45, 74, 107, 0.6);
        }
        .chat-msg-text {
          font-size: .9rem; color: #4a2018;
          background: #fdf5ea;
          padding: 8px 12px; border-radius: 0 12px 12px 12px;
          border: 1px solid #eedcd0;
          line-height: 1.4;
        }
        .chat-input-form {
          display: flex; gap: 8px; margin-top: 16px;
        }
        .chat-input {
          flex: 1; background: #ffffff;
          border: 1px solid #eedcd0;
          color: #4a2018; padding: 10px 14px;
          border-radius: 8px; outline: none; font-family: inherit;
        }
        .chat-input:focus { border-color: #c8854a; }
        .chat-send-btn {
          background: #c8854a; border: none; color: #fff;
          padding: 0 14px; border-radius: 8px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background .2s;
        }
        .chat-send-btn:hover:not(:disabled) { background: #b3643b; }
        .chat-send-btn:disabled { opacity: .5; cursor: not-allowed; }

        /* ── Move tree ── */
        .main-row {
          display: grid;
          grid-template-columns: 46px 1fr 1fr;
          align-items: stretch;
          padding: 0;
          background: #fdf5ea;
          border-radius: 0;
          margin-bottom: 0;
          border-bottom: 1px solid #eedcd0;
        }
        .variation-block {
          display: block;
          margin-left: 12px;
          border-left: 1px solid #eedcd0;
          padding: 2px 0 2px 10px;
          margin: 2px 0 4px;
          color: rgba(45, 74, 107, 0.8);
        }
        .variation-block::before { content: '('; margin-right: 2px; opacity: .4; }
        .variation-block::after  { content: ')'; margin-left:  2px; opacity: .4; }
        .inline-variation-line { display: inline; line-height: 1.4; }

        .m-num {
          background: rgba(45, 74, 107, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(45, 74, 107, 0.6);
          font-size: .75rem; font-weight: 500;
          border-right: 1px solid #eedcd0;
        }
        .pgn-num {
          color: rgba(45, 74, 107, 0.6);
          font-size: .72rem; min-width: 28px; font-weight: 500;
        }
        .m-btn {
          background: transparent; border: none;
          color: #4a2018; font-weight: 500;
          padding: 6px 12px; border-radius: 0;
          cursor: pointer; transition: all .1s;
          text-align: left; font-size: .85rem;
        }
        .m-btn:hover   { background: rgba(45, 74, 107, 0.08); color: #c8854a; }
        .m-btn.active  { background: #c8854a; color: #fff; }
        .m-btn.live-tip { outline: 1px solid rgba(74,222,128,.4); }
        .inline-btn { font-weight: 500; padding: 1px 4px; min-width: fit-content; display: inline-block; font-size: .8rem; }
        .m-sep         { display: none; }
        .m-placeholder { color: rgba(45, 74, 107, 0.3); padding: 6px 12px; font-size: .85rem; }

        .move-comment {
          display: block;
          width: 100%;
          padding: 8px 12px;
          background: rgba(45, 74, 107, 0.02);
          color: #4a2018;
          font-size: 0.85rem;
          line-height: 1.4;
          margin: 0;
          word-break: break-word;
          border-radius: 0;
          border-bottom: 1px solid #eedcd0;
          white-space: pre-wrap;
        }
        .inline-comment {
          margin: 0 6px;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(45, 74, 107, 0.05);
          color: rgba(45, 74, 107, 0.8);
          font-size: 0.82rem;
          display: inline-block;
          vertical-align: middle;
          white-space: pre-wrap;
        }
        .nag-glyph { margin-left: 2px; color: #c8854a; font-weight: 700; font-size: 0.9em; }

        .context-menu-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: transparent;
        }
        .context-menu {
          position: fixed;
          z-index: 10000;
          background: rgba(21, 21, 21, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          min-width: 200px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          font-family: inherit;
          backdrop-filter: blur(12px);
          animation: menuFadeIn 0.15s ease-out;
        }
        @keyframes menuFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .context-menu-header {
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.04);
          font-size: 0.8rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          text-align: left;
        }
        .context-menu-list {
          padding: 4px 0;
          display: flex;
          flex-direction: column;
        }
        .context-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          background: transparent;
          border: none;
          color: #e2e8f0;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
          width: 100%;
        }
        .context-menu-item:hover:not(:disabled) {
          background: rgba(200, 133, 74, 0.15);
          color: #c8854a;
        }
        .context-menu-item.danger:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
        .context-menu-item:disabled {
          color: rgba(255, 255, 255, 0.25);
          cursor: not-allowed;
        }
      `}</style>
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
