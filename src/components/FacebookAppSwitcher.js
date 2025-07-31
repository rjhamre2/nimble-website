import React, { useState } from 'react';

function FacebookAppSwitcher() {
  const [selectedApp, setSelectedApp] = useState('1110256151158809');
  const [showNewApp, setShowNewApp] = useState(false);

  const apps = [
    {
      id: '1110256151158809',
      name: 'Current App',
      status: 'App not active'
    }
  ];

  const handleAppChange = (appId) => {
    setSelectedApp(appId);
    // Update the Facebook SDK initialization
    if (window.FB) {
      window.FB.init({
        appId: appId,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v23.0'
      });
    }
  };

  const createNewApp = () => {
    setShowNewApp(true);
  };

  return (
    <div className="p-4 border rounded-lg bg-green-50">
      <h3 className="text-lg font-semibold mb-4">Facebook App Configuration</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Facebook App:</label>
        <select 
          value={selectedApp} 
          onChange={(e) => handleAppChange(e.target.value)}
          className="w-full p-2 border rounded"
        >
          {apps.map(app => (
            <option key={app.id} value={app.id}>
              {app.name} ({app.id}) - {app.status}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <button
          onClick={createNewApp}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create New Test App
        </button>
      </div>

      {showNewApp && (
        <div className="p-3 bg-yellow-100 border border-yellow-400 rounded">
          <h4 className="font-semibold mb-2">Create New Facebook App:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Go to <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Facebook Developers</a></li>
            <li>Click "Create App"</li>
            <li>Choose "Consumer" or "Business"</li>
            <li>Name it "Nimble AI Test"</li>
            <li>Add Facebook Login product</li>
            <li>Get new App ID and update the code</li>
          </ol>
        </div>
      )}

      <div className="text-sm text-gray-600">
        <p><strong>Current App ID:</strong> {selectedApp}</p>
        <p><strong>Status:</strong> App not active - needs configuration</p>
      </div>
    </div>
  );
}

export default FacebookAppSwitcher; 