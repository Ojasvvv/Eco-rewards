import { adminDb, adminAuth, ensureInitialized } from './_middleware/firebaseAdmin.js';
import { withRateLimitFirestore as withRateLimit } from './_middleware/rateLimiterFirestore.js';

const db = adminDb;

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
 * SECURITY: This endpoint is now DEPRECATED and restricted
 * Stats are calculated server-side in addRewardPoints.js
 * This endpoint only allows updating streakRewardsCollected (for claiming streak rewards)
 */
async function updateUserStatsHandler(req, res) {
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
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify Firebase auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // SECURITY: Verify user still exists in Firebase Auth (prevents deleted accounts from operating)
    try {
      await getAuth().getUser(userId);
    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        return res.status(403).json({ 
          error: 'Account no longer exists', 
          code: 'auth/user-not-found',
          forceLogout: true 
        });
      }
      throw authError;
    }

    // Get request data
    const { statsUpdate } = req.body;

    // Validate stats update
    if (!statsUpdate || typeof statsUpdate !== 'object') {
      return res.status(400).json({ error: 'Invalid stats update' });
    }

    const statsRef = db.collection('userStats').doc(userId);

    // SECURITY: Only allow updating streakRewardsCollected (for claiming rewards)
    // All other stats are calculated server-side in addRewardPoints.js
    const allowedFields = [
      'streakRewardsCollected',
    ];

    const updateData = {};
    for (const [key, value] of Object.entries(statsUpdate)) {
      if (allowedFields.includes(key)) {
        // Only validate streakRewardsCollected (the only field we allow)
        if (key === 'streakRewardsCollected') {
          // Must be an array of numbers
          if (!Array.isArray(value)) {
            return res.status(400).json({ 
              error: 'streakRewardsCollected must be an array' 
            });
          }
          if (value.some(v => typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 1000)) {
            return res.status(400).json({ 
              error: 'streakRewardsCollected must contain valid milestone numbers' 
            });
          }
          
          // SECURITY: Only allow ADDING to the array, not removing
          // Get current array and ensure new values are only additions
          const statsDoc = await statsRef.get();
          if (statsDoc.exists) {
            const currentRewards = statsDoc.data().streakRewardsCollected || [];
            const newRewards = value.filter(v => !currentRewards.includes(v));
            if (newRewards.length === 0) {
              return res.status(400).json({ 
                error: 'No new streak rewards to add' 
              });
            }
            // Only add new rewards, don't replace entire array
            updateData[key] = [...currentRewards, ...newRewards];
          } else {
            updateData[key] = value;
          }
        }
      }
    }

    // Ensure at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateData.lastUpdated = new Date();

    await statsRef.update(updateData);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating user stats:', error);
    return res.status(500).json({ error: 'Failed to update user stats' });
  }
}

// Export with rate limiting
export default withRateLimit('updateUserStats', updateUserStatsHandler);

