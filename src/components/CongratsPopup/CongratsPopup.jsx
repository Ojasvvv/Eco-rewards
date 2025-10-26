import React, { useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './CongratsPopup.css';

const CongratsPopup = ({ points, onClose }) => {
  useEffect(() => {
    // Auto-close after 4 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const { t } = useLanguage();

  return (
    <div className="congrats-popup-overlay" onClick={onClose}>
      <div className="congrats-popup" onClick={(e) => e.stopPropagation()}>
        <div className="congrats-icon">🎉</div>
        <h2 className="congrats-title">{t('congratulations')}</h2>
        <p className="congrats-message">{t('welcomeReward')}</p>
        <div className="reward-badge" onClick={onClose}>
          <span className="reward-emoji">💰</span>
          <span className="reward-points">+{points}</span>
        </div>
      </div>
    </div>
  );
};

export default CongratsPopup;

