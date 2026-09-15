import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  increment,
  runTransaction
} from 'firebase/firestore';
import firebaseConfigFile from '../../firebase-applet-config.json';
import { User, UserRole, DepositRecord, Wallet, WalletTransaction } from '../types';

// Support VITE_FIREBASE_* environment variables (common in Vercel / production deployments)
// with seamless fallback to firebase-applet-config.json
const env = typeof import.meta !== 'undefined' ? (import.meta as any).env || {} : {};

export const resolvedFirebaseConfig = {
  apiKey: (env.VITE_FIREBASE_API_KEY as string | undefined)?.trim() || firebaseConfigFile.apiKey,
  authDomain: (env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined)?.trim() || firebaseConfigFile.authDomain,
  projectId: (env.VITE_FIREBASE_PROJECT_ID as string | undefined)?.trim() || firebaseConfigFile.projectId,
  storageBucket: (env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined)?.trim() || firebaseConfigFile.storageBucket,
  messagingSenderId: (env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined)?.trim() || firebaseConfigFile.messagingSenderId,
  appId: (env.VITE_FIREBASE_APP_ID as string | undefined)?.trim() || firebaseConfigFile.appId,
  measurementId: (env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined)?.trim() || firebaseConfigFile.measurementId,
  firestoreDatabaseId: (env.VITE_FIREBASE_DATABASE_ID as string | undefined)?.trim() || firebaseConfigFile.firestoreDatabaseId
};

// Initialize Firebase App exactly once
const app = getApps().length === 0 ? initializeApp(resolvedFirebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId || undefined);

// Ensure local persistence so sessions survive page refresh and browser navigation
try {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('[Firebase Auth] Persistence configuration notice:', err?.message || err);
  });
} catch (e) {
  console.warn('[Firebase Auth] Persistence initialization notice:', e);
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Friendly error mapper for Firebase Auth errors.
 * Replaces technical codes with polished, user-friendly copy.
 */
export function mapFirebaseError(err: any): string {
  if (!err) return 'Authentication failed. Please try again.';
  const code = err.code || '';
  const message = err.message || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect email or password.';
    case 'auth/user-not-found':
      return 'Account does not exist with this email address. Please register first.';
    case 'auth/invalid-email':
      return 'Email address is not valid.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please log in.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact customer support.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Sign-in pop-up was blocked by your browser. Please enable pop-ups for this site.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in request was cancelled. Please try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method. Please sign in with your email and password first.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection and try again.';
    case 'auth/unauthorized-domain':
      return `Domain (${typeof window !== 'undefined' ? window.location.hostname : 'current'}) is not authorized in Firebase Console. Add this domain to Firebase Console > Authentication > Settings > Authorized domains.`;
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in Firebase Console. Please check Authentication > Sign-in method.';
    default:
      if (message.includes('network') || message.includes('offline')) {
        return 'Network error. Please check your internet connection.';
      }
      return message || 'Authentication failed. Please try again.';
  }
}

/**
 * Sign in with Email and Password using Firebase Auth
 */
export async function signInWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
  return cred.user;
}

/**
 * Register new user with Email and Password using Firebase Auth
 */
export async function signUpWithEmail(
  email: string,
  pass: string,
  displayName?: string
): Promise<FirebaseUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  
  if (displayName?.trim()) {
    try {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    } catch (profileErr) {
      console.warn('[Firebase Auth] updateProfile notice:', profileErr);
    }
  }

  return cred.user;
}

/**
 * Handle Google Sign-In with popup, graceful fallback, and friendly errors
 */
