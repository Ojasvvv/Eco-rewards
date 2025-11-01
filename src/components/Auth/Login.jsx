import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './Login.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithGoogle, user, loading: authLoading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Redirect to dashboard if user is already logged in
  // BUT only if onboarding is not scheduled (to let App.jsx show onboarding first)
  useEffect(() => {
    if (!authLoading && user) {
      const shouldShowOnboarding = sessionStorage.getItem('shouldShowOnboarding');
      // Don't redirect if onboarding needs to be shown - let App.jsx handle it
      if (shouldShowOnboarding !== 'true') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      
      const result = await signInWithGoogle();
      
      // Popup sign-in successful
      if (result) {
        console.log('✅ Sign-in successful, user:', result.uid);
        // Don't navigate here - let the useEffect in Login handle it
        // (it will detect the user and redirect to dashboard or show onboarding)
      }
      
    } catch (error) {
      // Show error (message is already set by AuthContext)
      console.error('Sign-in error:', error);
      setLoading(false);
    }
  };

  // Show loading spinner while checking auth state
  if (authLoading) {
    return (
      <div className="login-container">
        <div className="login-background">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          position: 'relative',
          zIndex: 10
        }}>
          <div className="spinner" style={{ width: '60px', height: '60px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <button onClick={toggleTheme} className="login-theme-toggle" title={isDark ? "Light mode" : "Dark mode"}>
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
      <div className="login-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Left Side - Features */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="brand-section">
            <div className="brand-mark">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="brand-text">
              <h1>EcoRewards</h1>
              <p className="brand-tagline">Sustainability Made Rewarding</p>
            </div>
          </div>

          <div className="features-showcase">
            <h2>Why Choose EcoRewards?</h2>
            <div className="feature-grid">
              <div className="showcase-feature">
                <div className="feature-icon-large">🌱</div>
                <div>
                  <h3>Earn Rewards</h3>
                  <p>Get points every time you recycle. Turn your eco-friendly actions into rewards!</p>
                </div>
              </div>
              <div className="showcase-feature">
                <div className="feature-icon-large">🎁</div>
                <div>
                  <h3>Redeem Coupons</h3>
                  <p>Use your points to get discounts at partner stores like Domino's, Starbucks, and more!</p>
                </div>
              </div>
              <div className="showcase-feature">
                <div className="feature-icon-large">🔥</div>
                <div>
                  <h3>Track Your Streak</h3>
                  <p>Build daily recycling habits and maintain your streak for bonus rewards.</p>
                </div>
              </div>
              <div className="showcase-feature">
                <div className="feature-icon-large">🏆</div>
                <div>
                  <h3>Achievements & Leaderboards</h3>
                  <p>Unlock achievements and compete with others in city-wide leaderboards.</p>
                </div>
              </div>
              <div className="showcase-feature">
                <div className="feature-icon-large">🗑️</div>
                <div>
                  <h3>Smart Bin Finder</h3>
                  <p>Find the nearest EcoRewards bins and schedule pickups with KabadConnect.</p>
                </div>
              </div>
              <div className="showcase-feature">
                <div className="feature-icon-large">🌍</div>
                <div>
                  <h3>Save the Planet</h3>
                  <p>Join thousands making a real impact on environmental sustainability.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign In */}
      <div className="login-right">
        <div className="login-card animate-slideUp">
          {/* Logo and Header */}
          <div className="login-header">
            <div className="logo-container">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <h1 className="login-title">Welcome!</h1>
            <p className="login-subtitle">Start your sustainable journey today</p>
          </div>

          {/* Sign In Button */}
          <div className="login-actions">
            {error && (
              <div className="error-message animate-fadeIn">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              className={`google-signin-btn ${loading ? 'loading' : ''}`}
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <svg className="google-icon" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <div className="divider">
              <span>Quick & Secure</span>
            </div>

            <p className="privacy-text">
              By continuing, you agree to help make the world a cleaner place.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
