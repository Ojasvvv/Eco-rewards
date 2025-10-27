import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
        // Set persistence to LOCAL (cached in browser)
        await setPersistence(auth, browserLocalPersistence);
        
        // Check for redirect result (for mobile sign-in)
        try {
          const result = await getRedirectResult(auth);
          if (result) {
            // User successfully signed in via redirect
            console.log('✅ Sign-in completed via redirect');
            setUser(result.user);
            
            // Clear the visit flag to show "Welcome" instead of "Welcome Back"
            if (result.user && result.user.uid) {
              localStorage.removeItem(`hasVisitedDashboard_${result.user.uid}`);
            }
          }
        } catch (redirectError) {
          console.error('Redirect sign-in error:', redirectError);
          setError(redirectError.message);
        }
        
        // Now listen for auth state changes
        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
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
      
      // Detect if user is on mobile or in a restricted browser
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isInAppBrowser = /FBAN|FBAV|Instagram|LinkedIn|Twitter/i.test(navigator.userAgent);
      const isIOSSafari = /iPhone|iPad|iPod/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent);
      
      // Use redirect for mobile devices and in-app browsers (more reliable)
      if (isMobile || isInAppBrowser || isIOSSafari) {
        console.log('📱 Using redirect-based sign-in (mobile/in-app browser detected)');
        await signInWithRedirect(auth, googleProvider);
        // Note: The app will redirect and reload, so this function won't return
        return null;
      } else {
        // Use popup for desktop (better UX)
        console.log('💻 Using popup-based sign-in (desktop detected)');
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      
      // If popup fails, try redirect as fallback
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        console.log('⚠️ Popup blocked, falling back to redirect');
        try {
          await signInWithRedirect(auth, googleProvider);
          return null;
        } catch (redirectError) {
          console.error('Redirect also failed:', redirectError);
          setError('Failed to sign in. Please check your browser settings and allow popups.');
          throw redirectError;
        }
      }
      
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
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

