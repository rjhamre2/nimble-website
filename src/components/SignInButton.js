import React from 'react';
import { logoutLambda as logout } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

function SignInButton() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignInClick = () => {
    navigate('/login');
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
      onClick={handleSignInClick}
      className="px-4 py-2 bg-blue-600 text-white rounded flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
    >
      Sign in
    </button>
  );
}

export default SignInButton; 