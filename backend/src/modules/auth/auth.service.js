// src/modules/auth/auth.service.js
const User         = require('../../models/User')
const jwtService   = require('../../services/jwtService')
const { AppError } = require('../../middleware/errorHandler')

// ── Refresh token ─────────────────────────────────────────────────────────────
const refreshToken = async (token) => {
  let decoded
  try {
    decoded = jwtService.verifyRefreshToken(token)
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401)
  }
  const user = await User.findById(decoded.id)
  if (!user || !user.isActive) throw new AppError('User not found.', 401)
  return jwtService.issueTokenPair(user)
}

// ── Logout — no blacklist needed, frontend clears token ───────────────────────
const logout = async () => {}

// ── OAuth ─────────────────────────────────────────────────────────────────────
const oauthCallback = async (user) => {
  const tokens = jwtService.issueTokenPair(user)
  return { user: user.toSafeObject(), ...tokens }
}

module.exports = { refreshToken, logout, oauthCallback }