export async function signInWithGoogleAuth(): Promise<{ email: string; displayName?: string; uid: string; idToken?: string }> {
  console.log('[Firebase Auth DEBUG] Initiating signInWithGoogleAuth...');
  console.log('[Firebase Auth DEBUG] Hostname:', window.location.hostname);

  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log('[Firebase Auth DEBUG] signInWithPopup returned result for:', result.user.email);
    const user = result.user;
    const idToken = await user.getIdToken();
    return {
      email: user.email || '',
      displayName: user.displayName || undefined,
      uid: user.uid,
      idToken
    };
  } catch (error: any) {
    console.warn('[Firebase Auth DEBUG] Popup sign-in notice:', error?.code, error?.message);

    // If popup was explicitly blocked by browser, attempt redirect fallback
    if (error?.code === 'auth/popup-blocked') {
      console.log('[Firebase Auth DEBUG] Popup blocked: Attempting redirect fallback...');
      try {
        await signInWithRedirect(auth, googleProvider);
        return new Promise(() => {}); // Wait for redirect unload
      } catch (redirectErr: any) {
        const mappedRedirectMsg = mapFirebaseError(redirectErr);
        const errObj = new Error(mappedRedirectMsg);
        (errObj as any).code = redirectErr?.code || 'auth/redirect-error';
        (errObj as any).originalError = redirectErr;
        throw errObj;
      }
    }

    // Map other errors (e.g. cancelled by user, unauthorized domain) cleanly while preserving code
    const mappedMsg = mapFirebaseError(error);
    const errObj = new Error(mappedMsg);
    (errObj as any).code = error?.code || 'auth/google-sign-in-failed';
    (errObj as any).originalError = error;
    throw errObj;
  }
}

/**
 * Check for pending Google OAuth redirect results (called on initial app load)
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
  } catch (err: any) {
    console.warn('[Firebase Auth DEBUG] Notice in checkGoogleRedirectResult:', err?.code, err?.message);
  }
  return null;
}

/**
 * Create or sync Firestore user profile at users/{uid}.
 * Never overwrites administrative role or existing balances from client input.
 */
export async function getOrCreateFirestoreUser(
  firebaseUser: FirebaseUser | { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null },
  extra?: { displayName?: string }
): Promise<User> {
  const uid = firebaseUser.uid;
  const userDocRef = doc(db, 'users', uid);
  const now = new Date().toISOString();
  const normalizedEmail = (firebaseUser.email || '').toLowerCase().trim();

  // Determine server-authorized role: only strictly configured admin emails receive admin
  const isDesignatedAdmin = normalizedEmail === 'admin@jjbetting.com' || normalizedEmail === 'mikiyaswoyne@gmail.com';
  const defaultRole: UserRole = isDesignatedAdmin ? 'admin' : 'customer';

  // If designated admin, ensure admin document exists in /admins/{uid}
  if (isDesignatedAdmin) {
    setDoc(doc(db, 'admins', uid), {
      uid,
      email: normalizedEmail,
      role: 'admin',
      verifiedAt: now
    }, { merge: true }).catch(() => {});
  }

  try {
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const existingData = docSnap.data();
      const resolvedRole: UserRole = isDesignatedAdmin ? 'admin' : ((existingData.role as UserRole) || defaultRole);

      // Update only harmless client-side profile fields, preserving role and permissions
      const updatedFields: Record<string, any> = {
        updatedAt: now
      };
      if (isDesignatedAdmin && existingData.role !== 'admin') {
        updatedFields.role = 'admin';
        updatedFields.kycStatus = 'fully_verified';
      }
      if (firebaseUser.displayName && firebaseUser.displayName !== existingData.displayName) {
        updatedFields.displayName = firebaseUser.displayName;
      }
      if (firebaseUser.photoURL && firebaseUser.photoURL !== existingData.photoURL) {
        updatedFields.photoURL = firebaseUser.photoURL;
      }

      await updateDoc(userDocRef, updatedFields).catch((uErr) => {
        console.warn('[Firestore] Update user doc notice (continuing):', uErr);
      });

      return {
        id: uid,
        email: normalizedEmail,
        displayName: existingData.displayName || firebaseUser.displayName || normalizedEmail.split('@')[0],
        role: resolvedRole,
        kycStatus: existingData.kycStatus || (resolvedRole === 'admin' ? 'fully_verified' : 'tier1_verified'),
        dailyDepositLimit: existingData.dailyDepositLimit || 50000,
        singleBetLimit: existingData.singleBetLimit || 10000,
        selfExclusionUntil: existingData.selfExclusionUntil || null,
        createdAt: existingData.createdAt || now
      };
    } else {
      // Create new profile document in Firestore
      const newProfile = {
        uid,
        id: uid,
        email: normalizedEmail,
        displayName: extra?.displayName || firebaseUser.displayName || (normalizedEmail ? normalizedEmail.split('@')[0] : 'Player'),
        photoURL: firebaseUser.photoURL || null,
        role: defaultRole,
        kycStatus: defaultRole === 'admin' ? 'fully_verified' : 'tier1_verified',
        dailyDepositLimit: 50000,
        singleBetLimit: 10000,
        selfExclusionUntil: null,
        createdAt: now,
        updatedAt: now
      };

      await setDoc(userDocRef, newProfile).catch((cErr) => {
        console.warn('[Firestore] Create user doc notice (continuing):', cErr);
      });

      return {
        id: uid,
        email: normalizedEmail,
        displayName: newProfile.displayName,
        role: defaultRole,
        kycStatus: newProfile.kycStatus as any,
        dailyDepositLimit: 50000,
        singleBetLimit: 10000,
        selfExclusionUntil: null,
        createdAt: now
      };
    }
  } catch (err) {
    console.warn('[Firestore] getOrCreateFirestoreUser fallback triggered:', err);
    // Return standard sanitized user object if firestore write has strict rule constraints
    return {
      id: uid,
      email: normalizedEmail,
      displayName: extra?.displayName || firebaseUser.displayName || normalizedEmail.split('@')[0] || 'Player',
      role: defaultRole,
      kycStatus: defaultRole === 'admin' ? 'fully_verified' : 'tier1_verified',
      dailyDepositLimit: 50000,
      singleBetLimit: 10000,
      selfExclusionUntil: null,
      createdAt: now
    };
  }
}

