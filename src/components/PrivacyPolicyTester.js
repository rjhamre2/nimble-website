import React, { useState, useEffect } from 'react';

function PrivacyPolicyTester() {
  const [urlStatus, setUrlStatus] = useState({
    privacy: 'Checking...',
    terms: 'Checking...',
    deletion: 'Checking...'
  });
  const [loading, setLoading] = useState(true);

  const urls = {
    privacy: 'https://nimbleai.in/privacy-policy',
    terms: 'https://nimbleai.in/terms-of-service',
    deletion: 'https://nimbleai.in/delete-user-data'
  };

  useEffect(() => {
    const checkUrls = async () => {
      const results = { ...urlStatus };

      for (const [key, url] of Object.entries(urls)) {
        try {
          const response = await fetch(url, { method: 'HEAD' });
          if (response.ok) {
            results[key] = '✅ Accessible';
          } else {
            results[key] = `❌ Error ${response.status}`;
          }
        } catch (error) {
          // Try with CORS proxy for cross-origin requests
          try {
            const proxyResponse = await fetch(`https://cors-anywhere.herokuapp.com/${url}`, { method: 'HEAD' });
            if (proxyResponse.ok) {
              results[key] = '✅ Accessible (via proxy)';
            } else {
              results[key] = '❌ Not accessible';
            }
          } catch (proxyError) {
            results[key] = '❌ Not accessible';
          }
        }
      }

      setUrlStatus(results);
      setLoading(false);
    };

    checkUrls();
  }, []);

  const getRecommendations = () => {
    const recs = [];

    if (urlStatus.privacy.includes('❌')) {
      recs.push('Privacy Policy URL is not accessible - check the URL');
    }

    if (urlStatus.terms.includes('❌')) {
      recs.push('Terms of Service URL is not accessible - check the URL');
    }

    if (urlStatus.deletion.includes('❌')) {
      recs.push('Data Deletion URL is not accessible - check the URL');
    }

    if (recs.length === 0) {
      recs.push('All URLs are accessible - try switching to Live Mode again');
    }

    return recs;
  };

  if (loading) {
    return <div className="p-4 border rounded-lg bg-gray-50">Checking URLs...</div>;
  }

  const recommendations = getRecommendations();

  return (
    <div className="p-4 border rounded-lg bg-purple-50">
      <h3 className="text-lg font-semibold mb-4">Privacy Policy URL Tester</h3>
      
      <div className="space-y-2 mb-4">
        <div><strong>Privacy Policy:</strong> {urlStatus.privacy}</div>
        <div><strong>Terms of Service:</strong> {urlStatus.terms}</div>
        <div><strong>Data Deletion:</strong> {urlStatus.deletion}</div>
      </div>

      <div className="mb-4">
        <strong>URLs to add in Facebook Console:</strong>
        <ul className="list-disc list-inside mt-2 ml-4 text-sm">
          <li>Privacy Policy: <code className="bg-gray-100 px-1 rounded">{urls.privacy}</code></li>
          <li>Terms of Service: <code className="bg-gray-100 px-1 rounded">{urls.terms}</code></li>
          <li>Data Deletion: <code className="bg-gray-100 px-1 rounded">{urls.deletion}</code></li>
        </ul>
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
        <p><strong>Facebook Console:</strong> <a href="https://developers.facebook.com/apps/1110256151158809/settings/basic/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open Settings</a></p>
      </div>
    </div>
  );
}

export default PrivacyPolicyTester; 