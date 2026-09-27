import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { signInWithGoogleLambda } from '../services/authService';
import { apiConfig } from '../config/api';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';

// ─── Firebase bootstrap ───────────────────────────────────────────────────────
const getFirebaseApp = () => {
  const cfg = {
    apiKey:     process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'nimbleai-firebase.firebaseapp.com',
    projectId:  process.env.REACT_APP_FIREBASE_PROJECT_ID  || 'nimbleai-firebase',
  };
  if (!cfg.apiKey) return null;
  try {
    return getApps().length > 0 ? getApps()[0] : initializeApp(cfg);
  } catch (e) { return getApps()[0] || null; }
};
let firebaseApp = getFirebaseApp();

// ─── Feature bullet ───────────────────────────────────────────────────────────
const Bullet = ({ text }) => (
  <li className="flex items-start gap-3">
    <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#25D366]/15 flex items-center justify-center">
      <svg className="w-3 h-3 text-[#25D366]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    </span>
    <span className="text-sm text-slate-600 leading-relaxed">{text}</span>
  </li>
);

// ─── Main component ───────────────────────────────────────────────────────────
const LoginPage = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [rememberMe,      setRememberMe]      = useState(false);
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error,           setError]           = useState('');
  const [isForgot,        setIsForgot]        = useState(false);
  const [resetSent,       setResetSent]       = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => { if (user) navigate('/dashboard'); }, [user, navigate]);

  // ── Google sign-in ──────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('Timed out')), 8000));
      await Promise.race([signInWithGoogleLambda(), timeout]);
    } catch (e) {
      setError(e.message || 'Google sign-in failed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  // ── Email/password login ────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const app  = firebaseApp || getFirebaseApp();
      if (!app)  throw new Error('Firebase is not configured. Please use Google Sign-In.');
      const auth = getAuth(app);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const tok  = await cred.user.getIdToken();

      const res  = await fetch(`${apiConfig.authConfig.baseURL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: tok }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Login failed (${res.status})`);
      }
      const result = await res.json();
      if (result.token) localStorage.setItem('authToken', result.token);
      if (result.user)  localStorage.setItem('userData', JSON.stringify(result.user));
      if (typeof result.firstTime === 'boolean') {
        localStorage.setItem('nimble_first_time', result.firstTime ? '1' : '0');
        window.dispatchEvent(new CustomEvent('firstTimeSet', { detail: { firstTime: result.firstTime } }));
      }
      window.dispatchEvent(new Event('authStateChanged'));
      setTimeout(() => navigate('/dashboard'), 100);
    } catch (e) {
      const MAP = {
        'auth/user-not-found':    'No account found with this email.',
        'auth/wrong-password':    'Incorrect password.',
        'auth/invalid-email':     'Invalid email address.',
        'auth/user-disabled':     'This account has been disabled.',
        'auth/too-many-requests': 'Too many attempts. Please try later.',
        'auth/invalid-credential':'Invalid email or password.',
      };
      setError(MAP[e.code] || e.message || 'Login failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  // ── Password reset ──────────────────────────────────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const app  = firebaseApp || getFirebaseApp();
      if (!app)  throw new Error('Firebase is not configured.');
      await sendPasswordResetEmail(getAuth(app), email);
      setResetSent(true);
    } catch (e) {
      const MAP = {
        'auth/user-not-found': 'No account with that email.',
        'auth/invalid-email':  'Invalid email address.',
      };
      setError(MAP[e.code] || e.message || 'Failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleForgot = () => {
    setIsForgot(!isForgot);
    setError('');
    setResetSent(false);
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Decorative top bar */}
      <div className="h-1 bg-gradient-to-r from-[#25D366] via-[#1ebe5d] to-[#128C7E]" />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">

          {/* ── Left panel – feature pitch ──────────────────────────────────── */}
          <div className="hidden lg:flex flex-col justify-center gap-8 pt-4">
            {/* Brand */}
            <div>
              <img src={require('../logo.png')} alt="NimbleAI" className="h-10 w-auto mb-6" />
              <h2 className="text-3xl font-bold text-slate-900 leading-snug tracking-tight">
                Everything you need to grow on WhatsApp.
              </h2>
              <p className="mt-3 text-slate-500 text-sm leading-relaxed">
                Sign in to your NimbleAI dashboard and start driving revenue with broadcast campaigns, AI support, and deep Shopify integrations.
              </p>
            </div>

            <ul className="space-y-3">
              <Bullet text="Targeted broadcasts with 98% open rates" />
              <Bullet text="AI chatbot that resolves 80% of queries 24/7" />
              <Bullet text="Recover 25%+ abandoned carts automatically" />
              <Bullet text="Native Shopify &amp; OpenCart integrations" />
              <Bullet text="Shared inbox for your entire support team" />
            </ul>

            <p className="text-xs text-slate-400 font-medium">
              Trusted by 8,000+ businesses across 52 countries.
            </p>
          </div>

          {/* ── Right panel – auth card ──────────────────────────────────────── */}
          <div className="card p-8 animate-scaleIn">

            {/* Mobile logo */}
            <div className="flex justify-center mb-6 lg:hidden">
              <img src={require('../logo.png')} alt="NimbleAI" className="h-10 w-auto" />
            </div>

            <h1 className="text-xl font-bold text-slate-900 mb-1">
              {isForgot ? 'Reset your password' : 'Welcome back'}
            </h1>
            <p className="text-sm text-slate-400 mb-6">
              {isForgot
                ? "We'll send a reset link to your email."
                : 'Sign in to your NimbleAI account.'}
            </p>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-700">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            {/* Reset success */}
            {resetSent && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5 text-sm text-emerald-700">
                ✅ Reset link sent! Check your inbox.
              </div>
            )}

            {/* Google sign-in */}
            {!isForgot && (
              <>
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={isGoogleLoading}
                  className="w-full flex items-center justify-center gap-3 border border-slate-200 bg-white hover:bg-slate-50
                             text-slate-700 font-medium text-sm rounded-xl py-2.5 transition-all duration-150
                             disabled:opacity-60 disabled:cursor-not-allowed mb-4"
                >
                  {isGoogleLoading ? (
                    <svg className="w-4 h-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Continue with Google
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-xs text-slate-400 font-medium">or</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>
              </>
            )}

            {/* Login / Forgot form */}
            <form onSubmit={isForgot ? handleReset : handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5" htmlFor="loginEmail">
                  Business email
                </label>
                <input
                  id="loginEmail"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@company.com"
                />
              </div>

              {!isForgot && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5" htmlFor="loginPassword">
                    Password
                  </label>
                  <input
                    id="loginPassword"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder="Your password"
                  />
                </div>
              )}

              {!isForgot && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#25D366] focus:ring-[#25D366]"
                    />
                    <span className="text-xs text-slate-500">Remember me</span>
                  </label>
                  <button type="button" onClick={toggleForgot}
                          className="text-xs text-[#25D366] hover:underline font-medium">
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || resetSent}
                className="w-full btn-primary justify-center py-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : isForgot ? 'Send reset link' : 'Sign in'}
              </button>

              {isForgot && (
                <button type="button" onClick={toggleForgot}
                        className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors mt-1">
                  ← Back to sign in
                </button>
              )}
            </form>

            {!isForgot && (
              <p className="text-center text-xs text-slate-400 mt-6">
                Don't have an account?{' '}
                <Link to="/start-now" className="text-[#25D366] font-semibold hover:underline">
                  Sign up
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 border-t border-slate-100 text-center">
        <p className="text-[11px] text-slate-400">
          © {new Date().getFullYear()} NimbleAI. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
