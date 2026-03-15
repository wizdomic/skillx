// src/modules/credits/credit.service.js
const User               = require('../../models/User')
const CreditTransaction  = require('../../models/CreditTransaction')
const { AppError }       = require('../../middleware/errorHandler')
const { parsePagination, buildMeta } = require('../../utils/paginate')
const mongoose           = require('mongoose')

// ── Hold credits (deduct from learner on booking) ─────────────────────────────
// Credits leave the learner's wallet immediately but are not yet given to the teacher.
const holdCredits = async ({ learnerId, amount, sessionId }) => {
  const mongoSession = await mongoose.startSession()
  mongoSession.startTransaction()

  try {
    const learner = await User.findById(learnerId).session(mongoSession)
    if (!learner)              throw new AppError('Learner not found.', 404)
    if (learner.creditBalance < amount)
      throw new AppError('Insufficient credits to book this session.', 402)

    const balanceBefore      = learner.creditBalance
    learner.creditBalance   -= amount
    await learner.save({ session: mongoSession })

    await CreditTransaction.create(
      [{
        userId:        learnerId,
        sessionId,
        type:          'spend',
        amount:        -amount,
        balanceBefore,
        balanceAfter:  learner.creditBalance,
        description:   `Credit hold — session booked (${amount} credit)`,
      }],
      { session: mongoSession }
    )

    await mongoSession.commitTransaction()
    return { learnerBalance: learner.creditBalance }
  } catch (err) {
    await mongoSession.abortTransaction()
    throw err
  } finally {
    mongoSession.endSession()
  }
}

// ── Refund held credits back to learner (on cancellation) ─────────────────────
const refundHeldCredits = async ({ learnerId, amount, sessionId, reason = '' }) => {
  const mongoSession = await mongoose.startSession()
  mongoSession.startTransaction()

  try {
    const learner = await User.findById(learnerId).session(mongoSession)
    if (!learner) throw new AppError('Learner not found.', 404)

    const balanceBefore      = learner.creditBalance
    learner.creditBalance   += amount
    await learner.save({ session: mongoSession })

    await CreditTransaction.create(
      [{
        userId:        learnerId,
        sessionId,
        type:          'refund',
        amount:        +amount,
        balanceBefore,
        balanceAfter:  learner.creditBalance,
        description:   reason || `Refund — session cancelled (${amount} credit)`,
      }],
      { session: mongoSession }
    )

    await mongoSession.commitTransaction()
    return { learnerBalance: learner.creditBalance }
  } catch (err) {
    await mongoSession.abortTransaction()
    throw err
  } finally {
    mongoSession.endSession()
  }
}

// ── Settle held credits to teacher (on completion) ────────────────────────────
// The credit was already deducted from learner on booking — just give it to teacher now.
const settleCreditsToTeacher = async ({ teacherId, amount, sessionId }) => {
  const mongoSession = await mongoose.startSession()
  mongoSession.startTransaction()

  try {
    const teacher = await User.findById(teacherId).session(mongoSession)
    if (!teacher) throw new AppError('Teacher not found.', 404)

    const balanceBefore     = teacher.creditBalance
    teacher.creditBalance  += amount
    await teacher.save({ session: mongoSession })

    await CreditTransaction.create(
      [{
        userId:        teacherId,
        sessionId,
        type:          'earn',
        amount:        +amount,
        balanceBefore,
        balanceAfter:  teacher.creditBalance,
        description:   `Session completed — earned ${amount} credit`,
      }],
      { session: mongoSession }
    )

    await mongoSession.commitTransaction()
    return { teacherBalance: teacher.creditBalance }
  } catch (err) {
    await mongoSession.abortTransaction()
    throw err
  } finally {
    mongoSession.endSession()
  }
}

// ── Legacy: direct transfer (kept for admin use) ──────────────────────────────
const transferCredits = async ({ fromUserId, toUserId, amount, sessionId, description }) => {
  if (amount <= 0) throw new AppError('Transfer amount must be positive.', 400)

  const mongoSession = await mongoose.startSession()
  mongoSession.startTransaction()

  try {
    const [fromUser, toUser] = await Promise.all([
      User.findById(fromUserId).session(mongoSession),
      User.findById(toUserId).session(mongoSession),
    ])

    if (!fromUser) throw new AppError('Sender not found.', 404)
    if (!toUser)   throw new AppError('Recipient not found.', 404)
    if (fromUser.creditBalance < amount) throw new AppError('Insufficient credits.', 402)

    const fromBalanceBefore = fromUser.creditBalance
    const toBalanceBefore   = toUser.creditBalance

    fromUser.creditBalance -= amount
    toUser.creditBalance   += amount

    await Promise.all([
      fromUser.save({ session: mongoSession }),
      toUser.save({ session: mongoSession }),
    ])

    const desc = description || `Session payment — ${amount} credit(s)`
    await CreditTransaction.insertMany(
      [
        {
          userId: fromUserId, sessionId: sessionId || null,
          type: 'spend', amount: -amount,
          balanceBefore: fromBalanceBefore, balanceAfter: fromUser.creditBalance,
          description: desc,
        },
        {
          userId: toUserId, sessionId: sessionId || null,
          type: 'earn', amount,
          balanceBefore: toBalanceBefore, balanceAfter: toUser.creditBalance,
          description: desc,
        },
      ],
      { session: mongoSession }
    )

    await mongoSession.commitTransaction()
    return { fromBalance: fromUser.creditBalance, toBalance: toUser.creditBalance }
  } catch (err) {
    await mongoSession.abortTransaction()
    throw err
  } finally {
    mongoSession.endSession()
  }
}

// ── Wallet ────────────────────────────────────────────────────────────────────
const getWallet = async (userId, query) => {
  const { page, limit, skip } = parsePagination(query)

  const user = await User.findById(userId).select('creditBalance')
  if (!user) throw new AppError('User not found.', 404)

  const filter = { userId }
  if (query.type) filter.type = query.type

  const [transactions, total] = await Promise.all([
    CreditTransaction.find(filter)
      .populate('sessionId', 'scheduledAt skillId status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    CreditTransaction.countDocuments(filter),
  ])

  return {
    balance: user.creditBalance,
    transactions,
    meta: buildMeta({ page, limit, total }),
  }
}

// ── Admin adjust ──────────────────────────────────────────────────────────────
const adminAdjustCredits = async ({ userId, amount, type, description }) => {
  const user = await User.findById(userId)
  if (!user) throw new AppError('User not found.', 404)

  if (type === 'penalty' && user.creditBalance + amount < 0)
    throw new AppError('Cannot reduce balance below 0.', 400)

  const balanceBefore  = user.creditBalance
  user.creditBalance  += amount
  await user.save()

  const tx = await CreditTransaction.create({
    userId, type, amount,
    balanceBefore,
    balanceAfter: user.creditBalance,
    description,
  })

  return { newBalance: user.creditBalance, transaction: tx }
}

module.exports = {
  holdCredits,
  refundHeldCredits,
  settleCreditsToTeacher,
  transferCredits,
  getWallet,
  adminAdjustCredits,
}