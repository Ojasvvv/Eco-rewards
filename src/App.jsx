import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AchievementsProvider } from './context/AchievementsContext';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import Leaderboard from './components/Leaderboard/Leaderboard';
import Profile from './components/Profile/Profile';
import Onboarding from './components/Onboarding/Onboarding';
import ProtectedRoute from './components/ProtectedRoute';
import PWAInstallPrompt from './components/PWAInstallPrompt/PWAInstallPrompt';
import UniversalAchievementNotification from './components/AchievementNotification/UniversalAchievementNotification';
import UniversalCongratsPopup from './components/CongratsPopup/UniversalCongratsPopup';

// Wrapper component to handle onboarding within Router context
function AppContent() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Clear old localStorage flag if it exists
    localStorage.removeItem('onboardingComplete');
    
    // Wait for auth to finish loading before checking onboarding
    if (!authLoading) {
      const shouldShowOnboarding = sessionStorage.getItem('shouldShowOnboarding');
      
      console.log('📋 App state:', { 
        authLoading, 
        hasUser: !!user, 
        shouldShowOnboarding,
        userId: user?.uid 
      });
      
      // Show onboarding if user is authenticated and flag is set
      if (user && shouldShowOnboarding === 'true') {
        console.log('🎯 Showing onboarding for user:', user.uid);
        setShowOnboarding(true);
      }
      
      setIsLoading(false);
    }
  }, [authLoading, user]);

  const handleOnboardingComplete = () => {
    console.log('✅ Onboarding complete, navigating to dashboard...');
    sessionStorage.removeItem('shouldShowOnboarding');
    setShowOnboarding(false);
    
    // Navigate to dashboard after onboarding completes
    // Use requestAnimationFrame to ensure React has updated the DOM
    requestAnimationFrame(() => {
      setTimeout(() => {
        console.log('🚀 Navigating to dashboard');
        navigate('/dashboard', { replace: true });
      }, 100); // Small delay to ensure state is fully updated
    });
  };

  // Wait for both app loading and auth loading to finish
  if (isLoading || authLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderTopColor: 'white',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
      </div>
    );
  }

  return (
    <>
      {showOnboarding ? (
        <Onboarding onComplete={handleOnboardingComplete} />
      ) : (
        <AchievementsProvider>
          <PWAInstallPrompt />
          <UniversalCongratsPopup />
          <UniversalAchievementNotification />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/leaderboard" 
              element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AchievementsProvider>
      )}
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;

