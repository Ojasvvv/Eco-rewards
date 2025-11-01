import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import './Missions.css';

const Missions = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDark } = useTheme();

  // Mock missions data (would come from Firestore in production)
  const [missions] = useState([
    {
      id: 'M001',
      type: 'weekly',
      title: t('missionPlastic2kg'),
      description: t('missionPlastic2kgDesc'),
      icon: '♻️',
      target: 2,
      current: 1.2,
      unit: 'kg',
      reward: 50,
      expiresIn: '3 days',
      difficulty: 'easy',
      category: 'plastic'
    },
    {
      id: 'M002',
      type: 'weekly',
      title: t('missionDaily5Days'),
      description: t('missionDaily5DaysDesc'),
      icon: '🔥',
      target: 5,
      current: 3,
      unit: 'days',
      reward: 100,
      expiresIn: '4 days',
      difficulty: 'medium',
      category: 'streak'
    },
    {
      id: 'M003',
      type: 'monthly',
      title: t('missionEwaste1kg'),
      description: t('missionEwaste1kgDesc'),
      icon: '📱',
      target: 1,
      current: 0.3,
      unit: 'kg',
      reward: 150,
      expiresIn: '15 days',
      difficulty: 'hard',
      category: 'ewaste'
    },
    {
      id: 'M004',
      type: 'weekly',
      title: t('missionMixed3Types'),
      description: t('missionMixed3TypesDesc'),
      icon: '🎯',
      target: 3,
      current: 2,
      unit: 'types',
      reward: 75,
      expiresIn: '2 days',
      difficulty: 'easy',
      category: 'variety'
    },
    {
      id: 'M005',
      type: 'monthly',
      title: t('missionPaper10kg'),
      description: t('missionPaper10kgDesc'),
      icon: '📄',
      target: 10,
      current: 6.5,
      unit: 'kg',
      reward: 200,
      expiresIn: '20 days',
      difficulty: 'hard',
      category: 'paper'
    },
    {
      id: 'M006',
      type: 'special',
      title: t('missionEcoWarrior'),
      description: t('missionEcoWarriorDesc'),
      icon: '🏆',
      target: 1,
      current: 0,
      unit: 'achievement',
      reward: 500,
      expiresIn: 'No expiry',
      difficulty: 'legendary',
      category: 'special'
    }
  ]);

  const [activeTab, setActiveTab] = useState('all');

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      case 'legendary': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getProgress = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const filteredMissions = missions.filter(mission => {
    if (activeTab === 'all') return true;
    return mission.type === activeTab;
  });

  const completedMissionsCount = missions.filter(m => getProgress(m.current, m.target) === 100).length;
  const totalRewardsAvailable = missions.reduce((sum, m) => sum + m.reward, 0);
  const earnedRewards = missions
    .filter(m => getProgress(m.current, m.target) === 100)
    .reduce((sum, m) => sum + m.reward, 0);

  return (
    <div className="missions-container">
      <div className="missions-header">
        <h2>
          <span className="header-icon">🎯</span>
          {t('ecoMissions')}
        </h2>
        <p className="header-subtitle">{t('ecoMissionsDesc')}</p>
      </div>

      {/* Mission Stats */}
      <div className="mission-stats">
        <div className="mission-stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-value">{completedMissionsCount}/{missions.length}</div>
            <div className="stat-label">{t('missionsCompleted')}</div>
          </div>
        </div>

        <div className="mission-stat-card">
          <div className="stat-icon">🎁</div>
          <div className="stat-info">
            <div className="stat-value">{earnedRewards}/{totalRewardsAvailable}</div>
            <div className="stat-label">{t('rewardsEarned')}</div>
          </div>
        </div>

        <div className="mission-stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-info">
            <div className="stat-value">{missions.filter(m => m.type === 'weekly').length}</div>
            <div className="stat-label">{t('activeWeekly')}</div>
          </div>
        </div>
      </div>

      {/* Mission Tabs */}
      <div className="mission-tabs">
        <button 
          className={`mission-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          {t('allMissions')}
        </button>
        <button 
          className={`mission-tab ${activeTab === 'weekly' ? 'active' : ''}`}
          onClick={() => setActiveTab('weekly')}
        >
          {t('weekly')}
        </button>
        <button 
          className={`mission-tab ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthly')}
        >
          {t('monthly')}
        </button>
        <button 
          className={`mission-tab ${activeTab === 'special' ? 'active' : ''}`}
          onClick={() => setActiveTab('special')}
        >
          {t('special')}
        </button>
      </div>

      {/* Missions List */}
      <div className="missions-grid">
        {filteredMissions.map(mission => {
          const progress = getProgress(mission.current, mission.target);
          const isCompleted = progress === 100;
          
          return (
            <div 
              key={mission.id} 
              className={`mission-card ${isCompleted ? 'completed' : ''}`}
              style={{
                borderColor: isCompleted ? '#10b981' : getDifficultyColor(mission.difficulty)
              }}
            >
              <div className="mission-header">
                <div className="mission-icon-wrapper">
                  <div 
                    className="mission-icon"
                    style={{ 
                      background: `linear-gradient(135deg, ${getDifficultyColor(mission.difficulty)}20 0%, ${getDifficultyColor(mission.difficulty)}40 100%)`
                    }}
                  >
                    {mission.icon}
                  </div>
                  {isCompleted && (
                    <div className="completion-badge">✓</div>
                  )}
                </div>
                
                <div className="mission-type-badge" style={{ background: getDifficultyColor(mission.difficulty) }}>
                  {mission.type}
                </div>
              </div>

              <div className="mission-content">
                <h3>{mission.title}</h3>
                <p>{mission.description}</p>

                <div className="mission-progress">
                  <div className="progress-info">
                    <span className="progress-current">{mission.current} / {mission.target} {mission.unit}</span>
                    <span className="progress-percent">{Math.round(progress)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${progress}%`,
                        background: isCompleted 
                          ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                          : `linear-gradient(90deg, ${getDifficultyColor(mission.difficulty)} 0%, ${getDifficultyColor(mission.difficulty)}dd 100%)`
                      }}
                    />
                  </div>
                </div>

                <div className="mission-footer">
                  <div className="mission-reward">
                    <span className="reward-icon">🎁</span>
                    <span className="reward-value">+{mission.reward} {t('points')}</span>
                  </div>
                  <div className="mission-expires">
                    <span className="expires-icon">⏰</span>
                    <span>{mission.expiresIn}</span>
                  </div>
                </div>

                {isCompleted ? (
                  <button className="btn-claim-reward">
                    {t('claimReward')}
                  </button>
                ) : (
                  <button className="btn-view-mission">
                    {t('viewMission')}
                  </button>
                )}
              </div>

              <div 
                className="difficulty-badge"
                style={{ 
                  background: getDifficultyColor(mission.difficulty),
                  color: 'white'
                }}
              >
                {t(mission.difficulty)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mission Tips */}
      <div className="mission-tips">
        <h3>💡 {t('missionTips')}</h3>
        <ul>
          <li>{t('missionTip1')}</li>
          <li>{t('missionTip2')}</li>
          <li>{t('missionTip3')}</li>
          <li>{t('missionTip4')}</li>
        </ul>
      </div>
    </div>
  );
};

export default Missions;

