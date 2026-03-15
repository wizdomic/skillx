// src/modules/auth/auth.service.js
const User              = require('../../models/User')
const CreditTransaction = require('../../models/CreditTransaction')
const jwtService        = require('../../services/jwtService')
const otpService        = require('../../services/otpService')
const emailService      = require('../../services/emailService')
const redis             = require('../../config/redis')
const { AppError }      = require('../../middleware/errorHandler')
const { SIGNUP_CREDIT_BONUS } = require('../../config/env')

const isRedisReady = () => redis && redis.status === 'ready'

// ── Register ──────────────────────────────────────────────────────────────────
const registerWithEmail = async ({ name, email, password }) => {
  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) throw new AppError('Email is already registered.', 409)

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash: password,
    creditBalance: 0,
  })

  const otp = await otpService.generateOTP(email.toLowerCase())
  await emailService.sendVerificationEmail(email, otp)
  console.log(`Generated OTP for ${email}: ${otp}`)

  return { userId: user._id, message: 'Verification code sent to your email.' }
}

// ── Verify email ──────────────────────────────────────────────────────────────
const verifyEmail = async ({ email, otp }) => {
  const result = await otpService.verifyOTP(email.toLowerCase(), otp)
  if (!result.valid) throw new AppError(result.reason, 400)

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { isEmailVerified: true, $inc: { creditBalance: SIGNUP_CREDIT_BONUS } },
    { new: true }
  )
  if (!user) throw new AppError('User not found.', 404)

  await CreditTransaction.create({
    userId: user._id,
    type: 'bonus',
    amount: SIGNUP_CREDIT_BONUS,
    balanceBefore: 0,
    balanceAfter: SIGNUP_CREDIT_BONUS,
    description: `Welcome bonus — ${SIGNUP_CREDIT_BONUS} credits`,
  })

  const tokens = jwtService.issueTokenPair(user)
  return { user: user.toSafeObject(), ...tokens }
}

// ── Login ─────────────────────────────────────────────────────────────────────
const loginWithEmail = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash')

  if (!user || !user.passwordHash) throw new AppError('Invalid email or password.', 401)
  if (user.isLocked) throw new AppError('Account locked due to too many failed attempts. Try again in 15 minutes.', 423)

  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    await user.incLoginAttempts()
    throw new AppError('Invalid email or password.', 401)
  }

  if (!user.isEmailVerified) {
    const otp = await otpService.generateOTP(email.toLowerCase())
    await emailService.sendVerificationEmail(email, otp)
    throw new AppError('Email not verified. A new code has been sent to your email.', 403)
  }

  if (user.loginAttempts > 0) {
    await user.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } })
  }

  const tokens = jwtService.issueTokenPair(user)
  return { user: user.toSafeObject(), ...tokens }
}

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

// ── Logout ────────────────────────────────────────────────────────────────────
const logout = async (token) => {
  if (isRedisReady()) {
    await redis.set(`blacklist:${token}`, '1', 'EX', 7 * 24 * 60 * 60)
  }
}

// ── Forgot password ───────────────────────────────────────────────────────────
const forgotPassword = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) return { message: 'If that email is registered, a reset code has been sent.' }

  const otp = await otpService.generateOTP(`reset:${email.toLowerCase()}`)
  await emailService.sendPasswordResetEmail(email, otp)
  return { message: 'Password reset code sent to your email.' }
}

// ── Reset password ────────────────────────────────────────────────────────────
const resetPassword = async ({ email, otp, newPassword }) => {
  const result = await otpService.verifyOTP(`reset:${email.toLowerCase()}`, otp)
  if (!result.valid) throw new AppError(result.reason, 400)

  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) throw new AppError('User not found.', 404)

  user.passwordHash = newPassword
  await user.save()
  return { message: 'Password reset successfully. You can now log in.' }
}

// ── OAuth ─────────────────────────────────────────────────────────────────────
const oauthCallback = async (user) => {
  const tokens = jwtService.issueTokenPair(user)
  return { user: user.toSafeObject(), ...tokens }
}

module.exports = {
  registerWithEmail, verifyEmail, loginWithEmail,
  refreshToken, logout, forgotPassword, resetPassword, oauthCallback,
}