// src/config/env.js
const { z } = require('zod')
require('dotenv').config()

const envSchema = z.object({
  PORT:       z.string().default('5000'),
  NODE_ENV:   z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().url(),

  MONGODB_URI: z.string({ required_error: 'MONGODB_URI is required' }),

  JWT_SECRET:             z.string().min(32),
  JWT_EXPIRES_IN:         z.string().default('7d'),
  JWT_REFRESH_SECRET:     z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  GOOGLE_CLIENT_ID:     z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL:  z.string().url().optional(),

  GITHUB_CLIENT_ID:     z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL:  z.string().url().optional(),

  SIGNUP_CREDIT_BONUS:            z.string().default('10'),
  MAX_SESSIONS_PER_PAIR_PER_WEEK: z.string().default('5'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('\n❌  Environment variable errors:\n')
  parsed.error.issues.forEach(i => console.error(`   • ${i.path.join('.')} — ${i.message}`))
  process.exit(1)
}

const d = parsed.data

module.exports = {
  PORT:       parseInt(d.PORT),
  NODE_ENV:   d.NODE_ENV,
  CLIENT_URL: d.CLIENT_URL,

  MONGODB_URI: d.MONGODB_URI,

  JWT_SECRET:             d.JWT_SECRET,
  JWT_EXPIRES_IN:         d.JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET:     d.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: d.JWT_REFRESH_EXPIRES_IN,

  GOOGLE_CLIENT_ID:     d.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: d.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL:  d.GOOGLE_CALLBACK_URL,

  GITHUB_CLIENT_ID:     d.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: d.GITHUB_CLIENT_SECRET,
  GITHUB_CALLBACK_URL:  d.GITHUB_CALLBACK_URL,

  SIGNUP_CREDIT_BONUS:            parseInt(d.SIGNUP_CREDIT_BONUS),
  MAX_SESSIONS_PER_PAIR_PER_WEEK: parseInt(d.MAX_SESSIONS_PER_PAIR_PER_WEEK),
}