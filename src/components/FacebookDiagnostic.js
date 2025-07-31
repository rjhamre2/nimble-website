import React, { useState, useEffect } from 'react';

function FacebookDiagnostic() {
  const [diagnostics, setDiagnostics] = useState({
    sdkLoaded: false,
    appAccessible: false,
    firebaseEnabled: false,
    redirectUris: false,
    domains: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const runDiagnostics = async () => {
      const results = { ...diagnostics };

      // Check 1: Facebook SDK
      if (window.FB) {
        results.sdkLoaded = true;
        console.log('✅ Facebook SDK loaded');
      } else {
        console.log('❌ Facebook SDK not loaded');
      }

      // Check 2: App Accessibility
      if (window.FB) {
        try {
          window.FB.api('/1110256151158809', (response) => {
            if (response && !response.error) {
              results.appAccessible = true;
              console.log('✅ App is accessible');
            } else {
              console.log('❌ App not accessible:', response?.error);
            }
            setDiagnostics(results);
          });
        } catch (error) {
          console.log('❌ Error checking app accessibility:', error);
        }
      }

      // Check 3: Firebase Configuration (simulated)
      // This would require checking Firebase config
      results.firebaseEnabled = 'Check Firebase Console';
      console.log('⚠️ Check Firebase Console for Facebook provider');

      // Check 4: Redirect URIs (simulated)
      results.redirectUris = 'Check Facebook Console';
      console.log('⚠️ Check Facebook Console for OAuth redirect URIs');

      // Check 5: Domains (simulated)
      results.domains = 'Check Facebook Console';
      console.log('⚠️ Check Facebook Console for app domains');

      setDiagnostics(results);
      setLoading(false);
    };

    runDiagnostics();
  }, []);

  const getRecommendations = () => {
    const recs = [];

    if (!diagnostics.sdkLoaded) {
      recs.push('Facebook SDK not loading - check internet connection');
    }

    if (!diagnostics.appAccessible) {
      recs.push('App not accessible - check Facebook Developer Console');
    }

    if (diagnostics.firebaseEnabled === 'Check Firebase Console') {
      recs.push('Enable Facebook provider in Firebase Console');
      recs.push('Add Facebook App Secret to Firebase settings');
    }

    if (diagnostics.redirectUris === 'Check Facebook Console') {
      recs.push('Add OAuth redirect URIs in Facebook Console');
      recs.push('Include: https://nimbleai-firebase.firebaseapp.com/__/auth/handler');
      recs.push('Include: http://localhost:3000/__/auth/handler');
    }

    if (diagnostics.domains === 'Check Facebook Console') {
      recs.push('Add domains to Facebook App settings');
      recs.push('Include: localhost, nimbleai-firebase.firebaseapp.com');
    }

    return recs;
  };

  if (loading) {
    return <div className="p-4 border rounded-lg bg-gray-50">Running diagnostics...</div>;
  }

  const recommendations = getRecommendations();

  return (
    <div className="p-4 border rounded-lg bg-blue-50">
      <h3 className="text-lg font-semibold mb-4">Facebook Authentication Diagnostic</h3>
      
      <div className="space-y-2 mb-4">
        <div><strong>Facebook SDK:</strong> {diagnostics.sdkLoaded ? '✅ Loaded' : '❌ Not loaded'}</div>
        <div><strong>App Accessible:</strong> {diagnostics.appAccessible ? '✅ Yes' : '❌ No'}</div>
        <div><strong>Firebase Enabled:</strong> {diagnostics.firebaseEnabled === 'Check Firebase Console' ? '⚠️ Check Firebase Console' : diagnostics.firebaseEnabled ? '✅ Yes' : '❌ No'}</div>
        <div><strong>Redirect URIs:</strong> {diagnostics.redirectUris === 'Check Facebook Console' ? '⚠️ Check Facebook Console' : diagnostics.redirectUris ? '✅ Configured' : '❌ Not configured'}</div>
        <div><strong>Domains:</strong> {diagnostics.domains === 'Check Facebook Console' ? '⚠️ Check Facebook Console' : diagnostics.domains ? '✅ Configured' : '❌ Not configured'}</div>
      </div>

      {recommendations.length > 0 && (
        <div className="mb-4">
          <strong>Recommendations:</strong>
          <ul className="list-disc list-inside mt-2 ml-4">
            {recommendations.map((rec, index) => (
              <li key={index} className="text-sm">{rec}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-sm text-gray-600 space-y-1">
        <p><strong>App ID:</strong> 1110256151158809</p>
        <p><strong>Facebook Console:</strong> <a href="https://developers.facebook.com/apps/1110256151158809" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open</a></p>
        <p><strong>Firebase Console:</strong> <a href="https://console.firebase.google.com/project/nimbleai-firebase/authentication/providers" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open</a></p>
      </div>
    </div>
  );
}

export default FacebookDiagnostic; 