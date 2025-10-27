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
      
      // If we got a user result (from popup), show onboarding
      if (result && result.uid) {
        console.log('✅ Popup sign-in successful, setting onboarding flag');
        sessionStorage.setItem('shouldShowOnboarding', 'true');
        localStorage.removeItem(`hasVisitedDashboard_${result.uid}`);
        window.location.href = '/dashboard';
      }
      // If redirect was used (result is null), the page will redirect automatically
      // The onboarding flag will be set by AuthContext after redirect completes
    } catch (error) {
      // Only show error if we're still on the same page (not redirected)
      setError('Failed to sign in. Please try again or check your browser settings.');
      console.error(error);
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

      <div className="login-content animate-slideUp">
        <div className="login-card">
          {/* Logo and Header */}
          <div className="login-header">
            <div className="logo-container">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V9C19 7.89543 18.1046 7 17 7M5 11V9C5 7.89543 5.89543 7 7 7M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7M7 7H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15L12 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <h1 className="login-title">EcoRewards</h1>
            <p className="login-subtitle">Recycle Smart, Earn Rewards</p>
          </div>

          {/* Features */}
          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon">🌱</div>
              <span>Earn rewards for recycling</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🎁</div>
              <span>Get discounts at partner stores</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🌍</div>
              <span>Help create a cleaner planet</span>
            </div>
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

        {/* Bottom Info */}
        <div className="bottom-info">
          <p>Scan the QR code on any EcoRewards dustbin to get started!</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

