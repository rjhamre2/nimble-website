import { apiConfig } from '../config/api';

// Initialize Google Sign-In
export const initializeGoogleSignIn = () => {
  if (!window.google || !window.google.accounts) {
    console.error('Google Identity Services not loaded');
    return false;
  }

  if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
    console.error('Google Client ID not found');
    return false;
  }

  return true;
};

// Google Sign-In using Lambda authentication
export const signInWithGoogleLambda = async () => {
  return new Promise((resolve, reject) => {
    try {
      if (!initializeGoogleSignIn()) {
        reject(new Error('Google Sign-In not initialized'));
        return;
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          try {
            if (tokenResponse.error) {
              reject(new Error(`Google Sign-In failed: ${tokenResponse.error}`));
              return;
            }

            // Get user info from Google using access token
            const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`);
            
            if (!userInfoResponse.ok) {
              reject(new Error('Failed to fetch user info from Google'));
              return;
            }
            
            const userInfo = await userInfoResponse.json();

            // Send user info to Lambda (not the token)
            const lambdaResponse = await fetch(apiConfig.endpoints.auth.google(), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userInfo: userInfo
              }),
            });

            if (!lambdaResponse.ok) {
              const errorData = await lambdaResponse.json();
              reject(new Error(errorData.error || 'Authentication failed'));
              return;
            }

            const authData = await lambdaResponse.json();
            
            // Store the JWT token
            localStorage.setItem('authToken', authData.token);
            localStorage.setItem('userData', JSON.stringify(authData.user));
            
            // Dispatch custom event to notify auth state change
            window.dispatchEvent(new Event('authStateChanged'));
            
            resolve(authData);
          } catch (error) {
            console.error('Error in callback:', error);
            reject(error);
          }
        },
      });

      client.requestAccessToken();
    } catch (error) {
      console.error('Google Identity authentication error:', error);
      reject(error);
    }
  });
};

// Alternative method using Google Identity Services
export const signInWithGoogleIdentity = async () => {
  return signInWithGoogleLambda();
};

// Logout using Lambda
export const logoutLambda = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (token) {
      await fetch(apiConfig.endpoints.auth.logout(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear local storage regardless of Lambda response
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Dispatch custom event to notify auth state change
    window.dispatchEvent(new Event('authStateChanged'));
  }
};

// Verify token with Lambda
export const verifyTokenLambda = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return null;
    }

    const response = await fetch(apiConfig.endpoints.auth.verify(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Token is invalid, clear it
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      // Dispatch custom event to notify auth state change
      window.dispatchEvent(new Event('authStateChanged'));
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Token verification error:', error);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Dispatch custom event to notify auth state change
    window.dispatchEvent(new Event('authStateChanged'));
    return null;
  }
};

// Get current user from localStorage
export const getCurrentUser = () => {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};
