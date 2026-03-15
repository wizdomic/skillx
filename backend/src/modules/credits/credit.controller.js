// src/modules/credits/credit.controller.js
const creditService = require('./credit.service');
const { success } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getWallet = asyncHandler(async (req, res) => {
  const data = await creditService.getWallet(req.user._id, req.query);
  success(res, { data });
});

const adminAdjust = asyncHandler(async (req, res) => {
  const data = await creditService.adminAdjustCredits(req.body);
  success(res, { message: 'Balance adjusted.', data });
});

module.exports = { getWallet, adminAdjust };

// ── Routes ────────────────────────────────────────────────────────────────────
// Exported inline to keep small modules compact
const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

/**
 * @route  GET /api/credits/wallet
 * @desc   Get current user's balance and transaction history
 * @query  page?, limit?, type?
 */
router.get('/wallet', authenticate, module.exports.getWallet);

/**
 * @route  POST /api/credits/admin/adjust
 * @desc   Admin manually adjusts a user's credits
 * @body   { userId, amount, type, description }
 */
router.post('/admin/adjust', authenticate, authorize('admin'), module.exports.adminAdjust);

module.exports.router = router;
