import { db, auth } from '../firebase/config';
import { collection, addDoc, getDocs, query, where, orderBy, limit, updateDoc, doc, Timestamp } from 'firebase/firestore';

/**
 * Schedule a new pickup request
 * @param {Object} pickupData - Pickup request data
 * @returns {Promise<Object>} - Created pickup document
 */
export const schedulePickup = async (pickupData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const pickup = {
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || 'User',
      ...pickupData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'pickups'), pickup);
    
    return {
      id: docRef.id,
      ...pickup
    };
  } catch (error) {
    console.error('Error scheduling pickup:', error);
    throw error;
  }
};

/**
 * Get user's pickup history
 * @param {string} userId - User ID
 * @param {number} limitCount - Number of results to return
 * @returns {Promise<Array>} - Array of pickup documents
 */
export const getUserPickups = async (userId, limitCount = 20) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const q = query(
      collection(db, 'pickups'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const pickups = [];
    
    querySnapshot.forEach((doc) => {
      pickups.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return pickups;
  } catch (error) {
    console.error('Error fetching user pickups:', error);
    throw error;
  }
};

/**
 * Update pickup status
 * @param {string} pickupId - Pickup document ID
 * @param {string} status - New status
 * @param {Object} additionalData - Additional data to update
 * @returns {Promise<void>}
 */
export const updatePickupStatus = async (pickupId, status, additionalData = {}) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const pickupRef = doc(db, 'pickups', pickupId);
    await updateDoc(pickupRef, {
      status,
      ...additionalData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating pickup status:', error);
    throw error;
  }
};

/**
 * Cancel a pickup request
 * @param {string} pickupId - Pickup document ID
 * @returns {Promise<void>}
 */
export const cancelPickup = async (pickupId) => {
  try {
    await updatePickupStatus(pickupId, 'cancelled');
  } catch (error) {
    console.error('Error cancelling pickup:', error);
    throw error;
  }
};

/**
 * Reschedule a pickup request
 * @param {string} pickupId - Pickup document ID
 * @param {Object} newSchedule - New schedule data (date, timeSlot)
 * @returns {Promise<void>}
 */
export const reschedulePickup = async (pickupId, newSchedule) => {
  try {
    await updatePickupStatus(pickupId, 'pending', {
      date: newSchedule.date,
      timeSlot: newSchedule.timeSlot,
      rescheduled: true
    });
  } catch (error) {
    console.error('Error rescheduling pickup:', error);
    throw error;
  }
};

/**
 * Check daily pickup limit for a user
 * @param {string} userId - User ID
 * @param {number} maxPickupsPerDay - Maximum pickups allowed per day (default: 2)
 * @returns {Promise<Object>} - { allowed: boolean, count: number, limit: number }
 */
export const checkDailyPickupLimit = async (userId, maxPickupsPerDay = 2) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get start and end of today
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Convert to ISO strings for Firestore query (createdAt is stored as ISO string)
    const startOfDayISO = startOfDay.toISOString();
    const endOfDayISO = endOfDay.toISOString();

    // Query pickups created today
    // Note: We query all pickups for the user and filter by date in code for better compatibility
    const q = query(
      collection(db, 'pickups'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    
    // Count only non-cancelled pickups created today
    let count = 0;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt;
      
      // Check if pickup was created today and is not cancelled
      if (createdAt && createdAt >= startOfDayISO && createdAt < endOfDayISO && data.status !== 'cancelled') {
        count++;
      }
    });

    return {
      allowed: count < maxPickupsPerDay,
      count,
      limit: maxPickupsPerDay,
      remaining: Math.max(0, maxPickupsPerDay - count)
    };
  } catch (error) {
    console.error('Error checking daily pickup limit:', error);
    // In case of error, allow the pickup (fail open)
    return {
      allowed: true,
      count: 0,
      limit: maxPickupsPerDay,
      remaining: maxPickupsPerDay
    };
  }
};

