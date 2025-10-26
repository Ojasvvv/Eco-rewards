import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { withRateLimitFirestore as withRateLimit } from './_middleware/rateLimiterFirestore.js';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  // Validate required environment variables
  const requiredEnvVars = {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY
  };
  
  const missing = Object.keys(requiredEnvVars).filter(key => !requiredEnvVars[key]);
  if (missing.length > 0) {
    console.error('❌ Missing Firebase Admin environment variables:', missing.join(', '));
    console.error('Please set these in Vercel Dashboard → Settings → Environment Variables');
  }
  
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

// CORS Configuration - Load from environment variable only (no hardcoded URLs)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [];

async function addRewardPointsHandler(req, res) {
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
    const { pointsToAdd, reason, depositData, dustbinCode, userLocation } = req.body;

    // Validate input
    if (!pointsToAdd || typeof pointsToAdd !== 'number' || pointsToAdd <= 0) {
      return res.status(400).json({ error: 'Invalid points amount' });
    }

    // SECURITY FIX: Validate depositData structure
    if (depositData !== null && depositData !== undefined) {
      if (typeof depositData !== 'object' || Array.isArray(depositData)) {
        return res.status(400).json({ error: 'depositData must be an object' });
      }
      
      // Only allow specific whitelisted fields
      const allowedDepositFields = ['outlet', 'outletId', 'timestamp', 'type'];
      const depositKeys = Object.keys(depositData);
      const invalidKeys = depositKeys.filter(key => !allowedDepositFields.includes(key));
      
      if (invalidKeys.length > 0) {
        return res.status(400).json({ 
          error: `Invalid depositData fields: ${invalidKeys.join(', ')}` 
        });
      }
      
      // Validate field types
      if (depositData.outlet && typeof depositData.outlet !== 'string') {
        return res.status(400).json({ error: 'depositData.outlet must be a string' });
      }
      if (depositData.outletId && typeof depositData.outletId !== 'string') {
        return res.status(400).json({ error: 'depositData.outletId must be a string' });
      }
      if (depositData.timestamp && typeof depositData.timestamp !== 'string') {
        return res.status(400).json({ error: 'depositData.timestamp must be a string' });
      }
      if (depositData.type && typeof depositData.type !== 'string') {
        return res.status(400).json({ error: 'depositData.type must be a string' });
      }
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

    // SERVER-SIDE LOCATION VALIDATION AND LOGGING
    // For now, just validate location format and log it to Firebase (no dustbin database check)
    if (reason === 'deposit') {
      // REQUIRED: Dustbin code must be provided and valid (max 5 chars, alphanumeric)
      if (!dustbinCode || typeof dustbinCode !== 'string' || dustbinCode.trim().length === 0) {
        return res.status(400).json({ error: 'Dustbin code is required for deposit' });
      }

      const trimmedCode = dustbinCode.trim().toUpperCase();
      
      // Validate length (max 5 characters)
      if (trimmedCode.length > 5) {
        return res.status(400).json({ error: 'Dustbin code is too long (maximum 5 characters)' });
      }

      // Validate format (alphanumeric only)
      const codeRegex = /^[A-Z0-9]{1,5}$/;
      if (!codeRegex.test(trimmedCode)) {
        return res.status(400).json({ error: 'Invalid dustbin code format (alphanumeric only, max 5 characters)' });
      }

      // REQUIRED: Validate user location is provided
      if (!userLocation || typeof userLocation !== 'object' || 
          typeof userLocation.lat !== 'number' || typeof userLocation.lng !== 'number') {
        return res.status(400).json({ error: 'Valid user location is required for deposit' });
      }

      // Validate location coordinates are within valid ranges
      if (userLocation.lat < -90 || userLocation.lat > 90 || 
          userLocation.lng < -180 || userLocation.lng > 180) {
        return res.status(400).json({ error: 'Invalid GPS coordinates' });
      }

      // Store validated dustbin code for logging
      depositData.dustbinCode = trimmedCode;

      // Log the validated location data to Firebase
      depositData.validatedLocation = {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        timestamp: new Date().toISOString(),
        accuracy: userLocation.accuracy || null
      };

      // Log to separate collection for location tracking/analysis
      try {
        await db.collection('locationLogs').add({
          userId,
          location: {
            latitude: userLocation.lat,
            longitude: userLocation.lng
          },
          dustbinCode: dustbinCode || null,
          timestamp: new Date(),
          points: pointsToAdd,
          reason
        });
      } catch (logError) {
        // Don't fail the transaction if logging fails
        console.error('Location logging failed:', logError);
      }
    }

    // Use Firestore transaction for atomicity
    const result = await db.runTransaction(async (transaction) => {
      const rewardsRef = db.collection('rewards').doc(userId);
      const rewardsDoc = await transaction.get(rewardsRef);

      let currentData;
      let newPoints;
      let newTotalEarned;

      if (!rewardsDoc.exists) {
        // Auto-create rewards document if it doesn't exist
        currentData = {
          points: 0,
          totalEarned: 0,
          totalRedeemed: 0,
          createdAt: new Date()
        };
        newPoints = pointsToAdd;
        newTotalEarned = pointsToAdd;
        
        transaction.set(rewardsRef, {
          points: newPoints,
          totalEarned: newTotalEarned,
          totalRedeemed: 0,
          createdAt: new Date(),
          lastUpdated: new Date(),
        });
      } else {
        currentData = rewardsDoc.data();
        newPoints = currentData.points + pointsToAdd;
        newTotalEarned = currentData.totalEarned + pointsToAdd;

        // Update rewards
        transaction.update(rewardsRef, {
          points: newPoints,
          totalEarned: newTotalEarned,
          lastUpdated: new Date(),
        });
      }

      // SERVER-SIDE STATS CALCULATION (Security Fix)
      // Only calculate stats for actual deposits, not for bonuses/achievements
      if (reason === 'deposit') {
        const statsRef = db.collection('userStats').doc(userId);
        const statsDoc = await transaction.get(statsRef);
        
        if (!statsDoc.exists) {
          // Auto-create stats document if it doesn't exist
          const now = new Date();
          const outletId = depositData?.outletId || 'unknown';
          
          transaction.set(statsRef, {
            totalDeposits: 1,
            earlyBirdDeposits: now.getHours() < 8 ? 1 : 0,
            nightOwlDeposits: now.getHours() >= 20 ? 1 : 0,
            weekendDeposits: (now.getDay() === 0 || now.getDay() === 6) ? 1 : 0,
            outletsVisited: { [outletId]: 1 },
            rewardsRedeemed: 0,
            currentStreak: 1,
            longestStreak: 1,
            lastDepositDate: now,
            streakRewardsCollected: [],
            createdAt: now,
            lastUpdated: now
          });
        } else if (statsDoc.exists) {
          const currentStats = statsDoc.data();
          const now = new Date();
          const hour = now.getHours();
          const day = now.getDay(); // 0 = Sunday, 6 = Saturday
          const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
          
          // Calculate streak server-side
          let newStreak = currentStats.currentStreak || 0;
          const lastDepositDate = currentStats.lastDepositDate 
            ? new Date(currentStats.lastDepositDate.toDate ? currentStats.lastDepositDate.toDate() : currentStats.lastDepositDate).toISOString().split('T')[0]
            : null;
          
          if (!lastDepositDate) {
            newStreak = 1; // First deposit
          } else if (lastDepositDate === today) {
            newStreak = currentStats.currentStreak; // Same day, no change
          } else {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            if (lastDepositDate === yesterdayStr) {
              newStreak = (currentStats.currentStreak || 0) + 1; // Streak continues
            } else {
              newStreak = 1; // Streak broken
            }
          }
          
          // Get outlet info
          const outletId = depositData?.outletId || 'unknown';
          const currentOutlets = currentStats.outletsVisited || {};
          const updatedOutlets = {
            ...currentOutlets,
            [outletId]: (currentOutlets[outletId] || 0) + 1
          };
          
          // Update all stats server-side
          transaction.update(statsRef, {
            totalDeposits: (currentStats.totalDeposits || 0) + 1,
            earlyBirdDeposits: hour < 8 ? (currentStats.earlyBirdDeposits || 0) + 1 : (currentStats.earlyBirdDeposits || 0),
            nightOwlDeposits: hour >= 20 ? (currentStats.nightOwlDeposits || 0) + 1 : (currentStats.nightOwlDeposits || 0),
            weekendDeposits: (day === 0 || day === 6) ? (currentStats.weekendDeposits || 0) + 1 : (currentStats.weekendDeposits || 0),
            outletsVisited: updatedOutlets,
            currentStreak: newStreak,
            longestStreak: Math.max(currentStats.longestStreak || 0, newStreak),
            lastDepositDate: now,
            lastUpdated: now
          });
        }
        
        // INCREMENT DAILY LIMIT COUNTER (atomically with deposit)
        // This ensures the counter only increments if the deposit succeeds
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const dailyLimitRef = db.collection('dailyLimits').doc(`${userId}_${today}`);
        const dailyLimitDoc = await transaction.get(dailyLimitRef);
        
        const currentCount = dailyLimitDoc.exists ? (dailyLimitDoc.data().count || 0) : 0;
        
        transaction.set(dailyLimitRef, {
          userId,
          count: currentCount + 1,
          lastDeposit: new Date().toISOString(),
          date: today
        }, { merge: true });
      }

      // Log transaction with cryptographically secure ID
      const crypto = await import('crypto');
      const randomBytes = crypto.randomBytes(8).toString('hex');
      const transactionId = `${userId}_${Date.now()}_${randomBytes}`;
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
    console.error('❌ Error adding reward points:', error);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Log environment variable status (without exposing values)
    console.error('Environment check:', {
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasAllowedOrigins: !!process.env.ALLOWED_ORIGINS,
      origin: req.headers.origin
    });
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to add reward points';
    let errorDetails = error.message;
    
    if (error.code === 'app/invalid-credential') {
      errorMessage = 'Firebase Admin credentials are invalid';
      errorDetails = 'Please check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in Vercel environment variables';
    } else if (error.message?.includes('private key')) {
      errorMessage = 'Firebase private key is invalid';
      errorDetails = 'Make sure FIREBASE_PRIVATE_KEY includes \\n line breaks and is wrapped in quotes';
    } else if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Authentication token expired';
      errorDetails = 'Please sign in again';
    } else if (error.code === 'auth/argument-error') {
      errorMessage = 'Authentication error';
      errorDetails = 'Invalid authentication token';
    }
    
    return res.status(500).json({ 
      error: errorMessage,
      details: errorDetails,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }
}

// Export with rate limiting
export default withRateLimit('addRewardPoints', addRewardPointsHandler);

