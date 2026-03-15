// src/modules/auth/auth.routes.js
const express    = require('express')
const passport   = require('passport')
const controller = require('./auth.controller')
const authenticate = require('../../middleware/authenticate')
const { authLimiter } = require('../../middleware/rateLimiter')

const router = express.Router()

// ── Email auth ────────────────────────────────────────────────────────────────
router.post('/register',      authLimiter, controller.register)
router.post('/verify-email',  authLimiter, controller.verifyEmail)
router.post('/login',         authLimiter, controller.login)
router.post('/refresh',       controller.refresh)
router.post('/logout',        authenticate, controller.logout)
router.post('/forgot-password', authLimiter, controller.forgotPassword)
router.post('/reset-password',  authLimiter, controller.resetPassword)

// ── OAuth — Google ────────────────────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth' }),
  controller.oauthCallback
)

// ── OAuth — GitHub ────────────────────────────────────────────────────────────
router.get('/github',
  passport.authenticate('github', { scope: ['user:email'] })
)
router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login?error=oauth' }),
  controller.oauthCallback
)

// ── Current user ──────────────────────────────────────────────────────────────
router.get('/me', authenticate, controller.getMe)

module.exports = router