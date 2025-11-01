import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import SchedulePickup from './SchedulePickup';
import PastOrders from './PastOrders';
import Missions from './Missions';
import './KabadConnect.css';

const KabadConnect = () => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('schedule');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const tabs = [
    { id: 'schedule', label: t('schedulePickup'), icon: '📅' },
    { id: 'orders', label: t('pastDeliveries'), icon: '📦' },
    { id: 'missions', label: t('ecoMissions'), icon: '🎯' }
  ];

  const handlePickupSuccess = (pickupRequest) => {
    console.log('Pickup scheduled:', pickupRequest);
    // Refresh orders list or show success message
  };

  return (
    <div className="kabadconnect-container">
      <div className="kabadconnect-header">
        <div className="header-content">
          <div className="header-text">
            <h2>
              <span className="header-icon">♻️</span>
              {t('kabadConnect')}
            </h2>
            <p className="header-subtitle">{t('kabadConnectDesc')}</p>
          </div>
          {activeTab === 'schedule' && (
            <button 
              className="btn-new-pickup"
              onClick={() => setShowScheduleModal(true)}
            >
              <span>+</span>
              {t('newPickup')}
            </button>
          )}
        </div>
      </div>

      <div className="kabadconnect-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`kabad-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="kabadconnect-content">
        {activeTab === 'schedule' && (
          <div className="schedule-content">
            <div className="schedule-info-cards">
              <div className="info-card">
                <div className="info-icon">🚚</div>
                <h3>{t('howItWorksTitle')}</h3>
                <ol className="info-list">
                  <li>{t('pickupStep1')}</li>
                  <li>{t('pickupStep2')}</li>
                  <li>{t('pickupStep3')}</li>
                  <li>{t('pickupStep4')}</li>
                  <li>{t('pickupStep5')}</li>
                </ol>
                <button 
                  className="btn-schedule-now"
                  onClick={() => setShowScheduleModal(true)}
                >
                  {t('scheduleNow')}
                </button>
              </div>

              <div className="info-card">
                <div className="info-icon">✅</div>
                <h3>{t('whyChooseUs')}</h3>
                <ul className="benefits-list">
                  <li>
                    <span className="benefit-icon">👤</span>
                    <span>{t('benefit1')}</span>
                  </li>
                  <li>
                    <span className="benefit-icon">💰</span>
                    <span>{t('benefit2')}</span>
                  </li>
                  <li>
                    <span className="benefit-icon">⏰</span>
                    <span>{t('benefit3')}</span>
                  </li>
                  <li>
                    <span className="benefit-icon">♻️</span>
                    <span>{t('benefit4')}</span>
                  </li>
                  <li>
                    <span className="benefit-icon">🌍</span>
                    <span>{t('benefit5')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && <PastOrders />}
        {activeTab === 'missions' && <Missions />}
      </div>

      {showScheduleModal && (
        <SchedulePickup 
          onClose={() => setShowScheduleModal(false)}
          onSuccess={handlePickupSuccess}
        />
      )}
    </div>
  );
};

export default KabadConnect;

