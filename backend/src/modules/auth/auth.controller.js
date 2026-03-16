// src/modules/auth/auth.controller.js
const authService  = require('./auth.service')
const { success }  = require('../../utils/apiResponse')
const asyncHandler = require('../../utils/asyncHandler')
const env          = require('../../config/env')

const oauthCallback = asyncHandler(async (req, res) => {
  const result    = await authService.oauthCallback(req.user)
  const clientUrl = env.CLIENT_URL || 'http://localhost:5173'
  res.redirect(
    `${clientUrl}/auth/oauth-callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`
  )
})

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken)
    return res.status(400).json({ success: false, message: 'Refresh token is required.' })
  const tokens = await authService.refreshToken(refreshToken)
  success(res, { data: tokens, message: 'Token refreshed.' })
})

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.token)
  success(res, { message: 'Logged out successfully.' })
})

const getMe = asyncHandler(async (req, res) => {
  success(res, { data: req.user })
})

module.exports = { oauthCallback, refresh, logout, getMe }