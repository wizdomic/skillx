// src/app.js
const express  = require('express')
const helmet   = require('helmet')
const cors     = require('cors')
const morgan   = require('morgan')
const passport = require('passport')

const { CLIENT_URL, NODE_ENV } = require('./config/env')
const { globalLimiter }        = require('./middleware/rateLimiter')
const { errorHandler }         = require('./middleware/errorHandler')

require('./config/passport')

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes             = require('./modules/auth/auth.routes')
const userRoutes             = require('./modules/users/user.routes')
const skillRoutes            = require('./modules/skills/skill.routes')
const sessionRoutes          = require('./modules/sessions/session.routes')
const creditController       = require('./modules/credits/credit.controller')
const ratingController       = require('./modules/ratings/rating.controller')
const requestController      = require('./modules/requests/request.controller')
const recommendationController = require('./modules/recommendations/recommendation.controller')
const chatController         = require('./modules/chat/chat.controller')

const app = express()

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  // Allow fonts/images from Google Fonts in development
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
  // Allow cross-origin requests in dev
  crossOriginEmbedderPolicy: NODE_ENV === 'production',
}))

// Prevent browser from sniffing MIME types
app.use(helmet.noSniff())
// Disable X-Powered-By header
app.use(helmet.hidePoweredBy())
// Force HTTPS in production
if (NODE_ENV === 'production') {
  app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }))
}

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// ── Logging ───────────────────────────────────────────────────────────────────
if (NODE_ENV !== 'test') {
  app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'))
}

// ── Rate limiter ──────────────────────────────────────────────────────────────
app.use('/api', globalLimiter)

// ── Passport ──────────────────────────────────────────────────────────────────
app.use(passport.initialize())

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: NODE_ENV })
})

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',            authRoutes)
app.use('/api/users',           userRoutes)
app.use('/api/skills',          skillRoutes)
app.use('/api/sessions',        sessionRoutes)
app.use('/api/credits',         creditController.router)
app.use('/api/ratings',         ratingController.router)
app.use('/api/requests',        requestController.router)
app.use('/api/recommendations', recommendationController.router)
app.use('/api/chat',            chatController.router)

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` })
})

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler)

module.exports = app