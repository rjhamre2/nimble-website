import React, { useState } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const IntegrationsPage = () => {
  const [isTesting, setIsTesting] = useState(false);

  // Mock integrations data
  const integrations = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      status: 'connected',
      icon: '💬',
      description: 'Business WhatsApp API',
      lastSync: '2 minutes ago',
      messageCount: '1,247'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      status: 'connected',
      icon: '📷',
      description: 'Instagram Direct Messages',
      lastSync: '5 minutes ago',
      messageCount: '856'
    },
    {
      id: 'website',
      name: 'Website Chat',
      status: 'connected',
      icon: '🌐',
      description: 'Website chat widget',
      lastSync: '1 minute ago',
      messageCount: '2,341'
    },
    {
      id: 'telegram',
      name: 'Telegram',
      status: 'disconnected',
      icon: '📱',
      description: 'Telegram Bot',
      lastSync: 'Never',
      messageCount: '0'
    }
  ];

  const handleTestMessage = (integrationId) => {
    setIsTesting(true);
    // Simulate test message
    setTimeout(() => {
      setIsTesting(false);
      alert(`Test message sent to ${integrationId}!`);
    }, 2000);
  };

  const handleReconnect = (integrationId) => {
    // Add reconnection logic
    console.log('Reconnecting:', integrationId);
  };

  const getStatusColor = (status) => {
    return status === 'connected' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (status) => {
    return status === 'connected' 
      ? <CheckCircleIcon className="h-5 w-5" />
      : <XCircleIcon className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integrations</h2>
          <p className="text-gray-600">Manage your platform connections</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <PlusIcon className="h-5 w-5" />
          <span>Add Platform</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{integration.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                  <p className="text-sm text-gray-500">{integration.description}</p>
                </div>
              </div>
              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                {getStatusIcon(integration.status)}
                <span className="capitalize">{integration.status}</span>
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Messages</p>
                <p className="font-semibold text-gray-900">{integration.messageCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Sync</p>
                <p className="font-semibold text-gray-900">{integration.lastSync}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              {integration.status === 'connected' ? (
                <>
                  <button
                    onClick={() => handleTestMessage(integration.id)}
                    disabled={isTesting}
                    className="flex-1 flex items-center justify-center space-x-1 bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
                  >
                    {isTesting ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    )}
                    <span>{isTesting ? 'Testing...' : 'Test Message'}</span>
                  </button>
                  <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                    Settings
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleReconnect(integration.id)}
                  className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add New Integration Card */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-6 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <PlusIcon className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Add New Platform</h3>
        <p className="text-gray-600 mb-4">Connect more platforms to reach your customers</p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Browse Platforms
        </button>
      </div>
    </div>
  );
};

export default IntegrationsPage; 