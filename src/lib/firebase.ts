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
  console.log('[Firebase Auth DEBUG] Initiating signInWithGoogleAuth...');
  console.log('[Firebase Auth DEBUG] Location at launch:', {
    href: window.location.href,
    origin: window.location.origin,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash
  });

  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log('[Firebase Auth DEBUG] signInWithPopup returned result:', result);
    const user = result.user;
    const idToken = await user.getIdToken();
    console.log('[Firebase Auth DEBUG] Retrieved ID token for popup user:', user.email);
    return {
      email: user.email || '',
      displayName: user.displayName || undefined,
      uid: user.uid,
      idToken
    };
  } catch (error: any) {
    console.warn('[Firebase Auth DEBUG] Popup sign-in error/notice:', error?.code, error?.message);
    
    // If popup is blocked or closed by popup restrictions in iframe sandbox, attempt redirect
    if (
      error.code === 'auth/popup-blocked' || 
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request' ||
      error.code === 'auth/unauthorized-domain'
    ) {
      console.log('[Firebase Auth DEBUG] Fallback to signInWithRedirect triggered due to code:', error.code);
      try {
        await signInWithRedirect(auth, googleProvider);
        console.log('[Firebase Auth DEBUG] signInWithRedirect dispatched. Page will redirect...');
        return new Promise(() => {}); // Wait for redirect page unload
      } catch (redirectErr: any) {
        console.error('[Firebase Auth DEBUG] signInWithRedirect failed:', redirectErr);
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
  console.log('[Firebase Auth DEBUG] Executing checkGoogleRedirectResult...');
  console.log('[Firebase Auth DEBUG] Window Location Inspection:', {
    href: window.location.href,
    origin: window.location.origin,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash
  });

  try {
    const result = await getRedirectResult(auth);
    console.log('[Firebase Auth DEBUG] getRedirectResult raw response:', result);

    if (result && result.user) {
      const user = result.user;
      console.log('[Firebase Auth DEBUG] Found user in redirect result:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        providerId: user.providerId
      });

      const idToken = await user.getIdToken();
      console.log('[Firebase Auth DEBUG] Retrieved ID token of length:', idToken ? idToken.length : 0);

      return {
        email: user.email || '',
        displayName: user.displayName || undefined,
        uid: user.uid,
        idToken
      };
    } else {
      console.log('[Firebase Auth DEBUG] No redirect user result found on this window load.');
    }
  } catch (err: any) {
    console.error('[Firebase Auth DEBUG] Error reading getRedirectResult:', err);
    console.error('[Firebase Auth DEBUG] Error Code:', err?.code, 'Message:', err?.message);
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
