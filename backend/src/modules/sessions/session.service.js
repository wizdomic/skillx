// src/modules/sessions/session.service.js
const Session    = require('../../models/Session')
const User       = require('../../models/User')
const Skill      = require('../../models/Skill')
const Rating     = require('../../models/Rating')
const creditService = require('../credits/credit.service')
const { AppError }  = require('../../middleware/errorHandler')
const { parsePagination, buildMeta } = require('../../utils/paginate')
const emailService  = require('../../services/emailService')
const { getIO }     = require('../../config/socket')
const { MAX_SESSIONS_PER_PAIR_PER_WEEK } = require('../../config/env')

const generateVideoLink = (sessionId) =>
  `https://meet.jit.si/skill-exchange-${sessionId}`

// ── Create ────────────────────────────────────────────────────────────────────
const createSession = async (learnerId, { teacherId, skillId, scheduledAt, durationMins = 60, notes = '' }) => {
  if (learnerId.toString() === teacherId.toString())
    throw new AppError('You cannot book a session with yourself.', 400)

  const [teacher, skill, learner] = await Promise.all([
    User.findById(teacherId),
    Skill.findById(skillId),
    User.findById(learnerId),
  ])

  if (!teacher || !teacher.isActive) throw new AppError('Teacher not found.', 404)
  if (!skill)   throw new AppError('Skill not found.', 404)
  if (learner.creditBalance < 1)
    throw new AppError('Insufficient credits. You need at least 1 credit to book a session.', 402)

  const scheduledDate = new Date(scheduledAt)
  if (scheduledDate <= new Date())
    throw new AppError('Session must be scheduled in the future.', 400)

  const conflictStart = new Date(scheduledDate.getTime() - 60 * 60 * 1000)
  const conflictEnd   = new Date(scheduledDate.getTime() + durationMins * 60 * 1000)

  const conflict = await Session.findOne({
    $or: [{ teacherId }, { learnerId }],
    scheduledAt: { $gte: conflictStart, $lte: conflictEnd },
    status: { $in: ['pending', 'accepted'] },
  })

  if (conflict) throw new AppError('A session is already scheduled during this time window.', 409)

  const session = await Session.create({
    teacherId, learnerId, skillId,
    scheduledAt: scheduledDate, durationMins, notes, creditsAmount: 1,
  })

  try {
    getIO().to(`user:${teacherId}`).emit('session:new_request', {
      sessionId: session._id,
      learnerName: learner.name,
      skillName: skill.name,
      scheduledAt: session.scheduledAt,
    })
  } catch (_) {}

  if (teacher.email && teacher.isEmailVerified) {
    emailService.sendSessionRequestEmail(teacher.email, learner.name, skill.name, session.scheduledAt).catch(console.error)
  }

  return session.populate(['teacherId', 'learnerId', 'skillId'])
}

// ── Accept ────────────────────────────────────────────────────────────────────
const acceptSession = async (teacherId, sessionId) => {
  const session = await Session.findById(sessionId)
  if (!session) throw new AppError('Session not found.', 404)
  if (session.teacherId.toString() !== teacherId.toString())
    throw new AppError('Only the teacher can accept this session.', 403)
  if (session.status !== 'pending')
    throw new AppError(`Session cannot be accepted. Current status: ${session.status}.`, 400)

  session.status    = 'accepted'
  session.videoLink = generateVideoLink(session._id.toString())
  await session.save()

  try {
    getIO().to(`user:${session.learnerId}`).emit('session:accepted', {
      sessionId: session._id,
      videoLink: session.videoLink,
    })
  } catch (_) {}

  return session.populate(['teacherId', 'learnerId', 'skillId'])
}

// ── Cancel ────────────────────────────────────────────────────────────────────
const cancelSession = async (userId, sessionId, reason = '') => {
  const session = await Session.findById(sessionId)
  if (!session) throw new AppError('Session not found.', 404)

  const isParticipant =
    session.teacherId.toString() === userId.toString() ||
    session.learnerId.toString() === userId.toString()

  if (!isParticipant) throw new AppError('You are not a participant of this session.', 403)
  if (!['pending', 'accepted'].includes(session.status))
    throw new AppError(`Cannot cancel a session with status: ${session.status}.`, 400)

  session.status       = 'cancelled'
  session.cancelledBy  = userId
  session.cancelReason = reason
  await session.save()

  const otherId = session.teacherId.toString() === userId.toString()
    ? session.learnerId : session.teacherId

  try { getIO().to(`user:${otherId}`).emit('session:cancelled', { sessionId: session._id, reason }) } catch (_) {}

  return session
}

