import React, { useState } from 'react';

function LiveModeHelper() {
  const [showLiveModeSteps, setShowLiveModeSteps] = useState(false);

  const liveModeSteps = [
    {
      title: 'Complete Firebase Configuration',
      description: 'Enable Facebook provider in Firebase Console',
      url: 'https://console.firebase.google.com/project/nimbleai-firebase/authentication/providers',
      instructions: [
        '1. Find "Facebook" in the providers list',
        '2. Click "Enable"',
        '3. Add App ID: 1110256151158809',
        '4. Add your Facebook App Secret',
        '5. Click "Save"'
      ]
    },
    {
      title: 'Configure App Domains',
      description: 'Add required domains to Facebook app settings',
      url: 'https://developers.facebook.com/apps/1110256151158809/settings/basic/',
      instructions: [
        '1. Find "App Domains" field',
        '2. Add: localhost',
        '3. Add: nimbleai-firebase.firebaseapp.com',
        '4. Add: nimbleai.in',
        '5. Click "Save Changes"'
      ]
    },
    {
      title: 'Add OAuth Redirect URIs',
      description: 'Configure OAuth redirect URIs for authentication',
      url: 'https://developers.facebook.com/apps/1110256151158809/fb-login/settings/',
      instructions: [
        '1. Find "OAuth redirect URIs"',
        '2. Add: http://localhost:3000/__/auth/handler',
        '3. Add: https://nimbleai-firebase.firebaseapp.com/__/auth/handler',
        '4. Save the changes'
      ]
    },
    {
      title: 'Switch to Live Mode',
      description: 'Make the app public for all users',
      url: 'https://developers.facebook.com/apps/1110256151158809/appreview/',
      instructions: [
        '1. Go to App Review → Make [App Name] public?',
        '2. Click "Make [App Name] public"',
        '3. Wait for confirmation',
        '4. Test Facebook login'
      ]
    }
  ];

  return (
    <div className="p-4 border rounded-lg bg-purple-50">
      <h3 className="text-lg font-semibold mb-4">Live Mode Helper</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Since test user creation is disabled, let's try switching to Live Mode instead.
        </p>
        <button
          onClick={() => setShowLiveModeSteps(!showLiveModeSteps)}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          {showLiveModeSteps ? 'Hide Live Mode Steps' : 'Show Live Mode Steps'}
        </button>
      </div>

      {showLiveModeSteps && (
        <div className="space-y-4">
          {liveModeSteps.map((step, index) => (
            <div key={index} className="p-3 bg-white border rounded">
              <h4 className="font-semibold mb-2">{step.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{step.description}</p>
              <a
                href={step.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 mb-2"
              >
                Open Console
              </a>
              <ol className="list-decimal list-inside text-sm space-y-1">
                {step.instructions.map((instruction, idx) => (
                  <li key={idx}>{instruction}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
        <strong>Alternative: Create New Test App</strong>
        <p className="text-sm mt-1">
          If Live Mode doesn't work, create a new Facebook app at{' '}
          <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            Facebook Developers
          </a>
          {' '}and get new App ID/Secret.
        </p>
      </div>

      <div className="text-sm text-gray-600 mt-4">
        <p><strong>Note:</strong> Live Mode requires all privacy policy URLs to be accessible (which they are now).</p>
      </div>
    </div>
  );
}

export default LiveModeHelper; 