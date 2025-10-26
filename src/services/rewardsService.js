import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

/**
 * Rewards Service - Production Version (Vercel Serverless)
 * All write operations go through secure Vercel API endpoints
 * This prevents ANY client-side manipulation of rewards
 */

const API_BASE_URL = import.meta.env.PROD 
  ? 'https://eco-rewards-wheat.vercel.app/api'
  : 'http://localhost:5173/api';

/**
 * Helper function to make authenticated API calls
 */
async function callAPI(endpoint, data) {
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
 */
export const addRewardPoints = async (userId, pointsToAdd, reason = 'deposit', depositData = null) => {
  try {
    const result = await callAPI('addRewardPoints', {
      pointsToAdd,
      reason,
      depositData
    });
    
    if (result.success) {
      return true;
    } else {
      throw new Error('Failed to add reward points');
    }
  } catch (error) {
    console.error('Error adding reward points:', error);
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
    });
    
    if (result.success) {
      return true;
    } else {
      throw new Error('Failed to redeem reward points');
    }
  } catch (error) {
    console.error('Error deducting reward points:', error);
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

