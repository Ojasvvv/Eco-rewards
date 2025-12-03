import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAchievements, ACHIEVEMENTS, STREAK_MILESTONES } from '../../context/AchievementsContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { getSafeImageURL, sanitizeDisplayName, sanitizeEmail } from '../../utils/sanitize';
import LanguageSelector from '../LanguageSelector/LanguageSelector';
import '../Dashboard/Dashboard.css';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const { unlockedAchievements, stats, getAchievementProgress } = useAchievements();
  const { t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [showRewards, setShowRewards] = React.useState(false);
  const [showReport, setShowReport] = React.useState(false);
  const [reportType, setReportType] = React.useState('');
  const [reportDetails, setReportDetails] = React.useState('');
  const [rewards, setRewards] = React.useState(0);

  React.useEffect(() => {
    // Load rewards if needed
    const loadRewards = async () => {
      try {
        const { getUserRewards } = await import('../../services/rewardsService');
        if (user?.uid) {
          const rewardsData = await getUserRewards(user.uid);
          setRewards(rewardsData.points || 0);
        }
      } catch (error) {
        console.error('Error loading rewards:', error);
      }
    };
    loadRewards();
  }, [user]);

  const handleReport = () => {
    setShowReport(true);
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!reportType || !reportDetails.trim()) {
      alert(t('selectIssueError') || 'Please fill in all fields');
      return;
    }
    console.log('Report submitted:', { type: reportType, details: reportDetails, user: user?.email });
    alert(t('thankYouReport') || 'Thank you for your report!');
    setShowReport(false);
    setReportType('');
    setReportDetails('');
  };

  const handleRedeemCoupon = async (points, couponName, couponPrefix) => {
    if (!user || !user.uid) {
      alert('❌ Please log in to redeem coupons');
      return;
    }

    if (rewards < points) {
      alert(`❌ Insufficient points. You need ${points - rewards} more points.`);
      return;
    }

    try {
      const { deductRewardPoints } = await import('../../services/rewardsService');
      await deductRewardPoints(user.uid, points, couponName);
      
      const code = `${couponPrefix}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      setRewards(prev => prev - points);
      
      alert(`✅ Coupon Redeemed!\n\nCode: ${code}\n\nShow this code at the store\nValid for 30 days`);
    } catch (error) {
      console.error('Redemption error:', error);
      if (error.message && error.message.includes('Unauthorized')) {
        alert('❌ Authentication required. Please log in again.');
      } else if (error.message && error.message.includes('Insufficient points')) {
        alert('❌ Insufficient points. Please try again.');
      } else {
        alert('❌ Failed to redeem coupon. Please try again.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      // Don't clear the visited flag - keep it so they see "Welcome Back" next time
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
      <header className="dashboard-header">
        <div className="header-accent-line"></div>
        <div className="header-content">
          <div className="header-left">
            <button onClick={() => navigate('/dashboard')} className="back-btn" style={{ marginRight: '1rem' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              {t('back') || 'Back'}
            </button>
            <div className="header-brand" onClick={() => navigate('/dashboard')}>
              <div className="brand-mark">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="brand-text">
                <h1>EcoRewards</h1>
                <div className="brand-tagline">Sustainability Made Rewarding</div>
              </div>
            </div>
          </div>
          
          <div className="header-right">
            <div className="header-actions">
              <button onClick={() => setShowRewards(!showRewards)} className="nav-action-btn rewards-action">
                <div className="action-icon-wrapper">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  {rewards > 0 && <span className="rewards-badge">{rewards}</span>}
                </div>
              </button>
              
              <LanguageSelector />
              
              <button onClick={toggleTheme} className="nav-action-btn" title={isDark ? "Light mode" : "Dark mode"}>
                <div className="action-icon-wrapper">
                  {isDark ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </div>
              </button>
              
              <button onClick={handleReport} className="nav-action-btn" title="Report an issue">
                <div className="action-icon-wrapper">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </button>
            </div>
            
            <div className="header-divider"></div>
            
            <div className="user-section" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <div className="user-info">
                <span className="user-greeting">Hi, {sanitizeDisplayName(user?.displayName)?.split(' ')[0] || 'User'}</span>
                <span className="user-email">{user?.email?.substring(0, 20)}{user?.email?.length > 20 ? '...' : ''}</span>
              </div>
              <img 
                src={getSafeImageURL(user?.photoURL, user?.displayName || 'User')} 
                alt={sanitizeDisplayName(user?.displayName)} 
                className="user-avatar"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=10b981&color=fff`;
                }}
              />
              {showProfileMenu && (
                <>
                  <div className="profile-menu-overlay" onClick={(e) => { e.stopPropagation(); setShowProfileMenu(false); }} />
                  <div className="profile-menu">
                    <button onClick={(e) => { e.stopPropagation(); navigate('/profile'); setShowProfileMenu(false); }} className="profile-menu-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile & Achievements
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleLogout(); }} className="profile-menu-logout">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Report Modal */}
      {showReport && (
        <div className="modal-overlay" onClick={() => setShowReport(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🚨 {t('reportIssue') || 'Report an Issue'}</h2>
              <button className="modal-close" onClick={() => setShowReport(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmitReport} className="report-form">
              <div className="form-group">
                <label htmlFor="reportType">{t('whatToReport') || 'What would you like to report?'}</label>
                <select 
                  id="reportType"
                  value={reportType} 
                  onChange={(e) => setReportType(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">{t('selectIssue') || 'Select an issue'}</option>
                  <option value="broken">🔧 {t('brokenDustbin') || 'Broken Dustbin'}</option>
                  <option value="full">🗑️ {t('fullDustbin') || 'Full Dustbin'}</option>
                  <option value="technical">⚙️ {t('technicalIssue') || 'Technical Issue'}</option>
                  <option value="qr_code">📱 {t('qrProblem') || 'QR Code Problem'}</option>
                  <option value="location">📍 {t('locationIssue') || 'Location Issue'}</option>
                  <option value="other">💬 {t('other') || 'Other'}</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="reportDetails">{t('elaborate') || 'Please elaborate'}</label>
                <textarea
                  id="reportDetails"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="form-textarea"
                  placeholder={t('describeProblem') || 'Describe the problem...'}
                  rows="6"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowReport(false)} className="btn-cancel">
                  {t('cancel') || 'Cancel'}
                </button>
                <button type="submit" className="btn-submit">
                  {t('submitReport') || 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rewards Modal */}
      {showRewards && (
        <div className="rewards-modal animate-fadeIn" onClick={() => setShowRewards(false)}>
          <div className="rewards-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="rewards-modal-header">
              <h2>{t('myRewards') || 'My Rewards'}</h2>
              <button className="close-btn" onClick={() => setShowRewards(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="rewards-balance">
              <span className="balance-label">{t('myRewards') || 'My Rewards'}</span>
              <span className="balance-value">{rewards} {t('points') || 'points'}</span>
            </div>

            <div className="coupons-grid">
              <div className="coupon-card dominos">
                <div className="coupon-header">
                  <div className="coupon-brand">
                    <div className="brand-logo">🍕</div>
                    <h4>Domino's Pizza</h4>
                  </div>
                  <span className="coupon-cost">30 points</span>
                </div>
                <div className="coupon-offer">
                  <p className="offer-title">20% OFF</p>
                  <p className="offer-subtitle">on orders above $15</p>
                </div>
                <button 
                  className="redeem-btn"
                  disabled={!user || rewards < 30}
                  onClick={() => handleRedeemCoupon(30, "Domino's 20% OFF", 'DOM')}
                >
                  {rewards >= 30 ? 'Redeem Now' : `Need ${30 - rewards} more points`}
                </button>
              </div>

              <div className="coupon-card starbucks">
                <div className="coupon-header">
                  <div className="coupon-brand">
                    <div className="brand-logo">☕</div>
                    <h4>Starbucks</h4>
                  </div>
                  <span className="coupon-cost">20 points</span>
                </div>
                <div className="coupon-offer">
                  <p className="offer-title">Free Tall Drink</p>
                  <p className="offer-subtitle">any beverage</p>
                </div>
                <button 
                  className="redeem-btn"
                  disabled={!user || rewards < 20}
                  onClick={() => handleRedeemCoupon(20, 'Starbucks Free Tall Drink', 'SBX')}
                >
                  {rewards >= 20 ? 'Redeem Now' : `Need ${20 - rewards} more points`}
                </button>
              </div>

              <div className="coupon-card mcdonalds">
                <div className="coupon-header">
                  <div className="coupon-brand">
                    <div className="brand-logo">🍔</div>
                    <h4>McDonald's</h4>
                  </div>
                  <span className="coupon-cost">15 points</span>
                </div>
                <div className="coupon-offer">
                  <p className="offer-title">Free Medium Fries</p>
                  <p className="offer-subtitle">with any purchase</p>
                </div>
                <button 
                  className="redeem-btn"
                  disabled={!user || rewards < 15}
                  onClick={() => handleRedeemCoupon(15, "McDonald's Free Medium Fries", 'MCD')}
                >
                  {rewards >= 15 ? 'Redeem Now' : `Need ${15 - rewards} more points`}
                </button>
              </div>

              <div className="coupon-card kfc">
                <div className="coupon-header">
                  <div className="coupon-brand">
                    <div className="brand-logo">🍗</div>
                    <h4>KFC</h4>
                  </div>
                  <span className="coupon-cost">25 points</span>
                </div>
                <div className="coupon-offer">
                  <p className="offer-title">$5 OFF</p>
                  <p className="offer-subtitle">on orders above $20</p>
                </div>
                <button 
                  className="redeem-btn"
                  disabled={!user || rewards < 25}
                  onClick={() => handleRedeemCoupon(25, 'KFC $5 OFF', 'KFC')}
                >
                  {rewards >= 25 ? 'Redeem Now' : `Need ${25 - rewards} more points`}
                </button>
              </div>

              <div className="coupon-card subway">
                <div className="coupon-header">
                  <div className="coupon-brand">
                    <div className="brand-logo">🥪</div>
                    <h4>Subway</h4>
                  </div>
                  <span className="coupon-cost">10 points</span>
                </div>
                <div className="coupon-offer">
                  <p className="offer-title">Buy 1 Get 1</p>
                  <p className="offer-subtitle">on 6" subs</p>
                </div>
                <button 
                  className="redeem-btn"
                  disabled={!user || rewards < 10}
                  onClick={() => handleRedeemCoupon(10, 'Subway Buy 1 Get 1', 'SUB')}
                >
                  {rewards >= 10 ? 'Redeem Now' : `Need ${10 - rewards} more points`}
                </button>
              </div>

              <div className="coupon-card pizzahut">
                <div className="coupon-header">
                  <div className="coupon-brand">
                    <div className="brand-logo">🍕</div>
                    <h4>Pizza Hut</h4>
                  </div>
                  <span className="coupon-cost">35 points</span>
                </div>
                <div className="coupon-offer">
                  <p className="offer-title">25% OFF</p>
                  <p className="offer-subtitle">on any large pizza</p>
                </div>
                <button 
                  className="redeem-btn"
                  disabled={!user || rewards < 35}
                  onClick={() => handleRedeemCoupon(35, 'Pizza Hut 25% OFF', 'PHT')}
                >
                  {rewards >= 35 ? 'Redeem Now' : `Need ${35 - rewards} more points`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      </div>

    </div>
  );
};

export default Profile;

