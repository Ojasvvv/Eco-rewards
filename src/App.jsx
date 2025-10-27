import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
  const navigate = useNavigate();

  useEffect(() => {
    // Clear old localStorage flag if it exists
    localStorage.removeItem('onboardingComplete');
    
    // Check if user should see onboarding (session-based, shows after every login)
    const shouldShowOnboarding = sessionStorage.getItem('shouldShowOnboarding');
    if (shouldShowOnboarding === 'true') {
      setShowOnboarding(true);
    }
    setIsLoading(false);
  }, []);

  const handleOnboardingComplete = () => {
    sessionStorage.removeItem('shouldShowOnboarding');
    setShowOnboarding(false);
    // Navigate to dashboard after onboarding completes
    navigate('/dashboard', { replace: true });
  };

  if (isLoading) {
    return null;
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

