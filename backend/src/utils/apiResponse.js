// src/utils/apiResponse.js
// Standardised JSON envelope for every API response.

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {object} options
 */
const success = (res, { statusCode = 200, message = 'Success', data = null, meta = null } = {}) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(statusCode).json(body);
};

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {object} options
 */
const error = (res, { statusCode = 500, message = 'Internal Server Error', errors = null } = {}) => {
  const body = { success: false, message };
  if (errors !== null) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { success, error };
