import React, { useState } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import WhatsAppEmbeddedSignup from '../WhatsAppEmbeddedSignup';

const IntegrationsPage = () => {
  const { user } = useAuth();
  const [isTesting, setIsTesting] = useState(false);
  const [showWhatsAppSetup, setShowWhatsAppSetup] = useState(false);

  // Mock integrations data
  const integrations = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      status: 'setup_required', // Changed from 'connected' to 'setup_required'
      icon: '💬',
      description: 'Business WhatsApp API',
      lastSync: '2 minutes ago',
      messageCount: '1,247'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      status: 'coming_soon',
      icon: '📷',
      description: 'Instagram Direct Messages',
      lastSync: 'Coming Soon',
      messageCount: '0'
    },
    {
      id: 'website',
      name: 'Website Chat',
      status: 'coming_soon',
      icon: '🌐',
      description: 'Website chat widget',
      lastSync: 'Coming Soon',
      messageCount: '0'
    },

  ];

  const handleTestMessage = (integrationId) => {
    setIsTesting(true);
    // Simulate test message
    setTimeout(() => {
      setIsTesting(false);
      alert(`Test message sent to ${integrationId}!`);
    }, 2000);
  };

  const handleReconnect = async (integrationId) => {
    setIsTesting(true);
    try {
      // Simulate reconnection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      // For now, just show a success message since integrations is not state
      alert(`Successfully reconnected to ${integrationId}!`);
    } catch (error) {
      console.error('Reconnection error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'connected') return 'bg-green-100 text-green-800';
    if (status === 'setup_required') return 'bg-yellow-100 text-yellow-800';
    if (status === 'coming_soon') return 'bg-gray-100 text-gray-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (status) => {
    if (status === 'connected') return <CheckCircleIcon className="h-5 w-5" />;
    if (status === 'setup_required') return <ArrowPathIcon className="h-5 w-5" />;
    if (status === 'coming_soon') return <ArrowPathIcon className="h-5 w-5" />;
    return <XCircleIcon className="h-5 w-5" />;
  };

  const getStatusText = (status) => {
    if (status === 'connected') return 'Connected';
    if (status === 'setup_required') return 'Setup Required';
    if (status === 'coming_soon') return 'Coming Soon';
    return 'Disconnected';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integrations</h2>
          <p className="text-gray-600">Manage your platform connections</p>
        </div>
        {/* <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <PlusIcon className="h-5 w-5" />
          <span>Add Platform</span>
        </button> */}
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
                <span className="capitalize">{getStatusText(integration.status)}</span>
              </span>
            </div>

            {/* Show WhatsApp Setup for WhatsApp integration */}
            {integration.id === 'whatsapp' && integration.status === 'setup_required' ? (
              <div className="mb-4">
                <button
                  onClick={() => setShowWhatsAppSetup(true)}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>💬</span>
                  <span>Setup WhatsApp Business</span>
                </button>
              </div>
            ) : (
              <>
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
                  ) : integration.status === 'coming_soon' ? (
                    <button
                      disabled
                      className="w-full bg-gray-100 text-gray-500 px-3 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReconnect(integration.id)}
                      className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* WhatsApp Setup Modal */}
      {showWhatsAppSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">WhatsApp Business Setup</h3>
              <button
                onClick={() => setShowWhatsAppSetup(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <WhatsAppEmbeddedSignup isDarkMode={false} user={user} />
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsPage; 