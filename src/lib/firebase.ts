import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Handle Google Sign-In with fallback for popup blocking or iframe sandbox constraints
 */
export async function signInWithGoogleAuth(): Promise<{ email: string; displayName?: string; uid: string; idToken?: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const idToken = await user.getIdToken();
    return {
      email: user.email || '',
      displayName: user.displayName || undefined,
      uid: user.uid,
      idToken
    };
  } catch (error: any) {
    console.warn('[Firebase Auth] Popup sign-in notice/fallback:', error.code, error.message);
    
    // If popup is blocked or closed by popup restrictions in iframe sandbox, attempt redirect
    if (
      error.code === 'auth/popup-blocked' || 
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request' ||
      error.code === 'auth/unauthorized-domain'
    ) {
      try {
        await signInWithRedirect(auth, googleProvider);
        // Will trigger page redirect to Google OAuth
        return new Promise(() => {}); // Wait for redirect page unload
      } catch (redirectErr: any) {
        console.warn('[Firebase Auth] Redirect failed:', redirectErr);
        throw new Error(redirectErr.message || 'Google Auth is unavailable in this preview container environment.');
      }
    }
    
    throw error;
  }
}

/**
 * Check for pending Google OAuth redirect results (call on initial app boot)
 */
export async function checkGoogleRedirectResult(): Promise<{ email: string; displayName?: string; uid: string; idToken?: string } | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      const user = result.user;
      const idToken = await user.getIdToken();
      return {
        email: user.email || '',
        displayName: user.displayName || undefined,
        uid: user.uid,
        idToken
      };
    }
  } catch (err) {
    console.error('[Firebase Auth] Error reading redirect result:', err);
  }
  return null;
}

export async function logoutFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.warn('[Firebase Auth] Logout notice:', err);
  }
}
