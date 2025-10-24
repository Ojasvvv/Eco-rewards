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

    try {
      // Simulate API call to verify code and open dustbin
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real application, you would:
      // 1. Verify the dustbin code with your backend
      // 2. Send signal to open the dustbin lid via IoT
      // 3. Wait for sensor confirmation that trash was deposited
      // 4. Award points/discount to user
      // 5. Update user's rewards in database
      
      setSuccess('✅ Dustbin opened! Please deposit your trash.');
      setDustbinCode('');
      
      // Simulate reward after 3 seconds (sensor detection)
      setTimeout(() => {
        setRewards(prev => prev + 10);
        setSuccess('🎉 Great job! You earned 10 reward points!');
      }, 3000);
      
    } catch (err) {
      setError('Invalid dustbin code. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
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
            <h1>EcoRewards</h1>
          </div>
          
          <div className="header-right">
            <div className="user-profile">
              <img 
                src={user?.photoURL || 'https://via.placeholder.com/40'} 
                alt={user?.displayName || 'User'} 
                className="user-avatar"
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
                <p className="stat-label">Reward Points</p>
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

          {/* Recent Activity */}
          <section className="activity-section animate-slideUp">
            <h3>How to Use Your Rewards</h3>
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
    </div>
  );
};

export default Dashboard;