// ── Confirm (complete) ────────────────────────────────────────────────────────
// Logic:
//   • If session time has already passed → one confirmation is enough to complete
//   • If session time is in the future   → both confirmations needed
const confirmSession = async (userId, sessionId) => {
  const session = await Session.findById(sessionId)
  if (!session) throw new AppError('Session not found.', 404)
  if (session.status !== 'accepted')
    throw new AppError('Only accepted sessions can be confirmed.', 400)

  const isTeacher = session.teacherId.toString() === userId.toString()
  const isLearner = session.learnerId.toString() === userId.toString()

  if (!isTeacher && !isLearner)
    throw new AppError('You are not a participant of this session.', 403)
  if (isTeacher && session.teacherConfirmed)
    throw new AppError('You have already confirmed this session.', 400)
  if (isLearner && session.learnerConfirmed)
    throw new AppError('You have already confirmed this session.', 400)

  if (isTeacher) session.teacherConfirmed = true
  if (isLearner) session.learnerConfirmed = true

  // Complete if: both confirmed, OR the session time has passed (one confirm is enough)
  const sessionEnded = new Date() > new Date(session.scheduledAt.getTime() + session.durationMins * 60 * 1000)
  const shouldComplete = (session.teacherConfirmed && session.learnerConfirmed) || sessionEnded

  if (shouldComplete && session.status !== 'completed') {
    const weekCount = await Session.countPairSessionsThisWeek(session.teacherId, session.learnerId)
    session.creditsEligible = weekCount < MAX_SESSIONS_PER_PAIR_PER_WEEK
    session.status          = 'completed'
    session.ratingPending   = true
    await session.save()

    if (session.creditsEligible) {
      await creditService.transferCredits({
        fromUserId: session.learnerId,
        toUserId:   session.teacherId,
        amount:     session.creditsAmount,
        sessionId:  session._id,
      })
    }

    await Promise.all([
      User.findByIdAndUpdate(session.teacherId, { $inc: { totalSessions: 1 } }),
      User.findByIdAndUpdate(session.learnerId, { $inc: { totalSessions: 1 } }),
    ])

    try {
      const io = getIO()
      io.to(`user:${session.teacherId}`).emit('session:rate_prompt', { sessionId: session._id })
      io.to(`user:${session.learnerId}`).emit('session:rate_prompt', { sessionId: session._id })
    } catch (_) {}

    return {
      session,
      creditsTransferred: session.creditsEligible,
      message: 'Session completed! Credits transferred. Please rate your partner.',
    }
  }

  await session.save()
  return {
    session,
    creditsTransferred: false,
    message: isTeacher
      ? 'Confirmed! Waiting for the learner to confirm too.'
      : 'Confirmed! Waiting for the teacher to confirm too.',
  }
}

// ── Get sessions (with userHasRated injected) ─────────────────────────────────
const getUserSessions = async (userId, query) => {
  const { page, limit, skip } = parsePagination(query)
  const { status, role } = query

  const filter = { $or: [{ teacherId: userId }, { learnerId: userId }] }
  if (status) filter.status = status
  if (role === 'teacher') { delete filter.$or; filter.teacherId = userId }
  if (role === 'learner') { delete filter.$or; filter.learnerId = userId }

  const [sessions, total] = await Promise.all([
    Session.find(filter)
      .populate('teacherId', 'name avatarUrl averageRating')
      .populate('learnerId', 'name avatarUrl')
      .populate('skillId',   'name slug category')
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(limit),
    Session.countDocuments(filter),
  ])

  // Check which completed sessions the current user has already rated
  const completedIds = sessions
    .filter(s => s.status === 'completed')
    .map(s => s._id)

  const myRatings = completedIds.length
    ? await Rating.find({ sessionId: { $in: completedIds }, raterId: userId }).select('sessionId')
    : []

  const ratedSessionIds = new Set(myRatings.map(r => r.sessionId.toString()))

  // Inject canRate flag into each session plain object
  const enriched = sessions.map(s => {
    const obj = s.toObject()
    obj.userHasRated = ratedSessionIds.has(s._id.toString())
    obj.canRate      = s.status === 'completed' && !ratedSessionIds.has(s._id.toString())
    return obj
  })

  return { sessions: enriched, meta: buildMeta({ page, limit, total }) }
}

// ── Get single session ────────────────────────────────────────────────────────
const getSession = async (userId, sessionId) => {
  const session = await Session.findById(sessionId)
    .populate('teacherId', 'name avatarUrl averageRating totalSessions')
    .populate('learnerId', 'name avatarUrl')
    .populate('skillId',   'name slug category')

  if (!session) throw new AppError('Session not found.', 404)

  const isParticipant =
    session.teacherId._id.toString() === userId.toString() ||
    session.learnerId._id.toString() === userId.toString()

  if (!isParticipant) throw new AppError('Access denied.', 403)
  return session
}

module.exports = { createSession, acceptSession, cancelSession, confirmSession, getUserSessions, getSession }