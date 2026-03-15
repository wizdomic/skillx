// src/config/socket.js
// Real-time layer for chat messages and session notifications.

const { Server } = require('socket.io');
const { CLIENT_URL } = require('./env');
const jwtService = require('../services/jwtService');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authenticate every Socket.IO connection via JWT
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) return next(new Error('Authentication token missing'));

      const decoded = jwtService.verifyAccessToken(token);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌  Socket connected: ${socket.userId}`);

    // Each user joins their own private room for direct notifications
    socket.join(`user:${socket.userId}`);

    // ── Chat ─────────────────────────────────────────────────────────────────
    socket.on('chat:send', (data) => {
      // data = { receiverId, content, tempId }
      // Persist via HTTP API; here we just broadcast instantly for UX
      io.to(`user:${data.receiverId}`).emit('chat:receive', {
        senderId: socket.userId,
        content: data.content,
        tempId: data.tempId,
        createdAt: new Date().toISOString(),
      });
    });

    // ── Typing indicator ─────────────────────────────────────────────────────
    socket.on('chat:typing', ({ receiverId }) => {
      io.to(`user:${receiverId}`).emit('chat:typing', { senderId: socket.userId });
    });

    socket.on('disconnect', () => {
      console.log(`🔌  Socket disconnected: ${socket.userId}`);
    });
  });

  return io;
};

// Utility to emit from anywhere in the backend (controllers / services)
const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialised');
  return io;
};

module.exports = { initSocket, getIO };