/**
 * Retrieve current authentication diagnostics for developer inspection
 */
export function getAuthDiagnostics() {
  const currentFbUser = auth.currentUser;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown';

  return {
    isInitialized: !!app,
    projectId: resolvedFirebaseConfig.projectId || 'jj-book-store',
    authDomain: resolvedFirebaseConfig.authDomain || 'jj-book-store.firebaseapp.com',
    currentHostname: hostname,
    currentOrigin: origin,
    currentUserUid: currentFbUser ? currentFbUser.uid : null,
    currentUserEmail: currentFbUser ? currentFbUser.email : null,
    providerId: currentFbUser?.providerData?.[0]?.providerId || (currentFbUser ? 'firebase' : null),
    isGoogleConfigured: !!googleProvider
  };
}

export async function logoutFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.warn('[Firebase Auth] Logout notice:', err);
  }
}

export function subscribeToAuthChanges(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Save a deposit record to Firestore deposits collection
 */
export async function saveFirestoreDeposit(deposit: DepositRecord): Promise<void> {
  try {
    const depositRef = doc(db, 'deposits', deposit.depositId);
    await setDoc(depositRef, deposit);
    console.log('[Firestore] Deposit request saved successfully:', deposit.depositId);
  } catch (err) {
    console.warn('[Firestore] Failed to save deposit to Firestore (continuing with local/server fallback):', err);
  }
}

/**
 * Fetch deposits from Firestore deposits collection
 */
export async function fetchFirestoreDeposits(isAdmin: boolean, userUid?: string): Promise<DepositRecord[]> {
  try {
    const depositsRef = collection(db, 'deposits');
    let q;
    if (isAdmin) {
      q = query(depositsRef);
    } else if (userUid) {
      q = query(depositsRef, where('userId', '==', userUid));
    } else {
      return [];
    }

    const snapshot = await getDocs(q);
    const results: DepositRecord[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as DepositRecord;
      if (data && data.depositId) {
        results.push(data);
      }
    });
    return results;
  } catch (err) {
    console.warn('[Firestore] Failed to fetch deposits from Firestore:', err);
    return [];
  }
}

/**
 * Update deposit status (APPROVED / REJECTED) in Firestore
 */
