import { Chess } from "chess.js";
import type { MoveNode, Participant, ChessRoomState, ArrowData, ChatMessage } from "@vca/types";

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
      isFreehand: false,
      chatHistory: [],
      studyTags: {}
    });
  }
  return rooms.get(roomId)!;
}

export function hasRoom(roomId: string): boolean {
  return rooms.has(roomId);
}

export function getRoomState(roomId: string): ChessRoomState {
  const room = getRoom(roomId);
  return {
    nodes: room.nodes,
    currentNodeId: room.currentNodeId,
    participants: Array.from(room.participantsMap.values()),
    isLocked: room.isLocked || false,
    isFreehand: room.isFreehand || false,
    chatHistory: room.chatHistory || [],
    studyTags: room.studyTags || {}
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

  // If freehand mode is active, try standard move, but if it throws or fails, fallback to custom FEN mover
  if (room.isFreehand) {
    let result: any = null;
    let finalFen = "";
    let sanStr = "";
    let finalTurn: 'w' | 'b' = 'w';
    let finalMoveNumber = parentNode.moveNumber;

    try {
      const game = new Chess(parentNode.fen);
      result = game.move({ from, to, promotion });
      if (result) {
        sanStr = result.san;
        finalFen = game.fen();
        finalTurn = result.color as 'w' | 'b';
        finalMoveNumber = parentNode.turn === 'b' ? parentNode.moveNumber + 1 : parentNode.moveNumber;
      }
    } catch (e) {
      // Standard move threw an error (illegal move or invalid FEN due to missing king)
    }

    if (!result) {
      const freehandResult = movePieceInFen(parentNode.fen, from, to);
      if (!freehandResult) return null;
      finalFen = freehandResult.fen;
      sanStr = freehandResult.san;
      finalTurn = freehandResult.color;
      finalMoveNumber = finalTurn === 'w' ? parentNode.moveNumber + 1 : parentNode.moveNumber;
    }

    const existingChildId = parentNode.children.find(childId => {
      return room.nodes[childId].san === sanStr;
    });

    let newCurrentNodeId = existingChildId;

    if (!newCurrentNodeId) {
      const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      
      const newNode: MoveNode = {
        id: nodeId,
        fen: finalFen,
        san: sanStr,
        from,
        to,
        parentId,
        children: [],
        moveNumber: finalMoveNumber,
        turn: finalTurn,
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
  } else {
    // Normal movement path
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
          from,
          to,
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
}

function movePieceInFen(fen: string, from: string, to: string): { fen: string; san: string; pieceType: string; color: 'w' | 'b' } | null {
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
    
    // Toggle active turn color
    parts[1] = parts[1] === 'w' ? 'b' : 'w';
    if (parts[1] === 'w' && parts[5]) {
      parts[5] = String(parseInt(parts[5], 10) + 1);
    }
    const newFen = parts.join(' ');
    
    const uPiece = piece.toUpperCase();
    const san = `${uPiece === 'P' ? '' : uPiece}${from}-${to}`;
    const color = piece === piece.toUpperCase() ? 'w' : 'b';

    return {
      fen: newFen,
      san,
      pieceType: uPiece.toLowerCase(),
      color
    };
  } catch (e) {
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

export function setupPosition(roomId: string, fen: string): void {
  const room = getRoom(roomId);
  const parts = fen.split(' ');
  const isBlackToPlay = parts[1] === 'b';
  const fullmove = parseInt(parts[5], 10) || 1;
  const turnColor = isBlackToPlay ? 'w' : 'b';
  const moveNumber = isBlackToPlay ? fullmove : (fullmove > 1 ? fullmove - 1 : 0);

  room.nodes = {
    root: {
      id: 'root',
      fen: fen,
      san: '',
      parentId: null,
      children: [],
      moveNumber: moveNumber,
      turn: turnColor,
      arrows: []
    }
  };
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

export function toggleFreehand(roomId: string, isFreehand: boolean): void {
  const room = getRoom(roomId);
  room.isFreehand = isFreehand;
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

export function updateNodeAnnotations(roomId: string, nodeId: string, comment?: string, glyphs?: string[]): boolean {
  const room = getRoom(roomId);
  if (room.nodes[nodeId]) {
    if (comment !== undefined) room.nodes[nodeId].comment = comment;
    if (glyphs !== undefined) room.nodes[nodeId].glyphs = glyphs;
    return true;
  }
  return false;
}

export function setStudyTag(roomId: string, key: string, value: string): void {
  const room = getRoom(roomId);
  room.studyTags[key] = value;
}

export function removeStudyTag(roomId: string, key: string): void {
  const room = getRoom(roomId);
  delete room.studyTags[key];
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

export function promoteToMainline(roomId: string, nodeId: string): boolean {
  const room = getRoom(roomId);
  const node = room.nodes[nodeId];
  if (!node || !node.parentId) return false;

  const parent = room.nodes[node.parentId];
  if (!parent) return false;

  const index = parent.children.indexOf(nodeId);
  if (index > 0) {
    parent.children.splice(index, 1);
    parent.children.unshift(nodeId);
    return true;
  }
  return false;
}

export function promoteVariation(roomId: string, nodeId: string): boolean {
  const room = getRoom(roomId);
  const node = room.nodes[nodeId];
  if (!node || !node.parentId) return false;

  const parent = room.nodes[node.parentId];
  if (!parent) return false;

  const index = parent.children.indexOf(nodeId);
  if (index > 0) {
    const temp = parent.children[index - 1];
    parent.children[index - 1] = nodeId;
    parent.children[index] = temp;
    return true;
  }
  return false;
}

export function deleteSubsequentMoves(roomId: string, nodeId: string): boolean {
  const room = getRoom(roomId);
  const node = room.nodes[nodeId];
  if (!node) return false;

  const removeDescendants = (id: string) => {
    const n = room.nodes[id];
    if (n) {
      n.children.forEach(childId => removeDescendants(childId));
      delete room.nodes[id];
    }
  };

  node.children.forEach(childId => removeDescendants(childId));
  node.children = [];

  if (!room.nodes[room.currentNodeId]) {
    room.currentNodeId = nodeId;
  }
  return true;
}

export function deletePreviousMoves(roomId: string, nodeId: string): boolean {
  const room = getRoom(roomId);
  const node = room.nodes[nodeId];
  if (!node || nodeId === 'root') return false;

  const descendants = new Set<string>();
  const collectDescendants = (id: string) => {
    descendants.add(id);
    const n = room.nodes[id];
    if (n) {
      n.children.forEach(childId => collectDescendants(childId));
    }
  };
  collectDescendants(nodeId);

  const rootNode = room.nodes['root'];
  if (!rootNode) return false;

  rootNode.fen = node.fen;
  rootNode.san = '';
  rootNode.parentId = null;
  rootNode.children = node.children;
  rootNode.moveNumber = node.moveNumber;
  rootNode.turn = node.turn;
  rootNode.arrows = node.arrows || [];
  rootNode.comment = node.comment;
  rootNode.glyphs = node.glyphs;

  rootNode.children.forEach(childId => {
    if (room.nodes[childId]) {
      room.nodes[childId].parentId = 'root';
    }
  });

  Object.keys(room.nodes).forEach(id => {
    if (id !== 'root' && !descendants.has(id)) {
      delete room.nodes[id];
    }
  });

  if (nodeId !== 'root') {
    delete room.nodes[nodeId];
  }

  if (!descendants.has(room.currentNodeId) || room.currentNodeId === nodeId) {
    room.currentNodeId = 'root';
  }

  return true;
}
