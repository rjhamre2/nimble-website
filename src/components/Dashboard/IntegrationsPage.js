import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { checkWhatsAppStatus, getWhatsAppLink } from '../../services/firebaseService';
import WhatsAppEmbeddedSignup from '../WhatsAppEmbeddedSignup';
import { QRCodeSVG } from 'qrcode.react';

const IntegrationsPage = ({ onWhatsAppSetupComplete }) => {
  const { user, userData } = useAuth();
  const [isTesting, setIsTesting] = useState(false);

  // --- WhatsApp State ---
  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [isCheckingWhatsapp, setIsCheckingWhatsapp] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState(null);
  const [isLoadingLink, setIsLoadingLink] = useState(false);

  // --- Shopify State ---
  // We initialize the Shopify status with preRegisteredDomain as null
  const [shopifyStatus, setShopifyStatus] = useState({ isIntegrated: false, preRegisteredDomain: null });
  const [showShopifyForm, setShowShopifyForm] = useState(false);
  const [shopifyDomain, setShopifyDomain] = useState('');
  const [shopifyError, setShopifyError] = useState('');
  const [isConnectingShopify, setIsConnectingShopify] = useState(false);

  // 👉 HARDCODED SHOPIFY LINK (Update this whenever you generate a new link in your Partner Dashboard)
  const SHOPIFY_HARDCODED_INSTALL_LINK = "https://admin.shopify.com/oauth/install_custom_app?client_id=f7dfd538c8935ab1fc83a6f4e0ae44ef&no_redirect=true&signature=eyJleHBpcmVzX2F0IjoxNzg2Njk2NjA2LCJwZXJtYW5lbnRfZG9tYWluIjoiNWcwbXd5LXpxLm15c2hvcGlmeS5jb20iLCJjbGllbnRfaWQiOiJmN2RmZDUzOGM4OTM1YWIxZmM4M2E2ZjRlMGFlNDRlZiIsInB1cnBvc2UiOiJjdXN0b21fYXBwIiwibWVyY2hhbnRfb3JnYW5pemF0aW9uX2lkIjoyMjkzNzYxOTN9--60c012f72d5ef7e07c65d3d644bca0e799ca9e82";
  // Check WhatsApp status when component mounts
  useEffect(() => {
    const performWhatsAppStatusCheck = async () => {
      if (!user?.uid) return;
      setIsCheckingWhatsapp(true);
      try {
        const data = await checkWhatsAppStatus(user.uid);
        setWhatsappStatus(data);
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

  const fetchWhatsAppLink = async () => {
    if (!user?.uid) return;
    setIsLoadingLink(true);
    try {
      const data = await getWhatsAppLink(user.uid);
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

  const handleWhatsAppSetupComplete = async () => {
    setWhatsappStatus(null);
    setIsCheckingWhatsapp(false);

    if (user?.uid) {
      setIsCheckingWhatsapp(true);
      try {
        const data = await checkWhatsAppStatus(user.uid);
        setWhatsappStatus(data);
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

    if (onWhatsAppSetupComplete) {
      onWhatsAppSetupComplete();
    }
  };

  const getWhatsAppStatus = () => {
    return isCheckingWhatsapp ? 'checking' :
      (!whatsappStatus || !whatsappStatus.success) ? 'error' :
        whatsappStatus.isIntegrated ? 'connected' : 'setup_required';
  };

  const handleReconnect = async (integrationId) => {
    setIsTesting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Successfully reconnected to ${integrationId}!`);
    } catch (error) {
      console.error('Reconnection error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  // --- PHASE 1: FORM VALIDATION AND DOMAIN SAVING ---
  const handleShopifyConnectSubmit = async (e) => {
    e.preventDefault();
    setShopifyError('');

    let cleanedDomain = shopifyDomain.trim().toLowerCase();
    if (!cleanedDomain) {
      setShopifyError('Please enter your store domain.');
      return;
    }

    cleanedDomain = cleanedDomain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    if (!cleanedDomain.endsWith('.myshopify.com')) {
      setShopifyError('Domain must follow the pattern: store-name.myshopify.com');
      return;
    }

    setIsConnectingShopify(true);

    try {
      // 1. Pre-register the domain to the user's account using your existing User API
      console.log(`Attempting to save domain "${cleanedDomain}" for user ${user}`);
      const response = await fetch(`http://localhost:3003/api/users/${userData.db_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopify_domain: cleanedDomain })
      });

      if (!response.ok) throw new Error('Failed to save domain');

      // 2. Hide the form and SHOW the static install link
      setShowShopifyForm(false);
      setShopifyStatus(prev => ({ ...prev, preRegisteredDomain: cleanedDomain }));

    } catch (err) {
      console.error(err);
      setShopifyError('Failed to save your store domain. Try again.');
    } finally {
      setIsConnectingShopify(false);
    }
  };

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
      id: 'shopify',
      name: 'Shopify',
      status: shopifyStatus?.isIntegrated ? 'connected' : 'setup_required',
      description: 'E-commerce store integration',
      lastSync: shopifyStatus?.isIntegrated ? 'Just now' : 'Not connected',
      messageCount: '0'
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {integration.id === 'whatsapp' && <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600" />}
                    {integration.id === 'shopify' && <ShoppingBagIcon className="h-8 w-8 text-[#95BF47]" />}
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

              {/* WhatsApp Context Layout */}
              {integration.id === 'whatsapp' && integration.status === 'setup_required' && (
                <div className="mb-4">
                  <WhatsAppEmbeddedSignup
                    isDarkMode={false}
                    user={user}
                    onSetupComplete={handleWhatsAppSetupComplete}
                  />
                </div>
              )}

              {/* Connected WhatsApp UI */}
              {integration.id === 'whatsapp' && integration.status === 'connected' && (
                <div className="mb-4 space-y-4">
                  {isLoadingLink ? (
                    <div className="flex items-center justify-center p-4">
                      <ArrowPathIcon className="h-6 w-6 animate-spin text-blue-600" />
                      <span className="ml-2 text-sm text-gray-600">Loading WhatsApp link...</span>
                    </div>
                  ) : whatsappLink ? (
                    <>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">WhatsApp Link</h4>
                        <div className="flex items-center space-x-2">
                          <input type="text" value={whatsappLink} readOnly className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-700" />
                          <button onClick={() => navigator.clipboard.writeText(whatsappLink)} className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors">Copy</button>
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">QR Code</h4>
                        <div className="flex justify-center">
                          <div className="p-2 bg-white rounded-lg"><QRCodeSVG value={whatsappLink} size={128} /></div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">WhatsApp link not available.</p>
                    </div>
                  )}
                </div>
              )}

              {/* --- SHOPIFY PRE-REGISTRATION FLOW --- */}

              {/* Step 1: The Input Form (Visible when Connect is clicked and domain not yet registered) */}
              {integration.id === 'shopify' && showShopifyForm && !shopifyStatus?.preRegisteredDomain && (
                <form onSubmit={handleShopifyConnectSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Step 1: Enter your Shopify Domain
                  </label>
                  <input
                    type="text"
                    value={shopifyDomain}
                    onChange={(e) => setShopifyDomain(e.target.value)}
                    placeholder="example-store.myshopify.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                  {shopifyError && (
                    <p className="text-xs text-red-600 mt-2 flex items-center">
                      <XCircleIcon className="h-3 w-3 mr-1 inline" /> {shopifyError}
                    </p>
                  )}
                  <div className="flex space-x-2 mt-3">
                    <button type="submit" disabled={isConnectingShopify} className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-blue-700">
                      {isConnectingShopify ? 'Saving...' : 'Save Domain'}
                    </button>
                    {/* Added a cancel button so you can hide the form without submitting */}
                    <button type="button" onClick={() => setShowShopifyForm(false)} className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-100 bg-white">
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: The Static Install Link (Revealed AFTER saving the domain) */}
              {integration.id === 'shopify' && shopifyStatus?.preRegisteredDomain && !shopifyStatus?.isIntegrated && (
                <div className="mb-4 space-y-4">
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Step 2: Install Application</h4>
                    <p className="text-xs text-gray-600 mb-3">
                      Your domain (<strong>{shopifyStatus.preRegisteredDomain}</strong>) is saved. Click below to authorize NimbleAI.
                    </p>
                    <a
                      href={SHOPIFY_HARDCODED_INSTALL_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full block text-center px-4 py-2 bg-[#95BF47] text-white text-sm font-medium rounded-lg hover:bg-[#7a9d3a]"
                    >
                      Install App
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Global Actions Block */}
            <div className="mt-4">

              {/* CONNECT BUTTON FOR SHOPIFY: Disappears when form is open OR domain is registered */}
              {integration.id === 'shopify' && integration.status !== 'connected' && !showShopifyForm && !shopifyStatus?.preRegisteredDomain && (
                <button
                  onClick={() => setShowShopifyForm(true)}
                  className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Connect
                </button>
              )}

              {/* OTHER INTEGRATIONS */}
              {integration.id !== 'shopify' && !(integration.id === 'whatsapp' && integration.status === 'connected') && (
                <div>
                  {integration.status === 'coming_soon' ? (
                    <button disabled className="w-full bg-gray-100 text-gray-500 px-3 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
                      Coming Soon
                    </button>
                  ) : (
                    integration.id !== 'whatsapp' && (
                      <button onClick={() => handleReconnect(integration.id)} className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        Connect
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationsPage;