import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Leaderboard.css';

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const companies = [
    {
      rank: 1,
      name: "🍕 Domino's Pizza",
      percentage: 60,
      waste: "850 kg",
      gradient: 'linear-gradient(90deg, #0078AE 0%, #005A87 100%)'
    },
    {
      rank: 2,
      name: "☕ Starbucks",
      percentage: 48,
      waste: "680 kg",
      gradient: 'linear-gradient(90deg, #00704A 0%, #008248 100%)'
    },
    {
      rank: 3,
      name: "🍔 McDonald's",
      percentage: 42,
      waste: "590 kg",
      gradient: 'linear-gradient(90deg, #FFC72C 0%, #DA291C 100%)'
    },
    {
      rank: 4,
      name: "🍗 KFC",
      percentage: 35,
      waste: "480 kg",
      gradient: 'linear-gradient(90deg, #E4002B 0%, #F40009 100%)'
    },
    {
      rank: 5,
      name: "🥪 Subway",
      percentage: 31,
      waste: "420 kg",
      gradient: 'linear-gradient(90deg, #008C15 0%, #006B11 100%)'
    },
    {
      rank: 6,
      name: "🍕 Pizza Hut",
      percentage: 28,
      waste: "375 kg",
      gradient: 'linear-gradient(90deg, #EE3124 0%, #C41E3A 100%)'
    },
    {
      rank: 7,
      name: "🍟 Burger King",
      percentage: 25,
      waste: "340 kg",
      gradient: 'linear-gradient(90deg, #EC1C24 0%, #F5A623 100%)'
    },
    {
      rank: 8,
      name: "🌮 Taco Bell",
      percentage: 22,
      waste: "295 kg",
      gradient: 'linear-gradient(90deg, #702082 0%, #A77BCA 100%)'
    },
    {
      rank: 9,
      name: "☕ Dunkin'",
      percentage: 19,
      waste: "260 kg",
      gradient: 'linear-gradient(90deg, #FF6600 0%, #DD0031 100%)'
    },
    {
      rank: 10,
      name: "🍕 Papa John's",
      percentage: 16,
      waste: "215 kg",
      gradient: 'linear-gradient(90deg, #CE0E2D 0%, #009639 100%)'
    }
  ];

  return (
    <div className="leaderboard-page-container">
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
            <button onClick={() => navigate('/dashboard')} className="back-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back</span>
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
      <main className="leaderboard-main">
        <div className="leaderboard-hero">
          <h1>🌍 Company Sustainability Leaderboard</h1>
          <p>Celebrating brands whose customers are making the biggest environmental impact</p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">3,455 kg</span>
              <span className="hero-stat-label">Waste Recycled This Month</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">10,240</span>
              <span className="hero-stat-label">Active Users</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">156</span>
              <span className="hero-stat-label">Smart Dustbins</span>
            </div>
          </div>
        </div>

        <div className="leaderboard-content">
          {companies.map((company, index) => (
            <div key={company.rank} className={`leaderboard-item-full ${index < 3 ? 'top-three' : ''}`}>
              <div className="rank-badge">
                <span className="rank-number">#{company.rank}</span>
                {index === 0 && <span className="rank-medal">🥇</span>}
                {index === 1 && <span className="rank-medal">🥈</span>}
                {index === 2 && <span className="rank-medal">🥉</span>}
              </div>
              
              <div className="company-info">
                <h3>{company.name}</h3>
                <div className="company-stats-grid">
                  <div className="company-stat">
                    <span className="stat-label">Participation</span>
                    <span className="stat-value-large">{company.percentage}%</span>
                  </div>
                  <div className="company-stat">
                    <span className="stat-label">Waste Diverted</span>
                    <span className="stat-value-large">{company.waste}</span>
                  </div>
                </div>
                
                <div className="progress-bar-large">
                  <div className="progress-fill-large" style={{width: `${company.percentage}%`, background: company.gradient}}></div>
                </div>
                
                <p className="company-impact">
                  {company.percentage >= 50 ? `🌟 Outstanding! ${company.name.split(' ')[1]} customers are environmental champions!` :
                   company.percentage >= 35 ? `💚 Impressive! ${company.name.split(' ')[1]} community is making a real difference!` :
                   company.percentage >= 25 ? `👏 Great progress! ${company.name.split(' ')[1]} is building sustainability momentum!` :
                   `🌱 Growing strong! ${company.name.split(' ')[1]} is on the path to sustainability!`}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="leaderboard-footer">
          <h3>Why This Matters</h3>
          <div className="footer-cards">
            <div className="footer-card">
              <div className="footer-icon">🌍</div>
              <h4>Outlets Benefit</h4>
              <p>Customers return more often to outlets with EcoRewards dustbins, increasing foot traffic and sales by an average of 12%.</p>
            </div>
            <div className="footer-card">
              <div className="footer-icon">♻️</div>
              <h4>Real Impact</h4>
              <p>Every kilogram of waste recycled prevents harmful methane emissions and reduces landfill pollution.</p>
            </div>
            <div className="footer-card">
              <div className="footer-icon">🎁</div>
              <div className="footer-icon">🎁</div>
              <h4>Win-Win Model</h4>
              <p>Customers get rewards at the same outlet where they recycled, driving repeat business while saving the planet.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;

