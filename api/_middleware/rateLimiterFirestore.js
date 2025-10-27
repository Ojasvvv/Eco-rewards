/**
 * Production-Ready Rate Limiter using Firestore
 * 
 * Works across multiple serverless instances and handles cold starts
 * 
 * SECURITY STRATEGY: "Fail Open"
 * ================================
 * If the rate limiter encounters an error (e.g., Firestore is down),
 * it ALLOWS the request to proceed rather than blocking it.
 * 
 * WHY "FAIL OPEN" IS ACCEPTABLE HERE:
 * 
 * 1. Multi-Layer Defense:
 *    - Email verification prevents fake accounts
 *    - Daily deposit limits (5/day) enforced separately
 *    - Server-side location validation prevents remote abuse
 *    - Firebase Auth tokens prevent unauthenticated requests
 *    - Firestore has its own built-in rate limits
 * 
 * 2. User Experience:
 *    - Legitimate users can continue using the app if rate limiter fails
 *    - Prevents false positives from blocking real users
 *    - Temporary Firestore issues won't take down the entire app
 * 
 * 3. Monitoring:
 *    - All rate limiter errors are logged to console
 *    - Set up error monitoring (Sentry/Crashlytics) to detect repeated failures
 *    - If rate limiter consistently fails, it indicates a larger infrastructure issue
 * 
 * TRADE-OFFS:
 * - Pro: Better availability and user experience
 * - Con: Potential for abuse during rate limiter failures
 * - Mitigation: Other security layers (daily limits, location checks) still active
 * 
 * ALTERNATIVE STRATEGY: "Fail Closed"
 * ====================================
 * To fail closed (block requests when rate limiter fails), change line 98 to:
 *   return { allowed: false, remaining: 0, message: 'Rate limiter unavailable' };
 * 
 * Note: This would impact user experience and should only be used if you have
 * a fallback rate limiting mechanism (e.g., Redis).
 */

import { adminDb, adminAuth, verifyFirebaseToken } from './firebaseAdmin.js';

// Re-export for convenience
export { adminDb, adminAuth, verifyFirebaseToken };

/**
 * Rate limit configuration
 * More forgiving limits to prevent blocking legitimate users
 */
const RATE_LIMITS = {
  addRewardPoints: { maxRequests: 30, windowMs: 60000 }, // 30 per minute (was 20)
  redeemRewardPoints: { maxRequests: 20, windowMs: 60000 }, // 20 per minute (was 10)
  updateUserStats: { maxRequests: 50, windowMs: 60000 }, // 50 per minute (was 30)
  checkDepositEligibility: { maxRequests: 100, windowMs: 60000 }, // 100 per minute (was 60)
  saveAchievements: { maxRequests: 10, windowMs: 60000 }, // 10 per minute - achievement saves
  getAchievements: { maxRequests: 30, windowMs: 60000 }, // 30 per minute - achievement reads
};

/**
 * Check rate limit using Firestore (production-ready, distributed)
 * @param {string} userId - User ID
 * @param {string} endpoint - API endpoint name
 * @returns {Promise<object>} { allowed: boolean, retryAfter?: number }
 */
