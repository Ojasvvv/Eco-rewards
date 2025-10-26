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
    const error = await response.json();
    
    // SECURITY: Handle deleted account error - force logout
    if (response.status === 403 && error.code === 'auth/user-not-found' && error.forceLogout) {
      // Force logout the user as their account no longer exists
      try {
        await auth.signOut();
        window.location.href = '/';
        // Show alert before redirect
        alert('Your account no longer exists. You have been logged out.');
      } catch (logoutError) {
        console.error('Error during forced logout:', logoutError);
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
    
    throw new Error(error.error || 'API request failed');
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
    console.error('Error initializing user rewards:', error);
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
    console.error('Error getting user rewards:', error);
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
    const result = await callAPI('addRewardPoints', {
      pointsToAdd,
      reason,
      depositData,
      dustbinCode,  // Server will validate this
      userLocation  // Server will validate proximity
    }, `addReward_${userId}`, 2000); // Throttle: 2 seconds between calls
    
    if (result.success) {
      return true;
    } else {
      throw new Error('Failed to add reward points');
    }
  } catch (error) {
    console.error('Error adding reward points:', error);
    
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
    }, `redeemReward_${userId}`, 3000); // Throttle: 3 seconds between redemptions
    
    if (result.success) {
      return true;
    } else {
      throw new Error('Failed to redeem reward points');
    }
  } catch (error) {
    console.error('Error deducting reward points:', error);
    
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
    console.error('Error getting user transactions:', error);
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
    console.error('Error initializing user stats:', error);
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
    console.error('Error getting user stats:', error);
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
    console.error('Error updating user stats:', error);
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
    
    return {
      eligible: result.eligible,
      reason: result.reason || null,
      message: result.message || null,
      remainingDeposits: result.remainingDeposits,
      emailVerified: result.emailVerified
    };
  } catch (error) {
    console.error('Error checking deposit eligibility:', error);
    
    // Parse the error for specific codes
    if (error.message.includes('Email not verified')) {
      return {
        eligible: false,
        reason: 'email_not_verified',
        message: 'Please verify your email address before earning rewards. Check your inbox for the verification link.'
      };
    }
    
    if (error.message.includes('Daily limit')) {
      return {
        eligible: false,
        reason: 'daily_limit_reached',
        message: 'You\'ve reached your daily deposit limit. Try again tomorrow!'
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
    console.log('🧹 Clearing rate limits...');
    const result = await callAPI('clearRateLimit', {}, null, 0);
    console.log('✅ Rate limits cleared successfully');
    return result;
  } catch (error) {
    console.error('❌ Error clearing rate limits:', error);
    throw error;
  }
};

