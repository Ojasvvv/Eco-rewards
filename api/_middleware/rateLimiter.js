/**
 * Rate Limiter Middleware for Vercel Serverless Functions
 * Prevents API abuse and brute force attacks
 * 
 * NOTE: This is the IN-MEMORY version (for development/testing)
 * For PRODUCTION, use rateLimiterFirestore.js instead
 * 
 * To switch to Firestore rate limiting:
 * 1. Import from './rateLimiterFirestore.js' instead
 * 2. Set environment variable: USE_FIRESTORE_RATE_LIMIT=true
 */

// In-memory store for rate limiting (per function instance)
// ⚠️ WARNING: This resets on serverless cold starts and doesn't work across instances
const rateLimitStore = new Map();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.resetTime > 60000) { // 1 minute old
      rateLimitStore.delete(key);
    }
  }
}, 300000);

/**
 * Rate limit configuration
 */
const RATE_LIMITS = {
  addRewardPoints: { maxRequests: 10, windowMs: 60000 }, // 10 per minute
  redeemRewardPoints: { maxRequests: 5, windowMs: 60000 }, // 5 per minute
  updateUserStats: { maxRequests: 20, windowMs: 60000 }, // 20 per minute
};

/**
 * Check rate limit for a user
 * @param {string} userId - User ID
 * @param {string} endpoint - API endpoint name
 * @returns {object} { allowed: boolean, retryAfter?: number }
 */
export function checkRateLimit(userId, endpoint) {
  const config = RATE_LIMITS[endpoint] || { maxRequests: 10, windowMs: 60000 };
  const key = `${userId}:${endpoint}`;
  const now = Date.now();

  const userData = rateLimitStore.get(key);

  if (!userData) {
    // First request
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { allowed: true };
  }

  // Check if window has expired
  if (now > userData.resetTime) {
    // Reset window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { allowed: true };
  }

  // Check if under limit
  if (userData.count < config.maxRequests) {
    userData.count++;
    return { allowed: true };
  }

  // Rate limit exceeded
  const retryAfter = Math.ceil((userData.resetTime - now) / 1000);
  return { 
    allowed: false, 
    retryAfter,
    message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`
  };
}

/**
 * Apply rate limiting to an API handler
 * @param {string} endpoint - Endpoint name
 * @param {Function} handler - Original handler function
 * @returns {Function} Wrapped handler with rate limiting
 */
export function withRateLimit(endpoint, handler) {
  return async (req, res) => {
    try {
      // Get user ID from request (assuming auth is already verified)
      const authHeader = req.headers.authorization;
      
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Extract user ID from token (simplified - in production verify the token)
      const token = authHeader.split('Bearer ')[1];
      
      // For now, use IP as fallback (not ideal but works)
      const userId = req.headers['x-user-id'] || req.headers['x-forwarded-for'] || 'anonymous';

      // Check rate limit
      const rateCheck = checkRateLimit(userId, endpoint);

      if (!rateCheck.allowed) {
        res.setHeader('Retry-After', rateCheck.retryAfter);
        res.setHeader('X-RateLimit-Limit', RATE_LIMITS[endpoint].maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + (rateCheck.retryAfter * 1000)).toISOString());
        
        return res.status(429).json({ 
          error: rateCheck.message,
          retryAfter: rateCheck.retryAfter
        });
      }

      // Set rate limit headers
      const userData = rateLimitStore.get(`${userId}:${endpoint}`);
      res.setHeader('X-RateLimit-Limit', RATE_LIMITS[endpoint].maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMITS[endpoint].maxRequests - (userData?.count || 0)));

      // Call original handler
      return handler(req, res);
    } catch (error) {
      console.error('Rate limiter error:', error);
      // If rate limiter fails, still allow the request (fail open)
      return handler(req, res);
    }
  };
}

