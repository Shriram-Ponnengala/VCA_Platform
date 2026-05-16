import { Server } from 'socket.io';
import { createServer } from 'http';
import { handleSocketConnection } from './handlers/handler';
import os from 'os';
import dotenv from 'dotenv';

dotenv.config();

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

const httpServer = createServer();
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
    methods: ["GET", "POST"]
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
