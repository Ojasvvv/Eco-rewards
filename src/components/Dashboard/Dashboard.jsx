import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import LanguageSelector from '../LanguageSelector/LanguageSelector';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [dustbinCode, setDustbinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [rewards, setRewards] = useState(() => {
    // Load rewards from localStorage
    const saved = localStorage.getItem(`rewards_${user?.uid}`);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [currentStep, setCurrentStep] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [showRewards, setShowRewards] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [outletRewards, setOutletRewards] = useState(() => {
    // Load outlet-specific rewards from localStorage
    const saved = localStorage.getItem(`outlet_rewards_${user?.uid}`);
    return saved ? JSON.parse(saved) : {};
  });

  // Save rewards to localStorage whenever they change
  useEffect(() => {
    if (user?.uid) {
      localStorage.setItem(`rewards_${user.uid}`, rewards.toString());
      localStorage.setItem(`outlet_rewards_${user.uid}`, JSON.stringify(outletRewards));
    }
  }, [rewards, outletRewards, user]);

  // Check daily usage limit
  const checkDailyLimit = () => {
    const today = new Date().toDateString();
    const usageKey = `usage_${user?.uid}_${today}`;
    const usage = localStorage.getItem(usageKey);
    const count = usage ? parseInt(usage, 10) : 0;
    
    if (count >= 2) {
      return false;
    }
    
    localStorage.setItem(usageKey, (count + 1).toString());
    return true;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

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

  const handleSubmitCode = async (e) => {
    e.preventDefault();
    
    if (!dustbinCode.trim()) {
      setError(t('enterDustbinCode'));
      return;
    }

    // Check daily limit
    if (!checkDailyLimit()) {
      setError(t('dailyLimitReached'));
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);
    setCurrentStep('location');

    try {
      // Step 1: Get user location
      setSuccess(`📍 ${t('checkingLocation')}`);
      const location = await getUserLocation();
      setUserLocation(location);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate dustbin location and get outlet info (in real app, fetch from API)
      const dustbinInfo = getDustbinInfo(dustbinCode);
      const dustbinLocation = { lat: location.lat + 0.0001, lng: location.lng + 0.0001 };
      const distance = calculateDistance(location, dustbinLocation);
      
      if (distance > 0.1) { // More than 100 meters
        setError(`❌ ${t('tooFar')} (${Math.round(distance * 1000)}m away). ${t('getCloser')}`);
        setLoading(false);
        setCurrentStep('');
        return;
      }
      
      setSuccess(`📍 ${t('locationVerified')}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Open dustbin
      setCurrentStep('opening');
      setSuccess(`🔓 Smart dustbin opened! Please deposit your trash.`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 3: Validate trash deposit
      setCurrentStep('validating');
      setSuccess('🔍 Validating trash deposit...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess('✅ Trash validated successfully!');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 4: Credit rewards FOR THIS SPECIFIC OUTLET
      setCurrentStep('rewarded');
      const pointsEarned = 10;
      setRewards(prev => prev + pointsEarned);
      
      // Track outlet-specific rewards
      setOutletRewards(prev => ({
        ...prev,
        [dustbinInfo.outletId]: (prev[dustbinInfo.outletId] || 0) + pointsEarned
      }));
      
      setSuccess(`🎉 ${t('success')}! ${t('earnedPoints')} ${pointsEarned} ${t('points')}!`);
      setDustbinCode('');
      
      setTimeout(() => {
        setSuccess('');
        setCurrentStep('');
      }, 4000);
      
    } catch (err) {
      if (err.message === 'location_denied') {
        setError('❌ Location access denied. Please enable location to use this feature.');
      } else {
        setError('❌ Something went wrong. Please try again.');
      }
      console.error(err);
      setCurrentStep('');
    } finally {
      setLoading(false);
    }
  };

  // Simulate getting dustbin info (in real app, fetch from backend)
  const getDustbinInfo = (code) => {
    const outlets = {
      'DOM': { outlet: "Domino's Pizza", outletId: 'dominos' },
      'SBX': { outlet: "Starbucks", outletId: 'starbucks' },
      'MCD': { outlet: "McDonald's", outletId: 'mcdonalds' },
      'KFC': { outlet: "KFC", outletId: 'kfc' },
      'SUB': { outlet: "Subway", outletId: 'subway' },
      'PHT': { outlet: "Pizza Hut", outletId: 'pizzahut' }
    };
    
    const prefix = code.substring(0, 3).toUpperCase();
    return outlets[prefix] || { outlet: "Partner Store", outletId: 'general' };
  };

  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // Try to get location name using reverse geocoding (simplified)
          const locationName = await getLocationName(latitude, longitude);
          resolve({ lat: latitude, lng: longitude, name: locationName });
        },
        (error) => {
          reject(new Error('location_denied'));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const getLocationName = async (lat, lng) => {
    // In production, use a real geocoding API
    // For now, return a placeholder
    return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  };

  const calculateDistance = (loc1, loc2) => {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  return (
    <div className="dashboard-container">
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
            <button onClick={() => setShowRewards(!showRewards)} className="rewards-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <span className="rewards-btn-text">{t('myRewards')}</span>
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

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Welcome Section */}
          <section className="welcome-section animate-slideUp">
            <h2>{t('welcomeBack')}, {user?.displayName?.split(' ')[0] || 'Eco Warrior'}! 👋</h2>
            <p>{t('scanQRPrompt')}</p>
          </section>

          {/* Stats Cards */}
          <div className="stats-grid animate-slideUp">
            <div className="stat-card">
              <div className="stat-icon" style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-label">{t('myRewards')}</p>
                <p className="stat-value">{rewards} {t('points')}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-label">{t('scanHistory')}</p>
                <p className="stat-value">{Math.floor(rewards / 10)}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-label">{t('myRewards')}</p>
                <p className="stat-value">{Math.floor(rewards / 10)}</p>
              </div>
            </div>
          </div>

          {/* Code Entry Form */}
          <section className="code-section animate-slideUp">
            <div className="code-card">
              <div className="code-header">
                <h3>{t('enterCode')}</h3>
                <p>{t('scanQRPrompt')}</p>
              </div>

              <form onSubmit={handleSubmitCode} className="code-form">
                <div className="input-group">
                  <div className="input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={dustbinCode}
                    onChange={(e) => setDustbinCode(e.target.value.toUpperCase())}
                    placeholder={t('enterCodePlaceholder')}
                    className="code-input"
                    maxLength="20"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="message error-msg animate-fadeIn">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                {success && (
                  <div className="message success-msg animate-fadeIn">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {success}
                  </div>
                )}

                <button 
                  type="submit" 
                  className={`submit-btn ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner-small"></div>
                      {t('submit')}...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('submit')}
                    </>
                  )}
                </button>
              </form>

              <div className="code-help">
                <p>💡 <strong>{t('howItWorks')}:</strong></p>
                <ol>
                  <li>{t('step1Desc')}</li>
                  <li>{t('step2Desc')}</li>
                  <li>{t('step3Desc')}</li>
                  <li>{t('step4Desc')}</li>
                </ol>
                <p className="code-help-highlight">
                  ⚠️ {t('usageLimit')}: {t('usageLimitDesc')}
                </p>
              </div>
            </div>
          </section>

          {/* City Leaderboard Preview */}
          <section className="leaderboard-preview animate-slideUp">
            <div className="leaderboard-preview-header">
              <div className="leaderboard-title-section">
                <h3>🌍 {t('citiesLeading')}</h3>
                <p className="section-subtitle">{t('citiesLeadingSub')}</p>
              </div>
              <button className="view-all-btn" onClick={() => navigate('/leaderboard')}>
                {t('viewLeaderboard')} →
              </button>
            </div>
            <div className="leaderboard-list">
              <div className="leaderboard-item">
                <div className="leaderboard-rank">1</div>
                <div className="leaderboard-content">
                  <div className="leaderboard-header">
                    <h4>🏙️ Indore</h4>
                    <span className="leaderboard-percentage">87%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '87%'}}></div>
                  </div>
                  <p className="leaderboard-description">
                    Indore leads with 87% {t('participation')}! 2,450 kg {t('wasteDiverted')}. 🌱
                  </p>
                </div>
              </div>
              
              <div className="leaderboard-item">
                <div className="leaderboard-rank">2</div>
                <div className="leaderboard-content">
                  <div className="leaderboard-header">
                    <h4>🏙️ Vijaywada</h4>
                    <span className="leaderboard-percentage">76%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '76%', background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)'}}></div>
                  </div>
                  <p className="leaderboard-description">
                    Vijaywada 76% {t('participation')}! 1,890 kg {t('wasteDiverted')}. ♻️
                  </p>
                </div>
              </div>

              <div className="leaderboard-item">
                <div className="leaderboard-rank">3</div>
                <div className="leaderboard-content">
                  <div className="leaderboard-header">
                    <h4>🏙️ Guntur</h4>
                    <span className="leaderboard-percentage">68%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '68%', background: 'linear-gradient(90deg, #F59E0B 0%, #EF4444 100%)'}}></div>
                  </div>
                  <p className="leaderboard-description">
                    Guntur 68% {t('participation')}! 1,530 kg {t('wasteDiverted')}. 🌍
                  </p>
                </div>
              </div>

            </div>
            <div className="view-all-btn-container">
              <button className="view-all-btn-secondary" onClick={() => navigate('/leaderboard')}>
                {t('seeMoreCities')} →
              </button>
            </div>
          </section>

          {/* Trash Disposal Info */}
          <section className="disposal-section animate-slideUp">
            <h3>♻️ {t('whatHappens')}</h3>
            <div className="disposal-grid">
              <div className="disposal-card">
                <div className="disposal-step">1</div>
                <div className="disposal-icon">🗑️</div>
                <h4>{t('collection')}</h4>
                <p>{t('collectionDesc')}</p>
              </div>
              
              <div className="disposal-card">
                <div className="disposal-step">2</div>
                <div className="disposal-icon">🔄</div>
                <h4>{t('sorting')}</h4>
                <p>{t('sortingDesc')}</p>
              </div>
              
              <div className="disposal-card">
                <div className="disposal-step">3</div>
                <div className="disposal-icon">🌱</div>
                <h4>{t('recycling')}</h4>
                <p>{t('recyclingDesc')}</p>
              </div>
              
              <div className="disposal-card">
                <div className="disposal-step">4</div>
                <div className="disposal-icon">⚡</div>
                <h4>{t('energyRecovery')}</h4>
                <p>{t('energyRecoveryDesc')}</p>
              </div>
            </div>
            
            <div className="disposal-stats">
              <div className="stats-disclaimer">
                <p>📊 {t('statsNote')}</p>
              </div>
              <div className="disposal-stat">
                <span className="stat-number">87%</span>
                <span className="stat-text">{t('wasteFromLandfills')}</span>
              </div>
              <div className="disposal-stat">
                <span className="stat-number">2,340+</span>
                <span className="stat-text">{t('tonsRecycled')}</span>
              </div>
              <div className="disposal-stat">
                <span className="stat-number">92%</span>
                <span className="stat-text">{t('emissionsReduction')}</span>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Rewards Modal */}
      {showRewards && (
        <div className="rewards-modal animate-fadeIn" onClick={() => setShowRewards(false)}>
          <div className="rewards-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="rewards-modal-header">
              <h2>{t('myRewards')}</h2>
              <button className="close-btn" onClick={() => setShowRewards(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="rewards-balance">
              <span className="balance-label">{t('myRewards')}</span>
              <span className="balance-value">{rewards} {t('points')}</span>
            </div>

            <div className="coupons-grid">
              <div className="coupon-card dominos">
                <div className="coupon-header">
                  <div className="coupon-brand">
                    <div className="brand-logo">🍕</div>
                    <h4>Domino's Pizza</h4>
                  </div>
                  <span className="coupon-cost">30 rewards</span>
                </div>
                <div className="coupon-offer">
                  <p className="offer-title">20% OFF</p>
                  <p className="offer-subtitle">on orders above $15</p>
                </div>
                <button 
                  className="redeem-btn"
                  disabled={rewards < 30}
                  onClick={() => {
                    if (rewards >= 30) {
                      setRewards(prev => prev - 30);
                      const code = `DOM${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
                      alert(`✅ Coupon Redeemed!\n\nCode: ${code}\n\nShow this at any Domino's\nValid for 30 days`);
                    }
                  }}
                >
                  {rewards >= 30 ? 'Redeem Now' : `Need ${30 - rewards} more rewards`}
                </button>
              </div>

              <div className="coupon-card starbucks">
                <div className="coupon-header">
                  <div className="coupon-brand">
                    <div className="brand-logo">☕</div>
                    <h4>Starbucks</h4>
                  </div>
                  <span className="coupon-cost">20 rewards</span>
                </div>
                <div className="coupon-offer">
                  <p className="offer-title">Free Tall Drink</p>
                  <p className="offer-subtitle">any beverage</p>
                </div>
                <button 
                  className="redeem-btn"
                  disabled={rewards < 20}
                  onClick={() => {
                    if (rewards >= 20) {
                      setRewards(prev => prev - 20);
                      const code = `SBX${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
                      alert(`✅ Coupon Redeemed!\n\nCode: ${code}\n\nShow this at any Starbucks\nValid for 30 days`);
                    }
                  }}
                >
                  {rewards >= 20 ? 'Redeem Now' : `Need ${20 - rewards} more rewards`}
                </button>
              </div>

              <div className="coupon-card mcdonalds">
                <div className="coupon-header">
                  <div className="coupon-brand">
                    <div className="brand-logo">🍔</div>
                    <h4>McDonald's</h4>
                  </div>
                  <span className="coupon-cost">15 rewards</span>
                </div>
                <div className="coupon-offer">
                  <p className="offer-title">Free Medium Fries</p>
                  <p className="offer-subtitle">with any purchase</p>
                </div>
                <button 
                  className="redeem-btn"
                  disabled={rewards < 15}
                  onClick={() => {
                    if (rewards >= 15) {
                      setRewards(prev => prev - 15);
                      const code = `MCD${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
                      alert(`✅ Coupon Redeemed!\n\nCode: ${code}\n\nShow this at any McDonald's\nValid for 30 days`);
                    }
                  }}
                >
                  {rewards >= 15 ? 'Redeem Now' : `Need ${15 - rewards} more rewards`}
                </button>
              </div>

              <div className="coupon-card kfc">
                <div className="coupon-header">
                  <div className="coupon-brand">
                    <div className="brand-logo">🍗</div>
                    <h4>KFC</h4>
                  </div>
                  <span className="coupon-cost">25 rewards</span>
                </div>
                <div className="coupon-offer">
                  <p className="offer-title">$5 OFF</p>
                  <p className="offer-subtitle">on orders above $20</p>
                </div>
                <button 
                  className="redeem-btn"
                  disabled={rewards < 25}
                  onClick={() => {
                    if (rewards >= 25) {
                      setRewards(prev => prev - 25);
                      const code = `KFC${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
                      alert(`✅ Coupon Redeemed!\n\nCode: ${code}\n\nShow this at any KFC\nValid for 30 days`);
                    }
                  }}
                >
                  {rewards >= 25 ? 'Redeem Now' : `Need ${25 - rewards} more rewards`}
                </button>
              </div>

              <div className="coupon-card subway">
                <div className="coupon-header">
                  <div className="coupon-brand">
                    <div className="brand-logo">🥪</div>
                    <h4>Subway</h4>
                  </div>
                  <span className="coupon-cost">10 rewards</span>
                </div>
                <div className="coupon-offer">
                  <p className="offer-title">Buy 1 Get 1</p>
                  <p className="offer-subtitle">on 6" subs</p>
                </div>
                <button 
                  className="redeem-btn"
                  disabled={rewards < 10}
                  onClick={() => {
                    if (rewards >= 10) {
                      setRewards(prev => prev - 10);
                      const code = `SUB${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
                      alert(`✅ Coupon Redeemed!\n\nCode: ${code}\n\nShow this at any Subway\nValid for 30 days`);
                    }
                  }}
                >
                  {rewards >= 10 ? 'Redeem Now' : `Need ${10 - rewards} more rewards`}
                </button>
              </div>

              <div className="coupon-card pizzahut">
                <div className="coupon-header">
                  <div className="coupon-brand">
                    <div className="brand-logo">🍕</div>
                    <h4>Pizza Hut</h4>
                  </div>
                  <span className="coupon-cost">35 rewards</span>
                </div>
                <div className="coupon-offer">
                  <p className="offer-title">25% OFF</p>
                  <p className="offer-subtitle">on any large pizza</p>
                </div>
                <button 
                  className="redeem-btn"
                  disabled={rewards < 35}
                  onClick={() => {
                    if (rewards >= 35) {
                      setRewards(prev => prev - 35);
                      const code = `PHT${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
                      alert(`✅ Coupon Redeemed!\n\nCode: ${code}\n\nShow this at any Pizza Hut\nValid for 30 days`);
                    }
                  }}
                >
                  {rewards >= 35 ? 'Redeem Now' : `Need ${35 - rewards} more rewards`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

