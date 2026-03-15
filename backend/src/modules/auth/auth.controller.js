// src/modules/auth/auth.controller.js
const authService = require('./auth.service')
const { success, error } = require('../../utils/apiResponse')
const asyncHandler = require('../../utils/asyncHandler')
const env = require("../../config/env")

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password) {
    return error(res, { statusCode: 400, message: 'Name, email and password are required.' })
  }
  const result = await authService.registerWithEmail({ name, email, password })
  success(res, { data: result, message: result.message, statusCode: 201 })
})

// POST /api/auth/verify-email
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body
  if (!email || !otp) {
    return error(res, { statusCode: 400, message: 'Email and OTP are required.' })
  }
  const result = await authService.verifyEmail({ email, otp })
  success(res, { data: result, message: 'Email verified successfully.' })
})

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return error(res, { statusCode: 400, message: 'Email and password are required.' })
  }
  const result = await authService.loginWithEmail({ email, password })
  success(res, { data: result, message: 'Login successful.' })
})

// POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) {
    return error(res, { statusCode: 400, message: 'Refresh token is required.' })
  }
  const tokens = await authService.refreshToken(refreshToken)
  success(res, { data: tokens, message: 'Token refreshed.' })
})

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.token)
  success(res, { message: 'Logged out successfully.' })
})

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body
  if (!email) return error(res, { statusCode: 400, message: 'Email is required.' })
  const result = await authService.forgotPassword(email)
  success(res, { data: result, message: result.message })
})

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body
  if (!email || !otp || !newPassword) {
    return error(res, { statusCode: 400, message: 'Email, OTP and new password are required.' })
  }
  const result = await authService.resetPassword({ email, otp, newPassword })
  success(res, { data: result, message: result.message })
})

// GET /api/auth/google/callback  &  GET /api/auth/github/callback
const oauthCallback = asyncHandler(async (req, res) => {
  const result = await authService.oauthCallback(req.user)
  const clientUrl = env.CLIENT_URL || 'http://localhost:5173'
  res.redirect(
    `${clientUrl}/auth/oauth-callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`
  )
})

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  success(res, { data: req.user })
})

module.exports = {
  register, verifyEmail, login,
  refresh, logout,
  forgotPassword, resetPassword,
  oauthCallback, getMe,
}