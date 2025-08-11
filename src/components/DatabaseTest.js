import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiConfig } from '../config/api';

const DatabaseTest = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult('Testing Lambda connection...');
    
    try {
      const response = await fetch(apiConfig.endpoints.auth.health());
      if (response.ok) {
        const data = await response.json();
        setTestResult(`✅ Lambda connection successful! Firebase: ${data.firebase}`);
      } else {
        setTestResult('❌ Lambda connection failed');
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestUserSave = async () => {
    if (!user) {
      setTestResult('❌ No user logged in');
      return;
    }

    setIsTesting(true);
    setTestResult('Testing user verification...');
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setTestResult('❌ No auth token found');
        return;
      }

      const response = await fetch(apiConfig.endpoints.auth.verify(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult(`✅ User verification successful! User: ${data.user.email}`);
      } else {
        setTestResult('❌ User verification failed');
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Lambda & Database Test</h3>
      
      <div className="space-y-4">
        <div>
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Test Lambda Connection
          </button>
        </div>

        <div>
          <button
            onClick={handleTestUserSave}
            disabled={isTesting || !user}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            Test User Verification
          </button>
          {!user && <p className="text-sm text-gray-600 mt-1">(Login first to test user verification)</p>}
        </div>

        <div className="p-3 bg-white border rounded">
          <strong>Test Result:</strong> {testResult}
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Current User:</strong> {user ? user.email : 'None'}</p>
          <p><strong>User UID:</strong> {user ? user.uid : 'None'}</p>
        </div>
      </div>
    </div>
  );
};

export default DatabaseTest; 