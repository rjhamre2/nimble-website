import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { checkWhatsAppStatus, getWhatsAppLink } from '../../services/firebaseService';
import WhatsAppEmbeddedSignup from '../WhatsAppEmbeddedSignup';
import { QRCodeSVG } from 'qrcode.react';




const IntegrationsPage = ({ onWhatsAppSetupComplete }) => {
  const { user } = useAuth();
  const [isTesting, setIsTesting] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [isCheckingWhatsapp, setIsCheckingWhatsapp] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState(null);
  const [isLoadingLink, setIsLoadingLink] = useState(false);

  // Check WhatsApp status when component mounts
  useEffect(() => {
    const performWhatsAppStatusCheck = async () => {
      if (!user?.uid) return;
      
      console.log('🔍 IntegrationsPage: Starting WhatsApp status check for user:', user.uid);
      setIsCheckingWhatsapp(true);
      try {
        const data = await checkWhatsAppStatus(user.uid);
        console.log('✅ IntegrationsPage: WhatsApp status check result:', data);
        setWhatsappStatus(data);
        
        // If WhatsApp is connected, fetch the link
        if (data.success && data.isIntegrated) {
          await fetchWhatsAppLink();
        }
      } catch (error) {
        console.error('❌ IntegrationsPage: Error checking WhatsApp status:', error);
        setWhatsappStatus({ success: false, error: error.message });
      } finally {
        setIsCheckingWhatsapp(false);
      }
    };

    if (user?.uid && !whatsappStatus && !isCheckingWhatsapp) {
      performWhatsAppStatusCheck();
    }
  }, [user?.uid, whatsappStatus, isCheckingWhatsapp]);

  // Function to fetch WhatsApp link
  const fetchWhatsAppLink = async () => {
    if (!user?.uid) return;
    
    console.log('🔗 IntegrationsPage: Fetching WhatsApp link for user:', user.uid);
    setIsLoadingLink(true);
    try {
      const data = await getWhatsAppLink(user.uid);
      console.log('✅ IntegrationsPage: WhatsApp link result:', data);
      if (data.success && data.whatsapp_link) {
        setWhatsappLink(data.whatsapp_link);
      } else {
        setWhatsappLink(null);
      }
    } catch (error) {
      console.error('❌ IntegrationsPage: Error fetching WhatsApp link:', error);
      setWhatsappLink(null);
    } finally {
      setIsLoadingLink(false);
    }
  };

  // Function to refresh WhatsApp status after setup completion
  const handleWhatsAppSetupComplete = async () => {
    console.log('🔄 IntegrationsPage: WhatsApp setup completed, refreshing status...');
    console.log('🔄 IntegrationsPage: Current status before refresh:', whatsappStatus);
    
    // Reset status to trigger a fresh check
    setWhatsappStatus(null);
    setIsCheckingWhatsapp(false);
    
    // Perform immediate status check
    if (user?.uid) {
      setIsCheckingWhatsapp(true);
      try {
        console.log('🔄 IntegrationsPage: Calling checkWhatsAppStatus for user:', user.uid);
        const data = await checkWhatsAppStatus(user.uid);
        console.log('✅ IntegrationsPage: Refreshed WhatsApp status:', data);
        console.log('✅ IntegrationsPage: isIntegrated value:', data.isIntegrated);
        setWhatsappStatus(data);
        
        // If WhatsApp is connected, fetch the link
        if (data.success && data.isIntegrated) {
          await fetchWhatsAppLink();
        }
      } catch (error) {
        console.error('❌ IntegrationsPage: Error refreshing WhatsApp status:', error);
        setWhatsappStatus({ success: false, error: error.message });
      } finally {
        setIsCheckingWhatsapp(false);
      }
    }
    
    // Also notify parent Dashboard component
    if (onWhatsAppSetupComplete) {
      console.log('🔄 IntegrationsPage: Notifying parent Dashboard component');
      onWhatsAppSetupComplete();
    }
  };

  // Determine WhatsApp integration status
  const getWhatsAppStatus = () => {
    const status = isCheckingWhatsapp ? 'checking' : 
                  (!whatsappStatus || !whatsappStatus.success) ? 'error' :
                  whatsappStatus.isIntegrated ? 'connected' : 'setup_required';
    
    console.log('🔍 IntegrationsPage: getWhatsAppStatus called:', {
      isCheckingWhatsapp,
      whatsappStatus,
      determinedStatus: status
    });
    
    return status;
  };

  // Mock integrations data with dynamic WhatsApp status
  const integrations = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      status: getWhatsAppStatus(),
      icon: '💬',
      description: 'Business WhatsApp API',
      lastSync: getWhatsAppStatus() === 'connected' ? '2 minutes ago' : 'Not connected',
      messageCount: getWhatsAppStatus() === 'connected' ? '1,247' : '0'
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
    if (status === 'checking') return 'bg-blue-100 text-blue-800';
    if (status === 'error') return 'bg-red-100 text-red-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (status) => {
    if (status === 'connected') return <CheckCircleIcon className="h-5 w-5" />;
    if (status === 'setup_required') return <ArrowPathIcon className="h-5 w-5" />;
    if (status === 'coming_soon') return <ArrowPathIcon className="h-5 w-5" />;
    if (status === 'checking') return <ArrowPathIcon className="h-5 w-5 animate-spin" />;
    if (status === 'error') return <XCircleIcon className="h-5 w-5" />;
    return <XCircleIcon className="h-5 w-5" />;
  };

  const getStatusText = (status) => {
    if (status === 'connected') return 'Connected';
    if (status === 'setup_required') return 'Setup Required';
    if (status === 'coming_soon') return 'Coming Soon';
    if (status === 'checking') return 'Checking...';
    if (status === 'error') return 'Error';
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
                <div className="text-2xl">
                  {integration.id === 'whatsapp' && <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600" />}
                  {integration.id === 'instagram' && <span className="text-pink-600">📷</span>}
                  {integration.id === 'website' && <span className="text-blue-600">🌐</span>}
                </div>
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
                <WhatsAppEmbeddedSignup
                  isDarkMode={false}
                  user={user}
                  onSetupComplete={handleWhatsAppSetupComplete}
                />
              </div>
            ) : (
              <>


                {/* Show WhatsApp Link and QR Code for connected WhatsApp integration */}
                {integration.id === 'whatsapp' && integration.status === 'connected' && (
                  <div className="mb-4">
                    {isLoadingLink ? (
                      <div className="flex items-center justify-center p-4">
                        <ArrowPathIcon className="h-6 w-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-sm text-gray-600">Loading WhatsApp link...</span>
                      </div>
                    ) : whatsappLink ? (
                      <div className="space-y-4">
                        {/* WhatsApp Link */}
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2">WhatsApp Link</h4>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={whatsappLink}
                              readOnly
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                            />
                            <button
                              onClick={() => navigator.clipboard.writeText(whatsappLink)}
                              className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        
                        {/* QR Code */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-medium text-blue-800 mb-2">QR Code</h4>
                          <div className="flex justify-center">
                            <div className="p-2 bg-white rounded-lg">
                              <QRCodeSVG value={whatsappLink} size={128} />
                            </div>
                          </div>
                          <p className="text-xs text-blue-600 mt-2 text-center">
                            Scan this QR code to open WhatsApp
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          WhatsApp link not available. Please contact support.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions - Hide for connected WhatsApp */}
                {!(integration.id === 'whatsapp' && integration.status === 'connected') && (
                  <div className="flex space-x-2">
                    {integration.status === 'coming_soon' ? (
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
                )}
              </>
            )}
          </div>
        ))}
      </div>


    </div>
  );
};

export default IntegrationsPage; 