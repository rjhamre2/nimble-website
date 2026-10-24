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
    <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-trust-100 border border-trust-300 flex items-center justify-center">
      <svg className="w-3 h-3 text-trust-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    <div className="min-h-screen bg-gray-50 text-slate-900 flex flex-col">

      {/* Decorative top bar */}
      <div className="h-1 bg-gradient-to-r from-trust-600 via-trust-500 to-conversion-500" />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">

          {/* ── Left panel – feature pitch ──────────────────────────────────── */}
          <div className="hidden lg:flex flex-col justify-center gap-8 pt-4">
            {/* Brand */}
            <div>
              <Link to="/" className="inline-block mb-6">
                <img src={require('../logo.png')} alt="nimbleAI" className="h-10 w-auto" />
              </Link>
              <div className="inline-flex items-center gap-2 rounded-full border border-trust-200 bg-trust-50 px-3 py-0.5 text-xs font-bold text-trust-700 font-mono mb-3">
                AI REVENUE &amp; RTO SHIELD
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 leading-snug tracking-tight">
                Autonomous AI for Indian D2C Revenue & Returns Management.
              </h2>
              <p className="mt-3 text-slate-500 text-sm leading-relaxed">
                Access your nimbleAI dashboard to monitor real-time RTO protection, COD-to-prepaid conversion performance, and autonomous post-purchase support metrics.
              </p>
            </div>

            <ul className="space-y-3.5">
              <Bullet text="AI-powered delivery address verification and NDR risk scoring before dispatch" />
              <Bullet text="Converts COD orders to non-refundable prepaid UPI payments via a 1-tap WhatsApp flow" />
              <Bullet text="Resolves over 80% of post-purchase support queries autonomously via live courier APIs" />
              <Bullet text="Recovers abandoned carts through personalised WhatsApp conversations with 1-tap checkout" />
              <Bullet text="Native Shopify integration and official Meta Cloud API compliance" />
            </ul>

            <div className="pt-2 border-t border-gray-200 flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-conversion-500 animate-pulse" />
              <span>Live Network: 98.4% RTO Detection Accuracy</span>
            </div>
          </div>

          {/* ── Right panel – auth card ──────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg animate-scaleIn">

            {/* Mobile logo */}
            <div className="flex justify-center mb-6 lg:hidden">
              <img src={require('../logo.png')} alt="nimbleAI" className="h-10 w-auto" />
            </div>

            <h1 className="text-xl font-bold text-slate-900 mb-1">
              {isForgot ? 'Reset your password' : 'Sign in to your Shield'}
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              {isForgot
                ? "We'll send a reset link to your email."
                : 'Access your nimbleAI store dashboard.'}
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
                  className="w-full flex items-center justify-center gap-3 border border-gray-300 bg-white hover:bg-gray-50
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
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-slate-400 font-medium">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              </>
            )}

            {/* Login / Forgot form */}
            <form onSubmit={isForgot ? handleReset : handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="loginEmail">
                  Business email
                </label>
                <input
                  id="loginEmail"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-trust-500 focus:ring-1 focus:ring-trust-200 transition-colors"
                  placeholder="you@brand.in"
                />
              </div>

              {!isForgot && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="loginPassword">
                    Password
                  </label>
                  <input
                    id="loginPassword"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-trust-500 focus:ring-1 focus:ring-trust-200 transition-colors"
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
                      className="w-4 h-4 rounded border-gray-300 bg-white text-trust-600 focus:ring-trust-500"
                    />
                    <span className="text-xs text-slate-500">Remember me</span>
                  </label>
                  <button type="button" onClick={toggleForgot}
                          className="text-xs text-trust-600 hover:text-trust-700 font-medium">
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || resetSent}
                className="w-full btn-primary justify-center py-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed font-bold"
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
                        className="w-full text-center text-xs text-slate-500 hover:text-slate-700 transition-colors mt-1">
                  ← Back to sign in
                </button>
              )}
            </form>

            {!isForgot && (
              <p className="text-center text-xs text-slate-500 mt-6">
                Don't have an account?{' '}
                <Link to="/start-now" className="text-trust-600 font-semibold hover:text-trust-700 hover:underline">
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