export async function updateFirestoreDepositStatus(
  depositId: string,
  status: 'APPROVED' | 'REJECTED',
  reviewedBy: string,
  adminNote?: string
): Promise<void> {
  try {
    const depositRef = doc(db, 'deposits', depositId);
    await updateDoc(depositRef, {
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy,
      adminNote: adminNote || null
    });
  } catch (err) {
    console.warn('[Firestore] Notice updating deposit status in Firestore:', err);
  }
}

/**
 * Atomically approve deposit in Firestore using runTransaction:
 * - Checks status is PENDING
 * - Fails if not PENDING (prevents duplicate approval)
 * - Sets status to APPROVED
 * - Credits customer's wallet atomically
 * - Creates immutable wallet transaction
 * - Creates immutable audit log
 */
export async function approveFirestoreDepositTransaction(
  depositId: string,
  adminUser: { id: string; email: string },
  adminNote?: string
): Promise<{ deposit: DepositRecord; wallet: Wallet; transaction: WalletTransaction }> {
  return await runTransaction(db, async (txn) => {
    const depositRef = doc(db, 'deposits', depositId);
    const depositSnap = await txn.get(depositRef);

    if (!depositSnap.exists()) {
      throw new Error(`Deposit ${depositId} not found in Firestore.`);
    }

    const depData = depositSnap.data() as DepositRecord;
    if (depData.status !== 'PENDING') {
      throw new Error(`Deposit is already ${depData.status} and cannot be approved again.`);
    }

    const customerId = depData.userId;
    const amount = Number(depData.amount) || 0;
    const now = new Date().toISOString();
    const adminId = adminUser.id || 'usr_admin_01';
    const adminEmail = adminUser.email || 'admin@jjbetting.com';

    // 1. Read Customer's Wallet
    const walletRef = doc(db, 'wallets', customerId);
    const walletSnap = await txn.get(walletRef);

    let currentBalance = 0;
    let currentTotalDeposited = 0;
    let currentLocked = 0;
    let currentTotalWithdrawn = 0;

    if (walletSnap.exists()) {
      const wData = walletSnap.data();
      currentBalance = Number(wData.availableBalance) || 0;
      currentTotalDeposited = Number(wData.totalDeposited) || 0;
      currentLocked = Number(wData.lockedBalance) || 0;
      currentTotalWithdrawn = Number(wData.totalWithdrawn) || 0;
    }

    const newBalance = Math.round((currentBalance + amount) * 100) / 100;
    const newTotalDeposited = Math.round((currentTotalDeposited + amount) * 100) / 100;

    // 2. Update Deposit Document
    const updatedDeposit: DepositRecord = {
      ...depData,
      status: 'APPROVED',
      reviewedAt: now,
      reviewedBy: adminEmail,
      adminNote: adminNote || 'Approved by administrator after verification'
    };
    txn.update(depositRef, {
      status: 'APPROVED',
      reviewedAt: now,
      reviewedBy: adminEmail,
      adminNote: adminNote || 'Approved by administrator after verification'
    });

    // 3. Update Wallet Document
    const updatedWallet: Wallet = {
      userId: customerId,
      availableBalance: newBalance,
      lockedBalance: currentLocked,
      totalDeposited: newTotalDeposited,
      totalWithdrawn: currentTotalWithdrawn,
      currency: 'ETB',
      updatedAt: now
    };
    txn.set(walletRef, updatedWallet, { merge: true });

    // 4. Create Immutable Wallet Transaction
    const txnId = `txn_dep_${Date.now()}_${depositId}`;
    const txnRef = doc(db, 'transactions', txnId);
    const ledgerTxn: WalletTransaction = {
      id: txnId,
      walletId: `wlt_${customerId}`,
      userId: customerId,
      customerId,
      type: 'deposit',
      amount: amount,
      currency: 'ETB',
      fee: 0,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      status: 'completed',
      depositId: depositId,
      referenceId: depositId,
      description: `Manual Deposit Approved (${depData.paymentMethodName || depData.paymentMethod})`,
      paymentMethod: depData.paymentMethod,
      approvedBy: adminEmail,
      adminId,
      createdAt: now
    };
    txn.set(txnRef, ledgerTxn);

    // 5. Create Immutable Audit Log
    const auditId = `audit_${Date.now()}_${depositId}`;
    const auditRef = doc(db, 'audit_logs', auditId);
    txn.set(auditRef, {
      id: auditId,
      actorId: adminId,
      actorEmail: adminEmail,
      adminId,
      action: 'DEPOSIT_APPROVED',
      entityType: 'deposit',
      entityId: depositId,
      depositId,
      customerId,
      amount,
      previousStatus: 'PENDING',
      newStatus: 'APPROVED',
      details: `Admin ${adminEmail} approved deposit ${depositId} (+${amount} ETB) for player ${depData.username} (${customerId}). Balance: ${currentBalance} -> ${newBalance} ETB.`,
      timestamp: now,
      createdAt: now
    });

    return {
      deposit: updatedDeposit,
      wallet: updatedWallet,
      transaction: ledgerTxn
    };
  });
}

