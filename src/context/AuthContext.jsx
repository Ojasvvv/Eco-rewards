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
    let redirectTimeout;
    
    // Set persistence FIRST, then listen for auth changes
    const initAuth = async () => {
      try {
        // Set persistence to LOCAL (cached in browser)
        await setPersistence(auth, browserLocalPersistence);
        
        // Check for redirect result (for mobile sign-in)
        let redirectHandled = false;
        let skipFirstAuthChange = false;
        
        console.log('🔍 Checking for redirect result...');
        try {
          const result = await getRedirectResult(auth);
          console.log('📥 getRedirectResult returned:', result ? `User: ${result.user.uid}` : 'null (no pending redirect)');
          
          if (result) {
            // User successfully signed in via redirect
            console.log('✅ Sign-in completed via redirect, user:', result.user.uid);
            redirectHandled = true;
            skipFirstAuthChange = true; // We'll set user directly, skip first null from onAuthStateChanged
            setUser(result.user);
            setLoading(false);
            
            // Clear the visit flag to show "Welcome" instead of "Welcome Back"
            if (result.user && result.user.uid) {
              localStorage.removeItem(`hasVisitedDashboard_${result.user.uid}`);
            }
            
            // IMPORTANT: Set flags to show onboarding after successful redirect
            console.log('📝 Setting onboarding flag for redirect sign-in');
            sessionStorage.setItem('shouldShowOnboarding', 'true');
            sessionStorage.setItem('redirectAuthComplete', 'true');
          } else {
            // No redirect result - but check if we're in the middle of a sign-in flow
            const wasSigningIn = sessionStorage.getItem('signingIn');
            const hasOnboardingFlag = sessionStorage.getItem('shouldShowOnboarding');
            
            // Only clear stale flags if we're NOT currently signing in
            if (hasOnboardingFlag === 'true' && wasSigningIn !== 'true') {
              console.log('🧹 Clearing stale onboarding flag (no redirect result and not signing in)');
              sessionStorage.removeItem('shouldShowOnboarding');
              sessionStorage.removeItem('redirectAuthComplete');
            } else if (wasSigningIn === 'true') {
              console.log('⏳ No redirect result yet, but sign-in in progress - waiting for auth state change');
            }
          }
        } catch (redirectError) {
          console.error('❌ Redirect sign-in error:', redirectError);
          setError(redirectError.message);
          // Clear onboarding and signing in flags on error
          sessionStorage.removeItem('shouldShowOnboarding');
          sessionStorage.removeItem('signingIn');
        }
        
        // Now listen for auth state changes
        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          console.log('🔄 Auth state changed:', currentUser ? `User: ${currentUser.uid}` : 'No user');
          
          // If we just handled redirect and this is the first auth change, skip it
          // (we already set the user from getRedirectResult)
          if (skipFirstAuthChange) {
            console.log('⏭️ Skipping first auth state change (already handled via redirect)');
            skipFirstAuthChange = false;
            return;
          }
          
          // MOBILE FIX: If getRedirectResult returned null but we now have a user,
          // and we don't have an onboarding flag yet, this might be a completed redirect
          // Check if this is a new sign-in by looking at session storage
          const wasSigningIn = sessionStorage.getItem('signingIn');
          
          if (currentUser && !redirectHandled) {
            const hasOnboardingFlag = sessionStorage.getItem('shouldShowOnboarding');
            const redirectAuthComplete = sessionStorage.getItem('redirectAuthComplete');
            
            // If we were signing in and now have a user, this is a successful redirect
            if (wasSigningIn === 'true' && !hasOnboardingFlag) {
              console.log('✅ Mobile redirect sign-in detected, setting onboarding flag');
              sessionStorage.setItem('shouldShowOnboarding', 'true');
              sessionStorage.setItem('redirectAuthComplete', 'true');
              sessionStorage.removeItem('signingIn');
              
              // Clear the visit flag to show "Welcome" instead of "Welcome Back"
              localStorage.removeItem(`hasVisitedDashboard_${currentUser.uid}`);
            }
          } else if (!currentUser && wasSigningIn === 'true') {
            // CRITICAL FIX: If we're waiting for sign-in but got no user yet,
            // keep loading=true and wait for the next auth state change
            console.log('⏳ Waiting for user after redirect (keeping loading state)...');
            
            // Set a timeout to prevent infinite loading (10 seconds)
            if (!redirectTimeout) {
              redirectTimeout = setTimeout(() => {
                console.log('⚠️ Redirect timeout - no user received, clearing flags');
                sessionStorage.removeItem('signingIn');
                sessionStorage.removeItem('shouldShowOnboarding');
                setLoading(false);
                setError('Sign-in timed out. Please try again.');
              }, 10000);
            }
            
            // Don't update user state or set loading to false yet
            return;
          } else if (currentUser && wasSigningIn === 'true') {
            // Clear timeout if we got a user
            if (redirectTimeout) {
              clearTimeout(redirectTimeout);
              redirectTimeout = null;
            }
          }
          
          // Always update user state to stay in sync
          setUser(currentUser);
          setLoading(false);
          
          // If we just handled a redirect and have a user, log it
          if (redirectHandled && currentUser) {
            console.log('✅ Auth state confirmed after redirect');
          }
          
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
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
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
        // Set a flag so we know we're in the middle of a sign-in redirect
        sessionStorage.setItem('signingIn', 'true');
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
      // Clear any auth-related flags
      sessionStorage.removeItem('shouldShowOnboarding');
      sessionStorage.removeItem('redirectAuthComplete');
      sessionStorage.removeItem('signingIn');
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

