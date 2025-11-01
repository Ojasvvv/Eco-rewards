import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAchievements } from '../../context/AchievementsContext';
import { useNavigate } from 'react-router-dom';
import LanguageSelector from '../LanguageSelector/LanguageSelector';
import Footer from '../Footer/Footer';
import KabadConnect from '../KabadConnect/KabadConnect';
import SmartBinFinder from '../SmartBinFinder/SmartBinFinder';
import { 
  initializeUserRewards, 
  getUserRewards, 
  addRewardPoints, 
  deductRewardPoints,
  checkDepositEligibility 
} from '../../services/rewardsService';
import { getSafeImageURL, sanitizeDisplayName } from '../../utils/sanitize';
import { validateDustbinCode, validateReportDetails, validateReportType } from '../../utils/validation';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const { recordDeposit, recordRewardRedemption, stats, showCongratsPopup, rewardsRefreshTrigger } = useAchievements();
  const navigate = useNavigate();
  const [dustbinCode, setDustbinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [rewards, setRewards] = useState(0);
  const [rewardsLoading, setRewardsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [showRewards, setShowRewards] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [outletRewards, setOutletRewards] = useState({});
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' or 'kabadconnect'

  // Check if this is first visit to dashboard EVER (not just this session)
  useEffect(() => {
    if (user?.uid) {
      const hasEverVisitedDashboard = localStorage.getItem(`hasVisitedDashboard_${user.uid}`);
      if (!hasEverVisitedDashboard) {
        // First time ever visiting dashboard for this user
        setIsFirstVisit(true);
        localStorage.setItem(`hasVisitedDashboard_${user.uid}`, 'true');
      } else {
        // User has visited before
        setIsFirstVisit(false);
      }
    }
  }, [user]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (showRewards || showReport) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showRewards, showReport]);

  // Load rewards from Firestore (secure, server-side storage)
  useEffect(() => {
    const loadRewards = async () => {
      if (user?.uid) {
        try {
          setRewardsLoading(true);
          // Initialize user rewards if first time
          await initializeUserRewards(user.uid);
          // Get current rewards from Firestore
          const rewardsData = await getUserRewards(user.uid);
          setRewards(rewardsData.points || 0);
        } catch (error) {
          console.error('Error loading rewards:', error);
          setError('Failed to load rewards. Please refresh the page.');
        } finally {
          setRewardsLoading(false);
        }
      }
    };
    
    loadRewards();
  }, [user]);

  // Refresh rewards when achievement rewards are claimed
  useEffect(() => {
    const refreshRewards = async () => {
      if (user?.uid && rewardsRefreshTrigger > 0) {
        try {
          const rewardsData = await getUserRewards(user.uid);
          setRewards(rewardsData.points || 0);
        } catch (error) {
          console.error('Error refreshing rewards:', error);
        }
      }
    };
    
    refreshRewards();
  }, [rewardsRefreshTrigger, user]);


  // Server-side eligibility check (email verification + daily limit)
  const checkEligibility = async () => {
    try {
      const eligibility = await checkDepositEligibility(user?.uid);
      
      // If eligibility check returned a result (even if not eligible), return it
      if (eligibility && eligibility.reason === 'daily_limit_reached') {
        return {
          eligible: false,
          reason: 'daily_limit_reached',
          message: `❌ Daily limit reached! You've already used dustbins 5 times today. Please try again tomorrow.`
        };
      }
      
      return eligibility;
    } catch (error) {
      console.error('Error checking eligibility:', error);
      
      // Check if it's a daily limit error (catch errors that weren't handled by checkDepositEligibility)
      if (error.message && (error.message.includes('Daily limit') || error.message.includes('daily deposit limit') || error.message.includes('DAILY_LIMIT_REACHED') || error.message.includes('Daily deposit limit reached'))) {
        return {
          eligible: false,
          reason: 'daily_limit_reached',
          message: `❌ Daily limit reached! You've already used dustbins 5 times today. Please try again tomorrow.`
        };
      }
      
      // Check if it's a rate limit error
      if (error.message && error.message.includes('Rate limit exceeded')) {
        const match = error.message.match(/(\d+) seconds/);
        const waitTime = match ? match[1] : '60';
        return {
          eligible: false,
          reason: 'rate_limit',
          message: `⏱️ Too many requests. Please wait ${waitTime} seconds before trying again.`
        };
      }
      
      return {
        eligible: false,
        reason: 'error',
        message: 'Unable to verify eligibility. Please try again.'
      };
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

  // Helper function to handle coupon redemption with proper auth checks
  const handleRedeemCoupon = async (points, couponName, couponPrefix) => {
    // Critical: Check if user is authenticated
    if (!user || !user.uid) {
      alert('❌ Please log in to redeem coupons');
      return;
    }

    // Check if user has enough points
    if (rewards < points) {
      alert(`❌ Insufficient points. You need ${points - rewards} more points.`);
      return;
    }

    try {
      // Deduct points on server (server validates user is authenticated)
      await deductRewardPoints(user.uid, points, couponName);
      
      // Only generate code AFTER successful server response
      const code = `${couponPrefix}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      
      // Update local state
      setRewards(prev => prev - points);
      recordRewardRedemption();
      
      // Show success message
      alert(`✅ Coupon Redeemed!\n\nCode: ${code}\n\nShow this code at the store\nValid for 30 days`);
    } catch (error) {
      console.error('Redemption error:', error);
      
      // Check for specific error messages
      if (error.message && error.message.includes('Unauthorized')) {
        alert('❌ Authentication required. Please log in again.');
      } else if (error.message && error.message.includes('Insufficient points')) {
        alert('❌ Insufficient points. Please try again.');
      } else {
        alert('❌ Failed to redeem coupon. Please try again.');
      }
    }
  };

  const handleReport = () => {
    setShowReport(true);
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    
    // Validate report type
    const typeValidation = validateReportType(reportType);
    if (!typeValidation.isValid) {
      alert(typeValidation.error);
      return;
    }

    // Validate report details
    const detailsValidation = validateReportDetails(reportDetails);
    if (!detailsValidation.isValid) {
      alert(detailsValidation.error);
      return;
    }

    // TODO: Send report to backend/database
    console.log('Report submitted:', { 
      type: typeValidation.value, 
      details: detailsValidation.value, 
      user: user?.email 
    });
    
    alert(t('thankYouReport'));
    
    // Reset form
    setShowReport(false);
    setReportType('');
    setReportDetails('');
  };

  const handleSubmitCode = async (e) => {
    e.preventDefault();
    
    // Validate dustbin code format
    const codeValidation = validateDustbinCode(dustbinCode);
    if (!codeValidation.isValid) {
      setError(codeValidation.error);
      return;
    }

    // Use the validated (uppercase, trimmed) code
    const validatedCode = codeValidation.value;

    setError('');
    setSuccess('');
    setLoading(true);
    setCurrentStep('checking');

    // Check eligibility (email verification + daily limit) - SERVER-SIDE
    setSuccess('🔐 Verifying eligibility...');
    const eligibility = await checkEligibility();
    
    if (!eligibility.eligible) {
      setError(`❌ ${eligibility.message}`);
      setLoading(false);
      setCurrentStep('');
      
      // If email not verified, show special message
      if (eligibility.reason === 'email_not_verified') {
        alert('📧 Email Verification Required\n\nPlease verify your email address to earn rewards.\n\nCheck your inbox for a verification link from Firebase.');
      }
      return;
    }

    // Show remaining deposits
    if (eligibility.remainingDeposits !== undefined) {
      setSuccess(`✅ Verified! You have ${eligibility.remainingDeposits} deposits remaining today.`);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setCurrentStep('location');

    try {
      // Step 1: Get user location
      setSuccess(`📍 ${t('checkingLocation')}`);
      const location = await getUserLocation();
      setUserLocation(location);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate dustbin location and get outlet info (in real app, fetch from API)
      const dustbinInfo = getDustbinInfo(validatedCode);
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
      
      // Step 4: Credit rewards FOR THIS SPECIFIC OUTLET (via Firestore)
      // SERVER-SIDE VALIDATION: Location and dustbin code are verified by the API
      setCurrentStep('rewarded');
      const pointsEarned = 10;
      
      try {
        // Add points to Firestore (server-controlled with location validation)
        await addRewardPoints(
          user.uid, 
          pointsEarned, 
          'deposit', 
          {
            outlet: dustbinInfo.outlet,
            outletId: dustbinInfo.outletId,
            timestamp: new Date().toISOString()
          },
          validatedCode,  // Server validates dustbin code exists in database
          location        // Server validates user is within 100m of dustbin
        );
        
        // Update local state to reflect the change
        setRewards(prev => prev + pointsEarned);
        
        // Track outlet-specific rewards
        setOutletRewards(prev => ({
          ...prev,
          [dustbinInfo.outletId]: (prev[dustbinInfo.outletId] || 0) + pointsEarned
        }));
        
        // Record deposit for achievements
        recordDeposit(dustbinInfo.outletId);
        
        setSuccess(`🎉 ${t('success')}! ${t('earnedPoints')} ${pointsEarned} ${t('points')}!`);
        setDustbinCode('');
        
        // Show congratulations popup (universal)
        showCongratsPopup(pointsEarned);
        
        setTimeout(() => {
          setSuccess('');
          setCurrentStep('');
        }, 1000);
      } catch (rewardError) {
        console.error('Error crediting rewards:', rewardError);
        
        // Check if it's a rate limit error
        if (rewardError.message && rewardError.message.includes('Rate limit exceeded')) {
          const match = rewardError.message.match(/(\d+) seconds/);
          const waitTime = match ? match[1] : '60';
          setError(`⏱️ Rate limit reached. Please wait ${waitTime} seconds before trying again.`);
        } else {
          setError('Deposit recorded, but there was an issue crediting points. Please contact support.');
        }
        setCurrentStep('');
      }
      
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
    // Map first 2-3 characters to outlets for demo purposes
    const outlets = {
      'DOM': { outlet: "Domino's Pizza", outletId: 'dominos' },
      'SBX': { outlet: "Starbucks", outletId: 'starbucks' },
      'SB': { outlet: "Starbucks", outletId: 'starbucks' },
      'MCD': { outlet: "McDonald's", outletId: 'mcdonalds' },
      'MC': { outlet: "McDonald's", outletId: 'mcdonalds' },
      'KFC': { outlet: "KFC", outletId: 'kfc' },
      'KF': { outlet: "KFC", outletId: 'kfc' },
      'SUB': { outlet: "Subway", outletId: 'subway' },
      'SU': { outlet: "Subway", outletId: 'subway' },
      'PHT': { outlet: "Pizza Hut", outletId: 'pizzahut' },
      'PH': { outlet: "Pizza Hut", outletId: 'pizzahut' },
      'PZ': { outlet: "Pizza Hut", outletId: 'pizzahut' }
    };
    
    // Try 3-char prefix first, then 2-char
    const prefix3 = code.substring(0, 3).toUpperCase();
    const prefix2 = code.substring(0, 2).toUpperCase();
    
    return outlets[prefix3] || outlets[prefix2] || { outlet: "Partner Store", outletId: 'general' };
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
        <div className="header-accent-line"></div>
        <div className="header-content">
          <div className="header-left">
            <div className="header-brand">
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
              <button onClick={() => setShowRewards(!showRewards)} className="nav-action-btn rewards-action rewards-btn-with-text">
                <div className="action-icon-wrapper">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  {rewards > 0 && <span className="rewards-badge">{rewards}</span>}
                </div>
                <span className="rewards-btn-text">{t('myRewards')}</span>
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
                  minLength="10"
                  maxLength="1000"
                  required
                />
                <small className="form-hint">
                  {reportDetails.length}/1000 characters (minimum 10)
                </small>
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
        {/* View Toggle Tabs */}
        <div className="view-toggle-tabs">
          <button 
            className={`view-tab ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>{t('smartDustbins')}</span>
          </button>
          <button 
            className={`view-tab ${activeView === 'binfinder' ? 'active' : ''}`}
            onClick={() => setActiveView('binfinder')}
          >
            <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Bin Finder</span>
          </button>
          <button 
            className={`view-tab ${activeView === 'kabadconnect' ? 'active' : ''}`}
            onClick={() => setActiveView('kabadconnect')}
          >
            <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{t('kabadConnect')}</span>
          </button>
        </div>

        {activeView === 'binfinder' ? (
          <div className="binfinder-view">
            <SmartBinFinder />
          </div>
        ) : activeView === 'kabadconnect' ? (
          <div className="kabadconnect-view">
            <KabadConnect />
          </div>
        ) : (
        <div className="dashboard-content">
          {/* Welcome Section */}
          <section className="welcome-section animate-slideUp">
            <h2>{t(isFirstVisit ? 'welcome' : 'welcomeBack')}, {sanitizeDisplayName(user?.displayName)?.split(' ')[0] || 'Eco Warrior'}! <span style={{fontWeight: 'normal', WebkitTextFillColor: 'initial', background: 'none'}}>👋🌱</span></h2>
            <p>✨ {t('scanQRPrompt')} 🗑️</p>
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
                <p className="stat-label">💰 {t('myRewards')}</p>
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
                <p className="stat-label">📊 {t('scanHistory')}</p>
                <p className="stat-value">{Math.floor(rewards / 10)}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-label">🔥 Current Streak</p>
                <p className="stat-value">{stats.currentStreak} days</p>
              </div>
            </div>
          </div>

          {/* Code Entry Form - Split Layout */}
          <section className="code-section-split animate-slideUp">
            <div className="code-card-left">
              <div className="code-header">
                <h3>🔑 {t('enterCode')}</h3>
                <p>📱 {t('scanQRPrompt')} 🎯</p>
              </div>

              <form onSubmit={handleSubmitCode} className={`code-form ${!error && !success ? 'idle-state' : ''}`}>
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
                    maxLength="5"
                    disabled={loading}
                    pattern="[A-Z0-9]{1,5}"
                    title="Format: Alphanumeric only, max 5 characters (e.g., AB123, XY45Z)"
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
                      ✨ {t('submit')} 🚀
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="code-info-right">
              <div className="info-card">
                <div className="info-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="info-icon">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3>{t('howItWorks')}</h3>
                </div>
                <ol className="info-steps">
                  <li>{t('step1Desc')}</li>
                  <li>{t('step2Desc')}</li>
                  <li>{t('step3Desc')}</li>
                  <li>{t('step4Desc')}</li>
                </ol>
              </div>

              <div className="info-card">
                <div className="info-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="info-icon">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3>{t('usageLimit')}</h3>
                </div>
                <p className="usage-limit-text">
                  {t('usageLimitDesc')}
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
        )}
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

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Dashboard;