/**
 * Atomically reject deposit in Firestore:
 * - Checks status is PENDING
 * - Sets status to REJECTED
 * - Does NOT credit wallet
 * - Creates immutable audit log
 */
export async function rejectFirestoreDepositTransaction(
  depositId: string,
  adminUser: { id: string; email: string },
  reason: string
): Promise<DepositRecord> {
  return await runTransaction(db, async (txn) => {
    const depositRef = doc(db, 'deposits', depositId);
    const depositSnap = await txn.get(depositRef);

    if (!depositSnap.exists()) {
      throw new Error(`Deposit ${depositId} not found in Firestore.`);
    }

    const depData = depositSnap.data() as DepositRecord;
    if (depData.status !== 'PENDING') {
      throw new Error(`Deposit is already ${depData.status} and cannot be modified.`);
    }

    const now = new Date().toISOString();
    const adminId = adminUser.id || 'usr_admin_01';
    const adminEmail = adminUser.email || 'admin@jjbetting.com';

    const updatedDeposit: DepositRecord = {
      ...depData,
      status: 'REJECTED',
      reviewedAt: now,
      reviewedBy: adminEmail,
      rejectionReason: reason,
      adminNote: reason
    };

    txn.update(depositRef, {
      status: 'REJECTED',
      reviewedAt: now,
      reviewedBy: adminEmail,
      rejectionReason: reason,
      adminNote: reason
    });

    const auditId = `audit_${Date.now()}_${depositId}`;
    const auditRef = doc(db, 'audit_logs', auditId);
    txn.set(auditRef, {
      id: auditId,
      actorId: adminId,
      actorEmail: adminEmail,
      adminId,
      action: 'DEPOSIT_REJECTED',
      entityType: 'deposit',
      entityId: depositId,
      depositId,
      customerId: depData.userId,
      amount: depData.amount,
      previousStatus: 'PENDING',
      newStatus: 'REJECTED',
      rejectionReason: reason,
      details: `Admin ${adminEmail} rejected deposit ${depositId} (${depData.amount} ETB). Reason: ${reason}`,
      timestamp: now,
      createdAt: now
    });

    return updatedDeposit;
  });
}

/**
 * Fetch wallet directly from Firestore
 */
export async function fetchFirestoreWallet(userId: string): Promise<Wallet | null> {
  try {
    const walletRef = doc(db, 'wallets', userId);
    const snap = await getDoc(walletRef);
    if (snap.exists()) {
      return snap.data() as Wallet;
    }
  } catch (err) {
    console.warn('[Firestore] Failed to fetch wallet from Firestore:', err);
  }
  return null;
}

/**
 * Fetch transactions directly from Firestore
 */
export async function fetchFirestoreTransactions(userId: string): Promise<WalletTransaction[]> {
  try {
    const txnRef = collection(db, 'transactions');
    const q = query(txnRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    const txns: WalletTransaction[] = [];
    snap.forEach((d) => {
      txns.push(d.data() as WalletTransaction);
    });
    return txns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.warn('[Firestore] Failed to fetch transactions from Firestore:', err);
    return [];
  }
}

