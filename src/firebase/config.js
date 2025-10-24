import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// TODO: Replace with your Firebase config
// Get this from Firebase Console -> Project Settings -> General -> Your apps -> SDK setup and configuration
const firebaseConfig = {
  apiKey: "AIzaSyATxxJDPufZV5lD2nw8xyhSIuSWq0w5uzU",
  authDomain: "hackathon-f19c9.firebaseapp.com",
  projectId: "hackathon-f19c9",
  storageBucket: "hackathon-f19c9.firebasestorage.app",
  messagingSenderId: "999485546225",
  appId: "1:999485546225:web:e65c34dd9eed0b4b6ad350"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;

