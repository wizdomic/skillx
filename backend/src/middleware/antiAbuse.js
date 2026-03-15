// src/middleware/antiAbuse.js
// Checks if a user pair has exceeded the weekly credited-session limit.
// Attaches req.creditsEligible for use in session confirmation logic.

const Session = require('../models/Session');
const { MAX_SESSIONS_PER_PAIR_PER_WEEK } = require('../config/env');

/**
 * To be used on the session-confirmation endpoint.
 * Reads teacherId / learnerId from req.body or req.session (populated earlier).
 */
const checkPairCreditEligibility = async (req, res, next) => {
  const { teacherId, learnerId } = req.sessionDoc || {};

  if (!teacherId || !learnerId) return next();

  const count = await Session.countPairSessionsThisWeek(teacherId, learnerId);

  // "> max" because this confirmation would make it count + 1
  req.creditsEligible = count < MAX_SESSIONS_PER_PAIR_PER_WEEK;

  if (!req.creditsEligible) {
    console.log(
      `⚠️  Anti-abuse: pair (${teacherId}, ${learnerId}) has ${count} sessions this week. Credits will NOT transfer.`
    );
  }

  next();
};

module.exports = { checkPairCreditEligibility };
