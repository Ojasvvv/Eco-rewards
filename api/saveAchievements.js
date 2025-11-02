import { adminDb, adminAuth, ensureInitialized } from './_middleware/firebaseAdmin.js';
import { withRateLimitFirestore as withRateLimit } from './_middleware/rateLimiterFirestore.js';

// CORS Configuration - Include localhost for development
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [];

// Always include localhost origins for development
const LOCALHOST_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5174'
];

const ALL_ALLOWED_ORIGINS = [...new Set([...ALLOWED_ORIGINS, ...LOCALHOST_ORIGINS])];

/**
 * Save user achievements to Firestore
 * This endpoint saves which achievements the user has unlocked
 */
async function saveAchievementsHandler(req, res) {
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

  // Handle CORS
  const origin = req.headers.origin;
  if (origin && ALL_ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
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

// Export handler wrapped with rate limiting (10 requests per minute for saves)
export default withRateLimit('saveAchievements', saveAchievementsHandler);

