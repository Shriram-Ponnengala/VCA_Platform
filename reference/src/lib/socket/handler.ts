import { Server, Socket } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "./types";
import {
  getRoomState,
  applyMove,
  navigateNode,
  resetRoom,
  addParticipant,
  removeParticipant,
  updateArrows,
  toggleLock,
  addChatMessage
} from "./chessRooms";

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type Sock = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function handleSocketConnection(io: IO) {
  io.on("connection", (socket: Sock) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    
    // Track which rooms this socket is in for cleanup
    const joinedRooms = new Set<string>();

    // ── Existing live-class room events ─────────────────────────────────────

    socket.on("join-room", (liveClassId: string) => {
      if (!liveClassId) {
        socket.emit("error", "Room ID is required");
        return;
      }
      socket.join(liveClassId);
      console.log(`[Socket] User ${socket.id} joined room: ${liveClassId}`);
      socket.to(liveClassId).emit("user-joined", { userId: socket.id });
    });

    socket.on("leave-room", (liveClassId: string) => {
      socket.leave(liveClassId);
      console.log(`[Socket] User ${socket.id} left room: ${liveClassId}`);
      socket.to(liveClassId).emit("user-left", { userId: socket.id });
    });

    socket.on("send-message", ({ liveClassId, message }) => {
      io.to(liveClassId).emit("room-message", { userId: socket.id, message });
    });

    // ── Chess events ─────────────────────────────────────────────────────────

    socket.on("chess:join_room", (roomId: string) => {
      socket.join(roomId);
      joinedRooms.add(roomId);
      
      // Use socket.id as a generic name for now, you can extend this to use real user info
      const participantName = `Admin (${socket.id.substring(0, 4)})`;
      addParticipant(roomId, socket.id, participantName);
      
      console.log(`[Chess] ${participantName} joined chess room: ${roomId}`);

      // Send full state to joining client
      socket.emit("chess:state", getRoomState(roomId));
      
      // Broadcast updated participants to everyone in the room
      io.to(roomId).emit("chess:participants_update", getRoomState(roomId).participants);
    });

    socket.on("chess:make_move", ({ roomId, from, to, promotion, parentId }) => {
      console.log(`[Chess] Move request: ${from}-${to} in room ${roomId} from ${socket.id}`);
      const result = applyMove(roomId, from, to, promotion ?? "q", parentId);

      if (result) {
        console.log(`[Chess] Move ${result.node.san} ACCEPTED in room ${roomId}`);
        io.to(roomId).emit("chess:move_made", result);
      } else {
        console.log(`[Chess] Move ${from}-${to} REJECTED in room ${roomId} (Illegal or Locked)`);
        socket.emit("chess:move_rejected", {
          reason: `Illegal move or board is locked`,
        });
      }
    });

    socket.on("chess:navigate", ({ roomId, nodeId }) => {
      const result = navigateNode(roomId, nodeId);
      if (result.success) {
        io.to(roomId).emit("chess:navigated", { 
          currentNodeId: nodeId,
          isLocked: result.isLocked 
        });
      }
    });

    socket.on("chess:reset", (roomId: string) => {
      resetRoom(roomId);
      console.log(`[Chess] Room ${roomId} reset by ${socket.id}`);
      io.to(roomId).emit("chess:state", getRoomState(roomId));
    });

    // ── New Feature Events ───────────────────────────────────────────────────

    socket.on("chess:update_arrows", ({ roomId, nodeId, arrows }) => {
      if (updateArrows(roomId, nodeId, arrows)) {
        // Broadcast arrows so other clients can draw them instantly
        io.to(roomId).emit("chess:arrows_updated", { nodeId, arrows });
      }
    });

    socket.on("chess:toggle_lock", ({ roomId, isLocked }) => {
      toggleLock(roomId, isLocked);
      io.to(roomId).emit("chess:lock_toggled", { isLocked });
    });

    socket.on("chess:send_chat", ({ roomId, message }) => {
      // Create a nice username or look it up from participantsMap
      const state = getRoomState(roomId);
      const participant = state.participants.find(p => p.id === socket.id);
      const username = participant ? participant.name : `Admin (${socket.id.substring(0,4)})`;
      
      const chatMsg = addChatMessage(roomId, socket.id, username, message);
      io.to(roomId).emit("chess:chat_message", chatMsg);
    });

    // ── Disconnect ───────────────────────────────────────────────────────────

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} (${reason})`);
      joinedRooms.forEach(roomId => {
        removeParticipant(roomId, socket.id);
        io.to(roomId).emit("chess:participants_update", getRoomState(roomId).participants);
      });
    });
  });
}
