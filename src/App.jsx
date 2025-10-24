import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import Leaderboard from './components/Leaderboard/Leaderboard';
import Onboarding from './components/Onboarding/Onboarding';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has completed onboarding
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (!onboardingComplete) {
      setShowOnboarding(true);
    }
    setIsLoading(false);
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (isLoading) {
    return null;
  }

  if (showOnboarding) {
    return (
      <LanguageProvider>
        <Onboarding onComplete={handleOnboardingComplete} />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <ThemeProvider>
        <Router>
          <AuthProvider>
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;

