import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithGoogleLambda } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { apiConfig } from '../config/api';

const StartNowPage = ({ isDarkMode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    businessEmail: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

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

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      // Construct displayName from firstName and lastName
      const displayName = `${formData.firstName} ${formData.lastName}`.trim();
      
      // Get the auth lambda base URL
      const authBaseURL = apiConfig.authConfig.baseURL;
      const signupURL = `${authBaseURL}/signup`;
      
      // Prepare request body
      const requestBody = {
        email: formData.businessEmail,
        password: formData.password,
        displayName: displayName
      };
      
      console.log('Calling signup API:', signupURL, requestBody);
      
      const response = await fetch(signupURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Signup successful:', result);
        
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
        
        // The useAuth hook will detect the change and PublicRoute will redirect to dashboard
        // Small delay to ensure state updates
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Signup error:', errorData);
        
        // Handle specific error cases
        if (response.status === 409 || errorData.error?.includes('already exists')) {
          setErrorMessage('email_exists');
        } else {
          setErrorMessage(errorData.error || `Signup failed: ${response.status} ${response.statusText}`);
        }
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrorMessage(`Failed to sign up: ${error.message}`);
      setIsSubmitting(false);
    }
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
          </div>

          {/* Right Side - Signup Form and Other Content */}
          <div className="flex flex-col">
            {/* Signup Options */}
            <div className={`rounded-lg p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Start your free trial
              </h2>

              {/* Google Sign In Button */}
              <div className="mb-4">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleSigningIn}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-blue-700"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {isGoogleSigningIn ? 'Signing in...' : 'Sign up with Google'}
                </button>
              </div>

              {/* Divider Line */}
              <div className={`border-t mb-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>

              {/* Sign up with email text */}
              <div className="mb-6">
                <p className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Or sign up with email
                </p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      {errorMessage === 'email_exists' ? (
                        <div>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>
                            Email already exists. Please use login instead.
                          </p>
                          <button
                            onClick={() => navigate('/login')}
                            className="mt-2 text-sm text-red-600 hover:underline font-medium"
                          >
                            Go to Login Page →
                          </button>
                        </div>
                      ) : (
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>
                          {errorMessage}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setErrorMessage(null)}
                      className={`ml-2 ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Email Signup Form */}
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block mb-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className={`block mb-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

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
                    Create Password
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

                {/* Terms and Conditions */}
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  By signing up, you agree to the{' '}
                  <Link to="/terms-of-service" className="text-green-600 hover:underline">
                    Terms & Conditions
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy-policy" className="text-green-600 hover:underline">
                    Privacy Policy
                  </Link>
                  , and consent to receive marketing communications from NimbleAI and our service partners. Your information will also be shared with NimbleAI's Service Partners to facilitate your NimbleAI signup, product inquiries and enable your use of the NimbleAI service.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
                >
                  {isSubmitting ? 'Starting...' : 'Start my trial'}
                </button>
              </form>

              {/* Sign In Link */}
              <div className="text-center mt-6">
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Already have an account?{' '}
                  <button
                    onClick={() => navigate('/login')}
                    className="text-green-600 hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartNowPage;

