'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import ChessBoard from '@/components/chess/ChessBoard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { VariationChooser } from '@/components/chess/VariationChooser';
import { AnnotationsPanel } from '@/components/chess/AnnotationsPanel';
import { History, Zap, Wifi, WifiOff, Users, User, MessageSquare, Send, Star, ArrowUp, Scissors, Eraser } from 'lucide-react';
import { useChessRoom } from '@/lib/hooks/useChessRoom';
import { MoveNode, ChatMessage } from '@vca/types';

const ROOM_ID = 'test-room';
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export default function ClassroomPage() {
  const { 
    nodes, currentNodeId, participants, isConnected, isReady, isLocked, isFreehand, chatHistory, studyTags,
    makeMove, navigate, resetBoard, updateArrows, clearArrows, toggleLock, toggleFreehand, sendChatMessage,
    updateNodeAnnotations, setStudyTag, removeStudyTag, setupPosition,
    promoteToMainline, promoteVariation, deleteSubsequentMoves, deletePreviousMoves
  } = useChessRoom(ROOM_ID);

  const [activeTab, setActiveTab] = useState<'history' | 'participants' | 'chat'>('history');
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);

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

  return (
    <div className="page-wrapper">
      <div className="app-container">

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
              isFreehand={isFreehand}
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
            />
          </section>

          <section className="sidebar">
            <div className="tabs-container">
              <button 
                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <History size={16} /> Moves
              </button>
              <button 
                className={`tab-btn ${activeTab === 'participants' ? 'active' : ''}`}
                onClick={() => setActiveTab('participants')}
              >
                <Users size={16} /> Participants
              </button>
              <button 
                className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                <MessageSquare size={16} /> Chat
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
              ) : activeTab === 'participants' ? (
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
              ) : (
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
              )}
            </div>

            {activeTab === 'history' && (
              <AnnotationsPanel
                currentNode={currentNode}
                studyTags={studyTags}
                isCoach={true}
                onUpdateAnnotations={updateNodeAnnotations}
                onSetStudyTag={setStudyTag}
                onRemoveStudyTag={removeStudyTag}
              />
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
          background: #fdf0e4;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          margin: 0;
          padding: 0;
          color: #4a2018;
          font-family: 'Outfit', sans-serif;
          box-sizing: border-box;
        }

        .app-container {
          display: flex;
          flex-direction: column;
          gap: 0;
          width: 100%;
          max-width: 100%;
          height: 100%;
          min-height: 0;
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
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 1rem;
          flex: 1;
          min-height: 0;
        }
        @media (max-width: 1100px) {
          .main-content { grid-template-columns: 1fr; }
        }

        .glass-panel {
          background: #ffffff;
          border: 1px solid #eedcd0;
          border-radius: 16px;
          padding: 1.25rem;
          box-shadow: 0 8px 32px rgba(45, 74, 107, 0.08);
          color: #4a2018;
        }

        .board-section {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          min-height: 0;
          padding: 0.75rem !important;
        }

        /* ── Sidebar ── */
        .sidebar {
          width: 400px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          height: 100%;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 4px;
        }
        
        .tabs-container {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: #fdf5ea;
          border-radius: 12px 12px 0 0;
          border: 1px solid #eedcd0;
          border-bottom: none;
          margin-bottom: -1px;
          z-index: 1;
          position: relative;
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
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          display: flex; 
          flex-direction: column; 
          border-top-left-radius: 0;
          padding: 1rem;
        }

        .history-content {
          display: flex;
          flex-direction: column;
          height: auto;
        }

        .participants-content, .chat-content {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 180px);
          overflow-y: auto;
          padding-right: .5rem;
        }

        .history-scroll-area {
          font-size: .82rem;
          overflow-y: visible;
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
    </div>
  );
}
