// src/modules/auth/auth.routes.js
const express      = require('express')
const passport     = require('passport')
const controller   = require('./auth.controller')
const authenticate = require('../../middleware/authenticate')

const router = express.Router()

// ── DEV ONLY — instant login without OAuth ────────────────────────────────────
// Visit http://localhost:5000/api/auth/dev-login in your browser to log in
// Automatically disabled in production — safe to leave in codebase
if (process.env.NODE_ENV !== 'production') {
  const User       = require('../../models/User')
  const jwtService = require('../../services/jwtService')

  router.get('/dev-login', async (req, res) => {
    try {
      let user = await User.findOne({ email: 'dev@skillx.local' })
      if (!user) {
        user = await User.create({
          name:                'Dev User',
          email:               'dev@skillx.local',
          username:            'dev_user',
          oauthProvider:       'google',
          oauthId:             'dev-local-id',
          isEmailVerified:     true,
          onboardingCompleted: true,
          creditBalance:       100,
        })
      }
      const { accessToken, refreshToken } = jwtService.issueTokenPair(user)
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
      res.redirect(`${clientUrl}/auth/oauth-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })
}

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