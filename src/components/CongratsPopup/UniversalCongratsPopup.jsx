import React, { useState, useEffect } from 'react';
import { useAchievements } from '../../context/AchievementsContext';
import CongratsPopup from './CongratsPopup';

const UniversalCongratsPopup = () => {
  const { congratsPopup, closeCongratsPopup, blockNotifications, unblockNotifications } = useAchievements();
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (congratsPopup) {
      setIsShowing(true);
      blockNotifications();
    } else {
      setIsShowing(false);
      unblockNotifications();
    }
  }, [congratsPopup, blockNotifications, unblockNotifications]);

  if (!isShowing || !congratsPopup) return null;

  return (
    <CongratsPopup
      points={congratsPopup.points}
      onClose={closeCongratsPopup}
    />
  );
};

export default UniversalCongratsPopup;

