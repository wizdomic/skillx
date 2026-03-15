// src/models/Session.js

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    learnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'completed', 'cancelled', 'disputed'],
      default: 'pending',
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    durationMins: {
      type: Number,
      default: 60,
      min: 15,
      max: 240,
    },
    // External video call link generated/entered on accept
    videoLink: {
      type: String,
      default: null,
    },
    creditsAmount: {
      type: Number,
      default: 1,
      min: 1,
    },
    // False when the pair has exceeded MAX_SESSIONS_PER_PAIR_PER_WEEK
    creditsEligible: {
      type: Boolean,
      default: true,
    },
    // Both parties must confirm for credits to transfer
    teacherConfirmed: {
      type: Boolean,
      default: false,
    },
    learnerConfirmed: {
      type: Boolean,
      default: false,
    },
    // Notes visible only to both participants
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelReason: {
      type: String,
      default: '',
    },
    // Flag set after ratings have been submitted by both sides
    ratingPending: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
sessionSchema.index({ teacherId: 1, learnerId: 1, scheduledAt: 1 });
sessionSchema.index({ learnerId: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ scheduledAt: 1 });

// ── Static: count completed sessions between a pair this week ─────────────────
sessionSchema.statics.countPairSessionsThisWeek = async function (
  userAId,
  userBId
) {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  return this.countDocuments({
    $or: [
      { teacherId: userAId, learnerId: userBId },
      { teacherId: userBId, learnerId: userAId },
    ],
    status: 'completed',
    scheduledAt: { $gte: startOfWeek },
  });
};

module.exports = mongoose.model('Session', sessionSchema);
