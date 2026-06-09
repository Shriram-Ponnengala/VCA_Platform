import { Server } from 'socket.io';
import { createServer } from 'http';
import { handleSocketConnection } from './handlers/handler';
import os from 'os';
import dotenv from 'dotenv';
import * as jose from 'jose';

dotenv.config();

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'wdfghjifghjoixcvhjk'
);

const getLocalIp = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
};

import { prisma } from '@vca/database';
import { getRoomState } from './rooms/chessRooms';

const globalRooms = global as typeof globalThis & {
  _chessRooms?: Map<string, any>;
};

const httpServer = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/internal/end-room') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString() });
    req.on('end', async () => {
      try {
        const { batchId, classroomId } = JSON.parse(body);
        const roomId = `batch_${batchId}`;
        
        // Save final state to DB before destroying
        if (globalRooms._chessRooms && globalRooms._chessRooms.has(roomId)) {
          const room = globalRooms._chessRooms.get(roomId);
          const state = {
            nodes: room.nodes,
            currentNodeId: room.currentNodeId,
            participants: Array.from(room.participantsMap.values()),
            isLocked: room.isLocked || false,
            chatHistory: room.chatHistory || [],
            studyTags: room.studyTags || {},
            chapters: room.chapters || [],
            activeChapterIndex: room.activeChapterIndex !== undefined ? room.activeChapterIndex : -1
          };
          
          try {
            if (classroomId) {
              await prisma.classroom.update({
                where: { id: Number(classroomId) },
                data: { stateData: state as any }
              });
              console.log(`[Socket Server] Saved final state for classroom ID ${classroomId}`);
            } else {
              const activeClassroom = await prisma.classroom.findFirst({
                where: { batch_id: String(batchId) },
                orderBy: { created_at: 'desc' }
              });
              if (activeClassroom) {
                await prisma.classroom.update({
                  where: { id: activeClassroom.id },
                  data: { stateData: state as any }
                });
                console.log(`[Socket Server] Saved final state for fallback classroom ID ${activeClassroom.id}`);
              }
            }
          } catch (dbErr) {
            console.error('[Socket Server] Error saving final state to DB:', dbErr);
          }
        }

        // Notify clients
        io.to(roomId).emit('access_denied');
        // Kick them out
        io.in(roomId).socketsLeave(roomId);
        // Destroy room
        if (globalRooms._chessRooms) {
          globalRooms._chessRooms.delete(roomId);
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        console.error('[Socket Server] Error ending room:', e);
        res.writeHead(500);
        res.end('Error');
      }
    });
    return;
  }
  
  res.writeHead(404);
  res.end();
});

// Persistence Loop
setInterval(async () => {
  try {
    if (!globalRooms._chessRooms) return;
    for (const [roomId, room] of globalRooms._chessRooms.entries()) {
      const batchIdStr = roomId.replace('batch_', '');
      await prisma.classroom.updateMany({
        where: { batch_id: batchIdStr, status: 'ACTIVE' },
        data: {
          stateData: getRoomState(roomId) as any
        }
      });
    }
  } catch (e) {
    console.error('[Persistence] Error saving state:', e);
  }
}, 30000);
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
console.log(allowedOrigins);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.includes('192.168.')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

import cookie from 'cookie';

io.use(async (socket, next) => {
  try {
    let token = socket.handshake.auth.token;
    if (!token && socket.request.headers.cookie) {
      const cookies = cookie.parse(socket.request.headers.cookie);
      token = cookies['auth-token'];
    }
    
    if (!token) throw new Error("no token provided");
    
    const { payload: decoded } = await jose.jwtVerify(token, JWT_SECRET);
    (socket as any).user = decoded;
    next();
  } catch (err: any) {
    console.error("[Socket Auth Middleware] Failed to authorize socket:", err.message || err);
    next(new Error("unauthorized"));
  }
});

handleSocketConnection(io as any);

const PORT = Number(process.env.PORT) || 4001;
const HOST = '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  const localIp = getLocalIp();
  console.log(`\n⚡ Realtime Server is running!`);
  console.log(`   - Local:    ws://localhost:${PORT}`);
  console.log(`   - Network:  ws://${localIp}:${PORT}\n`);
});
