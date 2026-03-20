// src/modules/users/user.routes.js
const express        = require('express')
const multer         = require('multer')
const router         = express.Router()
const ctrl           = require('./user.controller')
const authenticate   = require('../../middleware/authenticate')
const authorize      = require('../../middleware/authorize')
const { body }       = require('express-validator')
const { uploadAvatar, isConfigured } = require('../../services/uploadService')
const asyncHandler   = require('../../utils/asyncHandler')
const { success }    = require('../../utils/apiResponse')
const { AppError }   = require('../../middleware/errorHandler')
const User           = require('../../models/User')

const validate = (req, res, next) => {
  const { validationResult } = require('express-validator')
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(422).json({ success: false, message: 'Validation failed', errors: errors.array() })
  next()
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new AppError('Only image files are allowed.', 400))
    cb(null, true)
  },
})

// Search — must be before /:userId
router.get('/search', authenticate, ctrl.searchUsers)

router.get('/me',    authenticate, ctrl.getMe)
router.patch('/me',  authenticate, [
  body('name').optional().trim().isLength({ max: 100 }),
  body('bio').optional().isLength({ max: 500 }),
  body('location').optional().isString(),
  body('username').optional().trim().isLength({ min: 3, max: 30 })
    .matches(/^[a-z0-9_]+$/i).withMessage('Username can only contain letters, numbers and underscores'),
  validate,
], ctrl.updateProfile)

// Avatar upload
router.post('/me/avatar', authenticate, upload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded.', 400)
  if (!isConfigured) throw new AppError('Avatar upload is not configured. Set Cloudinary env vars.', 503)
  const url = await uploadAvatar(req.file.buffer, req.user._id.toString())
  await User.findByIdAndUpdate(req.user._id, { avatarUrl: url })
  success(res, { data: { avatarUrl: url }, message: 'Avatar updated.' })
}))

router.post('/me/onboarding', authenticate, ctrl.completeOnboarding)

router.post('/me/skills', authenticate, [
  body('skillId').notEmpty(),
  body('type').isIn(['teach', 'learn']),
  body('level').optional().isIn(['beginner', 'intermediate', 'advanced']),
  validate,
], ctrl.addSkill)

router.delete('/me/skills/:userSkillId', authenticate, ctrl.removeSkill)
router.delete('/me',                     authenticate, ctrl.deleteAccount)

router.get('/:userId', authenticate, ctrl.getUser)
router.get('/',        authenticate, authorize('admin'), ctrl.listUsers)

module.exports = router