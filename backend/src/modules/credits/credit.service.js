// src/modules/credits/credit.service.js
const User = require('../../models/User');
const CreditTransaction = require('../../models/CreditTransaction');
const { AppError } = require('../../middleware/errorHandler');
const { parsePagination, buildMeta } = require('../../utils/paginate');
const mongoose = require('mongoose');

/**
 * Transfer credits from one user to another atomically.
 * Uses MongoDB transactions to guarantee consistency.
 */
const transferCredits = async ({ fromUserId, toUserId, amount, sessionId, description }) => {
  if (amount <= 0) throw new AppError('Transfer amount must be positive.', 400);

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    // Fetch both users with session lock (read-for-update pattern)
    const [fromUser, toUser] = await Promise.all([
      User.findById(fromUserId).session(mongoSession),
      User.findById(toUserId).session(mongoSession),
    ]);

    if (!fromUser) throw new AppError('Sender not found.', 404);
    if (!toUser) throw new AppError('Recipient not found.', 404);

    if (fromUser.creditBalance < amount) {
      throw new AppError('Insufficient credits.', 402);
    }

    const fromBalanceBefore = fromUser.creditBalance;
    const toBalanceBefore = toUser.creditBalance;

    // Update balances
    fromUser.creditBalance -= amount;
    toUser.creditBalance += amount;

    await Promise.all([
      fromUser.save({ session: mongoSession }),
      toUser.save({ session: mongoSession }),
    ]);

    // Record both legs of the transaction
    const desc = description || `Session payment — ${amount} credit(s)`;
    await CreditTransaction.insertMany(
      [
        {
          userId: fromUserId,
          sessionId: sessionId || null,
          type: 'spend',
          amount: -amount,
          balanceBefore: fromBalanceBefore,
          balanceAfter: fromUser.creditBalance,
          description: desc,
        },
        {
          userId: toUserId,
          sessionId: sessionId || null,
          type: 'earn',
          amount,
          balanceBefore: toBalanceBefore,
          balanceAfter: toUser.creditBalance,
          description: desc,
        },
      ],
      { session: mongoSession }
    );

    await mongoSession.commitTransaction();
    return { fromBalance: fromUser.creditBalance, toBalance: toUser.creditBalance };
  } catch (err) {
    await mongoSession.abortTransaction();
    throw err;
  } finally {
    mongoSession.endSession();
  }
};

/**
 * Get wallet balance + transaction history for a user.
 */
const getWallet = async (userId, query) => {
  const { page, limit, skip } = parsePagination(query);

  const user = await User.findById(userId).select('creditBalance');
  if (!user) throw new AppError('User not found.', 404);

  const filter = { userId };
  if (query.type) filter.type = query.type;

  const [transactions, total] = await Promise.all([
    CreditTransaction.find(filter)
      .populate('sessionId', 'scheduledAt skillId status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    CreditTransaction.countDocuments(filter),
  ]);

  return {
    balance: user.creditBalance,
    transactions,
    meta: buildMeta({ page, limit, total }),
  };
};

/**
 * Admin: manually adjust a user's credit balance.
 */
const adminAdjustCredits = async ({ userId, amount, type, description }) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);

  if (type === 'penalty' && user.creditBalance + amount < 0) {
    throw new AppError('Cannot reduce balance below 0.', 400);
  }

  const balanceBefore = user.creditBalance;
  user.creditBalance += amount;
  await user.save();

  const tx = await CreditTransaction.create({
    userId,
    type,
    amount,
    balanceBefore,
    balanceAfter: user.creditBalance,
    description,
  });

  return { newBalance: user.creditBalance, transaction: tx };
};

module.exports = { transferCredits, getWallet, adminAdjustCredits };
