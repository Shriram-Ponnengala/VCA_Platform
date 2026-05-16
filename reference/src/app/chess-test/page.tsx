'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import ChessBoard from '@/components/chess/ChessBoard';
import { History, Zap, RotateCcw, Wifi, WifiOff, Users, User, Lock, Unlock, MessageSquare, Send, Eraser } from 'lucide-react';
import { useChessRoom } from '@/lib/hooks/useChessRoom';
import { MoveNode, ChatMessage } from '@/lib/socket/types';

const ROOM_ID = 'test-room';
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export default function ChessTestPage() {
  const { 
    nodes, currentNodeId, participants, isConnected, isReady, isLocked, chatHistory,
    makeMove, navigate, resetBoard, updateArrows, clearArrows, toggleLock, sendChatMessage
  } = useChessRoom(ROOM_ID);

  const [activeTab, setActiveTab] = useState<'history' | 'participants' | 'chat'>('history');
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);
  const [chatInput, setChatInput] = useState('');
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

    const elements: JSX.Element[] = [];
    let currId = node.children[0];
    let parentNode = node;

    while (currId) {
      const curr = nodes[currId];
      elements.push(
        <React.Fragment key={curr.id}>
          <span className="pgn-num">{curr.moveNumber}{curr.turn === 'w' ? '.' : '...'}</span>
          <button
            className={`m-btn inline-btn ${currentNodeId === curr.id ? 'active' : ''}`}
            onClick={() => navigate(curr.id)}
          >{curr.san}</button>
          {parentNode.children.length > 1 && parentNode.children[0] === currId && (
            <React.Fragment>
              {parentNode.children.slice(1).map(vId => (
                <div key={vId} className="variation-block">
                  <span className="pgn-num">{nodes[vId].moveNumber}{nodes[vId].turn === 'w' ? '.' : '...'}</span>
                  <button
                    className={`m-btn inline-btn ${currentNodeId === vId ? 'active' : ''}`}
                    onClick={() => navigate(vId)}
                  >{nodes[vId].san}</button>
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
    return <div className="inline-variation-line">{elements}</div>;
  };

  const renderMoveTree = (nodeId: string): JSX.Element[] => {
    const node = nodes[nodeId];
    if (!node || node.children.length === 0) return [];

    const elements: JSX.Element[] = [];
    const children = node.children;
    const mainId = children[0];
    const mainNode = nodes[mainId];

    if (mainNode.turn === 'w') {
      const blackId = mainNode.children.length > 0 && nodes[mainNode.children[0]].turn === 'b'
        ? mainNode.children[0] : null;
      const blackNode = blackId ? nodes[blackId] : null;
      const hasWhiteVars = children.length > 1;

      if (!hasWhiteVars) {
        elements.push(
          <div key={mainId} className="main-row">
            <span className="m-num">{mainNode.moveNumber}.</span>
            <button className={`m-btn ${currentNodeId === mainId ? 'active' : ''}`} onClick={() => navigate(mainId)}>{mainNode.san}</button>
            <span className="m-sep">-</span>
            {blackNode
              ? <button className={`m-btn ${currentNodeId === blackId ? 'active' : ''}`} onClick={() => navigate(blackId!)}>{blackNode.san}</button>
              : <span className="m-placeholder">...</span>}
          </div>
        );
        mainNode.children.forEach(vId => {
          if (vId !== blackId) {
            const vNode = nodes[vId];
            elements.push(
              <div key={vId} className="variation-block">
                <span className="pgn-num">{vNode.moveNumber}...</span>
                <button className={`m-btn inline-btn ${currentNodeId === vId ? 'active' : ''}`} onClick={() => navigate(vId)}>{vNode.san}</button>
                <InlineVariation nodeId={vId} />
              </div>
            );
          }
        });
        elements.push(...renderMoveTree(blackId || mainId));
      } else {
        elements.push(
          <div key={mainId} className="main-row">
            <span className="m-num">{mainNode.moveNumber}.</span>
            <button className={`m-btn ${currentNodeId === mainId ? 'active' : ''}`} onClick={() => navigate(mainId)}>{mainNode.san}</button>
            <span className="m-sep">-</span>
            <span className="m-placeholder">...</span>
          </div>
        );
        children.slice(1).forEach(vId => {
          const vNode = nodes[vId];
          if (vNode.san.trim().toLowerCase() === mainNode.san.trim().toLowerCase()) return;
          elements.push(
            <div key={vId} className="variation-block">
              <span className="pgn-num">{vNode.moveNumber}.</span>
              <button className={`m-btn inline-btn ${currentNodeId === vId ? 'active' : ''}`} onClick={() => navigate(vId)}>{vNode.san}</button>
              <InlineVariation nodeId={vId} />
            </div>
          );
        });
        if (blackNode) {
          elements.push(
            <div key={blackId} className="main-row">
              <span className="m-num">{blackNode.moveNumber}...</span>
              <span className="m-placeholder">...</span>
              <span className="m-sep">-</span>
              <button className={`m-btn ${currentNodeId === blackId ? 'active' : ''}`} onClick={() => navigate(blackId!)}>{blackNode.san}</button>
            </div>
          );
        }
        elements.push(...renderMoveTree(blackId || mainId));
      }
    } else {
      elements.push(
        <div key={mainId} className="main-row">
          <span className="m-num">{mainNode.moveNumber}...</span>
          <span className="m-placeholder">...</span>
          <span className="m-sep">-</span>
          <button className={`m-btn ${currentNodeId === mainId ? 'active' : ''}`} onClick={() => navigate(mainId)}>{mainNode.san}</button>
        </div>
      );
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
            <Zap size={28} className="text-primary" fill="currentColor" />
            <h1>VCA Chess</h1>
            <div className={`conn-badge ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{isConnected ? (isReady ? 'Live' : 'Syncing…') : 'Offline'}</span>
            </div>
          </div>
          <div className="header-right">
            <div className="room-badge">
              <Users size={14} />
              <span>Room: {ROOM_ID}</span>
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
              onClick={() => { if (confirm('Reset the board for everyone?')) resetBoard(); }}
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
          <section className="board-section glass-panel">
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
                    {nodes['root']?.children.length === 0
                      ? <p className="empty-state">No moves yet. Make a move to start!</p>
                      : renderMoveTree('root')
                    }
                  </div>
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
          </section>
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

        .page-wrapper {
          min-height: 100vh;
          background: #0f172a;
          background-image:
            radial-gradient(circle at 0% 0%, rgba(139,92,246,.15) 0%, transparent 50%),
            radial-gradient(circle at 100% 100%, rgba(139,92,246,.10) 0%, transparent 50%);
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 2rem;
          color: #f8fafc;
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
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255,255,255,.1);
        }
        .logo { display: flex; align-items: center; gap: .75rem; }
        .logo h1 {
          font-size: 1.6rem;
          font-weight: 700;
          background: linear-gradient(135deg, #fff 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .text-primary { color: #8b5cf6; }

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
          font-size: .75rem; color: #94a3b8;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          padding: 4px 10px; border-radius: 8px;
        }
        .header-btn {
          display: flex; align-items: center; gap: 5px;
          font-size: .78rem; font-weight: 600;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.1);
          color: #f8fafc; padding: 5px 12px; border-radius: 8px;
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
          display: none; /* Replaced by shared navigation */
        }

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
          background: rgba(255,255,255,.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 8px 32px rgba(0,0,0,.37);
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
          background: rgba(255,255,255,.05);
          border-radius: 12px 12px 0 0;
          border: 1px solid rgba(255,255,255,.08);
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
          color: rgba(255,255,255,.5);
          font-size: 0.9rem;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .tab-btn:hover {
          color: rgba(255,255,255,.8);
          background: rgba(255,255,255,.03);
        }
        
        .tab-btn.active {
          color: #fff;
          background: rgba(139,92,246,.2);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.1);
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
          color: rgba(255,255,255,.3);
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
          background: rgba(255,255,255,.03);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,.05);
        }

        .participant-avatar {
          width: 28px;
          height: 28px;
          background: rgba(139,92,246,.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a78bfa;
        }

        .participant-name {
          flex: 1;
          font-size: 0.9rem;
          font-weight: 500;
          color: rgba(255,255,255,.9);
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
          font-size: .8rem; font-weight: 600; color: #a78bfa;
        }
        .chat-msg-time {
          font-size: .7rem; color: rgba(255,255,255,.4);
        }
        .chat-msg-text {
          font-size: .9rem; color: #f8fafc;
          background: rgba(255,255,255,.05);
          padding: 8px 12px; border-radius: 0 12px 12px 12px;
          border: 1px solid rgba(255,255,255,.05);
          line-height: 1.4;
        }
        .chat-input-form {
          display: flex; gap: 8px; margin-top: 16px;
        }
        .chat-input {
          flex: 1; background: rgba(0,0,0,.2);
          border: 1px solid rgba(255,255,255,.1);
          color: #fff; padding: 10px 14px;
          border-radius: 8px; outline: none; font-family: inherit;
        }
        .chat-input:focus { border-color: rgba(139,92,246,.5); }
        .chat-send-btn {
          background: #8b5cf6; border: none; color: #fff;
          padding: 0 14px; border-radius: 8px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background .2s;
        }
        .chat-send-btn:hover:not(:disabled) { background: #7c3aed; }
        .chat-send-btn:disabled { opacity: .5; cursor: not-allowed; }

        /* ── Move tree ── */
        .main-row {
          display: flex; align-items: center; gap: 6px;
          padding: 3px 10px;
          background: rgba(255,255,255,.03);
          border-radius: 4px; margin-bottom: 1px;
        }
        .variation-block {
          display: block;
          margin-left: 12px;
          border-left: 1px solid rgba(255,255,255,.1);
          padding: 2px 0 2px 10px;
          margin: 2px 0 4px;
          color: rgba(255,255,255,.6);
        }
        .variation-block::before { content: '('; margin-right: 2px; opacity: .4; }
        .variation-block::after  { content: ')'; margin-left:  2px; opacity: .4; }
        .inline-variation-line { display: inline; line-height: 1.4; }

        .m-num, .pgn-num {
          color: rgba(255,255,255,.4);
          font-size: .72rem; min-width: 28px; font-weight: 500;
        }
        .m-btn {
          background: transparent; border: none;
          color: #f8fafc; font-weight: 600;
          padding: 2px 6px; border-radius: 3px;
          cursor: pointer; transition: all .1s;
          min-width: 40px; text-align: left; font-size: .82rem;
        }
        .m-btn:hover   { background: rgba(255,255,255,.08); color: #8b5cf6; }
        .m-btn.active  { background: #3692e7; color: #fff; box-shadow: 0 2px 6px rgba(54,146,231,.25); }
        .m-btn.live-tip { outline: 1px solid rgba(74,222,128,.4); }
        .inline-btn { font-weight: 500; padding: 1px 4px; min-width: fit-content; display: inline-block; font-size: .8rem; }
        .m-sep         { color: rgba(255,255,255,.2); }
        .m-placeholder { color: rgba(255,255,255,.05); width: 40px; text-align: center; font-size: .7rem; }
      `}</style>
    </div>
  );
}
