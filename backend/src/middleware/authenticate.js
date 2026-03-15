// src/middleware/authenticate.js
const jwtService = require('../services/jwtService')
const User       = require('../models/User')
const { error }  = require('../utils/apiResponse')
const asyncHandler = require('../utils/asyncHandler')
const redis      = require('../config/redis')

const isRedisReady = () => redis && redis.status === 'ready'

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, { statusCode: 401, message: 'Authentication required. Please log in.' })
  }

  const token = authHeader.split(' ')[1]

  // Only check blacklist if Redis is available
  if (isRedisReady()) {
    const isBlacklisted = await redis.get(`blacklist:${token}`)
    if (isBlacklisted) {
      return error(res, { statusCode: 401, message: 'Token has been revoked. Please log in again.' })
    }
  }

  let decoded
  try {
    decoded = jwtService.verifyAccessToken(token)
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Session expired. Please log in again.'
      : 'Invalid token. Please log in again.'
    return error(res, { statusCode: 401, message })
  }

  const user = await User.findById(decoded.id).select('-passwordHash')
  if (!user) return error(res, { statusCode: 401, message: 'User not found.' })
  if (!user.isActive) return error(res, { statusCode: 403, message: 'Account has been deactivated.' })

  req.user  = user
  req.token = token
  next()
})

module.exports = authenticate