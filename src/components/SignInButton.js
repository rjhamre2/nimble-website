import React, { useState } from 'react';
import { signInWithGoogle, logout } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useFacebookAuth } from '../hooks/useFacebookAuth';
import { useNavigate } from 'react-router-dom';

function SignInButton() {
  const { user, loading } = useAuth();
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const { loginWithFacebook, isLoading: isFacebookLoading, error: facebookError, isFacebookSDKReady } = useFacebookAuth();
  const navigate = useNavigate();



  const handleGoogleSignIn = async () => {
    setIsGoogleSigningIn(true);
    try {
      await signInWithGoogle();
      // PublicRoute will automatically redirect to dashboard
    } catch (error) {
      console.error('Google sign in error:', error);
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      await loginWithFacebook();
      // PublicRoute will automatically redirect to dashboard (same as Google)
    } catch (error) {
      console.error('Facebook sign in error:', error);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-2 bg-gray-300 text-gray-600 rounded">
        Loading...
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.photoURL && <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full" />}
        <span>{user.displayName}</span>
        <button 
          onClick={() => {
            logout();
            navigate('/');
          }} 
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {facebookError && (
        <div className="text-red-600 text-sm mb-2 bg-red-100 p-2 rounded">
          {facebookError}
        </div>
      )}
      
      <button 
        onClick={handleGoogleSignIn} 
        disabled={isGoogleSigningIn || isFacebookLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {isGoogleSigningIn ? 'Signing in...' : 'Sign in with Google'}
      </button>
      
      <button 
        onClick={handleFacebookSignIn} 
        disabled={isGoogleSigningIn || isFacebookLoading || !isFacebookSDKReady}
        className="px-4 py-2 bg-blue-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        {isFacebookLoading ? 'Signing in...' : 'Sign in with Facebook'}
      </button>
    </div>
  );
}

export default SignInButton; 