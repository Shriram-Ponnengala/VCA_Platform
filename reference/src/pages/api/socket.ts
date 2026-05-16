
import { Server as NetServer } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
import { handleSocketConnection } from "@/lib/socket/handler";

export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = (req: NextApiRequest, res: any) => {
  // If it's a Socket.io internal request (has EIO param), 
  // do NOT call res.end() or Next.js will steal the request from Socket.io.
  if (req.query.EIO) {
    return;
  }

  if (!res.socket.server.io) {
    console.log("[Socket] Initializing Socket.io server...");
    
    // Initialize Socket.io
    const httpServer: NetServer = res.socket.server as any;
    const io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
      pingTimeout: 120000,
      pingInterval: 30000,
      transports: ["polling", "websocket"],
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // Handle connections (only once)
    const ioAny = io as any;
    if (!ioAny.initialized) {
      console.log("[Socket] Attaching event handlers...");
      handleSocketConnection(ioAny);
      ioAny.initialized = true;
    }
 
    // Save the instance
    res.socket.server.io = io;
  } else {
    console.log("[Socket] Socket.io server already running");
  }
  
  res.end();
};

export default SocketHandler;
