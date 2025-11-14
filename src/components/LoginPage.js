import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithGoogleLambda } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { apiConfig } from '../config/api';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';

// Initialize Firebase if not already initialized
let firebaseApp;
const getFirebaseApp = () => {
  // First, check if Firebase is already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    console.log('✅ [Firebase] Using existing Firebase app');
    return existingApps[0];
  }
  
  // If not initialized, try to initialize with config
  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'nimbleai-firebase.firebaseapp.com',
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'nimbleai-firebase',
  };
  
  console.log('🔧 [Firebase] Initialization check:', {
    hasApiKey: !!firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    envApiKey: process.env.REACT_APP_FIREBASE_API_KEY ? 'set' : 'not set'
  });
  
  if (firebaseConfig.apiKey) {
    try {
      const app = initializeApp(firebaseConfig);
      console.log('✅ [Firebase] Firebase initialized successfully');
      return app;
    } catch (error) {
      console.error('❌ [Firebase] Error initializing Firebase:', error);
      return null;
    }
  } else {
    console.warn('⚠️ [Firebase] Firebase API key not found. Email/password login will not work.');
    console.warn('⚠️ [Firebase] Please set REACT_APP_FIREBASE_API_KEY environment variable.');
  }
  
  return null;
};

firebaseApp = getFirebaseApp();

