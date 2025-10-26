import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './CongratsPopup.css';

const CongratsPopup = ({ points, onClose }) => {
  const { t } = useLanguage();

  return (
    <div className="congrats-popup-overlay" onClick={onClose}>
      <div className="congrats-popup" onClick={(e) => e.stopPropagation()}>
        <button className="congrats-close-btn" onClick={onClose} title="Close">
          ×
        </button>
        <div className="congrats-icon">🎉</div>
        <h2 className="congrats-title">{t('congratulations')}</h2>
        <p className="congrats-message">{t('welcomeReward')}</p>
        <div className="reward-badge" onClick={onClose}>
          <span className="reward-emoji">💰</span>
          <span className="reward-points">+{points}</span>
        </div>
        <p className="congrats-hint">Click anywhere to continue</p>
      </div>
    </div>
  );
};

export default CongratsPopup;

