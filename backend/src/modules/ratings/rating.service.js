// src/modules/ratings/rating.service.js
const Rating = require('../../models/Rating');
const Session = require('../../models/Session');
const User = require('../../models/User');
const { AppError } = require('../../middleware/errorHandler');
const { parsePagination, buildMeta } = require('../../utils/paginate');

const submitRating = async (raterId, { sessionId, score, comment }) => {
  const session = await Session.findById(sessionId);
  if (!session) throw new AppError('Session not found.', 404);
  if (session.status !== 'completed') {
    throw new AppError('You can only rate completed sessions.', 400);
  }

  const isTeacher = session.teacherId.toString() === raterId.toString();
  const isLearner = session.learnerId.toString() === raterId.toString();

  if (!isTeacher && !isLearner) {
    throw new AppError('You are not a participant of this session.', 403);
  }

  // The rater rates the other participant
  const ratedId = isTeacher ? session.learnerId : session.teacherId;

  // Check if already rated
  const existing = await Rating.findOne({ sessionId, raterId });
  if (existing) throw new AppError('You have already rated this session.', 409);

  const rating = await Rating.create({ sessionId, raterId, ratedId, score, comment });

  // Update rated user's average
  const ratedUser = await User.findById(ratedId);
  await ratedUser.updateRating(score);

  // Check if both have rated — clear ratingPending flag
  const ratingCount = await Rating.countDocuments({ sessionId });
  if (ratingCount >= 2) {
    await Session.findByIdAndUpdate(sessionId, { ratingPending: false });
  }

  return rating;
};

const getUserRatings = async (userId, query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = { ratedId: userId };

  const [ratings, total] = await Promise.all([
    Rating.find(filter)
      .populate('raterId', 'name avatarUrl')
      .populate('sessionId', 'scheduledAt skillId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Rating.countDocuments(filter),
  ]);

  return { ratings, meta: buildMeta({ page, limit, total }) };
};

module.exports = { submitRating, getUserRatings };
