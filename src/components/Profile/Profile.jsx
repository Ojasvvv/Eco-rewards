import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAchievements, ACHIEVEMENTS, STREAK_MILESTONES } from '../../context/AchievementsContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { getSafeImageURL, sanitizeDisplayName, sanitizeEmail } from '../../utils/sanitize';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const { unlockedAchievements, stats, getAchievementProgress } = useAchievements();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Group achievements by category
  const achievementsByCategory = {
    beginner: [],
    milestone: [],
    streak: [],
    time: [],
    special: []
  };

  Object.values(ACHIEVEMENTS).forEach(achievement => {
    achievementsByCategory[achievement.category].push(achievement);
  });

  // Get upcoming streak milestone
  const getNextStreakMilestone = () => {
    const milestones = Object.keys(STREAK_MILESTONES).map(Number).sort((a, b) => a - b);
    for (let milestone of milestones) {
      if (stats.currentStreak < milestone) {
        return { days: milestone, ...STREAK_MILESTONES[milestone] };
      }
    }
    return null;
  };

  const nextMilestone = getNextStreakMilestone();

  const renderAchievement = (achievement) => {
    const isUnlocked = unlockedAchievements.includes(achievement.id);
    const progress = getAchievementProgress(achievement.id);

    return (
      <div 
        key={achievement.id} 
        className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
      >
        <div className="achievement-icon">
          {achievement.icon}
        </div>
        <div className="achievement-info">
          <h4 className="achievement-title">{achievement.title}</h4>
          <p className="achievement-description">{achievement.description}</p>
          <div className="achievement-progress-bar">
            <div 
              className="achievement-progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="achievement-footer">
            <span className="achievement-progress-text">
              {isUnlocked ? '✅ Unlocked!' : `${Math.round(progress)}%`}
            </span>
            {achievement.reward > 0 && (
              <span className="achievement-reward">
                {isUnlocked ? '🎁 Claimed' : `🎁 ${achievement.reward} points`}
              </span>
            )}
          </div>
        </div>
        {isUnlocked && <div className="achievement-unlocked-badge">✓</div>}
      </div>
    );
  };

  return (
    <div className={`profile-container ${isDark ? 'dark-theme' : ''}`}>
      {/* Header */}
      <header className="profile-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1>Profile & Achievements</h1>
      </header>

      <div className="profile-content">
        {/* User Info Card */}
        <section className="user-info-card">
          <div className="user-info-header">
            <img 
              src={getSafeImageURL(user?.photoURL, user?.displayName || 'User')}
              alt={sanitizeDisplayName(user?.displayName)}
              className="user-avatar-large"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=10b981&color=fff`;
              }}
            />
            <div className="user-info-text">
              <h2>{sanitizeDisplayName(user?.displayName) || 'Eco Warrior'}</h2>
              <p>{sanitizeEmail(user?.email)}</p>
            </div>
          </div>
          
          <div className="user-stats-grid">
            <div className="user-stat">
              <span className="stat-value">{stats.totalDeposits}</span>
              <span className="stat-label">Total Deposits</span>
            </div>
            <div className="user-stat">
              <span className="stat-value">{stats.currentStreak}</span>
              <span className="stat-label">Current Streak 🔥</span>
            </div>
            <div className="user-stat">
              <span className="stat-value">{stats.longestStreak}</span>
              <span className="stat-label">Longest Streak</span>
            </div>
            <div className="user-stat">
              <span className="stat-value">{unlockedAchievements.length}/{Object.keys(ACHIEVEMENTS).length}</span>
              <span className="stat-label">Achievements</span>
            </div>
          </div>
        </section>

        {/* Current Streak Card */}
        <section className="streak-card">
          <div className="streak-header">
            <h3>🔥 Current Streak</h3>
            <span className="streak-days">{stats.currentStreak} Days</span>
          </div>
          <div className="streak-calendar">
            {[...Array(7)].map((_, i) => {
              const dayNumber = i + 1;
              const isActive = dayNumber <= stats.currentStreak;
              return (
                <div key={i} className={`streak-day ${isActive ? 'active' : ''}`}>
                  <span className="day-number">{dayNumber}</span>
                  <span className="day-icon">{isActive ? '✓' : '○'}</span>
                </div>
              );
            })}
          </div>
          
          {nextMilestone && (
            <div className="next-milestone">
              <p className="milestone-text">
                Next milestone: <strong>{nextMilestone.days} days</strong>
              </p>
              <div className="milestone-reward">
                {nextMilestone.icon} <span>+{nextMilestone.reward} points reward</span>
              </div>
              <div className="milestone-progress-bar">
                <div 
                  className="milestone-progress-fill" 
                  style={{ width: `${(stats.currentStreak / nextMilestone.days) * 100}%` }}
                ></div>
              </div>
              <p className="milestone-progress-text">
                {nextMilestone.days - stats.currentStreak} days to go!
              </p>
            </div>
          )}

          {stats.currentStreak === 0 && (
            <div className="streak-motivation">
              <p>💡 Start your streak today by recycling!</p>
            </div>
          )}
        </section>

        {/* Achievements Section */}
        <section className="achievements-section">
          <div className="section-header">
            <h3>🏆 Achievements</h3>
            <span className="achievements-count">
              {unlockedAchievements.length} / {Object.keys(ACHIEVEMENTS).length} unlocked
            </span>
          </div>

          {/* Beginner */}
          <div className="achievement-category">
            <h4 className="category-title">🌱 Getting Started</h4>
            <div className="achievements-grid">
              {achievementsByCategory.beginner.map(renderAchievement)}
            </div>
          </div>

          {/* Milestones */}
          <div className="achievement-category">
            <h4 className="category-title">🎯 Milestones</h4>
            <div className="achievements-grid">
              {achievementsByCategory.milestone.map(renderAchievement)}
            </div>
          </div>

          {/* Streak */}
          <div className="achievement-category">
            <h4 className="category-title">🔥 Streak Master</h4>
            <div className="achievements-grid">
              {achievementsByCategory.streak.map(renderAchievement)}
            </div>
          </div>

          {/* Time-based */}
          <div className="achievement-category">
            <h4 className="category-title">⏰ Time Challenges</h4>
            <div className="achievements-grid">
              {achievementsByCategory.time.map(renderAchievement)}
            </div>
          </div>

          {/* Special */}
          <div className="achievement-category">
            <h4 className="category-title">⭐ Special</h4>
            <div className="achievements-grid">
              {achievementsByCategory.special.map(renderAchievement)}
            </div>
          </div>
        </section>

        {/* Account Actions */}
        <section className="account-actions">
          <button className="logout-btn-large" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </section>
      </div>
    </div>
  );
};

export default Profile;

