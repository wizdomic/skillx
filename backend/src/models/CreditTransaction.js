// src/models/CreditTransaction.js
// Immutable ledger of every credit movement in the system.

const mongoose = require('mongoose');

const creditTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
    type: {
      type: String,
      enum: ['earn', 'spend', 'bonus', 'refund', 'penalty'],
      required: true,
    },
    // Positive = incoming credits, negative = outgoing credits
    amount: {
      type: Number,
      required: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: [255, 'Description cannot exceed 255 characters'],
    },
  },
  {
    timestamps: true,
    // Transactions are never updated; disable version key overhead
    versionKey: false,
  }
);

creditTransactionSchema.index({ userId: 1, createdAt: -1 });
creditTransactionSchema.index({ sessionId: 1 });

module.exports = mongoose.model('CreditTransaction', creditTransactionSchema);
