import React, { useEffect, useState } from 'react';
import './AchievementNotification.css';

const AchievementNotification = ({ notification, onClose, onRewardClaimed }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);

    // Generate subtle confetti - fewer pieces for cleaner look
    const confettiArray = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 2 + Math.random() * 1,
      rotation: Math.random() * 360
    }));
    setConfetti(confettiArray);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleClaimReward = () => {
    const reward = notification.type === 'achievement' 
      ? notification.achievement.reward 
      : notification.reward;
    
    if (reward > 0) {
      onRewardClaimed(reward);
    }
    handleClose();
  };

  if (!notification) return null;

  const isAchievement = notification.type === 'achievement';
  const isStreakMilestone = notification.type === 'streak_milestone';

  return (
    <div className={`achievement-notification-overlay ${isVisible ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
      {/* Confetti */}
      <div className="confetti-container">
        {confetti.map(piece => (
          <div
            key={piece.id}
            className="confetti-piece"
            style={{
              left: `${piece.left}%`,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              transform: `rotate(${piece.rotation}deg)`
            }}
          />
        ))}
      </div>

      <div className={`achievement-notification ${isVisible ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>

        {/* Icon */}
        <div className="notification-icon-large">
          {isAchievement && notification.achievement.icon}
          {isStreakMilestone && notification.icon}
        </div>

        {/* Content */}
        <div className="notification-content">
          <h2 className="notification-title">
            {isAchievement && '🎉 Achievement Unlocked!'}
            {isStreakMilestone && '🔥 Streak Milestone!'}
          </h2>
          
          <h3 className="notification-subtitle">
            {isAchievement && notification.achievement.title}
            {isStreakMilestone && notification.message}
          </h3>

          <p className="notification-description">
            {isAchievement && notification.achievement.description}
            {isStreakMilestone && `You've maintained a ${notification.streak}-day streak!`}
          </p>

          {((isAchievement && notification.achievement.reward > 0) || 
            (isStreakMilestone && notification.reward > 0)) && (
            <div className="notification-reward">
              <div className="reward-badge">
                <span className="reward-icon">🎁</span>
                <span className="reward-amount">
                  +{isAchievement ? notification.achievement.reward : notification.reward} points
                </span>
              </div>
              <button className="claim-btn" onClick={handleClaimReward}>
                Claim Reward
              </button>
            </div>
          )}

          {((isAchievement && notification.achievement.reward === 0) || 
            (isStreakMilestone && notification.reward === 0)) && (
            <button className="close-notification-btn" onClick={handleClaimReward}>
              Awesome!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementNotification;

