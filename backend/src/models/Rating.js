// src/models/Rating.js

const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    raterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ratedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: [1, 'Score must be at least 1'],
      max: [5, 'Score cannot exceed 5'],
    },
    comment: {
      type: String,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

// Each rater can only rate once per session
ratingSchema.index({ sessionId: 1, raterId: 1 }, { unique: true });
ratingSchema.index({ ratedId: 1, createdAt: -1 });

module.exports = mongoose.model('Rating', ratingSchema);
