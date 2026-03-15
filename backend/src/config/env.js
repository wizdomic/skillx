// src/config/env.js
const { z } = require('zod')
require('dotenv').config()

const envSchema = z.object({
  // ── Server ────────────────────────────────────────────────────────────────
  PORT:     z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().url({ message: 'CLIENT_URL must be a valid URL e.g. http://localhost:5173' }),

  // ── Database ──────────────────────────────────────────────────────────────
  MONGODB_URI: z.string({ required_error: 'MONGODB_URI is required — add your MongoDB Atlas connection string' }),
  REDIS_URL:   z.string().default('redis://localhost:6379'),

  // ── JWT ───────────────────────────────────────────────────────────────────
  JWT_SECRET: z.string().min(32, {
    message: 'JWT_SECRET must be at least 32 characters — run: openssl rand -hex 32',
  }),
  JWT_EXPIRES_IN:         z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32, {
    message: 'JWT_REFRESH_SECRET must be at least 32 characters — run: openssl rand -hex 32',
  }),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // ── Email (optional — OTP falls back to terminal if not set) ──────────────
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().optional(),
  EMAIL_USER: z.string().email({ message: 'EMAIL_USER must be a valid email address' }).optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // ── OAuth (optional — only needed if using Google/GitHub login) ───────────
  GOOGLE_CLIENT_ID:     z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL:  z.string().url().optional(),
  GITHUB_CLIENT_ID:     z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL:  z.string().url().optional(),

  // ── App config ────────────────────────────────────────────────────────────
  SIGNUP_CREDIT_BONUS:           z.string().default('10'),
  MAX_SESSIONS_PER_PAIR_PER_WEEK: z.string().default('5'),
  OTP_EXPIRES_MINUTES:           z.string().default('10'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('\n❌  Environment variable errors — fix your .env file:\n')
  parsed.error.issues.forEach((issue) => {
    console.error(`   • ${issue.path.join('.')} — ${issue.message}`)
  })
  console.error('\n   See .env.example for reference.\n')
  process.exit(1)
}

const d = parsed.data

module.exports = {
  PORT:     parseInt(d.PORT),
  NODE_ENV: d.NODE_ENV,
  CLIENT_URL: d.CLIENT_URL,

  MONGODB_URI: d.MONGODB_URI,
  REDIS_URL:   d.REDIS_URL,

  JWT_SECRET:              d.JWT_SECRET,
  JWT_EXPIRES_IN:          d.JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET:      d.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN:  d.JWT_REFRESH_EXPIRES_IN,

  EMAIL_HOST: d.EMAIL_HOST,
  EMAIL_PORT: parseInt(d.EMAIL_PORT || '587'),
  EMAIL_USER: d.EMAIL_USER,
  EMAIL_PASS: d.EMAIL_PASS,
  EMAIL_FROM: d.EMAIL_FROM,

  GOOGLE_CLIENT_ID:     d.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: d.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL:  d.GOOGLE_CALLBACK_URL,
  GITHUB_CLIENT_ID:     d.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: d.GITHUB_CLIENT_SECRET,
  GITHUB_CALLBACK_URL:  d.GITHUB_CALLBACK_URL,

  SIGNUP_CREDIT_BONUS:            parseInt(d.SIGNUP_CREDIT_BONUS),
  MAX_SESSIONS_PER_PAIR_PER_WEEK: parseInt(d.MAX_SESSIONS_PER_PAIR_PER_WEEK),
  OTP_EXPIRES_MINUTES:            parseInt(d.OTP_EXPIRES_MINUTES),
}