// server.js — HTTP + Socket.IO entry point

const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const redis = require('./src/config/redis');
const { initSocket } = require('./src/config/socket');
const { runSessionReminders } = require('./src/jobs/sessionReminder');
const { PORT } = require('./src/config/env');

const startServer = async () => {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Connect to Redis (lazyConnect was set, so we force connect now)
  await redis.connect().catch(() => {
    console.warn('⚠️  Redis unavailable. OTP and token blacklist features will not work.');
  });

  // 3. Create HTTP server from Express app
  const server = http.createServer(app);

  // 4. Attach Socket.IO
  initSocket(server);

  // 5. Start background jobs
  runSessionReminders();

  // 6. Listen
  server.listen(PORT, () => {
    console.log(`\n🚀  Server running on http://localhost:${PORT}`);
    console.log(`📡  Socket.IO ready`);
    console.log(`🌱  Environment: ${process.env.NODE_ENV}\n`);
  });

  // ── Graceful shutdown ────────────────────────────────────────────────────────
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await redis.quit();
      console.log('👋  Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Crash on unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('💥  Unhandled rejection:', err.message);
    server.close(() => process.exit(1));
  });
};

startServer();
