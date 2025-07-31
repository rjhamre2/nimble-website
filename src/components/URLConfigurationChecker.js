import React, { useState, useEffect } from 'react';

function URLConfigurationChecker() {
  const [config, setConfig] = useState({
    currentDomain: '',
    facebookSDK: false,
    firebaseConfig: false,
    oauthRedirects: [],
    appDomains: [],
    issues: []
  });

  useEffect(() => {
    const checkConfiguration = () => {
      const issues = [];
      const oauthRedirects = [];
      const appDomains = [];

      // Check current domain
      const currentDomain = window.location.hostname;
      
      // Check Facebook SDK
      const facebookSDK = !!window.FB;
      
      // Check Firebase config
      const firebaseConfig = !!window.firebase;

      // Expected OAuth redirect URIs
      const expectedRedirects = [
        'https://nimbleai-firebase.firebaseapp.com/__/auth/handler',
        'http://localhost:3000/__/auth/handler',
        'https://nimbleai.in/__/auth/handler'
      ];

      // Expected app domains
      const expectedDomains = [
        'localhost',
        'nimbleai-firebase.firebaseapp.com',
        'nimbleai.in'
      ];

      // Check if current domain is in expected domains
      if (!expectedDomains.includes(currentDomain)) {
        issues.push(`Current domain (${currentDomain}) not in expected app domains`);
      }

      // Check Facebook SDK configuration
      if (window.FB) {
        try {
          // Try to get app info
          window.FB.api('/1110256151158809', (response) => {
            if (response && response.error) {
              issues.push(`Facebook API error: ${response.error.message}`);
            }
          });
        } catch (error) {
          issues.push(`Facebook SDK error: ${error.message}`);
        }
      } else {
        issues.push('Facebook SDK not loaded');
      }

      // Check for common React routing issues
      if (window.location.pathname !== '/' && !window.location.pathname.includes('__/auth/handler')) {
        issues.push('React routing might interfere with OAuth redirects');
      }

      // Check if we're on HTTPS (required for production)
      if (window.location.protocol !== 'https:' && currentDomain !== 'localhost') {
        issues.push('HTTPS required for Facebook authentication in production');
      }

      setConfig({
        currentDomain,
        facebookSDK,
        firebaseConfig,
        oauthRedirects: expectedRedirects,
        appDomains: expectedDomains,
        issues
      });
    };

    checkConfiguration();
  }, []);

  const getRecommendations = () => {
    const recs = [];

    if (config.issues.includes('Facebook SDK not loaded')) {
      recs.push('Check Facebook SDK script loading in index.html');
    }

    if (config.issues.includes('Current domain not in expected app domains')) {
      recs.push(`Add '${config.currentDomain}' to Facebook app domains`);
    }

    if (config.issues.includes('React routing might interfere')) {
      recs.push('Ensure OAuth redirect URIs are properly configured');
    }

    if (config.issues.includes('HTTPS required')) {
      recs.push('Use HTTPS for production Facebook authentication');
    }

    if (recs.length === 0) {
      recs.push('URL configuration looks good - check Facebook Console settings');
    }

    return recs;
  };

  return (
    <div className="p-4 border rounded-lg bg-red-50">
      <h3 className="text-lg font-semibold mb-4">URL Configuration Checker</h3>
      
      <div className="space-y-2 mb-4">
        <div><strong>Current Domain:</strong> {config.currentDomain}</div>
        <div><strong>Facebook SDK:</strong> {config.facebookSDK ? '✅ Loaded' : '❌ Not loaded'}</div>
        <div><strong>Firebase Config:</strong> {config.firebaseConfig ? '✅ Available' : '❌ Not available'}</div>
        <div><strong>Protocol:</strong> {window.location.protocol}</div>
      </div>

      <div className="mb-4">
        <strong>Expected OAuth Redirect URIs:</strong>
        <ul className="list-disc list-inside mt-2 ml-4 text-sm">
          {config.oauthRedirects.map((uri, index) => (
            <li key={index} className="font-mono">{uri}</li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <strong>Expected App Domains:</strong>
        <ul className="list-disc list-inside mt-2 ml-4 text-sm">
          {config.appDomains.map((domain, index) => (
            <li key={index} className="font-mono">{domain}</li>
          ))}
        </ul>
      </div>

      {config.issues.length > 0 && (
        <div className="mb-4">
          <strong>Issues Found:</strong>
          <ul className="list-disc list-inside mt-2 ml-4">
            {config.issues.map((issue, index) => (
              <li key={index} className="text-red-600">{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4">
        <strong>Recommendations:</strong>
        <ul className="list-disc list-inside mt-2 ml-4">
          {getRecommendations().map((rec, index) => (
            <li key={index} className="text-sm">{rec}</li>
          ))}
        </ul>
      </div>

      <div className="text-sm text-gray-600">
        <p><strong>Facebook Console:</strong> <a href="https://developers.facebook.com/apps/1110256151158809/settings/basic/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open</a></p>
        <p><strong>Firebase Console:</strong> <a href="https://console.firebase.google.com/project/nimbleai-firebase/authentication/providers" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open</a></p>
      </div>
    </div>
  );
}

export default URLConfigurationChecker; 