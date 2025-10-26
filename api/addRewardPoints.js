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
    const { pointsToAdd, reason, depositData } = req.body;

    // Validate input
    if (!pointsToAdd || typeof pointsToAdd !== 'number' || pointsToAdd <= 0) {
      return res.status(400).json({ error: 'Invalid points amount' });
    }

    // Maximum points per deposit (anti-cheat)
    if (pointsToAdd > 50) {
      return res.status(400).json({ error: 'Points exceed maximum allowed per deposit' });
    }

    // Validate reason
    const validReasons = ['deposit', 'bonus', 'streak', 'achievement', 'referral'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Invalid reason' });
    }

    // Use Firestore transaction for atomicity
    const result = await db.runTransaction(async (transaction) => {
      const rewardsRef = db.collection('rewards').doc(userId);
      const rewardsDoc = await transaction.get(rewardsRef);

      if (!rewardsDoc.exists) {
        throw new Error('Rewards document not found');
      }

      const currentData = rewardsDoc.data();
      const newPoints = currentData.points + pointsToAdd;
      const newTotalEarned = currentData.totalEarned + pointsToAdd;

      // Update rewards
      transaction.update(rewardsRef, {
        points: newPoints,
        totalEarned: newTotalEarned,
        lastUpdated: new Date(),
      });

      // Log transaction
      const transactionId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const transactionRef = db.collection('transactions').doc(transactionId);

      transaction.set(transactionRef, {
        userId,
        type: 'earn',
        points: pointsToAdd,
        reason,
        depositData: depositData || null,
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
      });

      return { newPoints, newTotalEarned };
    });

    return res.status(200).json({
      success: true,
      points: result.newPoints,
      totalEarned: result.newTotalEarned,
    });
  } catch (error) {
    console.error('Error adding reward points:', error);
    return res.status(500).json({ error: 'Failed to add reward points' });
  }
}

