import { adminDb, verifyFirebaseToken, ensureInitialized } from './_middleware/firebaseAdmin.js';
import { applyRateLimit } from './_middleware/rateLimiter.js';

/**
 * Save user achievements to Firestore
 * This endpoint saves which achievements the user has unlocked
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check Firebase Admin initialization
    ensureInitialized();
    // Apply rate limiting (5 requests per minute)
    const rateLimitResult = await applyRateLimit(req, res, 'saveAchievements', 5, 60000);
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

    // Get achievements from request body
    const { achievements } = req.body;

    if (!Array.isArray(achievements)) {
      return res.status(400).json({ error: 'Invalid achievements data' });
    }

    // Validate achievement IDs (basic validation)
    const validAchievementIds = [
      'FIRST_TIMER', 'EARLY_BIRD', 'NIGHT_OWL', 'ECO_STARTER', 
      'ECO_WARRIOR', 'ECO_CHAMPION', 'WEEKEND_WARRIOR', 
      'CONSISTENT_RECYCLER', 'STREAK_MASTER', 'LOYALTY_LEGEND',
      'MULTI_OUTLET', 'GENEROUS_SOUL'
    ];

    const invalidAchievements = achievements.filter(id => !validAchievementIds.includes(id));
    if (invalidAchievements.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid achievement IDs',
        invalid: invalidAchievements
      });
    }

    // Save to Firestore
    const achievementsRef = adminDb.collection('userAchievements').doc(userId);
    await achievementsRef.set({
      achievements,
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    console.log(`✅ Saved ${achievements.length} achievements for user ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Achievements saved successfully',
      count: achievements.length
    });

  } catch (error) {
    console.error('Error saving achievements:', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired' });
    }

    if (error.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    return res.status(500).json({ 
      error: 'Failed to save achievements',
      details: error.message 
    });
  }
}

