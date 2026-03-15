// src/modules/recommendations/recommendation.controller.js
const recommendationService = require('./recommendation.service');
const { success } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getRecommendations = asyncHandler(async (req, res) => {
  const { matches, meta } = await recommendationService.getRecommendations(
    req.user._id,
    req.query
  );
  success(res, { data: { matches }, meta });
});

module.exports = { getRecommendations };

// ── Routes ────────────────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');

/**
 * @route  GET /api/recommendations
 * @desc   Get ranked user matches for current user
 * @query  page?, limit?
 */
router.get('/', authenticate, module.exports.getRecommendations);

module.exports.router = router;
