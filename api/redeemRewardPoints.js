import { adminDb, adminAuth, ensureInitialized } from './_middleware/firebaseAdmin.js';
import { withRateLimitFirestore as withRateLimit } from './_middleware/rateLimiterFirestore.js';

const db = adminDb;

async function redeemRewardPointsHandler(req, res) {
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
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // SECURITY: Verify user still exists in Firebase Auth (prevents deleted accounts from operating)
    try {
      await adminAuth.getUser(userId);
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
    const { pointsToRedeem, couponName, couponId } = req.body;

    // Validate input
    if (!pointsToRedeem || typeof pointsToRedeem !== 'number' || pointsToRedeem <= 0) {
      return res.status(400).json({ error: 'Invalid points amount' });
    }

    if (!couponName || typeof couponName !== 'string') {
      return res.status(400).json({ error: 'Invalid coupon name' });
    }

    // Use Firestore transaction for atomicity
    const result = await db.runTransaction(async (transaction) => {
      // ============ PHASE 1: ALL READS FIRST ============
      // Firestore requires all reads to happen before any writes
      
      const rewardsRef = db.collection('rewards').doc(userId);
      const rewardsDoc = await transaction.get(rewardsRef);

      const statsRef = db.collection('userStats').doc(userId);
      const statsDoc = await transaction.get(statsRef);

      // ============ PHASE 2: VALIDATE & PROCESS DATA ============
      
      if (!rewardsDoc.exists) {
        throw new Error('Rewards document not found');
      }

      const currentData = rewardsDoc.data();

      // Check if user has enough points
      if (currentData.points < pointsToRedeem) {
        throw new Error('Insufficient points');
      }

      const newPoints = currentData.points - pointsToRedeem;
      const newTotalRedeemed = currentData.totalRedeemed + pointsToRedeem;

      // ============ PHASE 3: ALL WRITES ============
      
      // Update rewards
      transaction.update(rewardsRef, {
        points: newPoints,
        totalRedeemed: newTotalRedeemed,
        lastUpdated: new Date(),
      });

      // Log redemption transaction with cryptographically secure ID
      const crypto = await import('crypto');
      const randomBytes = crypto.randomBytes(8).toString('hex');
      const transactionId = `${userId}_${Date.now()}_${randomBytes}`;
      const transactionRef = db.collection('transactions').doc(transactionId);

      transaction.set(transactionRef, {
        userId,
        type: 'redeem',
        points: pointsToRedeem,
        reason: `Redeemed: ${couponName}`,
        couponId: couponId || null,
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
      });

      // Update user stats
      if (statsDoc.exists) {
        const statsData = statsDoc.data();
        transaction.update(statsRef, {
          rewardsRedeemed: (statsData.rewardsRedeemed || 0) + 1,
          lastUpdated: new Date(),
        });
      }

      return { newPoints, newTotalRedeemed };
    });

    return res.status(200).json({
      success: true,
      points: result.newPoints,
      totalRedeemed: result.newTotalRedeemed,
    });
  } catch (error) {
    console.error('Error redeeming reward points:', error);
    
    if (error.message === 'Insufficient points') {
      return res.status(400).json({ error: 'Insufficient points' });
    }
    
    return res.status(500).json({ error: 'Failed to redeem reward points' });
  }
}

// Export with rate limiting
export default withRateLimit('redeemRewardPoints', redeemRewardPointsHandler);

