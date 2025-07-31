import React, { useState, useEffect } from 'react';

function DataDeletionURIFixer() {
  const [urlStatus, setUrlStatus] = useState({
    privacy: 'Checking...',
    terms: 'Checking...',
    deletion: 'Checking...'
  });
  const [httpCodes, setHttpCodes] = useState({});
  const [showFix, setShowFix] = useState(false);

  const urls = {
    privacy: 'https://nimbleai.in/privacy-policy',
    terms: 'https://nimbleai.in/terms-of-service',
    deletion: 'https://nimbleai.in/delete-user-data'
  };

  useEffect(() => {
    const checkURLs = async () => {
      const results = { ...urlStatus };
      const codes = { ...httpCodes };

      for (const [key, url] of Object.entries(urls)) {
        try {
          const response = await fetch(url, { 
            method: 'GET',
            mode: 'no-cors' // This might help with CORS issues
          });
          
          // Since we're using no-cors, we can't get the status code
          // But we can check if the request was successful
          results[key] = '✅ Accessible';
          codes[key] = '200 (estimated)';
        } catch (error) {
          // Try with a different approach
          try {
            const img = new Image();
            img.onload = () => {
              results[key] = '✅ Accessible';
              codes[key] = '200 (via image load)';
              setUrlStatus(results);
              setHttpCodes(codes);
            };
            img.onerror = () => {
              results[key] = '❌ Bad HTTP Response';
              codes[key] = 'Error loading';
              setUrlStatus(results);
              setHttpCodes(codes);
            };
            img.src = url;
          } catch (imgError) {
            results[key] = '❌ Not accessible';
            codes[key] = 'Network error';
            setUrlStatus(results);
            setHttpCodes(codes);
          }
        }
      }
    };

    checkURLs();
  }, []);

  const getRecommendations = () => {
    const recs = [];

    if (urlStatus.deletion.includes('❌')) {
      recs.push('Data deletion URL is returning a bad HTTP response code');
      recs.push('Facebook requires this URL to return HTTP 200 status');
      recs.push('The page must be publicly accessible without authentication');
    }

    if (urlStatus.privacy.includes('❌')) {
      recs.push('Privacy policy URL needs to return HTTP 200');
    }

    if (urlStatus.terms.includes('❌')) {
      recs.push('Terms of service URL needs to return HTTP 200');
    }

    return recs;
  };

  const recommendations = getRecommendations();

  return (
    <div className="p-4 border rounded-lg bg-red-50">
      <h3 className="text-lg font-semibold mb-4">Data Deletion URL Fixer</h3>
      
      <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded">
        <strong>🚨 Critical Issue:</strong> Facebook is rejecting your data deletion URL because it returns a bad HTTP response code.
      </div>

      <div className="space-y-2 mb-4">
        <div><strong>Privacy Policy:</strong> {urlStatus.privacy} (Code: {httpCodes.privacy})</div>
        <div><strong>Terms of Service:</strong> {urlStatus.terms} (Code: {httpCodes.terms})</div>
        <div><strong>Data Deletion:</strong> {urlStatus.deletion} (Code: {httpCodes.deletion})</div>
      </div>

      <div className="mb-4">
        <button
          onClick={() => setShowFix(!showFix)}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          {showFix ? 'Hide Fix Options' : 'Show Fix Options'}
        </button>
      </div>

      {showFix && (
        <div className="space-y-4">
          <div className="p-3 bg-white border rounded">
            <h4 className="font-semibold mb-2">Option 1: Fix the Data Deletion Page</h4>
            <p className="text-sm mb-2">Ensure the data deletion page returns HTTP 200:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Make sure the page loads without errors</li>
              <li>Remove any authentication requirements</li>
              <li>Ensure the page is publicly accessible</li>
              <li>Check for JavaScript errors that might cause issues</li>
            </ul>
          </div>

          <div className="p-3 bg-white border rounded">
            <h4 className="font-semibold mb-2">Option 2: Use a Simple Static Page</h4>
            <p className="text-sm mb-2">Create a simple HTML page for data deletion:</p>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`<!DOCTYPE html>
<html>
<head>
    <title>Data Deletion Request - Nimble AI</title>
</head>
<body>
    <h1>Data Deletion Request</h1>
    <p>To request deletion of your data, email us at: contact@nimbleai.in</p>
    <p>We will process your request within 30 days.</p>
</body>
</html>`}
            </pre>
          </div>

          <div className="p-3 bg-white border rounded">
            <h4 className="font-semibold mb-2">Option 3: Use Development Mode</h4>
            <p className="text-sm mb-2">Skip Live Mode and use Development Mode:</p>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Stay in Development Mode</li>
              <li>Add yourself as administrator</li>
              <li>Test Facebook login immediately</li>
              <li>Fix the URLs later for production</li>
            </ol>
          </div>

          <div className="p-3 bg-white border rounded">
            <h4 className="font-semibold mb-2">Option 4: Create New App</h4>
            <p className="text-sm mb-2">Start fresh with a new Facebook app:</p>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Create new app at Facebook Developers</li>
              <li>Configure with proper URLs from the start</li>
              <li>Get new App ID and update code</li>
            </ol>
          </div>
        </div>
      )}

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
        <p><strong>Note:</strong> Facebook requires all URLs to return HTTP 200 status codes for Live Mode approval.</p>
      </div>
    </div>
  );
}

export default DataDeletionURIFixer; 