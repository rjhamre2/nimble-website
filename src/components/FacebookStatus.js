import React, { useState, useEffect } from 'react';

function FacebookStatus() {
  const [appStatus, setAppStatus] = useState('Checking...');
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    // Check Facebook app status
    const checkAppStatus = () => {
      if (window.FB) {
        // Try to get app info
        window.FB.api('/1110256151158809', (response) => {
          if (response && !response.error) {
            setAppStatus('✅ App is active');
            setRecommendations(['App is working correctly']);
          } else {
            setAppStatus('❌ App not accessible');
            setRecommendations([
              'Go to Facebook Developer Console',
              'Check if app is in Development Mode',
              'Add yourself as a test user',
              'Or submit app for review'
            ]);
          }
        });
      } else {
        setAppStatus('❌ Facebook SDK not loaded');
        setRecommendations(['Wait for SDK to load', 'Check internet connection']);
      }
    };

    checkAppStatus();
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-yellow-50">
      <h3 className="text-lg font-semibold mb-4">Facebook App Status</h3>
      
      <div className="mb-4">
        <strong>Status:</strong> {appStatus}
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

      <div className="text-sm text-gray-600">
        <p><strong>App ID:</strong> 1110256151158809</p>
        <p><strong>Developer Console:</strong> <a href="https://developers.facebook.com/apps/1110256151158809" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open Facebook Developer Console</a></p>
      </div>
    </div>
  );
}

export default FacebookStatus; 