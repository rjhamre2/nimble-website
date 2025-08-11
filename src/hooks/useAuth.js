import { useState, useEffect } from 'react';
import { getCurrentUser, isAuthenticated, verifyTokenLambda } from '../services/authService';
import { getCurrentUserData, updateUserData } from '../services/userService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      // Check if user is authenticated using our Lambda service
      if (isAuthenticated()) {
        const currentUser = getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          
          // Verify token with Lambda
          const verifiedUser = await verifyTokenLambda();
          if (verifiedUser) {
            setUser(verifiedUser);
            // Get additional user data from database
            const data = await getCurrentUserData();
            setUserData(data);
          } else {
            // Token is invalid, clear user
            setUser(null);
            setUserData(null);
          }
        }
      } else {
        setUser(null);
        setUserData(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    // Listen for storage changes to detect sign in/out
    const handleStorageChange = (e) => {
      if (e.key === 'authToken' || e.key === 'userData') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom auth events
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  const updateUser = async (updates) => {
    if (!user) return false;
    
    const success = await updateUserData(updates);
    if (success) {
      // Refresh user data
      const data = await getCurrentUserData();
      setUserData(data);
    }
    return success;
  };

  return {
    user,
    userData,
    loading,
    updateUser,
    isAuthenticated: !!user
  };
}; 