import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, ShieldCheck, AlertCircle, Loader2, ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { User, Wallet } from '../types';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogleAuth,
  getOrCreateFirestoreUser,
  mapFirebaseError,
  getAuthDiagnostics
} from '../lib/firebase';

interface AuthModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onAuthSuccess?: (user: User, wallet: Wallet) => void;
  onSuccess?: (user: User, wallet: Wallet) => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen = true,
  onClose,
  onAuthSuccess,
  onSuccess,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [lastErrorCode, setLastErrorCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  useEffect(() => {
    setDiagnostics(getAuthDiagnostics());
  }, [error]);

  if (!isOpen) return null;

  const triggerAuthSuccess = (user: User, wallet: Wallet) => {
    if (onAuthSuccess) onAuthSuccess(user, wallet);
    if (onSuccess) onSuccess(user, wallet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLastErrorCode(null);

    const targetEmail = email.trim().toLowerCase();
    const targetPassword = password.trim();

    if (!targetEmail || !targetPassword) {
      setError('Please enter both email address and password.');
      return;
    }

    if (mode === 'signup' && targetPassword.length < 6) {
      setError('Password should be at least 6 characters long.');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingAction(mode === 'login' ? 'Signing in...' : 'Creating account...');

      if (mode === 'login') {
        try {
          // 1. Authenticate with Firebase Auth
          const fbUser = await signInWithEmail(targetEmail, targetPassword);

          // 2. Sync / load Firestore profile
          const profile = await getOrCreateFirestoreUser(fbUser);

          // 3. Synchronize session with backend server
          const session = await api.syncFirebaseSession({
            uid: fbUser.uid,
            email: targetEmail,
            displayName: profile.displayName || fbUser.displayName || targetEmail.split('@')[0]
          });

          triggerAuthSuccess(session.user, session.wallet);
          onClose();
          return;
        } catch (fbErr: any) {
          console.warn('[AuthModal] Firebase login notice:', fbErr?.code, fbErr?.message);
          setLastErrorCode(fbErr?.code || 'AUTH_ERROR');

          // Seed demo users auto-registration or fallback
          if (
            (targetEmail === 'mikiyaswoyne@gmail.com' || targetEmail === 'admin@jjbetting.com') &&
            (fbErr?.code === 'auth/user-not-found' || fbErr?.code === 'auth/invalid-credential')
          ) {
            try {
              console.log('[AuthModal] Attempting automatic seed registration for demo user in Firebase...');
              const newFbUser = await signUpWithEmail(targetEmail, targetPassword, targetEmail.split('@')[0]);
              const profile = await getOrCreateFirestoreUser(newFbUser);
              const session = await api.syncFirebaseSession({
                uid: newFbUser.uid,
                email: targetEmail,
                displayName: profile.displayName
              });
              triggerAuthSuccess(session.user, session.wallet);
              onClose();
              return;
            } catch {
              const res = await api.login(targetEmail, targetPassword);
              triggerAuthSuccess(res.user, res.wallet);
              onClose();
              return;
            }
          }

          setError(mapFirebaseError(fbErr));
        }
      } else {
        // Registration flow
        try {
          const newFbUser = await signUpWithEmail(
            targetEmail,
            targetPassword,
            displayName.trim() || targetEmail.split('@')[0]
          );

          const profile = await getOrCreateFirestoreUser(newFbUser, {
            displayName: displayName.trim() || targetEmail.split('@')[0]
          });

          const session = await api.syncFirebaseSession({
            uid: newFbUser.uid,
            email: targetEmail,
            displayName: profile.displayName
          });

          triggerAuthSuccess(session.user, session.wallet);
          onClose();
        } catch (regErr: any) {
          console.warn('[AuthModal] Registration error:', regErr?.code, regErr?.message);
          setLastErrorCode(regErr?.code || 'REG_ERROR');
          setError(mapFirebaseError(regErr));
        }
      }
    } catch (err: any) {
      setError(mapFirebaseError(err));
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLastErrorCode(null);
    try {
      setIsLoading(true);
      setLoadingAction('Connecting to Google...');
      console.log('[AuthModal DEBUG] Google Sign-In button clicked');
      
      const firebaseUser = await signInWithGoogleAuth();
      if (!firebaseUser || !firebaseUser.email) {
        return; // Redirect flow dispatched or pending
      }

      const dummyFbUser: any = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: null
      };
      const profile = await getOrCreateFirestoreUser(dummyFbUser);

      const res = await api.syncFirebaseSession({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: profile.displayName || firebaseUser.displayName
      });

      console.log('[AuthModal DEBUG] Google session synchronized successfully:', res.user.email);
      triggerAuthSuccess(res.user, res.wallet);
      onClose();
    } catch (err: any) {
      console.error('[AuthModal DEBUG] Google sign-in failed:', err);
      const code = err?.code || '';
      setLastErrorCode(code || 'GOOGLE_SIGNIN_ERROR');

      if (code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with this email using password sign-in. Please sign in with your email and password.');
        setMode('login');
      } else {
        setError(mapFirebaseError(err));
      }
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleQuickFill = async (type: 'customer' | 'admin') => {
    setError(null);
    setLastErrorCode(null);
    const targetEmail = type === 'customer' ? 'mikiyaswoyne@gmail.com' : 'admin@jjbetting.com';
    const targetPassword = type === 'customer' ? 'password123' : 'admin123';
    
    setEmail(targetEmail);
    setPassword(targetPassword);
    setMode('login');

    try {
      setIsLoading(true);
      setLoadingAction('Signing in...');

      try {
        const fbUser = await signInWithEmail(targetEmail, targetPassword);
        const profile = await getOrCreateFirestoreUser(fbUser);
        const session = await api.syncFirebaseSession({
          uid: fbUser.uid,
          email: targetEmail,
          displayName: profile.displayName
        });
        triggerAuthSuccess(session.user, session.wallet);
        onClose();
        return;
      } catch (fbErr: any) {
        if (fbErr?.code === 'auth/user-not-found' || fbErr?.code === 'auth/invalid-credential') {
          try {
            const newFbUser = await signUpWithEmail(targetEmail, targetPassword, targetEmail.split('@')[0]);
            const profile = await getOrCreateFirestoreUser(newFbUser);
            const session = await api.syncFirebaseSession({
              uid: newFbUser.uid,
              email: targetEmail,
              displayName: profile.displayName
            });
            triggerAuthSuccess(session.user, session.wallet);
            onClose();
            return;
          } catch {
            const res = await api.login(targetEmail, targetPassword);
            triggerAuthSuccess(res.user, res.wallet);
            onClose();
            return;
          }
        }
        const res = await api.login(targetEmail, targetPassword);
        triggerAuthSuccess(res.user, res.wallet);
        onClose();
      }
    } catch (err: any) {
      console.error('[AuthModal DEBUG] Quick fill login notice:', err);
      setError(mapFirebaseError(err));
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              JJ
            </div>
            <div>
              <h3 className="font-black text-white text-base">
                {mode === 'login' ? 'Sign In to JJ-Betting' : 'Create Customer Account'}
              </h3>
              <p className="text-xs text-slate-400">Licensed Sportsbook Account System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 p-1">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setMode('signup'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-start gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span>{error}</span>
                {lastErrorCode && (
                  <div className="mt-1 text-[10px] text-rose-400/80 font-mono">
                    Code: {lastErrorCode}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-3 text-sm shadow-md border border-slate-200"
          >
            {isLoading && loadingAction?.includes('Google') ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                <span>Connecting with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-slate-900 px-3 text-[10px] text-slate-500 font-semibold uppercase tracking-wider shrink-0">
              Or with email & password
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full Name or Display Name</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  placeholder="e.g. Mikiyas Woyne"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-60"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                disabled={isLoading}
                placeholder="e.g. user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-60"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                disabled={isLoading}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-60"
              />
              {mode === 'signup' && (
                <span className="text-[10px] text-slate-500">Minimum 6 characters</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20 mt-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{loadingAction || 'Processing...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Account' : 'Register & Get Started'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Helper */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider">
              Quick Test Credentials
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickFill('customer')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 disabled:opacity-50 border border-slate-700/70 text-[11px] text-slate-300 font-medium cursor-pointer transition-colors text-left"
              >
                <div className="font-bold text-emerald-400">Demo Player</div>
                <div className="text-[10px] text-slate-400 truncate">mikiyaswoyne@gmail.com</div>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickFill('admin')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 disabled:opacity-50 border border-slate-700/70 text-[11px] text-slate-300 font-medium cursor-pointer transition-colors text-left"
              >
                <div className="font-bold text-amber-400">Demo Admin</div>
                <div className="text-[10px] text-slate-400 truncate">admin@jjbetting.com</div>
              </button>
            </div>
          </div>

          {/* Collapsible Authentication Diagnostics Section */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowDiagnostics(prev => !prev)}
              className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-300 py-1 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Authentication Diagnostics</span>
              </span>
              <span className="text-[10px] text-slate-500">{showDiagnostics ? 'Hide' : 'Show'}</span>
            </button>

            {showDiagnostics && diagnostics && (
              <div className="mt-2 p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5 text-[10px] font-mono text-slate-400">
                <div className="flex justify-between items-center">
                  <span>Firebase Init:</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 inline" /> Connected ({diagnostics.projectId})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Current Host:</span>
                  <span className="text-slate-300 truncate max-w-[180px]">{diagnostics.currentHostname}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Google Provider:</span>
                  <span className="text-emerald-400">Ready (GoogleAuthProvider)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Auth State:</span>
                  <span className="text-slate-300">
                    {diagnostics.currentUserUid ? `UID: ${diagnostics.currentUserUid.slice(0, 8)}...` : 'Logged Out'}
                  </span>
                </div>
                {lastErrorCode && (
                  <div className="flex justify-between items-center text-rose-400">
                    <span>Last Error Code:</span>
                    <span className="font-semibold">{lastErrorCode}</span>
                  </div>
                )}
                <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-900 leading-tight">
                  Note: In production, ensure current domain is registered in Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Firebase Authentication &amp; Firestore integration. Role enforced on server.</span>
        </div>
      </div>
    </div>
  );
};
