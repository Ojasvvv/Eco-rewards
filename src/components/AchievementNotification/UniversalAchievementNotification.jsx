import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAchievements } from '../../context/AchievementsContext';
import { addRewardPoints } from '../../services/rewardsService';
import AchievementNotification from './AchievementNotification';

const UniversalAchievementNotification = () => {
  const { user } = useAuth();
  const { getNextNotification, clearNotification, pendingNotificationsCount } = useAchievements();
  const [currentNotification, setCurrentNotification] = useState(null);
  const [notificationKey, setNotificationKey] = useState(0);

  // Check for new notifications
  useEffect(() => {
    if (!currentNotification) {
      const notification = getNextNotification();
      if (notification) {
        setCurrentNotification(notification);
        // Increment key to force smooth re-render without flash
        setNotificationKey(prev => prev + 1);
      }
    }
  }, [currentNotification, getNextNotification, pendingNotificationsCount]);

  const handleClose = () => {
    clearNotification();
    setCurrentNotification(null);
  };

  const handleRewardClaimed = async (rewardPoints) => {
    if (!user?.uid) return;
    
    try {
      // Add points to Firestore securely
      await addRewardPoints(user.uid, rewardPoints, 'achievement', {
        type: 'achievement_claimed',
        timestamp: new Date().toISOString()
      });
      
      // Clear current notification
      clearNotification();
      setCurrentNotification(null);
    } catch (error) {
      console.error('Error claiming achievement reward:', error);
      alert('Failed to claim reward. Please try again.');
    }
  };

  if (!currentNotification) return null;

  return (
    <AchievementNotification
      key={notificationKey}
      notification={currentNotification}
      onClose={handleClose}
      onRewardClaimed={handleRewardClaimed}
    />
  );
};

export default UniversalAchievementNotification;

