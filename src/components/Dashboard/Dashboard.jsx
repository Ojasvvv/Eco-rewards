import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dustbinCode, setDustbinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [rewards, setRewards] = useState(0); // In real app, fetch from database
  const [currentStep, setCurrentStep] = useState(''); // Track flow: location → opening → validating → rewarded
  const [userLocation, setUserLocation] = useState(null);
  const [showRewards, setShowRewards] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSubmitCode = async (e) => {
    e.preventDefault();
    
    if (!dustbinCode.trim()) {
      setError('Please enter a dustbin code');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);
    setCurrentStep('location');

    try {
      // Step 1: Get user location
      setSuccess('📍 Checking your location...');
      const location = await getUserLocation();
      setUserLocation(location);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate dustbin location (in real app, fetch from API)
      const dustbinLocation = { lat: location.lat + 0.0001, lng: location.lng + 0.0001 };
      const distance = calculateDistance(location, dustbinLocation);
      
      if (distance > 0.1) { // More than 100 meters
        setError(`❌ You're too far from the dustbin (${Math.round(distance * 1000)}m away). Please get closer.`);
        setLoading(false);
        setCurrentStep('');
        return;
      }
      
      setSuccess(`📍 You are at ${location.name || 'your location'}. Verifying code...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Open dustbin
      setCurrentStep('opening');
      setSuccess('🔓 Dustbin opened! Please deposit your trash.');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 3: Validate trash deposit
      setCurrentStep('validating');
      setSuccess('🔍 Validating trash deposit...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess('✅ Trash validated successfully!');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 4: Credit rewards
      setCurrentStep('rewarded');
      setRewards(prev => prev + 10);
      setSuccess('🎉 Congratulations! You earned 10 rewards!');
      setDustbinCode('');
      
      setTimeout(() => {
        setSuccess('');
        setCurrentStep('');
      }, 3000);
      
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
            <button onClick={() => setShowRewards(!showRewards)} className="rewards-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <span className="rewards-btn-text">My Rewards</span>
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
            <button onClick={handleLogout} className="logout-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Welcome Section */}
          <section className="welcome-section animate-slideUp">
            <h2>Welcome back, {user?.displayName?.split(' ')[0] || 'Eco Warrior'}! 👋</h2>
            <p>Scan a dustbin QR code and enter the code below to earn rewards</p>
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
                <p className="stat-label">Rewards</p>
                <p className="stat-value">{rewards}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-label">Total Deposits</p>
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
                <p className="stat-label">Active Rewards</p>
                <p className="stat-value">{Math.floor(rewards / 50)}</p>
              </div>
            </div>
          </div>

          {/* Code Entry Form */}
          <section className="code-section animate-slideUp">
            <div className="code-card">
              <div className="code-header">
                <h3>Enter Dustbin Code</h3>
                <p>Found on the QR code sticker</p>
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
                    placeholder="e.g., DB-12345"
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
                      Opening Dustbin...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Submit Code
                    </>
                  )}
                </button>
              </form>

              <div className="code-help">
                <p>💡 <strong>How it works:</strong></p>
                <ol>
                  <li>Scan the QR code on the dustbin</li>
                  <li>Enter the code shown</li>
                  <li>Deposit your trash when the lid opens</li>
                  <li>Earn reward points instantly!</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Company Leaderboard */}
          <section className="leaderboard-section animate-slideUp">
            <h3>🌍 Companies Making a Difference</h3>
            <p className="section-subtitle">See which brands are leading the sustainability revolution</p>
            <div className="leaderboard-list">
              <div className="leaderboard-item">
                <div className="leaderboard-rank">1</div>
                <div className="leaderboard-content">
                  <div className="leaderboard-header">
                    <h4>🍕 Domino's Pizza</h4>
                    <span className="leaderboard-percentage">60%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '60%'}}></div>
                  </div>
                  <p className="leaderboard-description">
                    60% of Domino's customers are using EcoRewards and actively contributing to a cleaner planet! Their collective effort has prevented over 2,500 kg of waste from polluting our environment. 🌱
                  </p>
                </div>
              </div>
              
              <div className="leaderboard-item">
                <div className="leaderboard-rank">2</div>
                <div className="leaderboard-content">
                  <div className="leaderboard-header">
                    <h4>☕ Starbucks</h4>
                    <span className="leaderboard-percentage">48%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '48%', background: 'linear-gradient(90deg, #00704A 0%, #008248 100%)'}}></div>
                  </div>
                  <p className="leaderboard-description">
                    Starbucks patrons are making an extraordinary impact! 48% participation has helped recycle 1,800 kg of waste, proving that every cup can contribute to sustainability. ♻️
                  </p>
                </div>
              </div>

              <div className="leaderboard-item">
                <div className="leaderboard-rank">3</div>
                <div className="leaderboard-content">
                  <div className="leaderboard-header">
                    <h4>🍔 McDonald's</h4>
                    <span className="leaderboard-percentage">42%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '42%', background: 'linear-gradient(90deg, #FFC72C 0%, #DA291C 100%)'}}></div>
                  </div>
                  <p className="leaderboard-description">
                    McDonald's customers are leading by example! Their 42% adoption rate demonstrates that fast food can go hand-in-hand with environmental responsibility. 🌍
                  </p>
                </div>
              </div>

              <div className="leaderboard-item">
                <div className="leaderboard-rank">4</div>
                <div className="leaderboard-content">
                  <div className="leaderboard-header">
                    <h4>🍗 KFC</h4>
                    <span className="leaderboard-percentage">35%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '35%', background: 'linear-gradient(90deg, #E4002B 0%, #F40009 100%)'}}></div>
                  </div>
                  <p className="leaderboard-description">
                    KFC's community is making waves in sustainability! 35% participation shows their customers care about the planet as much as great taste. 🌟
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Trash Disposal Info */}
          <section className="disposal-section animate-slideUp">
            <h3>♻️ What Happens to Your Trash?</h3>
            <div className="disposal-grid">
              <div className="disposal-card">
                <div className="disposal-step">1</div>
                <div className="disposal-icon">🗑️</div>
                <h4>Collection</h4>
                <p>Your waste is collected from our smart dustbins and sorted immediately at the source.</p>
              </div>
              
              <div className="disposal-card">
                <div className="disposal-step">2</div>
                <div className="disposal-icon">🔄</div>
                <h4>Recycling</h4>
                <p>Recyclable materials are sent to certified recycling facilities where they're processed and given new life.</p>
              </div>
              
              <div className="disposal-card">
                <div className="disposal-step">3</div>
                <div className="disposal-icon">🌱</div>
                <h4>Composting</h4>
                <p>Organic waste is composted and used to enrich soil, creating a circular economy for nutrients.</p>
              </div>
              
              <div className="disposal-card">
                <div className="disposal-step">4</div>
                <div className="disposal-icon">⚡</div>
                <h4>Energy Recovery</h4>
                <p>Non-recyclable waste is converted to energy through eco-friendly waste-to-energy processes.</p>
              </div>
            </div>
            
            <div className="disposal-stats">
              <div className="disposal-stat">
                <span className="stat-number">98%</span>
                <span className="stat-text">Waste Diverted from Landfills</span>
              </div>
              <div className="disposal-stat">
                <span className="stat-number">5000+</span>
                <span className="stat-text">Tons Recycled This Month</span>
              </div>
              <div className="disposal-stat">
                <span className="stat-number">Zero</span>
                <span className="stat-text">Harmful Emissions</span>
              </div>
            </div>
          </section>

          {/* How to Use Rewards */}
          <section className="activity-section animate-slideUp">
            <h3>🎁 How to Use Your Rewards</h3>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">🏪</div>
                <div className="activity-info">
                  <h4>Partner Store Discounts</h4>
                  <p>Use your points for discounts at participating stores</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">🎫</div>
                <div className="activity-info">
                  <h4>Special Offers</h4>
                  <p>Get exclusive deals and early access to sales</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">🌟</div>
                <div className="activity-info">
                  <h4>Leaderboard Prizes</h4>
                  <p>Top recyclers win monthly prizes and recognition</p>
                </div>
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
              <h2>My Rewards</h2>
              <button className="close-btn" onClick={() => setShowRewards(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="rewards-balance">
              <span className="balance-label">Available Rewards</span>
              <span className="balance-value">{rewards}</span>
            </div>

            <div className="coupons-grid">
              <div className="coupon-card dominos">
                <div className="coupon-header">
                  <div className="coupon-brand">
                    <div className="brand-logo">🍕</div>
                    <h4>Domino's Pizza</h4>
                  </div>
                  <span className="coupon-cost">50 rewards</span>
                </div>
                <div className="coupon-offer">
                  <p className="offer-title">20% OFF</p>
                  <p className="offer-subtitle">on orders above $15</p>
                </div>
                <button 
                  className="redeem-btn"
                  disabled={rewards < 50}
                  onClick={() => {
                    if (rewards >= 50) {
                      setRewards(prev => prev - 50);
                      const code = `DOM${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
                      alert(`✅ Coupon Redeemed!\n\nCode: ${code}\n\nVisit: dominos.com/offers\nValid for 30 days`);
                    }
                  }}
                >
                  {rewards >= 50 ? 'Redeem Now' : 'Not Enough Rewards'}
                </button>
              </div>

              <div className="coupon-card starbucks">
                <div className="coupon-header">
                  <div className="coupon-brand">
                    <div className="brand-logo">☕</div>
                    <h4>Starbucks</h4>
                  </div>
                  <span className="coupon-cost">40 rewards</span>
                </div>
                <div className="coupon-offer">
                  <p className="offer-title">Free Tall Drink</p>
                  <p className="offer-subtitle">any beverage</p>
                </div>
                <button 
                  className="redeem-btn"
                  disabled={rewards < 40}
                  onClick={() => {
                    if (rewards >= 40) {
                      setRewards(prev => prev - 40);
                      const code = `SBX${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
                      alert(`✅ Coupon Redeemed!\n\nCode: ${code}\n\nVisit: starbucks.com/rewards\nValid for 30 days`);
                    }
                  }}
                >
                  {rewards >= 40 ? 'Redeem Now' : 'Not Enough Rewards'}
                </button>
              </div>

              <div className="coupon-card mcdonalds">
                <div className="coupon-header">
                  <div className="coupon-brand">
                    <div className="brand-logo">🍔</div>
                    <h4>McDonald's</h4>
                  </div>
                  <span className="coupon-cost">35 rewards</span>
                </div>
                <div className="coupon-offer">
                  <p className="offer-title">Free Medium Fries</p>
                  <p className="offer-subtitle">with any purchase</p>
                </div>
                <button 
                  className="redeem-btn"
                  disabled={rewards < 35}
                  onClick={() => {
                    if (rewards >= 35) {
                      setRewards(prev => prev - 35);
                      const code = `MCD${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
                      alert(`✅ Coupon Redeemed!\n\nCode: ${code}\n\nVisit: mcdonalds.com/offers\nValid for 30 days`);
                    }
                  }}
                >
                  {rewards >= 35 ? 'Redeem Now' : 'Not Enough Rewards'}
                </button>
              </div>

              <div className="coupon-card kfc">
                <div className="coupon-header">
                  <div className="coupon-brand">
                    <div className="brand-logo">🍗</div>
                    <h4>KFC</h4>
                  </div>
                  <span className="coupon-cost">45 rewards</span>
                </div>
                <div className="coupon-offer">
                  <p className="offer-title">$5 OFF</p>
                  <p className="offer-subtitle">on orders above $20</p>
                </div>
                <button 
                  className="redeem-btn"
                  disabled={rewards < 45}
                  onClick={() => {
                    if (rewards >= 45) {
                      setRewards(prev => prev - 45);
                      const code = `KFC${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
                      alert(`✅ Coupon Redeemed!\n\nCode: ${code}\n\nVisit: kfc.com/offers\nValid for 30 days`);
                    }
                  }}
                >
                  {rewards >= 45 ? 'Redeem Now' : 'Not Enough Rewards'}
                </button>
              </div>

              <div className="coupon-card subway">
                <div className="coupon-header">
                  <div className="coupon-brand">
                    <div className="brand-logo">🥪</div>
                    <h4>Subway</h4>
                  </div>
                  <span className="coupon-cost">30 rewards</span>
                </div>
                <div className="coupon-offer">
                  <p className="offer-title">Buy 1 Get 1</p>
                  <p className="offer-subtitle">on 6" subs</p>
                </div>
                <button 
                  className="redeem-btn"
                  disabled={rewards < 30}
                  onClick={() => {
                    if (rewards >= 30) {
                      setRewards(prev => prev - 30);
                      const code = `SUB${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
                      alert(`✅ Coupon Redeemed!\n\nCode: ${code}\n\nVisit: subway.com/offers\nValid for 30 days`);
                    }
                  }}
                >
                  {rewards >= 30 ? 'Redeem Now' : 'Not Enough Rewards'}
                </button>
              </div>

              <div className="coupon-card pizzahut">
                <div className="coupon-header">
                  <div className="coupon-brand">
                    <div className="brand-logo">🍕</div>
                    <h4>Pizza Hut</h4>
                  </div>
                  <span className="coupon-cost">55 rewards</span>
                </div>
                <div className="coupon-offer">
                  <p className="offer-title">25% OFF</p>
                  <p className="offer-subtitle">on any large pizza</p>
                </div>
                <button 
                  className="redeem-btn"
                  disabled={rewards < 55}
                  onClick={() => {
                    if (rewards >= 55) {
                      setRewards(prev => prev - 55);
                      const code = `PHT${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
                      alert(`✅ Coupon Redeemed!\n\nCode: ${code}\n\nVisit: pizzahut.com/offers\nValid for 30 days`);
                    }
                  }}
                >
                  {rewards >= 55 ? 'Redeem Now' : 'Not Enough Rewards'}
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

