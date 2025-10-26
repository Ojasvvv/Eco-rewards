import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSelector from '../LanguageSelector/LanguageSelector';
import Footer from '../Footer/Footer';
import './Leaderboard.css';

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const [showReport, setShowReport] = React.useState(false);
  const [reportType, setReportType] = React.useState('');
  const [reportDetails, setReportDetails] = React.useState('');

  const handleReport = () => {
    setShowReport(true);
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    
    if (!reportType || !reportDetails.trim()) {
      alert(t('selectIssueError'));
      return;
    }

    // TODO: Send report to backend/database
    console.log('Report submitted:', { type: reportType, details: reportDetails, user: user?.email });
    
    alert(t('thankYouReport'));
    
    // Reset form
    setShowReport(false);
    setReportType('');
    setReportDetails('');
  };

  const cities = [
    {
      rank: 1,
      name: "🏙️ Indore",
      percentage: 87,
      waste: "2,450 kg",
      gradient: 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
    },
    {
      rank: 2,
      name: "🏙️ Vijaywada",
      percentage: 76,
      waste: "1,890 kg",
      gradient: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)'
    },
    {
      rank: 3,
      name: "🏙️ Guntur",
      percentage: 68,
      waste: "1,530 kg",
      gradient: 'linear-gradient(90deg, #F59E0B 0%, #EF4444 100%)'
    },
    {
      rank: 4,
      name: "🏙️ Pune",
      percentage: 62,
      waste: "1,380 kg",
      gradient: 'linear-gradient(90deg, #0EA5E9 0%, #0284C7 100%)'
    },
    {
      rank: 5,
      name: "🏙️ Surat",
      percentage: 58,
      waste: "1,215 kg",
      gradient: 'linear-gradient(90deg, #EC4899 0%, #DB2777 100%)'
    },
    {
      rank: 6,
      name: "🏙️ Bhopal",
      percentage: 54,
      waste: "1,120 kg",
      gradient: 'linear-gradient(90deg, #8B5CF6 0%, #7C3AED 100%)'
    },
    {
      rank: 7,
      name: "🏙️ Chandigarh",
      percentage: 51,
      waste: "980 kg",
      gradient: 'linear-gradient(90deg, #14B8A6 0%, #0D9488 100%)'
    },
    {
      rank: 8,
      name: "🏙️ Coimbatore",
      percentage: 47,
      waste: "865 kg",
      gradient: 'linear-gradient(90deg, #F97316 0%, #EA580C 100%)'
    },
    {
      rank: 9,
      name: "🏙️ Mysore",
      percentage: 43,
      waste: "750 kg",
      gradient: 'linear-gradient(90deg, #06B6D4 0%, #0891B2 100%)'
    },
    {
      rank: 10,
      name: "🏙️ Jaipur",
      percentage: 39,
      waste: "690 kg",
      gradient: 'linear-gradient(90deg, #A855F7 0%, #9333EA 100%)'
    },
    {
      rank: 11,
      name: "🏙️ Vadodara",
      percentage: 36,
      waste: "625 kg",
      gradient: 'linear-gradient(90deg, #22C55E 0%, #16A34A 100%)'
    },
    {
      rank: 12,
      name: "🏙️ Nagpur",
      percentage: 33,
      waste: "570 kg",
      gradient: 'linear-gradient(90deg, #EAB308 0%, #CA8A04 100%)'
    }
  ];

  return (
    <div className="leaderboard-page-container">
      {/* Report Modal */}
      {showReport && (
        <div className="modal-overlay" onClick={() => setShowReport(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🚨 {t('reportIssue')}</h2>
              <button className="modal-close" onClick={() => setShowReport(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmitReport} className="report-form">
              <div className="form-group">
                <label htmlFor="reportType">{t('whatToReport')}</label>
                <select 
                  id="reportType"
                  value={reportType} 
                  onChange={(e) => setReportType(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">{t('selectIssue')}</option>
                  <option value="broken">🔧 {t('brokenDustbin')}</option>
                  <option value="full">🗑️ {t('fullDustbin')}</option>
                  <option value="technical">⚙️ {t('technicalIssue')}</option>
                  <option value="qr_code">📱 {t('qrProblem')}</option>
                  <option value="location">📍 {t('locationIssue')}</option>
                  <option value="other">💬 {t('other')}</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="reportDetails">{t('elaborate')}</label>
                <textarea
                  id="reportDetails"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="form-textarea"
                  placeholder={t('describeProblem')}
                  rows="6"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowReport(false)} className="btn-cancel">
                  {t('cancel')}
                </button>
                <button type="submit" className="btn-submit">
                  {t('submitReport')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-logo">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V9C19 7.89543 18.1046 7 17 7M5 11V9C5 7.89543 5.89543 7 7 7M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7M7 7H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 onClick={() => navigate('/dashboard')}>EcoRewards</h1>
          </div>
          
          <div className="header-right">
            <LanguageSelector />
            <button onClick={() => navigate('/dashboard')} className="back-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>{t('back')}</span>
            </button>
            <div className="user-profile">
              <img 
                src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=10b981&color=fff`} 
                alt={user?.displayName || 'User'} 
                className="user-avatar"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=10b981&color=fff`;
                }}
              />
              <span className="user-name">{user?.displayName?.split(' ')[0] || 'User'}</span>
            </div>
            <button onClick={toggleTheme} className="theme-toggle-btn" title={isDark ? "Light mode" : "Dark mode"}>
              {isDark ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button onClick={handleReport} className="report-btn" title="Report an issue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </button>
            <button onClick={handleLogout} className="logout-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="leaderboard-main">
        <div className="leaderboard-hero">
          <h1>🌍 {t('cityLeaderboard')}</h1>
          <p>{t('cityLeaderboardSub')}</p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">14,065 kg</span>
              <span className="hero-stat-label">{t('wasteRecycledMonth')}</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">28,540</span>
              <span className="hero-stat-label">{t('activeUsers')}</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">487</span>
              <span className="hero-stat-label">{t('smartDustbins')}</span>
            </div>
          </div>
        </div>

        <div className="leaderboard-content">
          {cities.map((city, index) => (
            <div key={city.rank} className={`leaderboard-item-full ${index < 3 ? 'top-three' : ''}`}>
              <div className="rank-badge">
                <span className="rank-number">#{city.rank}</span>
                {index === 0 && <span className="rank-medal">🥇</span>}
                {index === 1 && <span className="rank-medal">🥈</span>}
                {index === 2 && <span className="rank-medal">🥉</span>}
              </div>
              
              <div className="company-info">
                <h3>{city.name}</h3>
                <div className="company-stats-grid">
                  <div className="company-stat">
                    <span className="stat-label">{t('participation')}</span>
                    <span className="stat-value-large">{city.percentage}%</span>
                  </div>
                  <div className="company-stat">
                    <span className="stat-label">{t('wasteDiverted')}</span>
                    <span className="stat-value-large">{city.waste}</span>
                  </div>
                </div>
                
                <div className="progress-bar-large">
                  <div className="progress-fill-large" style={{width: `${city.percentage}%`, background: city.gradient}}></div>
                </div>
                
                <p className="company-impact">
                  {city.percentage >= 70 ? `🌟 Outstanding! ${city.name.split(' ')[1]} citizens are environmental champions!` :
                   city.percentage >= 50 ? `💚 Impressive! ${city.name.split(' ')[1]} community is making a real difference!` :
                   city.percentage >= 40 ? `👏 Great progress! ${city.name.split(' ')[1]} is building sustainability momentum!` :
                   `🌱 Growing strong! ${city.name.split(' ')[1]} is on the path to sustainability!`}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="leaderboard-footer">
          <h3>{t('whyMatters')}</h3>
          <div className="footer-cards">
            <div className="footer-card">
              <div className="footer-icon">🌍</div>
              <h4>{t('citiesThrive')}</h4>
              <p>{t('citiesThriveDesc')}</p>
            </div>
            <div className="footer-card">
              <div className="footer-icon">♻️</div>
              <h4>{t('realImpact')}</h4>
              <p>{t('realImpactDesc')}</p>
            </div>
            <div className="footer-card">
              <div className="footer-icon">🎁</div>
              <h4>{t('winWin')}</h4>
              <p>{t('winWinDesc')}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Leaderboard;

