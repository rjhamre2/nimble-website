import { useState, useEffect } from 'react';
import { signInWithFacebook } from '../firebase';

export const useFacebookAuth = () => {
  const [isFacebookSDKReady, setIsFacebookSDKReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if Facebook SDK is loaded
    const checkFacebookSDK = () => {
      if (window.FB) {
        setIsFacebookSDKReady(true);
      } else {
        // Retry after a short delay
        setTimeout(checkFacebookSDK, 100);
      }
    };

    checkFacebookSDK();
  }, []);

  const loginWithFacebook = async () => {
    if (!isFacebookSDKReady) {
      setError('Facebook SDK not ready. Please try again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signInWithFacebook();
    } catch (error) {
      console.error('Facebook login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Handle specific Facebook login errors
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Login was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups for this site.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with the same email address but different sign-in credentials.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setError('Facebook authentication is not enabled. Please contact support.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for Facebook login.');
      } else if (error.code === 'auth/invalid-credential') {
        setError('Invalid Facebook credentials. Please try again.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(`Facebook login failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    loginWithFacebook,
    isLoading,
    error,
    isFacebookSDKReady
  };
}; 