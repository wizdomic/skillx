// src/config/redis.js
// Redis is used for:
//   - OTP storage (TTL-based expiry)
//   - Rate-limit counters
//   - Session blacklist (logout / token revoke)

// src/config/redis.js
const Redis = require('ioredis');
const { REDIS_URL } = require('./env');

const redis = new Redis(REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest:0,   
  enableOfflineQueue: false,
  enableReadyCheck: false,      
  retryStrategy: (times) => {
    if (times > 10) return null; 
    return Math.min(times * 50, 2000);
  },
});

redis.on('connect', () => console.log('✅  Redis connected'));
redis.on('error', (err) => console.error('❌  Redis error:', err.message));

module.exports = redis;