export async function checkRateLimitFirestore(userId, endpoint) {
  const db = adminDb;
  const config = RATE_LIMITS[endpoint] || { maxRequests: 10, windowMs: 60000 };
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    const rateLimitRef = db.collection('rateLimits').doc(`${userId}_${endpoint}`);
    
    // Use Firestore transaction for atomic read-update
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);
      
      if (!doc.exists) {
        // First request - create new record
        transaction.set(rateLimitRef, {
          userId,
          endpoint,
          requests: [{
            timestamp: now,
            ip: null // Will be filled by handler if needed
          }],
          windowStart: now,
          lastRequest: now,
          createdAt: new Date()
        });
        
        return { allowed: true, remaining: config.maxRequests - 1 };
      }
      
      const data = doc.data();
      let requests = data.requests || [];
      
      // AGGRESSIVE cleanup: Remove old requests outside the window
      // Use strict < comparison - requests older than windowMs are removed
      requests = requests.filter(req => {
        const age = now - req.timestamp;
        return age < config.windowMs;
      });
      
      // Safety: If array somehow has too many items, keep only recent ones
      if (requests.length > config.maxRequests * 2) {
        requests = requests.slice(-config.maxRequests);
      }
      
      // If all requests are old, completely reset
      if (requests.length === 0) {
        // Reset the document completely
        transaction.set(rateLimitRef, {
          userId,
          endpoint,
          requests: [{
            timestamp: now,
            ip: null
          }],
          windowStart: now,
          lastRequest: now,
          updatedAt: new Date()
        });
        
        return { allowed: true, remaining: config.maxRequests - 1 };
      }
      
      // Check if under limit
      if (requests.length >= config.maxRequests) {
        // Double-check that the oldest request is close to expiring
        const oldestRequest = requests[0].timestamp;
        const oldestAge = now - oldestRequest;
        
        // BUG FIX: Changed threshold from >= to > (strictly greater than)
        // This allows requests through once the oldest request reaches exactly windowMs age
        // or is older, preventing users from being stuck in rate-limited state
        if (oldestAge > config.windowMs - 100) {  // 100ms grace period
          // The oldest request has expired or is about to expire - remove it and allow this request
          requests.shift(); // Remove the oldest request
          requests.push({
            timestamp: now,
            ip: null
          });
          
          transaction.update(rateLimitRef, {
            requests,
            windowStart: requests.length > 0 ? requests[0].timestamp : now,
            lastRequest: now,
            updatedAt: new Date()
          });
          
          return {
            allowed: true,
            remaining: config.maxRequests - requests.length
          };
        }
        
        // Rate limit exceeded and oldest request is still valid
        const retryAfter = Math.ceil((oldestRequest + config.windowMs - now) / 1000);
        
        // CRITICAL FIX: Update the document with filtered requests even when rate-limited
        // This ensures old expired requests are cleaned up from the database
        // Without this, users get stuck in rate-limited state indefinitely
        transaction.update(rateLimitRef, {
          requests,
          windowStart: requests.length > 0 ? requests[0].timestamp : now,
          lastRequest: now,
          updatedAt: new Date()
        });
        
        return {
          allowed: false,
          retryAfter: Math.max(1, retryAfter), // Ensure at least 1 second retry
          remaining: 0,
          message: `Rate limit exceeded. Try again in ${Math.max(1, retryAfter)} seconds.`
        };
      }
      
      // Add new request
      requests.push({
        timestamp: now,
        ip: null
      });
      
      // Update document
      transaction.update(rateLimitRef, {
        requests,
        windowStart: requests[0].timestamp,
        lastRequest: now,
        updatedAt: new Date()
      });
      
      return {
        allowed: true,
        remaining: config.maxRequests - requests.length
      };
    });
    
    return result;
  } catch (error) {
    console.error('Firestore rate limiter error:', error);
    console.error('⚠️  RATE LIMITER FAILURE - Allowing request (fail open strategy)');
    console.error('⚠️  If this happens frequently, check Firestore health and consider setting up monitoring');
    
    // SECURITY DECISION: Fail open
    // Allow the request to proceed despite rate limiter failure
    // Rationale: Other security layers (auth, daily limits, location checks) still protect the system
    // Trade-off: Temporarily allows higher request rates during rate limiter outages
    // Recommendation: Set up error monitoring (Sentry/Crashlytics) to detect this scenario
    return { allowed: true, remaining: config.maxRequests };
  }
}

/**
 * Apply rate limiting using Firestore (production-ready)
 * @param {string} endpoint - Endpoint name
 * @param {Function} handler - Original handler function
 * @returns {Function} Wrapped handler with rate limiting
 */
export function withRateLimitFirestore(endpoint, handler) {
  return async (req, res) => {
    try {
      // Get user ID from request
      const authHeader = req.headers.authorization;
      
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // SECURITY FIX: Extract actual user ID from verified token
      let userId;
      try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyFirebaseToken(token);
        userId = decodedToken.uid;
      } catch (error) {
        console.error('❌ Token verification failed in rate limiter:', error);
        console.error('Token error code:', error.code);
        console.error('Token error message:', error.message);
        console.error('Environment check in rate limiter:', {
          hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
          hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
          hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY
        });
        return res.status(401).json({ 
          error: 'Invalid authentication token',
          code: error.code,
          details: error.message
        });
      }

      // Check rate limit using Firestore with verified user ID
      const rateCheck = await checkRateLimitFirestore(userId, endpoint);

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
      res.setHeader('X-RateLimit-Limit', RATE_LIMITS[endpoint].maxRequests);
      res.setHeader('X-RateLimit-Remaining', rateCheck.remaining || 0);

      // Call original handler
      return handler(req, res);
    } catch (error) {
      console.error('Rate limiter middleware error:', error);
      console.error('⚠️  RATE LIMITER MIDDLEWARE FAILURE - Allowing request (fail open strategy)');
      
      // SECURITY DECISION: Fail open
      // If rate limiter middleware fails, still allow the request to reach the handler
      // The handler still performs auth checks, validation, and daily limits
      return handler(req, res);
    }
  };
}

/**
 * Cleanup function - Run this periodically to remove old rate limit records
 * Can be triggered by a Cloud Scheduler or called manually
 */
export async function cleanupOldRateLimits() {
  const db = adminDb;
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  try {
    const snapshot = await db.collection('rateLimits')
      .where('lastRequest', '<', oneDayAgo)
      .limit(500) // Process in batches
      .get();
    
    if (snapshot.empty) {
      console.log('No old rate limit records to clean up');
      return { deleted: 0 };
    }
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Cleaned up ${snapshot.size} old rate limit records`);
    
    return { deleted: snapshot.size };
  } catch (error) {
    console.error('Error cleaning up rate limits:', error);
    throw error;
  }
}

