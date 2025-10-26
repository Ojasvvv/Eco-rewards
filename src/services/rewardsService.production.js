import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase/config';

/**
 * Production Rewards Service
 * Uses Cloud Functions for all sensitive operations
 * This is SECURE and production-ready
 */

// Initialize Cloud Functions
const functions = getFunctions();

// ==================== CLOUD FUNCTION WRAPPERS ====================

/**
 * Add reward points via secure Cloud Function
 * @param {string} userId - User ID
 * @param {number} pointsToAdd - Points to add
 * @param {string} reason - Reason for adding points
 * @param {object} depositData - Optional deposit data
 */
export const addRewardPoints = async (userId, pointsToAdd, reason = 'deposit', depositData = null) => {
  try {
    const addPoints = httpsCallable(functions, 'addRewardPoints');
    const result = await addPoints({
      pointsToAdd,
      reason,
      depositData
    });
    
    return result.data;
  } catch (error) {
    console.error('Error adding reward points:', error);
    throw new Error(error.message || 'Failed to add reward points');
  }
};

/**
 * Redeem reward points via secure Cloud Function
 * @param {string} userId - User ID
 * @param {number} pointsToRedeem - Points to redeem
 * @param {string} couponName - Name of coupon being redeemed
 * @param {string} couponId - Optional coupon ID
 */
export const deductRewardPoints = async (userId, pointsToRedeem, couponName, couponId = null) => {
  try {
    const redeemPoints = httpsCallable(functions, 'redeemRewardPoints');
    const result = await redeemPoints({
      pointsToRedeem,
      couponName,
      couponId
    });
    
    return result.data;
  } catch (error) {
    console.error('Error redeeming reward points:', error);
    
    // Handle specific error codes
    if (error.code === 'functions/failed-precondition') {
      throw new Error('Insufficient points');
    }
    
    throw new Error(error.message || 'Failed to redeem reward points');
  }
};

/**
 * Process a deposit and award points via secure Cloud Function
 * This is the recommended way to handle deposits
 * @param {object} depositData - Deposit information
 */
export const processDeposit = async (depositData) => {
  try {
    const processDepositFunc = httpsCallable(functions, 'processDeposit');
    const result = await processDepositFunc(depositData);
    
    return result.data;
  } catch (error) {
    console.error('Error processing deposit:', error);
    throw new Error(error.message || 'Failed to process deposit');
  }
};

/**
 * Update user stats via secure Cloud Function
 * @param {string} userId - User ID
 * @param {object} statsUpdate - Stats to update
 */
export const updateUserStats = async (userId, statsUpdate) => {
  try {
    const updateStats = httpsCallable(functions, 'updateUserStats');
    const result = await updateStats({ statsUpdate });
    
    return result.data;
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw new Error(error.message || 'Failed to update user stats');
  }
};

// ==================== READ OPERATIONS ====================
// These are safe to do client-side (read-only)

/**
 * Get user's current reward points from Firestore
 * This is read-only so it's safe to do client-side
 */
export const getUserRewards = async (userId) => {
  try {
    const rewardsRef = doc(db, 'rewards', userId);
    const rewardsDoc = await getDoc(rewardsRef);
    
    if (rewardsDoc.exists()) {
      return rewardsDoc.data();
    } else {
      // Return default values if document doesn't exist yet
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
 * Get user's stats from Firestore
 * This is read-only so it's safe to do client-side
 */
export const getUserStats = async (userId) => {
  try {
    const statsRef = doc(db, 'userStats', userId);
    const statsDoc = await getDoc(statsRef);
    
    if (statsDoc.exists()) {
      return statsDoc.data();
    } else {
      // Return default values if document doesn't exist yet
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
 * Get user's transaction history
 * This is read-only so it's safe to do client-side
 */
export const getUserTransactions = async (userId, limit = 50) => {
  try {
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
    
    return transactions.slice(0, limit);
  } catch (error) {
    console.error('Error getting user transactions:', error);
    throw error;
  }
};

// ==================== INITIALIZATION ====================
// Note: User initialization is now handled automatically by Cloud Function
// when a new user is created (see functions/index.js - initializeUserRewards)

/**
 * Initialize user rewards (called automatically by Cloud Function)
 * This function is kept for backward compatibility but does nothing
 */
export const initializeUserRewards = async (userId) => {
  console.log('User rewards are initialized automatically by Cloud Functions');
  return true;
};

/**
 * Initialize user stats (called automatically by Cloud Function)
 * This function is kept for backward compatibility but does nothing
 */
export const initializeUserStats = async (userId) => {
  console.log('User stats are initialized automatically by Cloud Functions');
  return true;
};

