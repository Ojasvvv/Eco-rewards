import React, { useEffect } from 'react';
import { useAchievements } from '../../context/AchievementsContext';
import CongratsPopup from './CongratsPopup';

const UniversalCongratsPopup = () => {
  const { congratsPopup, closeCongratsPopup, blockNotifications, unblockNotifications } = useAchievements();

  useEffect(() => {
    if (congratsPopup) {
      blockNotifications();
    } else {
      // Small delay to ensure state settles before unblocking
      const timer = setTimeout(() => {
        unblockNotifications();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [congratsPopup, blockNotifications, unblockNotifications]);

  // Also ensure unblock on unmount
  useEffect(() => {
    return () => {
      unblockNotifications();
    };
  }, [unblockNotifications]);

  if (!congratsPopup) return null;

  return (
    <CongratsPopup
      points={congratsPopup.points}
      onClose={closeCongratsPopup}
    />
  );
};

export default UniversalCongratsPopup;

