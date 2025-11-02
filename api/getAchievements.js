import { adminDb, adminAuth, ensureInitialized } from './_middleware/firebaseAdmin.js';
import { withRateLimitFirestore as withRateLimit } from './_middleware/rateLimiterFirestore.js';

/**
 * Get user achievements from Firestore
 * This endpoint retrieves which achievements the user has unlocked
 */
async function getAchievementsHandler(req, res) {
  // Check Firebase Admin initialization first
  try {
    ensureInitialized();
  } catch (error) {
    console.error('Firebase Admin not initialized:', error);
    return res.status(500).json({ 
      error: 'Server configuration error. Please contact support.',
      details: error.message 
    });
  }

  // Only allow POST requests (for consistency with auth header)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify Firebase token and get user ID
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
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

// Export handler wrapped with rate limiting (30 requests per minute for reads)
export default withRateLimit('getAchievements', getAchievementsHandler);

