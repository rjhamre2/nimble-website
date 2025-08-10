import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { onboardUser } from '../services/onboardingService';

const OnboardingTest = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleOnboardUser = async () => {
    if (!isAuthenticated) {
      setError('Please sign in first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await onboardUser();
      setResult(response);
      console.log('Onboarding result:', response);
    } catch (err) {
      setError(err.message);
      console.error('Onboarding error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Onboarding Test</h3>
        <p className="text-yellow-700">Please sign in to test the onboarding API</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-lg font-semibold text-blue-800 mb-4">Onboarding API Test</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Current User: {user?.email}</p>
        <p className="text-sm text-gray-600">User ID: {user?.uid}</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleOnboardUser}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Trigger Onboarding'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800 text-sm">Error: {error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800 text-sm font-semibold mb-2">Success!</p>
          <pre className="text-xs text-green-700 bg-green-100 p-2 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default OnboardingTest; 