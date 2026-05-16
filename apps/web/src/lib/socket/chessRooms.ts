import { Chess } from "chess.js";
import type { MoveNode, Participant, ChessRoomState, ArrowData, ChatMessage } from "./types";

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

interface ServerChessRoom extends ChessRoomState {
  participantsMap: Map<string, Participant>;
}

const globalRooms = global as typeof globalThis & {
  _chessRooms?: Map<string, ServerChessRoom>;
};

if (!globalRooms._chessRooms) {
  globalRooms._chessRooms = new Map();
}

const rooms: Map<string, ServerChessRoom> = globalRooms._chessRooms;

function createInitialNodes(): Record<string, MoveNode> {
  return {
    root: {
      id: 'root',
      fen: START_FEN,
      san: '',
      parentId: null,
      children: [],
      moveNumber: 0,
      turn: 'b', // Next move will be white
      arrows: []
    }
  };
}

export function getRoom(roomId: string): ServerChessRoom {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      nodes: createInitialNodes(),
      currentNodeId: 'root',
      participantsMap: new Map(),
      participants: [],
      isLocked: false,
      chatHistory: []
    });
  }
  return rooms.get(roomId)!;
}

export function getRoomState(roomId: string): ChessRoomState {
  const room = getRoom(roomId);
  return {
    nodes: room.nodes,
    currentNodeId: room.currentNodeId,
    participants: Array.from(room.participantsMap.values()),
    isLocked: room.isLocked || false,
    chatHistory: room.chatHistory || []
  };
}

export function applyMove(
  roomId: string,
  from: string,
  to: string,
  promotion = "q",
  parentId: string
): { node: MoveNode; currentNodeId: string } | null {
  const room = getRoom(roomId);
  
  if (room.isLocked) return null; // Prevent moves if locked

  const parentNode = room.nodes[parentId];
  if (!parentNode) return null;

  try {
    const game = new Chess(parentNode.fen);
    const result = game.move({ from, to, promotion });
    if (!result) return null;

    const existingChildId = parentNode.children.find(childId => {
      return room.nodes[childId].san === result.san;
    });

    let newCurrentNodeId = existingChildId;

    if (!newCurrentNodeId) {
      const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const newMoveNumber = parentNode.turn === 'b' ? parentNode.moveNumber + 1 : parentNode.moveNumber;
      
      const newNode: MoveNode = {
        id: nodeId,
        fen: game.fen(),
        san: result.san,
        from: result.from,
        to: result.to,
        parentId,
        children: [],
        moveNumber: newMoveNumber,
        turn: result.color as 'w' | 'b',
        arrows: []
      };

      room.nodes[nodeId] = newNode;
      room.nodes[parentId].children.push(nodeId);
      newCurrentNodeId = nodeId;
    }

    room.currentNodeId = newCurrentNodeId;

    return {
      node: room.nodes[newCurrentNodeId],
      currentNodeId: newCurrentNodeId
    };
  } catch (err) {
    return null;
  }
}

export function navigateNode(roomId: string, nodeId: string): { success: boolean; isLocked: boolean } {
  const room = getRoom(roomId);
  if (room.nodes[nodeId]) {
    room.currentNodeId = nodeId;
    // Auto-unlock on navigation per requirements
    room.isLocked = false;
    return { success: true, isLocked: false };
  }
  return { success: false, isLocked: room.isLocked };
}

export function resetRoom(roomId: string): void {
  const room = getRoom(roomId);
  room.nodes = createInitialNodes();
  room.currentNodeId = 'root';
  room.isLocked = false;
}

// ─── New Features Management ───
export function updateArrows(roomId: string, nodeId: string, arrows: ArrowData[]): boolean {
  const room = getRoom(roomId);
  if (room.nodes[nodeId]) {
    room.nodes[nodeId].arrows = arrows;
    return true;
  }
  return false;
}

export function toggleLock(roomId: string, isLocked: boolean): void {
  const room = getRoom(roomId);
  room.isLocked = isLocked;
}

export function addChatMessage(roomId: string, userId: string, username: string, message: string): ChatMessage {
  const room = getRoom(roomId);
  const msg: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    userId,
    username,
    message,
    timestamp: Date.now()
  };
  room.chatHistory.push(msg);
  
  // Keep history limited to 100 messages to prevent memory leaks
  if (room.chatHistory.length > 100) {
    room.chatHistory.shift();
  }
  return msg;
}

// ─── Participants management ───
export function addParticipant(roomId: string, socketId: string, name: string) {
  const room = getRoom(roomId);
  room.participantsMap.set(socketId, { id: socketId, name });
  room.participants = Array.from(room.participantsMap.values());
}

export function removeParticipant(roomId: string, socketId: string) {
  const room = getRoom(roomId);
  room.participantsMap.delete(socketId);
  room.participants = Array.from(room.participantsMap.values());
}
