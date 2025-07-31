import React, { useState, useEffect } from 'react';

function LocalhostTester() {
  const [localhostConfig, setLocalhostConfig] = useState({
    isLocalhost: false,
    facebookSDK: false,
    appDomains: false,
    oauthRedirects: false,
    testUser: false
  });

  useEffect(() => {
    const checkLocalhostConfig = () => {
      const config = {
        isLocalhost: window.location.hostname === 'localhost',
        facebookSDK: !!window.FB,
        appDomains: false,
        oauthRedirects: false,
        testUser: false
      };

      // Check if localhost is properly configured
      if (window.FB) {
        window.FB.api('/1110256151158809', (response) => {
          if (response && !response.error) {
            config.appDomains = true;
          }
        });
      }

      setLocalhostConfig(config);
    };

    checkLocalhostConfig();
  }, []);

  const getLocalhostInstructions = () => {
    return [
      '1. Go to Facebook Developer Console',
      '2. Settings → Basic → App Domains',
      '3. Add: localhost',
      '4. Facebook Login → Settings → OAuth Redirect URIs',
      '5. Add: http://localhost:3000/__/auth/handler',
      '6. Roles → Test Users → Add your Facebook account',
      '7. Test with test user credentials'
    ];
  };

  return (
    <div className="p-4 border rounded-lg bg-blue-50">
      <h3 className="text-lg font-semibold mb-4">Localhost Facebook Test</h3>
      
      <div className="space-y-2 mb-4">
        <div><strong>Running on localhost:</strong> {localhostConfig.isLocalhost ? '✅ Yes' : '❌ No'}</div>
        <div><strong>Facebook SDK:</strong> {localhostConfig.facebookSDK ? '✅ Loaded' : '❌ Not loaded'}</div>
        <div><strong>App Domains:</strong> {localhostConfig.appDomains ? '✅ Configured' : '⚠️ Check configuration'}</div>
        <div><strong>OAuth Redirects:</strong> {localhostConfig.oauthRedirects ? '✅ Configured' : '⚠️ Check configuration'}</div>
        <div><strong>Test User:</strong> {localhostConfig.testUser ? '✅ Added' : '⚠️ Add test user'}</div>
      </div>

      {localhostConfig.isLocalhost && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 rounded">
          <strong>✅ Localhost Configuration Required</strong>
          <div className="mt-2">
            <strong>Steps for localhost testing:</strong>
            <ol className="list-decimal list-inside mt-1 ml-4 text-sm">
              {getLocalhostInstructions().map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>
        </div>
      )}

      <div className="mb-4">
        <strong>Quick Links:</strong>
        <div className="mt-2 space-y-1 text-sm">
          <p><a href="https://developers.facebook.com/apps/1110256151158809/settings/basic/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">→ App Domains Settings</a></p>
          <p><a href="https://developers.facebook.com/apps/1110256151158809/fb-login/settings/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">→ OAuth Redirect URIs</a></p>
          <p><a href="https://developers.facebook.com/apps/1110256151158809/roles/test-users/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">→ Test Users</a></p>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <p><strong>Note:</strong> For localhost testing, the app should be in Development Mode with test users added.</p>
      </div>
    </div>
  );
}

export default LocalhostTester; 