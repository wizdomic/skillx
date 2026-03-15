// src/models/User.js
const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    // No unique:true here — defined via schema.index() below to avoid duplicates
    email: {
      type: String,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    phone: {
      type: String,
      sparse: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    avatarUrl:  { type: String, default: '' },
    bio:        { type: String, maxlength: [500, 'Bio cannot exceed 500 characters'], default: '' },
    location:   { type: String, default: '' },
    timezone:   { type: String, default: 'UTC' },

    creditBalance: {
      type: Number,
      default: 0,
      min: [0, 'Credit balance cannot be negative'],
    },
    totalSessions:  { type: Number, default: 0 },
    averageRating:  { type: Number, default: 0, min: 0, max: 5 },
    ratingCount:    { type: Number, default: 0 },

    isEmailVerified:    { type: Boolean, default: false },
    isPhoneVerified:    { type: Boolean, default: false },
    onboardingCompleted:{ type: Boolean, default: false },

    oauthProvider: { type: String, enum: ['google', 'github', null], default: null },
    oauthId:       { type: String, default: null },

    role:     { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true },

    loginAttempts: { type: Number, default: 0 },
    lockUntil:     { type: Date },
  },
  { timestamps: true }
)

// ── Indexes — defined once here, not on field declarations ───────────────────
userSchema.index({ email: 1 }, { unique: true, sparse: true })
userSchema.index({ phone: 1 }, { unique: true, sparse: true })
userSchema.index({ oauthProvider: 1, oauthId: 1 })

// ── Virtual ───────────────────────────────────────────────────────────────────
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now())
})

// ── Hash password before save ─────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next()
  if (this.passwordHash.startsWith('$2')) return next() // already hashed
  const salt = await bcrypt.genSalt(12)
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt)
  next()
})

// ── Instance methods ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (plaintext) {
  return bcrypt.compare(plaintext, this.passwordHash)
}

userSchema.methods.incLoginAttempts = async function () {
  const LOCK_AFTER      = 5
  const LOCK_DURATION   = 15 * 60 * 1000

  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } })
  }
  const updates = { $inc: { loginAttempts: 1 } }
  if (this.loginAttempts + 1 >= LOCK_AFTER && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_DURATION) }
  }
  return this.updateOne(updates)
}

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject({ virtuals: true })
  delete obj.passwordHash
  delete obj.loginAttempts
  delete obj.lockUntil
  delete obj.__v
  return obj
}

userSchema.methods.updateRating = async function (newScore) {
  const total = this.averageRating * this.ratingCount + newScore
  this.ratingCount += 1
  this.averageRating = parseFloat((total / this.ratingCount).toFixed(2))
  return this.save()
}

module.exports = mongoose.model('User', userSchema)