const LoginPage = ({ isDarkMode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessEmail: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleSigningIn(true);
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign-in cancelled or timed out')), 5000);
      });
      await Promise.race([signInWithGoogleLambda(), timeoutPromise]);
    } catch (error) {
      console.error('Google sign in error:', error);
      setIsGoogleSigningIn(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError(null);
    
    try {
      // Try to get Firebase app (might be initialized elsewhere)
      const app = firebaseApp || getFirebaseApp();
      
      if (!app) {
        throw new Error('Firebase is not configured. Please contact support or try using Google Sign-In.');
      }

      const auth = getAuth(app);
      
      // Step 1: Authenticate with Firebase using email/password
      console.log('🔐 [Login] Authenticating with Firebase...');
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.businessEmail,
        formData.password
      );
      
      const firebaseUser = userCredential.user;
      console.log('✅ [Login] Firebase authentication successful:', firebaseUser.email);
      
      // Step 2: Get the ID token from Firebase
      const idToken = await firebaseUser.getIdToken();
      console.log('🔑 [Login] ID token obtained');
      
      // Step 3: Send ID token to Lambda login endpoint
      const authBaseURL = apiConfig.authConfig.baseURL;
      const loginURL = `${authBaseURL}/login`;
      
      console.log('🌐 [Login] Calling login API:', loginURL);
      
      const response = await fetch(loginURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: idToken
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ [Login] Login successful:', result);
        
        // Store auth data similar to Google sign-in flow
        if (result.token) {
          localStorage.setItem('authToken', result.token);
        }
        if (result.user) {
          localStorage.setItem('userData', JSON.stringify(result.user));
        }
        
        // Store firstTime flag if present (for welcome modal)
        if (typeof result.firstTime === 'boolean') {
          localStorage.setItem('nimble_first_time', result.firstTime ? '1' : '0');
          console.log('✅ Stored firstTime flag:', result.firstTime ? '1' : '0');
          // Dispatch specific event for firstTime flag
          window.dispatchEvent(new CustomEvent('firstTimeSet', { detail: { firstTime: result.firstTime } }));
        }
        
        // Dispatch custom event to notify auth state change
        window.dispatchEvent(new Event('authStateChanged'));
        
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [Login] Login API error:', errorData);
        setLoginError(errorData.error || `Login failed: ${response.status} ${response.statusText}`);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('❌ [Login] Error:', error);
      
      // Handle Firebase Auth errors
      let errorMessage = 'Failed to login. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setLoginError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError(null);
    setResetSuccess(false);
    
    try {
      const app = firebaseApp || getFirebaseApp();
      
      if (!app) {
        throw new Error('Firebase is not configured. Please contact support.');
      }

      const auth = getAuth(app);
      
      console.log('🔐 [Password Reset] Sending password reset email to:', formData.businessEmail);
      await sendPasswordResetEmail(auth, formData.businessEmail);
      
      console.log('✅ [Password Reset] Password reset email sent successfully');
      setResetSuccess(true);
      setIsSubmitting(false);
    } catch (error) {
      console.error('❌ [Password Reset] Error:', error);
      
      let errorMessage = 'Failed to send password reset email. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setLoginError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const toggleForgotPasswordMode = () => {
    setIsForgotPasswordMode(!isForgotPasswordMode);
    setLoginError(null);
    setResetSuccess(false);
    setFormData({ ...formData, password: '' });
  };

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Heading and Features */}
          <div className="flex flex-col">
            {/* Main Heading */}
            <h1 className={`text-4xl md:text-5xl font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Everything you need to grow your business on WhatsApp
            </h1>

            {/* Features List */}
            <ul className="space-y-4">
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className={`text-lg ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Targeted Campaigns to deliver personalized offers
                </span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className={`text-lg ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Pre-built templates to send updates & reminders
                </span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className={`text-lg ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  24x7 instant engagement with no-code chatbots
                </span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className={`text-lg ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Powerful automations to resolve issues faster
                </span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className={`text-lg ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Integrations to bring in context from Zoho, Shopify, etc.
                </span>
              </li>
            </ul>

            {/* Trust Badge */}
            <div className="mt-8">
              <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Trusted by 8000+ customers across 52 countries
              </p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex flex-col">
            <div className={`rounded-lg p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Log in to your account
              </h2>

              {!isForgotPasswordMode && (
                <>
                  <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Select a method to sign in
                  </p>

                  {/* Google Sign In Button */}
                  <div className="mb-6">
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleSigningIn}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:bg-blue-700"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      {isGoogleSigningIn ? 'Signing in...' : 'Log in with Google'}
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center my-6">
                    <div className={`flex-1 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>
                    <span className={`px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>or</span>
                    <div className={`flex-1 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>
                  </div>

                  {/* Continue with email text */}
                  <div className="mb-4">
                    <p className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Continue with email
                    </p>
                  </div>
                </>
              )}

              {/* Error Message */}
              {loginError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>
                        {loginError}
                      </p>
                    </div>
                    <button
                      onClick={() => setLoginError(null)}
                      className={`ml-2 ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Success Message for Password Reset */}
              {resetSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                        Password reset email sent! Please check your inbox and follow the instructions to reset your password.
                      </p>
                    </div>
                    <button
                      onClick={() => setResetSuccess(false)}
                      className={`ml-2 ${isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Login Form or Password Reset Form */}
              {isForgotPasswordMode ? (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <label className={`block mb-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Business email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.businessEmail}
                      onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter business email"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
                  >
                    {isSubmitting ? 'Sending...' : 'Reset your password'}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={toggleForgotPasswordMode}
                      className={`text-sm text-green-600 hover:underline ${isDarkMode ? 'text-green-400' : ''}`}
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className={`block mb-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Business email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.businessEmail}
                      onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter business email"
                    />
                  </div>

                  <div>
                    <label className={`block mb-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter password"
                    />
                  </div>

                  {/* Remember me and Forgot password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-green-600 focus:ring-green-500 rounded"
                      />
                      <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Remember me
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={toggleForgotPasswordMode}
                      className={`text-sm text-green-600 hover:underline ${isDarkMode ? 'text-green-400' : ''}`}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
                  >
                    {isSubmitting ? 'Logging in...' : 'Login'}
                  </button>
                </form>
              )}

              {/* Sign up link */}
              <div className="text-center mt-6">
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Don't have an account?{' '}
                  <Link to="/start-now" className="text-green-600 hover:underline font-medium">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

