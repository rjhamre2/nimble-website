import React, { useState, useEffect } from 'react';
import { useFacebookAuth } from '../hooks/useFacebookAuth';

function FacebookDebug() {
  const [sdkStatus, setSdkStatus] = useState('Checking...');
  const [firebaseStatus, setFirebaseStatus] = useState('Checking...');
  const { isFacebookSDKReady, error, loginWithFacebook, isLoading } = useFacebookAuth();

  useEffect(() => {
    // Check Facebook SDK status
    const checkSDK = () => {
      if (window.FB) {
        setSdkStatus('✅ Facebook SDK loaded');
        console.log('Facebook SDK object:', window.FB);
      } else {
        setSdkStatus('❌ Facebook SDK not found');
      }
    };

    // Check Firebase auth status
    const checkFirebase = async () => {
      try {
        const { auth } = await import('../firebase');
        setFirebaseStatus('✅ Firebase Auth available');
        console.log('Firebase Auth object:', auth);
      } catch (error) {
        setFirebaseStatus('❌ Firebase Auth error: ' + error.message);
      }
    };

    checkSDK();
    checkFirebase();

    // Re-check SDK after a delay
    const timer = setTimeout(checkSDK, 2000);
    return () => clearTimeout(timer);
  }, []);

  const testFacebookLogin = async () => {
    console.log('Testing Facebook login...');
    console.log('SDK Ready:', isFacebookSDKReady);
    console.log('Window FB object:', window.FB);
    
    try {
      await loginWithFacebook();
    } catch (error) {
      console.error('Test login failed:', error);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Facebook Authentication Debug</h3>
      
      <div className="space-y-2 mb-4">
        <div><strong>Facebook SDK:</strong> {sdkStatus}</div>
        <div><strong>Firebase Auth:</strong> {firebaseStatus}</div>
        <div><strong>SDK Ready:</strong> {isFacebookSDKReady ? '✅ Yes' : '❌ No'}</div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      <button
        onClick={testFacebookLogin}
        disabled={isLoading || !isFacebookSDKReady}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Test Facebook Login'}
      </button>

      <div className="mt-4 text-sm text-gray-600">
        <p>Check the browser console for detailed error information.</p>
      </div>
    </div>
  );
}

export default FacebookDebug; 