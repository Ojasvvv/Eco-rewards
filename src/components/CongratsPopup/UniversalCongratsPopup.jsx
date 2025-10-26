import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAchievements } from '../../context/AchievementsContext';
import CongratsPopup from './CongratsPopup';

const UniversalCongratsPopup = () => {
  const { congratsPopup, closeCongratsPopup, blockNotifications, unblockNotifications } = useAchievements();
  const prevCongratsPopup = useRef(congratsPopup);
  const location = useLocation();
  const prevLocation = useRef(location.pathname);

  useEffect(() => {
    if (congratsPopup) {
      blockNotifications();
    } else if (prevCongratsPopup.current && !congratsPopup) {
      // Popup just closed - unblock immediately
      unblockNotifications();
    }
    prevCongratsPopup.current = congratsPopup;
  }, [congratsPopup, blockNotifications, unblockNotifications]);

  // Close popup and unblock notifications when navigating to a different page
  useEffect(() => {
    // Only trigger if location actually changed
    if (location.pathname !== prevLocation.current) {
      if (congratsPopup) {
        closeCongratsPopup();
        // Use a small delay to ensure state settles before unblocking
        setTimeout(() => {
          unblockNotifications();
        }, 100);
      }
      prevLocation.current = location.pathname;
    }
  }, [location.pathname, congratsPopup, closeCongratsPopup, unblockNotifications]);

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

