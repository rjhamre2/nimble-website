import { useState, useEffect } from 'react';
import { signInWithFacebook } from '../firebase';

export const useFacebookAuth = () => {
  const [isFacebookSDKReady, setIsFacebookSDKReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if Facebook SDK is loaded with enhanced security checks
    const checkFacebookSDK = () => {
      if (window.FB) {
        // Additional security checks
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          console.warn('Facebook authentication requires HTTPS in production');
        }
        
        setIsFacebookSDKReady(true);
        console.log('Facebook SDK ready with security checks');
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

    // Security check for HTTPS
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setError('Facebook authentication requires a secure connection (HTTPS) in production.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the same Firebase function as Google login
      // This will trigger onAuthStateChanged which saves data to Firestore
      await signInWithFacebook();
      console.log('Facebook login successful');
    } catch (error) {
      console.error('Facebook login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Handle specific Facebook login errors with enhanced messaging
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Login was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups for this site and try again.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with the same email address but different sign-in credentials. Please use the original sign-in method.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setError('Facebook authentication is not enabled. Please contact support to enable this feature.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for Facebook login. Please contact support to add this domain.');
      } else if (error.code === 'auth/invalid-credential') {
        setError('Invalid Facebook credentials. Please try again or use a different sign-in method.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection and try again.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many login attempts. Please wait a moment before trying again.');
      } else if (error.code === 'auth/user-disabled') {
        setError('This account has been disabled. Please contact support.');
      } else {
        setError(`Facebook login failed: ${error.message || 'Unknown error occurred. Please try again.'}`);
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