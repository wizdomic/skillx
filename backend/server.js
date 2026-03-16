// server.js — HTTP + Socket.IO entry point
const http = require('http')
const app  = require('./src/app')
const connectDB = require('./src/config/db')
const { initSocket } = require('./src/config/socket')
const { runSessionReminders } = require('./src/jobs/sessionReminder')
const { PORT } = require('./src/config/env')

const startServer = async () => {
  await connectDB()

  const server = http.createServer(app)
  initSocket(server)
  runSessionReminders()

  server.listen(PORT, () => {
    console.log(`🚀  Server running on http://localhost:${PORT}`)
    console.log(`🌱  Environment: ${process.env.NODE_ENV}`)
  })

  const shutdown = async (signal) => {
    console.log(`${signal} received. Shutting down...`)
    server.close(() => process.exit(0))
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT',  () => shutdown('SIGINT'))

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err.message)
    server.close(() => process.exit(1))
  })
}

startServer()