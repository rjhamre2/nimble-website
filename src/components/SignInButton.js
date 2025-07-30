import React, { useState } from 'react';
import { signInWithGoogle, logout } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

function SignInButton() {
  const { user, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const navigate = useNavigate();



  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      // PublicRoute will automatically redirect to dashboard
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsSigningIn(false);
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
    <button 
      onClick={handleSignIn} 
      disabled={isSigningIn}
      className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
    </button>
  );
}

export default SignInButton; 