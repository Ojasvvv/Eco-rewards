import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { withRateLimitFirestore as withRateLimit } from './_middleware/rateLimiterFirestore.js';

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
const auth = getAuth();

// CORS Configuration - Load from environment variable only (no hardcoded URLs)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [];

// Daily deposit limit per user
const DAILY_DEPOSIT_LIMIT = 5;

async function checkDepositEligibilityHandler(req, res) {
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
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get user details to check email verification
    const userRecord = await auth.getUser(userId);

    // Check 1: Email verification
    // Google OAuth users are auto-verified by Google
    const isGoogleUser = userRecord.providerData.some(provider => provider.providerId === 'google.com');
    const isEmailVerified = userRecord.emailVerified || isGoogleUser;

    if (!isEmailVerified) {
      return res.status(403).json({ 
        error: 'Email not verified',
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address before earning rewards. Check your inbox for the verification link.',
        eligible: false,
        reason: 'email_not_verified'
      });
    }

    // Check 2: Daily deposit limit (server-side tracking)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dailyLimitRef = db.collection('dailyLimits').doc(`${userId}_${today}`);
    const dailyLimitDoc = await dailyLimitRef.get();

    let depositCount = 0;
    if (dailyLimitDoc.exists) {
      depositCount = dailyLimitDoc.data().count || 0;
    }

    if (depositCount >= DAILY_DEPOSIT_LIMIT) {
      return res.status(429).json({
        error: 'Daily limit reached',
        code: 'DAILY_LIMIT_REACHED',
        message: `You've reached your daily limit of ${DAILY_DEPOSIT_LIMIT} deposits. Try again tomorrow!`,
        eligible: false,
        reason: 'daily_limit_reached',
        limit: DAILY_DEPOSIT_LIMIT,
        current: depositCount,
        resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
      });
    }

    // DO NOT increment counter here - it will be incremented in addRewardPoints
    // when the deposit actually succeeds (atomically in the same transaction)
    
    // User is eligible!
    return res.status(200).json({
      eligible: true,
      remainingDeposits: DAILY_DEPOSIT_LIMIT - depositCount,
      currentCount: depositCount,
      limit: DAILY_DEPOSIT_LIMIT,
      emailVerified: userRecord.emailVerified,
      message: 'Eligible to earn rewards'
    });

  } catch (error) {
    console.error('Error checking deposit eligibility:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please sign in again.' });
    }
    
    return res.status(500).json({ error: 'Failed to check eligibility' });
  }
}

// Export with rate limiting
export default withRateLimit('checkDepositEligibility', checkDepositEligibilityHandler);

