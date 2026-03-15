// src/modules/ratings/rating.controller.js
const ratingService = require('./rating.service');
const { success } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const submitRating = asyncHandler(async (req, res) => {
  const data = await ratingService.submitRating(req.user._id, req.body);
  success(res, { statusCode: 201, message: 'Rating submitted. Thank you!', data });
});

const getUserRatings = asyncHandler(async (req, res) => {
  const { ratings, meta } = await ratingService.getUserRatings(req.params.userId, req.query);
  success(res, { data: { ratings }, meta });
});

module.exports = { submitRating, getUserRatings };

// ── Routes ────────────────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const { body } = require('express-validator');

const validate = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
  next();
};

/**
 * @route  POST /api/ratings
 * @desc   Submit a rating for a completed session
 * @body   { sessionId, score (1-5), comment? }
 */
router.post(
  '/',
  authenticate,
  [
    body('sessionId').notEmpty(),
    body('score').isInt({ min: 1, max: 5 }).withMessage('Score must be between 1 and 5'),
    body('comment').optional().isLength({ max: 500 }),
    validate,
  ],
  module.exports.submitRating
);

/**
 * @route  GET /api/ratings/:userId
 * @desc   Get all ratings for a user (public)
 */
router.get('/:userId', authenticate, module.exports.getUserRatings);

module.exports.router = router;
