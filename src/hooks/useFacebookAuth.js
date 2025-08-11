import { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authService';

export const useFacebookAuth = () => {
  const [isFacebookSDKReady, setIsFacebookSDKReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if Facebook SDK is already loaded
    const checkFacebookSDK = () => {
      if (window.FB) {
        setIsFacebookSDKReady(true);
        return true;
      }
      return false;
    };

    // Try to check immediately
    if (!checkFacebookSDK()) {
      // If not available, wait for it to load
      const checkInterval = setInterval(() => {
        if (checkFacebookSDK()) {
          clearInterval(checkInterval);
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.FB) {
          setError('Facebook SDK not available. Please refresh the page.');
        }
      }, 10000);
    }
  }, []);

  const signInWithFacebook = async () => {
    if (!isFacebookSDKReady) {
      throw new Error('Facebook SDK not ready');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the same Firebase function as Google login
      // This will trigger onAuthStateChanged which saves data to Firestore
      await getCurrentUser();
    } catch (error) {
      console.error('Facebook login error:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isFacebookSDKReady,
    isLoading,
    error,
    signInWithFacebook
  };
}; 