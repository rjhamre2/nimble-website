import React, { useState } from 'react';

function FacebookQuickFix() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);

  const steps = [
    {
      id: 1,
      title: 'Add Yourself as Administrator',
      description: 'Add your Facebook account as an administrator to enable testing',
      action: 'Go to Administrators',
      url: 'https://developers.facebook.com/apps/1110256151158809/roles/administrators/',
      instructions: [
        '1. Click "Add Administrator"',
        '2. Enter your Facebook account email',
        '3. Select "Administrator" role',
        '4. Save the changes',
        '5. You can now test with your regular Facebook account'
      ]
    },
    {
      id: 2,
      title: 'Enable Firebase Facebook Provider',
      description: 'Enable Facebook authentication in Firebase Console',
      action: 'Go to Firebase Console',
      url: 'https://console.firebase.google.com/project/nimbleai-firebase/authentication/providers',
      instructions: [
        '1. Find "Facebook" in the providers list',
        '2. Click "Enable"',
        '3. Add your Facebook App ID: 1110256151158809',
        '4. Add your Facebook App Secret',
        '5. Click "Save"'
      ]
    },
    {
      id: 3,
      title: 'Add Localhost to App Domains',
      description: 'Add localhost to Facebook app domains for development',
      action: 'Go to App Settings',
      url: 'https://developers.facebook.com/apps/1110256151158809/settings/basic/',
      instructions: [
        '1. Find "App Domains" field',
        '2. Add: localhost',
        '3. Add: nimbleai-firebase.firebaseapp.com',
        '4. Click "Save Changes"'
      ]
    },
    {
      id: 4,
      title: 'Add OAuth Redirect URIs',
      description: 'Add OAuth redirect URIs for authentication flow',
      action: 'Go to Facebook Login Settings',
      url: 'https://developers.facebook.com/apps/1110256151158809/fb-login/settings/',
      instructions: [
        '1. Find "OAuth redirect URIs"',
        '2. Add: http://localhost:3000/__/auth/handler',
        '3. Add: https://nimbleai-firebase.firebaseapp.com/__/auth/handler',
        '4. Save the changes'
      ]
    }
  ];

  const handleStepComplete = (stepId) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
    setCurrentStep(Math.min(stepId + 1, steps.length));
  };

  const getCurrentStep = () => steps.find(step => step.id === currentStep);

  return (
    <div className="p-4 border rounded-lg bg-green-50">
      <h3 className="text-lg font-semibold mb-4">Facebook Quick Fix Guide</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          ✅ Privacy Policy URLs are accessible! Now let's fix the remaining issues.
        </p>
      </div>

      <div className="mb-4">
        <strong>Current Step: {getCurrentStep()?.title}</strong>
        <p className="text-sm text-gray-600 mt-1">{getCurrentStep()?.description}</p>
      </div>

      <div className="mb-4">
        <a
          href={getCurrentStep()?.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {getCurrentStep()?.action}
        </a>
      </div>

      <div className="mb-4">
        <strong>Instructions:</strong>
        <ol className="list-decimal list-inside mt-2 ml-4 text-sm">
          {getCurrentStep()?.instructions.map((instruction, index) => (
            <li key={index}>{instruction}</li>
          ))}
        </ol>
      </div>

      <div className="mb-4">
        <button
          onClick={() => handleStepComplete(currentStep)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mr-2"
        >
          Mark Step Complete
        </button>
        {currentStep < steps.length && (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Next Step
          </button>
        )}
      </div>

      <div className="mb-4">
        <strong>Progress:</strong>
        <div className="flex space-x-2 mt-2">
          {steps.map(step => (
            <div
              key={step.id}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                completedSteps.includes(step.id)
                  ? 'bg-green-500 text-white'
                  : step.id === currentStep
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}
            >
              {completedSteps.includes(step.id) ? '✓' : step.id}
            </div>
          ))}
        </div>
      </div>

      {completedSteps.length === steps.length && (
        <div className="p-3 bg-green-100 border border-green-400 rounded">
          <strong>✅ All steps completed!</strong>
          <p className="text-sm mt-1">Try Facebook login now - it should work!</p>
        </div>
      )}

      <div className="text-sm text-gray-600">
        <p><strong>Note:</strong> Complete these steps in order for best results.</p>
      </div>
    </div>
  );
}

export default FacebookQuickFix; 