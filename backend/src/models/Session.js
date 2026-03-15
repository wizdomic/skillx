// src/models/Session.js
const mongoose = require('mongoose')

const sessionSchema = new mongoose.Schema(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skillId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'completed', 'cancelled', 'disputed'],
      default: 'pending',
    },

    scheduledAt:  { type: Date, required: true },
    durationMins: { type: Number, default: 60, min: 15, max: 240 },
    videoLink:    { type: String, default: null },
    notes:        { type: String, maxlength: 500, default: '' },

    creditsAmount:   { type: Number, default: 1, min: 1 },
    creditsEligible: { type: Boolean, default: true },

    // ── Credit hold tracking ───────────────────────────────────────────────
    // true  = learner's credit has been deducted and is waiting
    // false = not yet held (or already settled/refunded)
    creditsHeld: { type: Boolean, default: false },

    // ── Confirmation flags ─────────────────────────────────────────────────
    teacherConfirmed: { type: Boolean, default: false },
    learnerConfirmed: { type: Boolean, default: false },

    // ── Cancellation info ──────────────────────────────────────────────────
    cancelledBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancelReason: { type: String, default: '' },

    ratingPending: { type: Boolean, default: false },
  },
  { timestamps: true }
)

sessionSchema.index({ teacherId: 1, learnerId: 1, scheduledAt: 1 })
sessionSchema.index({ learnerId: 1 })
sessionSchema.index({ status: 1 })
sessionSchema.index({ scheduledAt: 1 })

sessionSchema.statics.countPairSessionsThisWeek = async function (userAId, userBId) {
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  return this.countDocuments({
    $or: [
      { teacherId: userAId, learnerId: userBId },
      { teacherId: userBId, learnerId: userAId },
    ],
    status: 'completed',
    scheduledAt: { $gte: startOfWeek },
  })
}

module.exports = mongoose.model('Session', sessionSchema)