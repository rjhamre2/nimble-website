import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const SimpleTest = () => {
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const testSimpleWrite = async () => {
    setIsLoading(true);
    setResult('Testing...');
    
    try {
      console.log('Starting simple test...');
      console.log('DB instance:', db);
      
      const testRef = doc(db, 'simple-test', 'test-doc');
      console.log('Test reference:', testRef);
      
      await setDoc(testRef, {
        message: 'Hello Firestore!',
        timestamp: new Date().toISOString(),
        test: true
      });
      
      console.log('Simple test successful!');
      setResult('✅ Simple write test successful!');
    } catch (error) {
      console.error('Simple test failed:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      setResult(`❌ Error: ${error.message} (Code: ${error.code})`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border-2 border-red-500 rounded-lg bg-red-50">
      <h3 className="text-lg font-bold text-red-700 mb-4">Simple Firestore Test</h3>
      
      <button
        onClick={testSimpleWrite}
        disabled={isLoading}
        className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Test Simple Write'}
      </button>
      
      <div className="mt-4 p-3 bg-white border rounded">
        <strong>Result:</strong> {result}
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>This test tries to write a simple document to Firestore.</p>
        <p>Check the browser console for detailed logs.</p>
      </div>
    </div>
  );
};

export default SimpleTest; 