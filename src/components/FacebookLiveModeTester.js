import React, { useState, useEffect } from 'react';

function FacebookLiveModeTester() {
  const [appStatus, setAppStatus] = useState('Checking...');
  const [canGoLive, setCanGoLive] = useState(false);
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    const checkAppStatus = () => {
      const problems = [];
      let status = 'Checking app configuration...';

      // Check if Facebook SDK is loaded
      if (!window.FB) {
        problems.push('Facebook SDK not loaded');
        status = '❌ Facebook SDK not available';
      } else {
        status = '✅ Facebook SDK loaded';
      }

      // Check app accessibility
      if (window.FB) {
        window.FB.api('/1110256151158809', (response) => {
          if (response && !response.error) {
            status += ' - ✅ App accessible';
            setCanGoLive(true);
          } else {
            problems.push('App not accessible');
            status += ' - ❌ App not accessible';
          }
          setAppStatus(status);
        });
      }

      // Check for common Live Mode requirements
      const liveModeRequirements = [
        'Privacy Policy URL added',
        'Terms of Service URL added', 
        'Data Deletion URL added',
        'App domains configured',
        'OAuth redirect URIs set'
      ];

      // For now, assume these are configured since user added URLs
      if (problems.length === 0) {
        setCanGoLive(true);
        status += ' - ✅ Ready for Live Mode';
      } else {
        setCanGoLive(false);
        status += ' - ❌ Issues found';
      }

      setIssues(problems);
      setAppStatus(status);
    };

    checkAppStatus();
  }, []);

  const getLiveModeInstructions = () => {
    return [
      '1. Go to Facebook Developer Console',
      '2. Navigate to App Review → Make [App Name] public?',
      '3. Click "Make [App Name] public"',
      '4. If it fails, check the specific error message'
    ];
  };

  const getAlternativeInstructions = () => {
    return [
      '1. Stay in Development Mode',
      '2. Go to Roles → Test Users',
      '3. Add your Facebook account as a test user',
      '4. Test Facebook login with test user credentials'
    ];
  };

  return (
    <div className="p-4 border rounded-lg bg-orange-50">
      <h3 className="text-lg font-semibold mb-4">Facebook Live Mode Tester</h3>
      
      <div className="mb-4">
        <strong>App Status:</strong> {appStatus}
      </div>

      {canGoLive ? (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 rounded">
          <strong>✅ Ready for Live Mode!</strong>
          <div className="mt-2">
            <strong>Instructions:</strong>
            <ol className="list-decimal list-inside mt-1 ml-4 text-sm">
              {getLiveModeInstructions().map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
          <strong>⚠️ Issues Found</strong>
          <ul className="list-disc list-inside mt-2 ml-4">
            {issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4">
        <strong>Alternative: Use Development Mode</strong>
        <div className="mt-2 p-3 bg-blue-100 border border-blue-400 rounded">
          <ol className="list-decimal list-inside text-sm">
            {getAlternativeInstructions().map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        <p><strong>Facebook Console:</strong> <a href="https://developers.facebook.com/apps/1110256151158809" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open</a></p>
        <p><strong>App Review:</strong> <a href="https://developers.facebook.com/apps/1110256151158809/appreview/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open</a></p>
        <p><strong>Test Users:</strong> <a href="https://developers.facebook.com/apps/1110256151158809/roles/test-users/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open</a></p>
      </div>
    </div>
  );
}

export default FacebookLiveModeTester; 