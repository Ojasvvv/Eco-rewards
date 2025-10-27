import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

/**
 * Initialize Firebase Admin SDK (shared across all endpoints)
 * This ensures Firebase is initialized only once
 */
let initializationError = null;
let adminDb = null;
let adminAuth = null;

if (!getApps().length) {
  // Validate required environment variables
  const requiredEnvVars = {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY
  };
  
  const missing = Object.keys(requiredEnvVars).filter(key => !requiredEnvVars[key]);
  if (missing.length > 0) {
    const errorMsg = `Missing Firebase Admin environment variables: ${missing.join(', ')}`;
    console.error('❌', errorMsg);
    console.error('Please set these in Vercel Dashboard → Settings → Environment Variables');
    initializationError = new Error(errorMsg);
  } else {
    try {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      
      console.log('✅ Firebase Admin initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin:', error);
      initializationError = error;
    }
  }
}

// Only get Firestore and Auth instances if initialization succeeded
try {
  if (!initializationError && getApps().length > 0) {
    adminDb = getFirestore();
    adminAuth = getAuth();
  }
} catch (error) {
  console.error('❌ Failed to get Firebase Admin instances:', error);
  initializationError = error;
}

// Export singleton instances
export { adminDb, adminAuth };

/**
 * Check if Firebase Admin is properly initialized
 * @throws {Error} If initialization failed
 */
export function ensureInitialized() {
  if (initializationError) {
    throw initializationError;
  }
}

/**
 * Verify Firebase ID token
 * @param {string} token - Firebase ID token
 * @returns {Promise<object>} Decoded token
 */
export async function verifyFirebaseToken(token) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
}

