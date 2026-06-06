'use client';

/**
 * useChessRoom
 *
 * A focused hook that manages the real-time chess session for a single room.
 * Responsibilities:
 *  - Connects to the Socket.IO server (via the existing /api/socket endpoint)
 *  - Joins the specified chess room on connect
 *  - Exposes: current FEN, ordered move history, connection status
 *  - Provides makeMove() — sends to server and does NOT update local state
 *    until server confirms via chess:move_made
 *  - Provides resetBoard() — sends reset request to server
 *
 * Usage:
 *   const { fen, history, isConnected, makeMove, resetBoard } = useChessRoom("test-room");
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents, MoveNode, Participant, ArrowData, ChatMessage } from '@vca/types';

type ChessSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface UseChessRoomReturn {
  nodes: Record<string, MoveNode>;
  currentNodeId: string;
  participants: Participant[];
  isConnected: boolean;
  isReady: boolean;
  isLocked: boolean;
  chatHistory: ChatMessage[];
  studyTags: Record<string, string>;
  isFreehand: boolean;
  makeMove: (from: string, to: string, promotion?: string, parentId?: string) => void;
  navigate: (nodeId: string) => void;
  resetBoard: () => void;
  updateArrows: (arrows: ArrowData[]) => void;
  clearArrows: () => void;
  toggleLock: (locked: boolean) => void;
  toggleFreehand: (freehand: boolean) => void;
  sendChatMessage: (message: string) => void;
  updateNodeAnnotations: (nodeId: string, comment?: string, glyphs?: string[]) => void;
  setStudyTag: (key: string, value: string) => void;
  removeStudyTag: (key: string) => void;
  setupPosition: (fen: string) => void;
  promoteToMainline: (nodeId: string) => void;
  promoteVariation: (nodeId: string) => void;
  deleteSubsequentMoves: (nodeId: string) => void;
  deletePreviousMoves: (nodeId: string) => void;
}

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const initialNodes: Record<string, MoveNode> = {
  root: { id: 'root', fen: START_FEN, san: '', parentId: null, children: [], moveNumber: 0, turn: 'b', arrows: [] }
};

export function useChessRoom(
  roomId: string,
  userJWT?: string,
  options?: { enabled?: boolean }
): UseChessRoomReturn {
  const actualRoomId = roomId.startsWith('batch_') ? roomId : `batch_${roomId}`;
  const [nodes, setNodes] = useState<Record<string, MoveNode>>(initialNodes);
  const [currentNodeId, setCurrentNodeId] = useState<string>('root');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [isFreehand, setIsFreehand] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [studyTags, setStudyTags] = useState<Record<string, string>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const socketRef = useRef<ChessSocket | null>(null);
  const roomIdRef = useRef(actualRoomId);
  const currentNodeIdRef = useRef(currentNodeId);

  useEffect(() => {
    roomIdRef.current = actualRoomId;
  }, [actualRoomId]);

  useEffect(() => {
    currentNodeIdRef.current = currentNodeId;
  }, [currentNodeId]);

  useEffect(() => {
    if (options?.enabled === false) {
      setIsConnected(false);
      setIsReady(false);
      return;
    }

    let isMounted = true;
    let socket: ChessSocket;

    const init = () => {
      console.log('[ChessRoom] Initializing socket connection for room:', roomIdRef.current);
      
      if (!isMounted) return;

      console.log('[ChessRoom] Attempting socket connection...');
      // Use configured environment variable or dynamically determine host IP
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || `http://${window.location.hostname}:4001`;
      
      socket = io(socketUrl, {
        auth: {
          token: userJWT
        },
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        transports: ['websocket', 'polling'],
      }) as ChessSocket;

      socketRef.current = socket;

        socket.on('connect', () => {
          console.log('[ChessRoom] Socket connected! ID:', socket.id);
          setIsConnected(true);
          const batchId = roomIdRef.current.replace('batch_', '');
          socket.emit('join_classroom', { batchId });
        });

        socket.on('access_denied', () => {
          console.error('[ChessRoom] Access denied to this classroom');
          setIsConnected(false);
          setIsReady(false);
        });

        socket.on('connect_error', (err) => {
          console.warn('[ChessRoom] Connection warning:', err.message);
          setIsConnected(false);
        });

        socket.on('disconnect', (reason) => {
          console.log('[ChessRoom] Socket disconnected. Reason:', reason);
          setIsConnected(false);
          setIsReady(false);
        });

        // ── Chess events ────────────────────────────────────────────────────

        socket.on('chess:state', (state) => {
          console.log('[ChessRoom] State received');
          setNodes(state.nodes);
          setCurrentNodeId(state.currentNodeId);
          setParticipants(state.participants);
          setIsLocked(state.isLocked);
          setIsFreehand(state.isFreehand || false);
          setChatHistory(state.chatHistory);
          setStudyTags(state.studyTags || {});
          setIsReady(true);
        });

        socket.on('chess:move_made', ({ node, currentNodeId }) => {
          console.log('[ChessRoom] Move made:', node.san);
          setNodes(prev => {
            const next = { ...prev };
            if (node.parentId && next[node.parentId]) {
              const parent = next[node.parentId];
              if (!parent.children.includes(node.id)) {
                next[node.parentId] = { ...parent, children: [...parent.children, node.id] };
              }
            }
            next[node.id] = node;
            return next;
          });
          setCurrentNodeId(currentNodeId);
        });

        socket.on('chess:navigated', ({ currentNodeId, isLocked }) => {
          setCurrentNodeId(currentNodeId);
          if (isLocked !== undefined) setIsLocked(isLocked);
        });

        socket.on('chess:participants_update', (updatedParticipants) => {
          setParticipants(updatedParticipants);
        });

        socket.on('chess:move_rejected', ({ reason }) => {
          console.warn('[ChessRoom] Move rejected:', reason);
        });
        
        socket.on('chess:arrows_updated', ({ nodeId, arrows }) => {
          setNodes(prev => {
            if (!prev[nodeId]) return prev;
            return {
              ...prev,
              [nodeId]: { ...prev[nodeId], arrows }
            };
          });
        });

        socket.on('chess:lock_toggled', ({ isLocked }) => {
          setIsLocked(isLocked);
        });

        socket.on('chess:freehand_toggled', ({ isFreehand }) => {
          setIsFreehand(isFreehand);
        });

        socket.on('chess:chat_message', (msg) => {
          setChatHistory(prev => {
            const newHistory = [...prev, msg];
            if (newHistory.length > 100) newHistory.shift();
            return newHistory;
          });
        });

        socket.on('chess:node_updated', ({ nodeId, comment, glyphs }) => {
          setNodes(prev => {
            if (!prev[nodeId]) return prev;
            return {
              ...prev,
              [nodeId]: {
                ...prev[nodeId],
                ...(comment !== undefined && { comment }),
                ...(glyphs !== undefined && { glyphs })
              }
            };
          });
        });

        socket.on('chess:set_tag', ({ key, value }) => {
          setStudyTags(prev => ({ ...prev, [key]: value }));
        });

        socket.on('chess:remove_tag', ({ key }) => {
          setStudyTags(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        });

        socket.on('error', (msg) => {
          console.error('[ChessRoom] Socket error event:', msg);
        });
    };


    init();

    return () => {
      console.log('[ChessRoom] Component unmounting, cleaning up socket...');
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [options?.enabled]);

  const makeMove = useCallback((from: string, to: string, promotion = 'q', parentId?: string) => {
    socketRef.current?.emit('chess:make_move', {
      roomId: roomIdRef.current,
      from,
      to,
      promotion,
      parentId: parentId || currentNodeIdRef.current,
    });
  }, []);

  const navigate = useCallback((nodeId: string) => {
    socketRef.current?.emit('chess:navigate', {
      roomId: roomIdRef.current,
      nodeId,
    });
  }, []);

  const resetBoard = useCallback(() => {
    socketRef.current?.emit('chess:reset', roomIdRef.current);
  }, []);

  const updateArrows = useCallback((arrows: ArrowData[]) => {
    socketRef.current?.emit('chess:update_arrows', {
      roomId: roomIdRef.current,
      nodeId: currentNodeIdRef.current,
      arrows
    });
  }, []);

  const clearArrows = useCallback(() => {
    socketRef.current?.emit('chess:update_arrows', {
      roomId: roomIdRef.current,
      nodeId: currentNodeIdRef.current,
      arrows: []
    });
  }, []);

  const toggleLock = useCallback((locked: boolean) => {
    socketRef.current?.emit('chess:toggle_lock', {
      roomId: roomIdRef.current,
      isLocked: locked
    });
  }, []);

  const toggleFreehand = useCallback((freehand: boolean) => {
    socketRef.current?.emit('chess:toggle_freehand', {
      roomId: roomIdRef.current,
      isFreehand: freehand
    });
  }, []);

  const sendChatMessage = useCallback((message: string) => {
    socketRef.current?.emit('chess:send_chat', {
      roomId: roomIdRef.current,
      message
    });
  }, []);

  const updateNodeAnnotations = useCallback((nodeId: string, comment?: string, glyphs?: string[]) => {
    socketRef.current?.emit('chess:update_node', {
      roomId: roomIdRef.current,
      nodeId,
      comment,
      glyphs
    });
  }, []);

  const setStudyTag = useCallback((key: string, value: string) => {
    socketRef.current?.emit('chess:set_tag', {
      roomId: roomIdRef.current,
      key,
      value
    });
  }, []);

  const removeStudyTag = useCallback((key: string) => {
    socketRef.current?.emit('chess:remove_tag', {
      roomId: roomIdRef.current,
      key
    });
  }, []);

  const setupPosition = useCallback((fen: string) => {
    socketRef.current?.emit('chess:setup_position', {
      roomId: roomIdRef.current,
      fen
    });
  }, []);

  const promoteToMainline = useCallback((nodeId: string) => {
    socketRef.current?.emit('chess:promote_to_mainline', {
      roomId: roomIdRef.current,
      nodeId
    });
  }, []);

  const promoteVariation = useCallback((nodeId: string) => {
    socketRef.current?.emit('chess:promote_variation', {
      roomId: roomIdRef.current,
      nodeId
    });
  }, []);

  const deleteSubsequentMoves = useCallback((nodeId: string) => {
    socketRef.current?.emit('chess:delete_subsequent_moves', {
      roomId: roomIdRef.current,
      nodeId
    });
  }, []);

  const deletePreviousMoves = useCallback((nodeId: string) => {
    socketRef.current?.emit('chess:delete_previous_moves', {
      roomId: roomIdRef.current,
      nodeId
    });
  }, []);

  return { 
    nodes, currentNodeId, participants, isConnected, isReady, isLocked, isFreehand, chatHistory, studyTags,
    makeMove, navigate, resetBoard, updateArrows, clearArrows, toggleLock, toggleFreehand, sendChatMessage,
    updateNodeAnnotations, setStudyTag, removeStudyTag, setupPosition,
    promoteToMainline, promoteVariation, deleteSubsequentMoves, deletePreviousMoves
  };
}
