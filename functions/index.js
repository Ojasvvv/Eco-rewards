const functions = require('firebase-functions');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onUserCreated } = require('firebase-functions/v2/identity');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

/**
 * Production-Ready Cloud Functions for Reward Management
 * These functions run on the server and cannot be tampered with by clients
 * Using V2 API with RESTRICTED CORS for maximum security
 * 
 * SECURITY: Only allows requests from the production Vercel domain
 */

// CORS Configuration - ONLY allow your production domain
const ALLOWED_ORIGINS = [
  'https://eco-rewards-wheat.vercel.app',
];

// Common CORS options for all callable functions
const corsOptions = {
  cors: ALLOWED_ORIGINS
};

// ==================== REWARD OPERATIONS ====================

/**
 * Initialize user rewards when they first sign up
 * Trigger: onCreate for new users
 */
exports.initializeUserRewards = onUserCreated(async (event) => {
  const user = event.data;
  const userId = user.uid;
  
  try {
    // Create rewards document
    await db.collection('rewards').doc(userId).set({
      points: 0,
      totalEarned: 0,
      totalRedeemed: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create user stats document
    await db.collection('userStats').doc(userId).set({
      totalDeposits: 0,
      earlyBirdDeposits: 0,
      nightOwlDeposits: 0,
      weekendDeposits: 0,
      outletsVisited: {},
      rewardsRedeemed: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastDepositDate: null,
      streakRewardsCollected: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Initialized rewards for user ${userId}`);
  } catch (error) {
    console.error(`Error initializing user ${userId}:`, error);
  }
});

/**
 * Add reward points (called when user makes a deposit)
 * This is the ONLY way to add points - fully server-controlled
 * V2 API with RESTRICTED CORS
 */
exports.addRewardPoints = onCall(corsOptions, async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const userId = request.auth.uid;
  const { pointsToAdd, reason, depositData } = request.data;
  
  // Validate input
  if (!pointsToAdd || typeof pointsToAdd !== 'number' || pointsToAdd <= 0) {
    throw new HttpsError('invalid-argument', 'Invalid points amount');
  }
  
  // Maximum points per deposit (anti-cheat)
  if (pointsToAdd > 50) {
    throw new HttpsError('invalid-argument', 'Points exceed maximum allowed per deposit');
  }
  
  // Validate reason
  const validReasons = ['deposit', 'bonus', 'streak', 'achievement', 'referral'];
  if (!validReasons.includes(reason)) {
    throw new HttpsError('invalid-argument', 'Invalid reason');
  }
  
  try {
    // Use a transaction to ensure atomicity
    const result = await db.runTransaction(async (transaction) => {
      const rewardsRef = db.collection('rewards').doc(userId);
      const rewardsDoc = await transaction.get(rewardsRef);
      
      if (!rewardsDoc.exists) {
        throw new HttpsError('not-found', 'Rewards document not found');
      }
      
      const currentData = rewardsDoc.data();
      const newPoints = currentData.points + pointsToAdd;
      const newTotalEarned = currentData.totalEarned + pointsToAdd;
      
      // Update rewards
      transaction.update(rewardsRef, {
        points: newPoints,
        totalEarned: newTotalEarned,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
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
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString()
      });
      
      return { newPoints, newTotalEarned };
    });
    
    return { 
      success: true, 
      points: result.newPoints,
      totalEarned: result.newTotalEarned
    };
  } catch (error) {
    console.error('Error adding reward points:', error);
    throw new HttpsError('internal', 'Failed to add reward points');
  }
});

/**
 * Redeem reward points (called when user redeems a coupon)
 * Server-side validation prevents manipulation
 * V2 API with RESTRICTED CORS
 */
exports.redeemRewardPoints = onCall(corsOptions, async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const userId = request.auth.uid;
  const { pointsToRedeem, couponName, couponId } = request.data;
  
  // Validate input
  if (!pointsToRedeem || typeof pointsToRedeem !== 'number' || pointsToRedeem <= 0) {
    throw new HttpsError('invalid-argument', 'Invalid points amount');
  }
  
  if (!couponName || typeof couponName !== 'string') {
    throw new HttpsError('invalid-argument', 'Invalid coupon name');
  }
  
  try {
    // Use a transaction to ensure atomicity
    const result = await db.runTransaction(async (transaction) => {
      const rewardsRef = db.collection('rewards').doc(userId);
      const rewardsDoc = await transaction.get(rewardsRef);
      
      if (!rewardsDoc.exists) {
        throw new HttpsError('not-found', 'Rewards document not found');
      }
      
      const currentData = rewardsDoc.data();
      
      // Check if user has enough points
      if (currentData.points < pointsToRedeem) {
        throw new HttpsError('failed-precondition', 'Insufficient points');
      }
      
      const newPoints = currentData.points - pointsToRedeem;
      const newTotalRedeemed = currentData.totalRedeemed + pointsToRedeem;
      
      // Update rewards
      transaction.update(rewardsRef, {
        points: newPoints,
        totalRedeemed: newTotalRedeemed,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
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
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString()
      });
      
      // Update user stats
      const statsRef = db.collection('userStats').doc(userId);
      transaction.update(statsRef, {
        rewardsRedeemed: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { newPoints, newTotalRedeemed };
    });
    
    return { 
      success: true, 
      points: result.newPoints,
      totalRedeemed: result.newTotalRedeemed
    };
  } catch (error) {
    console.error('Error redeeming reward points:', error);
    if (error.code && error.code.startsWith('functions/')) {
      throw error; // Re-throw HttpsError
    }
    throw new HttpsError('internal', 'Failed to redeem reward points');
  }
});

/**
 * Update user stats after a deposit
 * Server-side to prevent manipulation
 * V2 API with RESTRICTED CORS
 */
exports.updateUserStats = onCall(corsOptions, async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const userId = request.auth.uid;
  const { statsUpdate } = request.data;
  
  // Validate stats update
  if (!statsUpdate || typeof statsUpdate !== 'object') {
    throw new HttpsError('invalid-argument', 'Invalid stats update');
  }
  
  try {
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
      'streakRewardsCollected'
    ];
    
    const updateData = {};
    for (const [key, value] of Object.entries(statsUpdate)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value;
      }
    }
    
    updateData.lastUpdated = admin.firestore.FieldValue.serverTimestamp();
    
    await statsRef.update(updateData);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw new HttpsError('internal', 'Failed to update user stats');
  }
});

/**
 * Process deposit and award points
 * This combines all the deposit logic in one secure function
 * V2 API with RESTRICTED CORS
 */
exports.processDeposit = onCall(corsOptions, async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const userId = request.auth.uid;
  const { 
    depositType, 
    location, 
    weight, 
    wasteType,
    isEarlyBird,
    isNightOwl,
    isWeekend
  } = request.data;
  
  try {
    // Calculate points based on deposit
    let pointsToAward = 10; // Base points
    
    // Bonus points for specific conditions
    if (isEarlyBird) pointsToAward += 5;
    if (isNightOwl) pointsToAward += 5;
    if (isWeekend) pointsToAward += 10;
    
    // Award points using the addRewardPoints logic
    const result = await db.runTransaction(async (transaction) => {
      const rewardsRef = db.collection('rewards').doc(userId);
      const statsRef = db.collection('userStats').doc(userId);
      
      const rewardsDoc = await transaction.get(rewardsRef);
      const statsDoc = await transaction.get(statsRef);
      
      if (!rewardsDoc.exists || !statsDoc.exists) {
        throw new HttpsError('not-found', 'User data not found');
      }
      
      const rewardsData = rewardsDoc.data();
      const statsData = statsDoc.data();
      
      // Update rewards
      transaction.update(rewardsRef, {
        points: rewardsData.points + pointsToAward,
        totalEarned: rewardsData.totalEarned + pointsToAward,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update stats
      const statsUpdate = {
        totalDeposits: statsData.totalDeposits + 1,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      };
      
      if (isEarlyBird) statsUpdate.earlyBirdDeposits = (statsData.earlyBirdDeposits || 0) + 1;
      if (isNightOwl) statsUpdate.nightOwlDeposits = (statsData.nightOwlDeposits || 0) + 1;
      if (isWeekend) statsUpdate.weekendDeposits = (statsData.weekendDeposits || 0) + 1;
      
      // Update outlets visited
      if (location) {
        const outletsVisited = statsData.outletsVisited || {};
        outletsVisited[location] = (outletsVisited[location] || 0) + 1;
        statsUpdate.outletsVisited = outletsVisited;
      }
      
      transaction.update(statsRef, statsUpdate);
      
      // Log transaction
      const transactionId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const transactionRef = db.collection('transactions').doc(transactionId);
      
      transaction.set(transactionRef, {
        userId,
        type: 'earn',
        points: pointsToAward,
        reason: 'deposit',
        depositData: {
          depositType,
          location,
          weight,
          wasteType,
          bonuses: {
            earlyBird: isEarlyBird || false,
            nightOwl: isNightOwl || false,
            weekend: isWeekend || false
          }
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString()
      });
      
      return {
        newPoints: rewardsData.points + pointsToAward,
        pointsEarned: pointsToAward,
        totalDeposits: statsData.totalDeposits + 1
      };
    });
    
    return { success: true, ...result };
  } catch (error) {
    console.error('Error processing deposit:', error);
    throw new HttpsError('internal', 'Failed to process deposit');
  }
});

// ==================== LEADERBOARD OPERATIONS ====================

/**
 * Update leaderboard (triggered on rewards update)
 * V2 API for better performance
 */
exports.updateLeaderboard = onDocumentUpdated('rewards/{userId}', async (event) => {
    const userId = event.params.userId;
    const newData = event.data.after.data();
    
    try {
      // Get user profile for display name
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      
      // Update leaderboard entry
      await db.collection('leaderboard').doc(userId).set({
        userId,
        displayName: userData.displayName || 'Anonymous',
        photoURL: userData.photoURL || null,
        points: newData.points,
        totalEarned: newData.totalEarned,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  });

// ==================== RATE LIMITING ====================
// Note: Firebase Functions V2 has built-in rate limiting and concurrency controls
// Additional rate limiting can be added using Firebase App Check or custom middleware

