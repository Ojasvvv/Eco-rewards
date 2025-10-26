import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

// CORS Configuration - Only allow your production domain
const ALLOWED_ORIGINS = ['https://eco-rewards-wheat.vercel.app'];

export default async function handler(req, res) {
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
      const rewardsRef = db.collection('rewards').doc(userId);
      const rewardsDoc = await transaction.get(rewardsRef);

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

      // Update rewards
      transaction.update(rewardsRef, {
        points: newPoints,
        totalRedeemed: newTotalRedeemed,
        lastUpdated: new Date(),
      });

      // Log redemption transaction
      const transactionId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      const statsRef = db.collection('userStats').doc(userId);
      const statsDoc = await transaction.get(statsRef);
      
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

