import { adminDb, verifyFirebaseToken, ensureInitialized } from './_middleware/firebaseAdmin.js';
import { applyRateLimit } from './_middleware/rateLimiter.js';

/**
 * Get user achievements from Firestore
 * This endpoint retrieves which achievements the user has unlocked
 */
export default async function handler(req, res) {
  // Only allow POST requests (for consistency with auth header)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check Firebase Admin initialization
    ensureInitialized();
    // Apply rate limiting (20 requests per minute - more lenient for reads)
    const rateLimitResult = await applyRateLimit(req, res, 'getAchievements', 20, 60000);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.resetIn
      });
    }

    // Verify Firebase token and get user ID
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyFirebaseToken(token);
    const userId = decodedToken.uid;

    // Get from Firestore
    const achievementsRef = adminDb.collection('userAchievements').doc(userId);
    const doc = await achievementsRef.get();

    if (!doc.exists) {
      // Return empty array if no achievements saved yet
      return res.status(200).json({
        success: true,
        achievements: [],
        lastUpdated: null
      });
    }

    const data = doc.data();

    return res.status(200).json({
      success: true,
      achievements: data.achievements || [],
      lastUpdated: data.lastUpdated || null
    });

  } catch (error) {
    console.error('Error getting achievements:', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired' });
    }

    if (error.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    return res.status(500).json({ 
      error: 'Failed to get achievements',
      details: error.message 
    });
  }
}

