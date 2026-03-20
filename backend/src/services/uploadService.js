// src/services/uploadService.js
// Cloudinary free tier: 25 GB storage, 25 GB bandwidth/month.
// Sign up at cloudinary.com, copy your cloud name, API key and secret.
// Set these in Render env vars:
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

const cloudinary = require('cloudinary').v2

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
)

/**
 * Upload a buffer to Cloudinary and return the secure URL.
 * @param {Buffer} buffer   - Image buffer from multer
 * @param {string} userId   - Used to name the file (overwrite on re-upload)
 */
const uploadAvatar = (buffer, userId) => {
  if (!isConfigured) throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.')

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:         'skillx/avatars',
        public_id:      `user_${userId}`,
        overwrite:      true,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (err, result) => {
        if (err) return reject(err)
        resolve(result.secure_url)
      }
    )
    stream.end(buffer)
  })
}

module.exports = { uploadAvatar, isConfigured }