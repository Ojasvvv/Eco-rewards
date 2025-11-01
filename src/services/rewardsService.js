import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { throttle, handleRateLimitError } from '../utils/rateLimitClient';

/**
 * Rewards Service - Production Version (Vercel Serverless)
 * All write operations go through secure Vercel API endpoints
 * This prevents ANY client-side manipulation of rewards
 */

const API_BASE_URL = import.meta.env.PROD 
  ? 'https://eco-rewards-wheat.vercel.app/api'
  : 'http://localhost:5173/api';

/**
 * Helper function to make authenticated API calls with rate limiting
 */
async function callAPI(endpoint, data, throttleKey = null, throttleMs = 2000) {
  // SECURITY NOTE: Client-side throttling is for UX ONLY - NOT for security
  // Actual rate limiting is enforced server-side and cannot be bypassed
  if (throttleKey && !throttle(throttleKey, throttleMs)) {
    throw new Error('Please wait a moment before trying again.');
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const token = await user.getIdToken();
  
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let error;
    
    // Try to parse response as JSON, but handle plain text errors
    try {
      const text = await response.text();
      try {
        error = JSON.parse(text);
      } catch (jsonError) {
        // Not JSON, treat as plain text error
        error = { error: text || 'Server error occurred' };
      }
    } catch (textError) {
      error = { error: 'Failed to read server response' };
    }
    
    // SECURITY: Handle deleted account error - force logout
    if (response.status === 403 && error.code === 'auth/user-not-found' && error.forceLogout) {
      // Force logout the user as their account no longer exists
      try {
        await auth.signOut();
        window.location.href = '/';
        // Show alert before redirect
        alert('Your account no longer exists. You have been logged out.');
          } catch (logoutError) {
        // Silent error handling
      }
      throw new Error('Account no longer exists');
    }
    
    // Handle 429 errors - distinguish between rate limit and daily limit
    if (response.status === 429) {
      // Check if it's a daily limit error (has specific code)
      if (error.code === 'DAILY_LIMIT_REACHED') {
        throw new Error(error.message || 'Daily deposit limit reached. Try again tomorrow!');
      }
      
      // Otherwise it's a rate limit error
      const retryAfter = response.headers.get('Retry-After') || error.retryAfter || 60;
      throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
    }
    
    throw new Error(error.error || error.message || 'API request failed');
  }

  return response.json();
}

/**
 * Initialize user rewards document
 * Note: This is automatically done by Cloud Function on user creation
 * This function just checks if it exists, and returns current state
 */
export const initializeUserRewards = async (userId) => {
  try {
    const rewardsRef = doc(db, 'rewards', userId);
    const rewardsDoc = await getDoc(rewardsRef);
    
    if (!rewardsDoc.exists()) {
      // Cloud Function will create it automatically on first auth
      // Return default values for now
      return {
        points: 0,
        totalEarned: 0,
        totalRedeemed: 0
      };
    }
    
    return rewardsDoc.data();
  } catch (error) {
    throw error;
  }
};

/**
 * Get user's current reward points from Firestore (READ ONLY)
 */
