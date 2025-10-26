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
    const { statsUpdate } = req.body;

    // Validate stats update
    if (!statsUpdate || typeof statsUpdate !== 'object') {
      return res.status(400).json({ error: 'Invalid stats update' });
    }

    const statsRef = db.collection('userStats').doc(userId);

    // Only allow specific fields to be updated
    const allowedFields = [
      'totalDeposits',
      'earlyBirdDeposits',
      'nightOwlDeposits',
      'weekendDeposits',
      'outletsVisited',
      'currentStreak',
      'longestStreak',
      'lastDepositDate',
      'streakRewardsCollected',
    ];

    const updateData = {};
    for (const [key, value] of Object.entries(statsUpdate)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value;
      }
    }

    updateData.lastUpdated = new Date();

    await statsRef.update(updateData);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating user stats:', error);
    return res.status(500).json({ error: 'Failed to update user stats' });
  }
}

