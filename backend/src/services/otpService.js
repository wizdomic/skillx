// src/services/otpService.js
const crypto = require('crypto')
const redis = require('../config/redis')
const { OTP_EXPIRES_MINUTES } = require('../config/env')

const OTP_PREFIX      = 'otp:'
const ATTEMPTS_PREFIX = 'otp_attempts:'
const MAX_ATTEMPTS    = 5

// ── In-memory fallback when Redis is unavailable ──────────────────────────────
const memStore = new Map() // key → { value, expiresAt }

function memSet(key, value, ttlSeconds) {
  memStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
}
function memGet(key) {
  const entry = memStore.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { memStore.delete(key); return null }
  return entry.value
}
function memDel(key) { memStore.delete(key) }
function memIncr(key, ttlSeconds) {
  const cur = parseInt(memGet(key) || '0', 10) + 1
  memSet(key, String(cur), ttlSeconds)
  return cur
}

function isRedisReady() {
  return redis && redis.status === 'ready'
}

// ── generateOTP ───────────────────────────────────────────────────────────────
const generateOTP = async (identifier) => {
  const otp = crypto.randomInt(100000, 999999).toString()
  const key  = `${OTP_PREFIX}${identifier}`
  const attKey = `${ATTEMPTS_PREFIX}${identifier}`
  const ttl  = Number(OTP_EXPIRES_MINUTES) * 60

  if (isRedisReady()) {
    await redis.set(key, otp, 'EX', ttl)
    await redis.del(attKey)
  } else {
    memSet(key, otp, ttl)
    memDel(attKey)
  }

  return otp
}

// ── verifyOTP ─────────────────────────────────────────────────────────────────
const verifyOTP = async (identifier, submittedOtp) => {
  const key     = `${OTP_PREFIX}${identifier}`
  const attKey  = `${ATTEMPTS_PREFIX}${identifier}`
  const ttl     = Number(OTP_EXPIRES_MINUTES) * 60

  const stored = isRedisReady() ? await redis.get(key) : memGet(key)

  if (!stored) {
    return { valid: false, reason: 'OTP expired or not found. Please request a new one.' }
  }

  let attempts
  if (isRedisReady()) {
    attempts = await redis.incr(attKey)
    await redis.expire(attKey, ttl)
  } else {
    attempts = memIncr(attKey, ttl)
  }

  if (attempts > MAX_ATTEMPTS) {
    isRedisReady() ? await redis.del(key) : memDel(key)
    return { valid: false, reason: 'Too many failed attempts. Please request a new OTP.' }
  }

  if (stored !== submittedOtp) {
    return { valid: false, reason: `Invalid OTP. ${MAX_ATTEMPTS - attempts} attempt(s) remaining.` }
  }

  // Clean up on success
  if (isRedisReady()) {
    await redis.del(key)
    await redis.del(attKey)
  } else {
    memDel(key)
    memDel(attKey)
  }

  return { valid: true }
}

// ── invalidateOTP ─────────────────────────────────────────────────────────────
const invalidateOTP = async (identifier) => {
  const key = `${OTP_PREFIX}${identifier}`
  isRedisReady() ? await redis.del(key) : memDel(key)
}

module.exports = { generateOTP, verifyOTP, invalidateOTP }