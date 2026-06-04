import React from 'react';
import { logoutLambda as logout } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button'; // Import your consistent Button component

function SignInButton({ className }) { 
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Button disabled variant="outline" size="sm">
        Loading...
      </Button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        {user.photoURL && <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full border border-gray-200" />}
        <span className="text-sm font-medium text-gray-700">{user.displayName}</span>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            logout();
            navigate('/');
          }} 
        >
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={() => navigate('/login')}
      // This applies the SaaS 2.0 theme you requested
      variant="hero" 
      size="sm"
      className={className} 
    >
      Admin Login
    </Button>
  );
}

export default SignInButton;