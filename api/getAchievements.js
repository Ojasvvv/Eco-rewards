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

