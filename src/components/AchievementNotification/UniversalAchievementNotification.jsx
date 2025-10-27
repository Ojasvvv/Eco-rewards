import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAchievements } from '../../context/AchievementsContext';
import { addRewardPoints } from '../../services/rewardsService';
import AchievementNotification from './AchievementNotification';

const UniversalAchievementNotification = () => {
  const { user } = useAuth();
  const { getNextNotification, clearNotification, pendingNotificationsCount, notificationsBlocked, notificationTrigger, triggerRewardsRefresh } = useAchievements();
  const [currentNotification, setCurrentNotification] = useState(null);
  const [notificationKey, setNotificationKey] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  // Check for new notifications
  useEffect(() => {
    // Only show new notification if:
    // 1. Not currently showing one
    // 2. Not in the middle of closing
    // 3. Notifications are not blocked (e.g., by congrats popup)
    if (!currentNotification && !isClosing && !notificationsBlocked) {
      const notification = getNextNotification();
      if (notification) {
        setCurrentNotification(notification);
        setNotificationKey(prev => prev + 1);
      }
    }
  }, [currentNotification, getNextNotification, pendingNotificationsCount, isClosing, notificationsBlocked, notificationTrigger]);

  const handleClose = () => {
    setIsClosing(true);
    // Wait for exit animation before clearing
    setTimeout(() => {
      clearNotification();
      setCurrentNotification(null);
      setIsClosing(false);
    }, 200); // Match exit animation duration (0.2s)
  };

  const handleRewardClaimed = async (rewardPoints) => {
    if (!user?.uid) return;
    
    setIsClosing(true);
    
    try {
      // Add points to Firestore securely
      await addRewardPoints(user.uid, rewardPoints, 'achievement', {
        type: 'achievement_claimed',
        timestamp: new Date().toISOString()
      });
      
      // Trigger rewards refresh in Dashboard
      triggerRewardsRefresh();
      
      // Wait for exit animation before clearing
      setTimeout(() => {
        clearNotification();
        setCurrentNotification(null);
        setIsClosing(false);
      }, 200); // Match exit animation duration (0.2s)
    } catch (error) {
      console.error('Error claiming achievement reward:', error);
      alert('Failed to claim reward. Please try again.');
      setIsClosing(false);
    }
  };

  if (!currentNotification) return null;

  return (
    <AchievementNotification
      key={notificationKey}
      notification={currentNotification}
      onClose={handleClose}
      onRewardClaimed={handleRewardClaimed}
      isClosing={isClosing}
    />
  );
};

export default UniversalAchievementNotification;

