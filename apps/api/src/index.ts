import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@vca/database';

import routes from './routes';

import os from 'os';

const app = express();

// Helper to get local IP address for logging
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

// Configurable CORS for development and network access
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({ 
  origin: (origin, callback) => {
    // In dev, allow requests with no origin (like mobile apps) or from any allowed origin
    if (!origin || allowedOrigins.includes(origin) || origin.includes('192.168.')) {
      callback(null, true);
    } else {
      callback(null, true); // Still allow all in dev for now, but log origin
    }
  }, 
  credentials: true 
}));

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

app.use('/api', routes);

const PORT = Number(process.env.PORT) || 4000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
  const localIp = getLocalIp();
  console.log(`\n🚀 API Server is running!`);
  console.log(`   - Local:    http://localhost:${PORT}`);
  console.log(`   - Network:  http://${localIp}:${PORT}`);
  console.log(`   - Origin:   ${allowedOrigins.join(', ')}\n`);
});
