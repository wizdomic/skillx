// src/modules/requests/request.controller.js
const requestService = require('./request.service')
const { success }    = require('../../utils/apiResponse')
const asyncHandler   = require('../../utils/asyncHandler')

const listRequests = asyncHandler(async (req, res) => {
  const { requests, meta } = await requestService.listRequests(req.query, req.user._id)
  success(res, { data: { requests }, meta })
})

const createRequest = asyncHandler(async (req, res) => {
  const data = await requestService.createRequest(req.user._id, req.body)
  success(res, { statusCode: 201, message: 'Request posted.', data })
})

const updateRequest = asyncHandler(async (req, res) => {
  const data = await requestService.updateRequest(req.user._id, req.params.requestId, req.body)
  success(res, { message: 'Request updated.', data })
})

const deleteRequest = asyncHandler(async (req, res) => {
  const data = await requestService.deleteRequest(req.user._id, req.params.requestId)
  success(res, { message: data.message })
})

module.exports = { listRequests, createRequest, updateRequest, deleteRequest }

// ── Routes ────────────────────────────────────────────────────────────────────
const express      = require('express')
const router       = express.Router()
const authenticate = require('../../middleware/authenticate')
const { body }     = require('express-validator')

const validate = (req, res, next) => {
  const { validationResult } = require('express-validator')
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() })
  next()
}

router.get('/',    authenticate, module.exports.listRequests)

router.post('/',
  authenticate,
  [
    body('skillId').notEmpty(),
    body('type').isIn(['offer', 'wanted']),
    body('title').notEmpty().isLength({ max: 150 }),
    body('description').notEmpty().isLength({ max: 1000 }),
    validate,
  ],
  module.exports.createRequest
)

router.patch('/:requestId',  authenticate, module.exports.updateRequest)
router.delete('/:requestId', authenticate, module.exports.deleteRequest)

module.exports.router = router