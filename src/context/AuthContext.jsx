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
        // Set persistence to LOCAL (cached in browser)
        await setPersistence(auth, browserLocalPersistence);
        
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
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
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

