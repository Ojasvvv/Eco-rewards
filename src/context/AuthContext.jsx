import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup,
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;
    let validationInterval;
    
    // Set persistence FIRST, then listen for auth changes
    const initAuth = async () => {
      try {
        console.log('🚀 Initializing auth with popup-only mode...');
        
        // Set persistence to LOCAL (cached in browser)
        await setPersistence(auth, browserLocalPersistence);
        console.log('✅ Persistence set to LOCAL');
        
        // Listen for auth state changes
        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          console.log('🔄 Auth state changed:', currentUser ? `User: ${currentUser.uid}` : 'No user');
          
          // Update user state
          setUser(currentUser);
          setLoading(false);
          
          // SECURITY: Set up periodic validation if user is logged in
          if (currentUser) {
            // Clear any existing interval
            if (validationInterval) {
              clearInterval(validationInterval);
            }
            
            // Validate user account every 5 minutes
            validationInterval = setInterval(async () => {
              try {
                // Force token refresh - this will fail if account is deleted
                await currentUser.getIdToken(true);
              } catch (tokenError) {
                console.error('Token refresh failed:', tokenError);
                // If token refresh fails, sign out user
                if (tokenError.code === 'auth/user-token-expired' || 
                    tokenError.code === 'auth/user-disabled' ||
                    tokenError.message?.includes('user') && tokenError.message?.includes('not found')) {
                  alert('Your account is no longer valid. You have been logged out.');
                  await signOut(auth);
                }
              }
            }, 5 * 60 * 1000); // 5 minutes
          } else {
            // Clear validation interval if user logs out
            if (validationInterval) {
              clearInterval(validationInterval);
            }
          }
        });
      } catch (error) {
        console.error('Error setting persistence:', error);
        // Still set up the listener even if persistence fails
        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (validationInterval) {
        clearInterval(validationInterval);
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      console.log('🪟 Starting popup-based Google sign-in...');
      
      // POPUP-ONLY APPROACH: Works on all modern browsers (desktop + mobile)
      const result = await signInWithPopup(auth, googleProvider);
      
      console.log('✅ Sign-in successful!', result.user.uid);
      
      // Set onboarding flag for new sign-in
      sessionStorage.setItem('shouldShowOnboarding', 'true');
      localStorage.removeItem(`hasVisitedDashboard_${result.user.uid}`);
      
      return result.user;
      
    } catch (error) {
      console.error('❌ Sign-in error:', error.code, error.message);
      
      // User-friendly error messages
      let errorMessage = 'Failed to sign in. Please try again.';
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in cancelled. Please try again.';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup was blocked by your browser. Please enable popups for this site and try again.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please wait a moment and try again.';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = 'This domain is not authorized. Please contact support.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Google sign-in is not enabled. Please contact support.';
          break;
        case 'auth/internal-error':
          errorMessage = 'Internal error. Please try again in a moment.';
          break;
        case 'auth/cancelled-popup-request':
          // Multiple popups opened, ignore this error (just log it)
          console.log('⚠️ Multiple popup requests detected, using the latest one');
          return null;
        default:
          if (error.message) {
            errorMessage = `Sign-in failed: ${error.message}`;
          }
      }
      
      setError(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      // Clear any auth-related flags
      sessionStorage.removeItem('shouldShowOnboarding');
      sessionStorage.removeItem('redirectAuthComplete');
      sessionStorage.removeItem('signingIn');
      sessionStorage.removeItem('signInTimestamp');
    } catch (error) {
      console.error('Error signing out:', error);
      setError(error.message);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

