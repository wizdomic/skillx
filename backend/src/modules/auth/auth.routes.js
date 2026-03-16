// src/modules/auth/auth.routes.js
const express      = require('express')
const passport     = require('passport')
const controller   = require('./auth.controller')
const authenticate = require('../../middleware/authenticate')

const router = express.Router()

// ── Google ────────────────────────────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth' }),
  controller.oauthCallback
)

// ── GitHub ────────────────────────────────────────────────────────────────────
router.get('/github',
  passport.authenticate('github', { scope: ['user:email'] })
)
router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login?error=oauth' }),
  controller.oauthCallback
)

// ── Token management ──────────────────────────────────────────────────────────
router.post('/refresh', controller.refresh)
router.post('/logout',  authenticate, controller.logout)
router.get('/me',       authenticate, controller.getMe)

module.exports = router