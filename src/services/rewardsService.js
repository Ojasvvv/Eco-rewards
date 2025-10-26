import { doc, getDoc } from 'firebase/firestore';
import { db, functions } from '../firebase/config';
import { httpsCallable } from 'firebase/functions';

/**
 * Rewards Service - Production Version
 * All write operations go through secure Cloud Functions
 * This prevents ANY client-side manipulation of rewards
 */

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
 * Add points to user's account via Cloud Function (SERVER-SIDE ONLY)
 * This is the ONLY way to add points - fully tamper-proof
 */
export const addRewardPoints = async (userId, pointsToAdd, reason = 'deposit', depositData = null) => {
  try {
    // Call the Cloud Function
    const addRewardPointsFunc = httpsCallable(functions, 'addRewardPoints');
    
    const result = await addRewardPointsFunc({
      pointsToAdd,
      reason,
      depositData
    });
    
    if (result.data.success) {
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
 * Deduct points from user's account via Cloud Function (SERVER-SIDE ONLY)
 * Server validates the user has enough points before deducting
 */
export const deductRewardPoints = async (userId, pointsToDeduct, couponName) => {
  try {
    // Call the Cloud Function
    const redeemRewardPointsFunc = httpsCallable(functions, 'redeemRewardPoints');
    
    const result = await redeemRewardPointsFunc({
      pointsToRedeem: pointsToDeduct,
      couponName,
      couponId: `${couponName}_${Date.now()}`
    });
    
    if (result.data.success) {
      return true;
    } else {
      throw new Error('Failed to redeem reward points');
    }
  } catch (error) {
    console.error('Error deducting reward points:', error);
    // Provide more specific error messages
    if (error.code === 'functions/failed-precondition') {
      throw new Error('Insufficient points');
    } else if (error.code === 'functions/unauthenticated') {
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
 * Update user stats via Cloud Function (SERVER-SIDE ONLY)
 */
export const updateUserStats = async (userId, statsUpdate) => {
  try {
    // Call the Cloud Function
    const updateUserStatsFunc = httpsCallable(functions, 'updateUserStats');
    
    const result = await updateUserStatsFunc({
      statsUpdate
    });
    
    if (result.data.success) {
      return true;
    } else {
      throw new Error('Failed to update user stats');
    }
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
};

