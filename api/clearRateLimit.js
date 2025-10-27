import { adminDb, adminAuth } from './_middleware/firebaseAdmin.js';

const db = adminDb;

// CORS Configuration
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [];

async function clearRateLimitHandler(req, res) {
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

    // Delete all rate limit documents for this user
    const rateLimitsRef = db.collection('rateLimits');
    const snapshot = await rateLimitsRef
      .where('userId', '==', userId)
      .get();

    const batch = db.batch();
    let deletedCount = 0;

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    if (deletedCount > 0) {
      await batch.commit();
      console.log(`✅ Cleared ${deletedCount} rate limit documents for user ${userId}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Rate limits cleared successfully',
      cleared: deletedCount
    });
  } catch (error) {
    console.error('❌ Error clearing rate limits:', error);
    return res.status(500).json({ 
      error: 'Failed to clear rate limits',
      details: error.message
    });
  }
}

export default clearRateLimitHandler;

