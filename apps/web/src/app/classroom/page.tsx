'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ChessBoard from '@/components/chess/ChessBoard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { VariationChooser } from '@/components/chess/VariationChooser';
import SaveToDbModal from '@/components/chess/SaveToDbModal';
import { Toast } from '@vca/ui';
import { AnnotationsPanel } from '@/components/chess/AnnotationsPanel';
import { History, Zap, Wifi, WifiOff, Users, User, MessageSquare, Send, Star, ArrowUp, Scissors, Eraser, Database, Trash2, Compass, BookOpen } from 'lucide-react';
import { useChessRoom } from '@/lib/hooks/useChessRoom';
import { MoveNode, ChatMessage } from '@vca/types';
import EngineAnalysisPanel from '@/components/chess/EngineAnalysisPanel';
import OpeningExplorerPanel from '@/components/chess/OpeningExplorerPanel';
import DatabasePanel from '@/components/chess/DatabasePanel';
import ChapterCard from '@/components/chess/ChapterCard';
import { Chess } from '@vca/chess';
import { applyContextMenuPosition } from '@/lib/utils/contextMenuUtils';

const featureFlags = {
  participants: false,
  chat: false,
  engineAnalysis: true,
  openingExplorer: true
};

const ROOM_ID = 'test-room';
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export default function ClassroomPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | undefined>(undefined);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [isAuthError, setIsAuthError] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'coach' | 'student' | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveGameName, setSaveGameName] = useState('');
  const [savingGame, setSavingGame] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetch('/api/auth/token', { credentials: 'include' })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not authenticated');
      })
      .then(data => {
        setToken(data.token);
        try {
          const payload = JSON.parse(atob(data.token.split('.')[1]));
          console.log('Current logged-in user role (generic classroom):', payload.role);
          setUserRole(payload.role);
          setCurrentUserId(payload.id);
        } catch (e) {
          console.error('Error decoding token role:', e);
        }
        setIsLoadingToken(false);
      })
      .catch(err => {
        setIsAuthError(true);
        setIsLoadingToken(false);
        // Redirect to login after a short delay so user can see the message
        setTimeout(() => router.push('/'), 1500);
      });
  }, []);


  const { 
    nodes, currentNodeId, participants, isConnected, isReady, isLocked, isFreehand, chatHistory, studyTags,
    chapters, activeChapterIndex, loadPgn, selectChapter, moveRejectedAt,
    makeMove, makeNullMove, navigate, resetBoard, updateArrows, clearArrows, toggleLock, toggleFreehand, sendChatMessage,
    updateNodeAnnotations, setStudyTag, removeStudyTag, setupPosition,
    promoteToMainline, promoteVariation, deleteSubsequentMoves, deletePreviousMoves, deleteMove
  } = useChessRoom(ROOM_ID, token, { enabled: !!token });

  const [activeTab, setActiveTab] = useState<string>('history');

  // Auto switch to chapters tab when chapters are loaded
  useEffect(() => {
    if (chapters.length > 0) {
      setActiveTab('chapters');
    } else {
      setActiveTab('history');
    }
  }, [chapters.length]);


  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [dbNav, setDbNav] = useState<{ games: any[], currentIndex: number } | null>(null);

  const handleGamesContextLoaded = useCallback((games: any[], currentIndex: number) => {
     setDbNav(games.length > 0 ? { games, currentIndex } : null);
  }, []);

  // ── Resizable split between Moves panel and Annotations panel ──
  const SPLIT_KEY = 'classroom_split_ratio';
  const [splitRatio, setSplitRatio] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(SPLIT_KEY);
      if (stored) {
        const v = parseFloat(stored);
        if (!isNaN(v) && v > 0.1 && v < 0.9) return v;
      }
    } catch {}
    return 0.60;
  });
  const sidebarBodyRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartRatioRef = useRef(0);
  const lastRatioRef = useRef(splitRatio);
  // Keep lastRatioRef in sync
  lastRatioRef.current = splitRatio;

  const handleSplitterMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartYRef.current = e.clientY;
    dragStartRatioRef.current = lastRatioRef.current;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current || !sidebarBodyRef.current) return;
      const totalH = sidebarBodyRef.current.getBoundingClientRect().height;
      if (totalH <= 0) return;
      const delta = ev.clientY - dragStartYRef.current;
      const deltaRatio = delta / totalH;
      const newRatio = Math.min(0.85, Math.max(0.15, dragStartRatioRef.current + deltaRatio));
      lastRatioRef.current = newRatio;
      setSplitRatio(newRatio);
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  // Persist ratio to localStorage on change
  useEffect(() => {
    try { localStorage.setItem(SPLIT_KEY, String(splitRatio)); } catch {}
  }, [splitRatio]);

  // ── Horizontal sidebar resizer ──────────────────────────────────────────
  const SIDEBAR_WIDTH_KEY = 'classroom_sidebar_width';
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_WIDTH_KEY);
      if (stored) {
        const v = parseFloat(stored);
        if (!isNaN(v) && v >= 260 && v <= 640) return v;
      }
    } catch {}
    return 400;
  });
  const mainContentRef = useRef<HTMLElement>(null);
  const isHDraggingRef = useRef(false);
  const hDragStartXRef = useRef(0);
  const hDragStartWidthRef = useRef(0);
  const lastSidebarWidthRef = useRef(sidebarWidth);
  lastSidebarWidthRef.current = sidebarWidth;

  const handleHResizerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isHDraggingRef.current = true;
    hDragStartXRef.current = e.clientX;
    hDragStartWidthRef.current = lastSidebarWidthRef.current;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isHDraggingRef.current) return;
      // Dragging left increases width, right decreases width
      const delta = hDragStartXRef.current - ev.clientX;
      const newWidth = Math.min(640, Math.max(260, hDragStartWidthRef.current + delta));
      lastSidebarWidthRef.current = newWidth;
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      isHDraggingRef.current = false;
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth)); } catch {}
  }, [sidebarWidth]);


  const handleSaveToDb = () => {
    setSaveGameName(`Analysis Game - ${new Date().toLocaleDateString()}`);
    setShowSaveModal(true);
  };

  const confirmSaveToDb = async (gameName: string, folderId: string | null) => {
    if (!gameName.trim()) return;
    setSavingGame(true);
    try {
      const { buildPgnFromMoveTree } = await import('@/features/database/pgnUtils');
      const pgn = buildPgnFromMoveTree(nodes, 'root');
      
      const res = await fetch('/api/database/collections/save-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: gameName.trim(),
          pgnText: pgn,
          folderId: folderId
        })
      });
      if (res.ok) {
        setToast({ message: 'Game successfully saved to My DB!', type: 'success' });
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

  const handleContextMenu = (e: React.MouseEvent, nodeId: string) => {
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
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

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
  if (!currentNode) return null; // Safe guard during init

  const canGoNext = currentNode.children.length > 0;
  const canGoPrev = currentNode.parentId !== null;
  const numBranches = currentNode.children.length;
  const branches = currentNode?.children.map(id => ({ id, san: nodes[id].san })) || [];

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

  const handleExplorerMove = (moveSan: string) => {
    try {
      const chess = new Chess(boardFen);
      const result = chess.move(moveSan);
      if (result) {
        makeMove(result.from, result.to, result.promotion ?? 'q', currentNodeId);
      }
    } catch (err) {
      console.error('[ClassroomPage] Error making explorer move:', err);
    }
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
      if (!curr) break;
      const isWhite = curr.turn === 'w';
      const showNum = elements.length === 0 || isWhite;
      const targetId = curr.id;
      elements.push(
        <React.Fragment key={curr.id}>
          {showNum && <span className="pgn-num">{curr.moveNumber}{isWhite ? '.' : '...'}</span>}
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

  if (isLoadingToken) {
    return (
      <div className="page-wrapper" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: '#4a2018' }}>Connecting...</h2>
      </div>
    );
  }

  if (isAuthError) {
    return (
      <div className="page-wrapper" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: '#4a2018' }}>Not authenticated. Redirecting to login...</h2>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="app-container">

        {/* ── Main layout ── */}
        <main className="main-content" ref={mainContentRef}>
          <section className="board-section">
            <ChessBoard
              role={userRole}
              userId={currentUserId}
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
              moveRejectedAt={moveRejectedAt}
              onVariationUp={handleVariationUp}
              onVariationDown={handleVariationDown}
              arrows={currentNode?.arrows || []}
              onUpdateArrows={updateArrows}
              isLocked={isLocked}
              isFreehand={isFreehand}
              nodes={nodes}
              branches={branches}
              selectedBranchIndex={selectedVariationIndex}
              onSelectBranch={setSelectedVariationIndex}
              onChooseBranch={(id) => {
                navigate(id);
                setSelectedVariationIndex(0);
              }}
              currentNode={currentNode}
              onReset={() => setShowResetConfirm(true)}
              onClearArrows={clearArrows}
              onMoreTools={() => toggleLock(!isLocked)}
              onToggleFreehand={toggleFreehand}
              onSetupPosition={setupPosition}
              onNullMove={() => makeNullMove()}
              onUploadPgn={(pgn) => {
                setDbNav(null);
                loadPgn(pgn);
              }}
              onSaveToDb={userRole?.toUpperCase() === 'COACH' ? handleSaveToDb : undefined}
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

          {/* ── Horizontal resize handle ── */}
          <div
            className="h-resizer"
            onMouseDown={handleHResizerMouseDown}
            title="Drag to resize sidebar"
          />

          <section className="sidebar" style={{ width: sidebarWidth, flexShrink: 0, minWidth: 260, maxWidth: 640 }}>
            <div className="tabs-container">
              <button 
                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <History size={16} /> Moves
              </button>
              {chapters.length > 0 && (
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
              {featureFlags.openingExplorer && (
                <button 
                  className={`tab-btn ${activeTab === 'explorer' ? 'active' : ''}`}
                  onClick={() => setActiveTab('explorer')}
                >
                  <Compass size={16} /> Opening Explorer
                </button>
              )}
              <button 
                className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
                onClick={() => setActiveTab('database')}
              >
                <Database size={16} /> Database
              </button>
            </div>

            {/* ── When on history tab: resizable split between Moves and Annotations ── */}
            {activeTab === 'history' ? (
              <div className="sidebar-body" ref={sidebarBodyRef}>
                <div
                  className="sidebar-panel glass-panel"
                  style={{ height: `calc(${splitRatio * 100}% - 4px)` }}
                >
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
                    <VariationChooser
                      variations={branches}
                      selectedIndex={selectedVariationIndex}
                      onSelect={setSelectedVariationIndex}
                      onChoose={(id) => {
                        navigate(id);
                        setSelectedVariationIndex(0);
                      }}
                    />
                  </div>
                </div>

                {/* Drag handle / splitter */}
                <div
                  className="sidebar-splitter"
                  onMouseDown={handleSplitterMouseDown}
                  title="Drag to resize"
                />

                <div
                  className="annotations-wrapper sidebar-panel glass-panel"
                  style={{ height: `calc(${(1 - splitRatio) * 100}% - 4px)`, padding: 0 }}
                >
                  <AnnotationsPanel
                    currentNode={currentNode}
                    studyTags={studyTags}
                    isCoach={true}
                    onUpdateAnnotations={updateNodeAnnotations}
                    onSetStudyTag={setStudyTag}
                    onRemoveStudyTag={removeStudyTag}
                  />
                </div>
              </div>
            ) : (
              <div className="sidebar-panel glass-panel sidebar-panel-full">
                {activeTab === 'chapters' ? (
                  <div className="chapters-content" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    <div className="panel-header" style={{ marginBottom: '8px' }}>
                      <h2 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#4a2018' }}>Study Chapters ({chapters.length})</h2>
                    </div>
                    <div className="chapters-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {chapters.map((ch, idx) => (
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
                ) : activeTab === 'explorer' && featureFlags.openingExplorer ? (
                  <OpeningExplorerPanel 
                    fen={boardFen} 
                    onMoveClick={handleExplorerMove} 
                    onLoadPgn={(pgn) => { loadPgn(pgn); }}
                  />
                ) : activeTab === 'database' ? (
                  <DatabasePanel 
                    onLoadPgn={(pgn) => { loadPgn(pgn); }} 
                    onLoadFen={setupPosition} 
                    role={userRole} 
                    onGamesContextLoaded={handleGamesContextLoaded}
                    activeGameId={dbNav?.games[dbNav.currentIndex]?.id || null}
                  />
                ) : null}
              </div>
            )}
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

      <SaveToDbModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        defaultGameName={saveGameName}
        onSave={confirmSaveToDb}
        savingGame={savingGame}
      />

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

            let varRoot = clickedNode;
            let varParent = varRoot.parentId ? nodes[varRoot.parentId] : null;
            while (varParent && varParent.children[0] === varRoot.id && varParent.id !== 'root') {
              varRoot = varParent;
              varParent = varRoot.parentId ? nodes[varRoot.parentId] : null;
            }

            const isMainline = varParent ? varParent.children[0] === varRoot.id : true;
            const canMakeMainline = varParent && !isMainline;
            const canPromote = varParent && varParent.children.indexOf(varRoot.id) > 0;
            const canDeleteSubsequent = clickedNode.children.length > 0;
            const canDeletePrevious = clickedNode.id !== 'root';

            return (
              <div 
                className="context-menu" 
                ref={(el) => applyContextMenuPosition(el, contextMenu.x, contextMenu.y)}
                style={{ top: contextMenu.y, left: contextMenu.x, visibility: 'hidden' }}
              >
                <div className="context-menu-header">
                  {clickedNode.moveNumber}{clickedNode.turn === 'w' ? '.' : '...'} {clickedNode.san}
                </div>
                <div className="context-menu-list">
                  <button
                    className="context-menu-item"
                    disabled={!canMakeMainline}
                    onClick={() => handleMakeMainline(varRoot.id)}
                  >
                    <Star size={14} />
                    <span>Make mainline</span>
                  </button>
                  <button
                    className="context-menu-item"
                    disabled={!canPromote}
                    onClick={() => handlePromoteVariation(varRoot.id)}
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
          height: 100vh;
          overflow: hidden;
          background: var(--classroom-bg, #fdf0e4) !important;
          background-size: var(--classroom-bg-size, auto) !important;
          background-repeat: var(--classroom-bg-repeat, repeat) !important;
          background-position: var(--classroom-bg-position, 0 0) !important;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          margin: 0;
          padding: 0;
          color: #4a2018;
          font-family: 'Outfit', sans-serif;
          box-sizing: border-box;
          position: relative;
          z-index: 0;
        }

        .page-wrapper::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--classroom-bg-overlay, transparent);
          pointer-events: none;
          z-index: -1;
        }

        .app-container {
          display: flex;
          flex-direction: column;
          gap: 0;
          width: 100%;
          max-width: 100%;
          height: 100%;
          min-height: 0;
          position: relative;
          z-index: 1;
        }

        /* ── Header ── */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: #2d4a6b;
          border-radius: 0;
          color: #ffffff;
          margin-bottom: 1rem;
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

        /* ── Banner ── */
        .history-banner {
          display: none;
        }

        /* ── Main layout ── */
        .main-content {
          display: flex;
          flex-direction: row;
          gap: 0;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        @media (max-width: 1100px) {
          .main-content { flex-direction: column; }
          .h-resizer { display: none; }
        }

        /* ── Horizontal drag handle ── */
        .h-resizer {
          width: 6px;
          flex-shrink: 0;
          cursor: col-resize;
          background: transparent;
          position: relative;
          z-index: 10;
          transition: background 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .h-resizer::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 3px;
          height: 40px;
          background: #eedcd0;
          border-radius: 2px;
          transition: background 0.15s, height 0.15s;
        }
        .h-resizer:hover::after,
        .h-resizer:active::after {
          background: #c8854a;
          height: 60px;
        }

        .glass-panel {
          background: var(--panel-bg, #ffffff);
          background-image: var(--panel-bg-image, none);
          background-size: var(--panel-bg-size, auto);
          background-position: var(--panel-bg-position, 0 0);
          border: 1px solid var(--panel-border-color, #eedcd0);
          border-radius: 16px;
          padding: 1.25rem;
          box-shadow: var(--panel-box-shadow, 0 8px 32px rgba(45, 74, 107, 0.08));
          color: var(--panel-text-color, #4a2018);
          backdrop-filter: var(--panel-backdrop-filter, none);
          -webkit-backdrop-filter: var(--panel-backdrop-filter, none);
          transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .board-section {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          min-height: 0;
          flex: 1;
          min-width: 0;
          padding: 0.75rem !important;
        }

        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          height: 100%;
          overflow: hidden;
          padding-right: 4px;
        }
        
        .tabs-container {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          padding: 4px;
          background: var(--panel-bg, #fdf5ea);
          background-image: var(--panel-bg-image, none);
          background-size: var(--panel-bg-size, auto);
          background-position: var(--panel-bg-position, 0 0);
          border-radius: 12px;
          border: 1px solid var(--panel-border-color, #eedcd0);
          backdrop-filter: var(--panel-backdrop-filter, none);
          -webkit-backdrop-filter: var(--panel-backdrop-filter, none);
          z-index: 1;
          position: relative;
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }
        
        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: var(--panel-subtext-color, rgba(74, 32, 24, 0.6));
          font-size: 0.85rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .tab-btn:hover {
          color: var(--panel-text-color, #4a2018);
          background: var(--panel-avatar-bg, rgba(74, 32, 24, 0.05));
        }
        
        .tab-btn.active {
          color: var(--panel-text-color, #4a2018);
          background: var(--panel-card-bg, #ffffff);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border: 1px solid var(--panel-border-color, rgba(0,0,0,0.05));
          border-radius: 8px;
        }

        .sidebar-panel { 
          display: flex; 
          flex-direction: column; 
          border-top-left-radius: 0;
          padding: 1rem;
          overflow: hidden;
        }

        /* Full-height panel when no annotations section */
        .sidebar-panel-full {
          flex: 1;
          min-height: 0;
        }

        /* Resizable body: holds moves panel + splitter + annotations */
        .sidebar-body {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* The splitter bar */
        .sidebar-splitter {
          flex-shrink: 0;
          height: 8px;
          cursor: row-resize;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
          user-select: none;
        }
        .sidebar-splitter::before {
          content: '';
          display: block;
          width: 40px;
          height: 3px;
          border-radius: 2px;
          background: #eedcd0;
          transition: background 0.15s, width 0.15s;
        }
        .sidebar-splitter:hover::before {
          background: #c8854a;
          width: 56px;
        }
        .sidebar-splitter:active::before {
          background: #a06030;
        }

        /* Annotations wrapper so overflow is contained */
        .annotations-wrapper {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .annotations-wrapper .annotations-panel {
          flex: 1;
          min-height: 0;
          margin-top: 0;
          overflow: hidden;
        }

        .history-content {
          display: flex;
          flex-direction: column;
          height: 100%;
          flex: 1;
          min-height: 0;
        }

        .participants-content, .chat-content {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding-right: .5rem;
        }

        .history-scroll-area {
          font-size: .82rem;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
        }

        .empty-state {
          color: var(--panel-subtext-color, rgba(45, 74, 107, 0.6));
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
          background: var(--panel-card-bg, #fdf5ea);
          border-radius: 8px;
          border: 1px solid var(--panel-border-color, #eedcd0);
        }

        .participant-avatar {
          width: 28px;
          height: 28px;
          background: var(--panel-avatar-bg, rgba(45, 74, 107, 0.1));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--panel-text-color, #4a2018);
        }

        .participant-name {
          flex: 1;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--panel-text-color, #4a2018);
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
          font-size: .8rem; font-weight: 600; color: var(--panel-accent-color, #c8854a);
        }
        .chat-msg-time {
          font-size: .7rem; color: var(--panel-subtext-color, rgba(45, 74, 107, 0.6));
        }
        .chat-msg-text {
          font-size: .9rem; color: var(--panel-text-color, #4a2018);
          background: var(--panel-card-bg, #fdf5ea);
          padding: 8px 12px; border-radius: 0 12px 12px 12px;
          border: 1px solid var(--panel-border-color, #eedcd0);
          line-height: 1.4;
        }
        .chat-input-form {
          display: flex; gap: 8px; margin-top: 16px;
        }
        .chat-input {
          flex: 1; background: var(--panel-bg-inner, #ffffff);
          border: 1px solid var(--panel-border-color, #eedcd0);
          color: var(--panel-text-color, #4a2018); padding: 10px 14px;
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
        .m-btn:hover:not(.active) { background: rgba(45, 74, 107, 0.05); color: #c8854a; }

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
        .m-btn.active  { background: #c8854a; color: #fff; }
        .m-btn.live-tip { outline: 1px solid rgba(74,222,128,.4); }
        .inline-btn { font-weight: 500; padding: 1px 4px; border-radius: 3px; min-width: fit-content; display: inline-block; font-size: .8rem; }
        .m-sep         { display: none; }
        .m-placeholder { color: rgba(45, 74, 107, 0.3); padding: 6px 12px; font-size: .85rem; }
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
