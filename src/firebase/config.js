import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ============ ENVIRONMENT VARIABLE VALIDATION ============
// Validate required Firebase configuration at startup
const requiredEnvVars = {
  'VITE_FIREBASE_API_KEY': import.meta.env.VITE_FIREBASE_API_KEY,
  'VITE_FIREBASE_AUTH_DOMAIN': import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  'VITE_FIREBASE_PROJECT_ID': import.meta.env.VITE_FIREBASE_PROJECT_ID,
  'VITE_FIREBASE_STORAGE_BUCKET': import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  'VITE_FIREBASE_MESSAGING_SENDER_ID': import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  'VITE_FIREBASE_APP_ID': import.meta.env.VITE_FIREBASE_APP_ID
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  const errorMsg = `
╔═══════════════════════════════════════════════════════════╗
║  ❌ FIREBASE CONFIGURATION ERROR                          ║
╚═══════════════════════════════════════════════════════════╝

Missing required environment variables:
${missingVars.map(v => `  • ${v}`).join('\n')}

Please configure these in:
  • Vercel Dashboard → Settings → Environment Variables
  • Or create a .env file locally (see ENV_SETUP.md)

The application cannot start without Firebase configuration.
  `;
  
  console.error(errorMsg);
  
  // Show user-friendly error
  if (typeof window !== 'undefined') {
    alert('⚠️ Application Configuration Error\n\nThe app is not properly configured. Please contact support or check the browser console for details.');
  }
  
  throw new Error('Missing Firebase configuration. See console for details.');
}

console.log('✅ Firebase configuration validated successfully');
// =========================================================

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;