export const getUserRewards = async (userId) => {
  try {
    const rewardsRef = doc(db, 'rewards', userId);
    const rewardsDoc = await getDoc(rewardsRef);
    
    if (rewardsDoc.exists()) {
      return rewardsDoc.data();
    } else {
      // Return default values if not exists yet
      return {
        points: 0,
        totalEarned: 0,
        totalRedeemed: 0
      };
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Add points to user's account via Vercel API (SERVER-SIDE ONLY)
 * This is the ONLY way to add points - fully tamper-proof
 * 
 * @param {string} userId - User ID
 * @param {number} pointsToAdd - Points to add
 * @param {string} reason - Reason for points (deposit, bonus, etc.)
 * @param {object} depositData - Additional deposit data
 * @param {string} dustbinCode - Dustbin code (REQUIRED for deposits)
 * @param {object} userLocation - User's GPS location { lat, lng } (REQUIRED for deposits)
 */
export const addRewardPoints = async (userId, pointsToAdd, reason = 'deposit', depositData = null, dustbinCode = null, userLocation = null) => {
  try {
    // Use different throttle keys and times for different operations
    const throttleKey = reason === 'achievement' 
      ? `achievementReward_${userId}` 
      : `addReward_${userId}`;
    
    // Achievements: No throttle (instant, server limits are enough)
    // Deposits: 500ms throttle (just prevents accidental double-clicks)
    const throttleMs = reason === 'achievement' ? 0 : 500;
    
    const result = await callAPI('addRewardPoints', {
      pointsToAdd,
      reason,
      depositData,
      dustbinCode,  // Server will validate this
      userLocation  // Server will validate proximity
    }, throttleKey, throttleMs);
    
    if (result.success) {
      return true;
    } else {
      throw new Error('Failed to add reward points');
    }
  } catch (error) {
    // Check if it's a rate limit error
    const rateLimitInfo = handleRateLimitError(error);
    if (rateLimitInfo.isRateLimit) {
      throw new Error(rateLimitInfo.message);
    }
    
    throw error;
  }
};

/**
 * Deduct points from user's account via Vercel API (SERVER-SIDE ONLY)
 * Server validates the user has enough points before deducting
 */
export const deductRewardPoints = async (userId, pointsToDeduct, couponName) => {
  try {
    const result = await callAPI('redeemRewardPoints', {
      pointsToRedeem: pointsToDeduct,
      couponName,
      couponId: `${couponName}_${Date.now()}`
    }, `redeemReward_${userId}`, 800); // Throttle: 800ms between redemptions
    
    if (result.success) {
      return true;
    } else {
      throw new Error('Failed to redeem reward points');
    }
  } catch (error) {
    // Check if it's a rate limit error
    const rateLimitInfo = handleRateLimitError(error);
    if (rateLimitInfo.isRateLimit) {
      throw new Error(rateLimitInfo.message);
    }
    
    // Provide more specific error messages
    if (error.message.includes('Insufficient points')) {
      throw new Error('Insufficient points');
    } else if (error.message.includes('Unauthorized')) {
      throw new Error('Authentication required');
    }
    throw error;
  }
};

/**
 * Get user's transaction history
 */
export const getUserTransactions = async (userId) => {
  try {
    const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
    
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const transactions = [];
    
    querySnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return transactions;
  } catch (error) {
    throw error;
  }
};

/**
 * Initialize user stats document
 * Note: This is automatically done by Cloud Function on user creation
 */
export const initializeUserStats = async (userId) => {
  try {
    const statsRef = doc(db, 'userStats', userId);
    const statsDoc = await getDoc(statsRef);
    
    if (statsDoc.exists()) {
      return statsDoc.data();
    } else {
      // Return default values - Cloud Function creates it automatically
      return {
        totalDeposits: 0,
        earlyBirdDeposits: 0,
        nightOwlDeposits: 0,
        weekendDeposits: 0,
        outletsVisited: {},
        rewardsRedeemed: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastDepositDate: null,
        streakRewardsCollected: []
      };
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Get user's stats from Firestore (READ ONLY)
 */
export const getUserStats = async (userId) => {
  try {
    const statsRef = doc(db, 'userStats', userId);
    const statsDoc = await getDoc(statsRef);
    
    if (statsDoc.exists()) {
      return statsDoc.data();
    } else {
      // Return default values
      return {
        totalDeposits: 0,
        earlyBirdDeposits: 0,
        nightOwlDeposits: 0,
        weekendDeposits: 0,
        outletsVisited: {},
        rewardsRedeemed: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastDepositDate: null,
        streakRewardsCollected: []
      };
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Update user stats via Vercel API (SERVER-SIDE ONLY)
 * SECURITY: This is now restricted to only updating streakRewardsCollected
 * All other stats are calculated server-side in addRewardPoints API
 */
export const updateUserStats = async (userId, statsUpdate) => {
  try {
    const result = await callAPI('updateUserStats', {
      statsUpdate
    });
    
    if (result.success) {
      return true;
    } else {
      throw new Error('Failed to update user stats');
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Check if user is eligible for deposit (email verified + daily limit check)
 * SERVER-SIDE validation prevents abuse
 */
export const checkDepositEligibility = async (userId) => {
  try {
    const result = await callAPI('checkDepositEligibility', {}, null, 0); // No throttling for eligibility checks
    
    // Handle case where API returns eligible: false (though API typically returns 429)
    if (result.eligible === false && result.reason === 'daily_limit_reached') {
      return {
        eligible: false,
        reason: 'daily_limit_reached',
        message: '❌ Daily limit reached! You\'ve already used dustbins 5 times today. Please try again tomorrow.',
        remainingDeposits: result.remainingDeposits || 0
      };
    }
    
    return {
      eligible: result.eligible,
      reason: result.reason || null,
      message: result.message || null,
      remainingDeposits: result.remainingDeposits,
      emailVerified: result.emailVerified
    };
  } catch (error) {
    // Parse the error for specific codes
    const errorMsg = error.message || '';
    
    if (errorMsg.includes('Email not verified') || errorMsg.includes('email not verified')) {
      return {
        eligible: false,
        reason: 'email_not_verified',
        message: 'Please verify your email address before earning rewards. Check your inbox for the verification link.'
      };
    }
    
    // Check for daily limit error (case-insensitive)
    if (errorMsg.toLowerCase().includes('daily limit') || errorMsg.includes('DAILY_LIMIT_REACHED') || errorMsg.toLowerCase().includes('daily deposit limit')) {
      return {
        eligible: false,
        reason: 'daily_limit_reached',
        message: '❌ Daily limit reached! You\'ve already used dustbins 5 times today. Please try again tomorrow.'
      };
    }
    
    throw error;
  }
};

/**
 * Clear rate limits for the current user
 * USE THIS IF YOU'RE STUCK: This will immediately clear all rate limits
 */
export const clearRateLimit = async () => {
  try {
    const result = await callAPI('clearRateLimit', {}, null, 0);
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Save user achievements to Firestore (SERVER-SIDE)
 * @param {string} userId - User ID
 * @param {Array<string>} achievements - Array of achievement IDs
 */
export const saveAchievements = async (userId, achievements) => {
  try {
    const result = await callAPI('saveAchievements', {
      achievements
    }, `saveAchievements_${userId}`, 0); // No throttle - server rate limits are enough
    
    if (result.success) {
      return true;
    } else {
      throw new Error('Failed to save achievements');
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Get user achievements from Firestore (SERVER-SIDE)
 * @param {string} userId - User ID
 * @returns {Array<string>} Array of achievement IDs
 */
export const getAchievements = async (userId) => {
  try {
    const result = await callAPI('getAchievements', {}, null, 0); // No throttling for reads
    
    if (result.success) {
      return result.achievements || [];
    } else {
      throw new Error('Failed to get achievements');
    }
  } catch (error) {
    // Silently fail and return empty array
    return [];
  }
};

