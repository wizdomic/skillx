// src/middleware/authorize.js
// Role-based access control. Must be used AFTER authenticate.

const { error } = require('../utils/apiResponse');

/**
 * Usage: router.delete('/admin/users/:id', authenticate, authorize('admin'), ...)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return error(res, { statusCode: 401, message: 'Authentication required.' });
  }

  if (!roles.includes(req.user.role)) {
    return error(res, {
      statusCode: 403,
      message: `Access denied. Required role(s): ${roles.join(', ')}.`,
    });
  }

  next();
};

module.exports = authorize;
