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
  const [isClosing, setIsClosing] = useState(false);

  // Check for new notifications
  useEffect(() => {
    // Only show new notification if not currently showing one and not in the middle of closing
    if (!currentNotification && !isClosing) {
      const notification = getNextNotification();
      if (notification) {
        // Small delay to ensure previous notification fully cleared
        const timer = setTimeout(() => {
          setCurrentNotification(notification);
          setNotificationKey(prev => prev + 1);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [currentNotification, getNextNotification, pendingNotificationsCount, isClosing]);

  const handleClose = () => {
    setIsClosing(true);
    // Wait for exit animation before clearing
    setTimeout(() => {
      clearNotification();
      setCurrentNotification(null);
      setIsClosing(false);
    }, 400); // Match exit animation duration
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
      
      // Wait for exit animation before clearing
      setTimeout(() => {
        clearNotification();
        setCurrentNotification(null);
        setIsClosing(false);
      }, 400); // Match exit animation duration
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

