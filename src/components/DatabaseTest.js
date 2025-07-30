import React, { useState } from 'react';
import { testFirestoreConnection, saveUserToDatabase } from '../firebase';
import { useAuth } from '../hooks/useAuth';

const DatabaseTest = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult('Testing connection...');
    
    try {
      const result = await testFirestoreConnection();
      setTestResult(result ? '✅ Connection test successful!' : '❌ Connection test failed');
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
    setTestResult('Testing user save...');
    
    try {
      const result = await saveUserToDatabase(user);
      setTestResult(result ? '✅ User save test successful!' : '❌ User save test failed');
    } catch (error) {
      setTestResult(`❌ Error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Database Test</h3>
      
      <div className="space-y-4">
        <div>
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Test Firestore Connection
          </button>
        </div>

        <div>
          <button
            onClick={handleTestUserSave}
            disabled={isTesting || !user}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            Test User Save
          </button>
          {!user && <p className="text-sm text-gray-600 mt-1">(Login first to test user save)</p>}
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