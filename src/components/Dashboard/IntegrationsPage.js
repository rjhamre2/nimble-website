import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ShoppingBagIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { checkWhatsAppStatus, getWhatsAppLink } from '../../services/firebaseService';
import { checkShopifyStatus, saveShopifyDomain } from '../../services/shopifyService';
import WhatsAppEmbeddedSignup from '../WhatsAppEmbeddedSignup';
import { QRCodeSVG } from 'qrcode.react';

// ---------------------------------------------------------------------------
// Shopify install link (update whenever you generate a new one in your
// Partner Dashboard). This is only shown AFTER the domain is pre-registered.
// ---------------------------------------------------------------------------
const SHOPIFY_HARDCODED_INSTALL_LINK =
  'https://admin.shopify.com/oauth/install_custom_app?client_id=f7dfd538c8935ab1fc83a6f4e0ae44ef&no_redirect=true&signature=eyJleHBpcmVzX2F0IjoxNzg2Njk2NjA2LCJwZXJtYW5lbnRfZG9tYWluIjoiNWcwbXd5LXpxLm15c2hvcGlmeS5jb20iLCJjbGllbnRfaWQiOiJmN2RmZDUzOGM4OTM1YWIxZmM4M2E2ZjRlMGFlNDRlZiIsInB1cnBvc2UiOiJjdXN0b21fYXBwIiwibWVyY2hhbnRfb3JnYW5pemF0aW9uX2lkIjoyMjkzNzYxOTN9--60c012f72d5ef7e07c65d3d644bca0e799ca9e82';

// ---------------------------------------------------------------------------
// Helpers shared across cards
// ---------------------------------------------------------------------------
const STATUS_COLORS = {
  connected:      'bg-emerald-100 text-emerald-700 border border-emerald-200',
  setup_required: 'bg-amber-100 text-amber-700 border border-amber-200',
  coming_soon:    'bg-slate-100 text-slate-500 border border-slate-200',
  checking:       'bg-blue-100 text-blue-700 border border-blue-200',
  error:          'bg-red-100 text-red-700 border border-red-200',
};

const STATUS_LABELS = {
  connected:      'Connected',
  setup_required: 'Setup Required',
  coming_soon:    'Coming Soon',
  checking:       'Checking…',
  error:          'Error',
};

const StatusBadge = ({ status }) => {
  const isSpinning = status === 'checking';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[status] || STATUS_COLORS.error}`}
    >
      {status === 'connected'      && <CheckCircleIcon className="h-3.5 w-3.5" />}
      {status === 'setup_required' && <ArrowPathIcon className="h-3.5 w-3.5" />}
      {status === 'coming_soon'    && <ArrowPathIcon className="h-3.5 w-3.5" />}
      {status === 'checking'       && <ArrowPathIcon className={`h-3.5 w-3.5 ${isSpinning ? 'animate-spin' : ''}`} />}
      {status === 'error'          && <XCircleIcon className="h-3.5 w-3.5" />}
      {STATUS_LABELS[status] ?? 'Disconnected'}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const IntegrationsPage = ({ onWhatsAppSetupComplete }) => {
  const { user, userData } = useAuth();

  // ── WhatsApp state ───────────────────────────────────────────────────────
  const [whatsappStatus,    setWhatsappStatus]    = useState(null);
  const [isCheckingWa,      setIsCheckingWa]      = useState(false);
  const [whatsappLink,      setWhatsappLink]       = useState(null);
  const [isLoadingWaLink,   setIsLoadingWaLink]   = useState(false);

  // ── Shopify state ────────────────────────────────────────────────────────
  /**
   * shopifyStatus shape:
   *   { isConnected: boolean, shopifyDomain: string|null }
   *   | null  (not yet fetched)
   */
  const [shopifyStatus,         setShopifyStatus]         = useState(null);
  const [isCheckingShopify,     setIsCheckingShopify]     = useState(false);
  const [shopifyCheckError,     setShopifyCheckError]     = useState(null);

  // Connect flow
  const [showShopifyForm,       setShowShopifyForm]       = useState(false);
  const [shopifyDomainInput,    setShopifyDomainInput]    = useState('');
  const [shopifyFormError,      setShopifyFormError]      = useState('');
  const [isSavingDomain,        setIsSavingDomain]        = useState(false);
  // After saving domain — show the install link
  const [preRegisteredDomain,   setPreRegisteredDomain]   = useState(null);

  // ── Fetch Shopify status from backend ────────────────────────────────────
  const fetchShopifyStatus = useCallback(async () => {
    setIsCheckingShopify(true);
    setShopifyCheckError(null);
    try {
      const res = await checkShopifyStatus();
      if (res.success) {
        setShopifyStatus(res.data);
        // If already connected, no need to show domain form
        if (res.data.isConnected) {
          setPreRegisteredDomain(res.data.shopifyDomain);
          setShowShopifyForm(false);
        } else if (res.data.shopifyDomain) {
          // Domain saved but not yet connected — go straight to install step
          setPreRegisteredDomain(res.data.shopifyDomain);
        }
      } else {
        setShopifyStatus({ isConnected: false, shopifyDomain: null });
        setShopifyCheckError(res.error || 'Failed to check Shopify status');
      }
    } catch (err) {
      console.error('❌ IntegrationsPage: Shopify status check error:', err);
      setShopifyStatus({ isConnected: false, shopifyDomain: null });
      setShopifyCheckError(err.message);
    } finally {
      setIsCheckingShopify(false);
    }
  }, []);

  // ── Fetch WhatsApp status ────────────────────────────────────────────────
  const fetchWhatsAppStatus = useCallback(async () => {
    if (!user?.uid) return;
    setIsCheckingWa(true);
    try {
      const data = await checkWhatsAppStatus(user.uid);
      setWhatsappStatus(data);
      if (data.success && data.isIntegrated) {
        fetchWhatsAppLink();
      }
    } catch (err) {
      console.error('❌ IntegrationsPage: WhatsApp status check error:', err);
      setWhatsappStatus({ success: false, error: err.message });
    } finally {
      setIsCheckingWa(false);
    }
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchWhatsAppLink = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoadingWaLink(true);
    try {
      const data = await getWhatsAppLink(user.uid);
      setWhatsappLink(data.success && data.whatsapp_link ? data.whatsapp_link : null);
    } catch (err) {
      console.error('❌ IntegrationsPage: WhatsApp link fetch error:', err);
      setWhatsappLink(null);
    } finally {
      setIsLoadingWaLink(false);
    }
  }, [user?.uid]);

  // ── On mount ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchShopifyStatus();
  }, [fetchShopifyStatus]);

  useEffect(() => {
    if (user?.uid && !whatsappStatus && !isCheckingWa) {
      fetchWhatsAppStatus();
    }
  }, [user?.uid, whatsappStatus, isCheckingWa, fetchWhatsAppStatus]);

  // ── WhatsApp helpers ─────────────────────────────────────────────────────
  const handleWhatsAppSetupComplete = async () => {
    setWhatsappStatus(null);
    setIsCheckingWa(false);
    await fetchWhatsAppStatus();
    onWhatsAppSetupComplete?.();
  };

  const getWhatsAppStatusKey = () => {
    if (isCheckingWa)                              return 'checking';
    if (!whatsappStatus || !whatsappStatus.success) return 'error';
    return whatsappStatus.isIntegrated             ? 'connected' : 'setup_required';
  };

  // ── Shopify helpers ──────────────────────────────────────────────────────
  const getShopifyStatusKey = () => {
    if (isCheckingShopify)         return 'checking';
    if (!shopifyStatus)            return 'checking'; // initial load
    return shopifyStatus.isConnected ? 'connected' : 'setup_required';
  };

  const handleShopifyConnectSubmit = async (e) => {
    e.preventDefault();
    setShopifyFormError('');

    let domain = shopifyDomainInput.trim().toLowerCase();
    if (!domain) {
      setShopifyFormError('Please enter your store domain.');
      return;
    }
    // Strip protocol / www
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    if (!domain.endsWith('.myshopify.com')) {
      setShopifyFormError('Domain must follow the pattern: store-name.myshopify.com');
      return;
    }

    if (!userData?.db_id) {
      setShopifyFormError('Unable to identify your account. Please refresh and try again.');
      return;
    }

    setIsSavingDomain(true);
    try {
      await saveShopifyDomain(userData.db_id, domain);
      setPreRegisteredDomain(domain);
      setShopifyStatus(prev => ({ ...prev, shopifyDomain: domain }));
      setShowShopifyForm(false);
    } catch (err) {
      console.error(err);
      setShopifyFormError('Failed to save your store domain. Please try again.');
    } finally {
      setIsSavingDomain(false);
    }
  };

  const handleShopifyDisconnect = async () => {
    // Re-fetch to reflect current DB state
    setPreRegisteredDomain(null);
    setShopifyDomainInput('');
    await fetchShopifyStatus();
  };

  // ── Derived integration list ──────────────────────────────────────────────
  const shopifyStatusKey = getShopifyStatusKey();
  const waStatusKey      = getWhatsAppStatusKey();

  const integrations = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      description: 'Business WhatsApp API',
      status: waStatusKey,
    },
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'E-commerce store integration',
      status: shopifyStatusKey,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      description: 'Instagram Direct Messages',
      status: 'coming_soon',
    },
    {
      id: 'website',
      name: 'Website Chat',
      description: 'Website chat widget',
      status: 'coming_soon',
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Integrations</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage your platform connections</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col"
          >
            {/* ── Card header ── */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="flex-shrink-0">
                  {integration.id === 'whatsapp' && (
                    <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600" />
                  )}
                  {integration.id === 'shopify' && (
                    <ShoppingBagIcon className="h-8 w-8 text-[#95BF47]" />
                  )}
                  {integration.id === 'instagram' && (
                    <span className="text-2xl">📷</span>
                  )}
                  {integration.id === 'website' && (
                    <span className="text-2xl">🌐</span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 leading-tight">
                    {integration.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{integration.description}</p>
                </div>
              </div>
              <StatusBadge status={integration.status} />
            </div>

            {/* ── WhatsApp — setup required ── */}
            {integration.id === 'whatsapp' && integration.status === 'setup_required' && (
              <div className="mb-4">
                <WhatsAppEmbeddedSignup
                  isDarkMode={false}
                  user={user}
                  onSetupComplete={handleWhatsAppSetupComplete}
                />
              </div>
            )}

            {/* ── WhatsApp — connected ── */}
            {integration.id === 'whatsapp' && integration.status === 'connected' && (
              <div className="mb-4 space-y-3">
                {isLoadingWaLink ? (
                  <div className="flex items-center gap-2 p-3 text-sm text-gray-500">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Loading WhatsApp link…
                  </div>
                ) : whatsappLink ? (
                  <>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-2">
                        WhatsApp Link
                      </h4>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={whatsappLink}
                          readOnly
                          className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-white text-gray-700 truncate"
                        />
                        <button
                          onClick={() => navigator.clipboard.writeText(whatsappLink)}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors whitespace-nowrap"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-2">
                        QR Code
                      </h4>
                      <div className="flex justify-center">
                        <div className="p-2 bg-white rounded-lg">
                          <QRCodeSVG value={whatsappLink} size={120} />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    WhatsApp link not available yet.
                  </div>
                )}
              </div>
            )}

            {/* ── WhatsApp — error ── */}
            {integration.id === 'whatsapp' && integration.status === 'error' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                Unable to check WhatsApp status. Please refresh the page.
              </div>
            )}

            {/* ────────────────────────────────────────────────────────────
                SHOPIFY CARD BODY
            ──────────────────────────────────────────────────────────── */}

            {/* Status error (backend check failed) */}
            {integration.id === 'shopify' && shopifyCheckError && !shopifyStatus?.isConnected && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                Could not check Shopify status: {shopifyCheckError}
              </div>
            )}

            {/* Connected — show domain info */}
            {integration.id === 'shopify' && integration.status === 'connected' && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <LinkIcon className="h-3.5 w-3.5" />
                  Connected Store
                </div>
                <p className="text-sm font-medium text-gray-900 break-all">
                  {shopifyStatus?.shopifyDomain}
                </p>
                {shopifyStatus?.expiresAt ? (
                  <p className="text-xs text-gray-600">
                    Validity:{' '}
                    <span className={shopifyStatus?.isExpired ? "text-red-600 font-semibold" : "text-emerald-700 font-medium"}>
                      {shopifyStatus?.isExpired ? 'Expired' : `Valid until ${new Date(shopifyStatus.expiresAt).toLocaleDateString()}`}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-emerald-700 font-medium">
                    Validity: Permanent access
                  </p>
                )}
              </div>
            )}

            {/* Step 1 — domain input form */}
            {integration.id === 'shopify' &&
              showShopifyForm &&
              !preRegisteredDomain &&
              integration.status !== 'connected' && (
                <form
                  onSubmit={handleShopifyConnectSubmit}
                  className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3"
                >
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Step 1 — Enter your Shopify domain
                  </label>
                  <input
                    id="shopify-domain-input"
                    type="text"
                    value={shopifyDomainInput}
                    onChange={(e) => setShopifyDomainInput(e.target.value)}
                    placeholder="example-store.myshopify.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    autoFocus
                  />
                  {shopifyFormError && (
                    <p className="flex items-center gap-1 text-xs text-red-600">
                      <XCircleIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      {shopifyFormError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSavingDomain}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
                    >
                      {isSavingDomain ? 'Saving…' : 'Save Domain'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowShopifyForm(false); setShopifyFormError(''); }}
                      className="px-3 py-2 border border-gray-300 text-gray-600 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

            {/* Step 2 — show install link after domain is saved but not yet connected */}
            {integration.id === 'shopify' &&
              preRegisteredDomain &&
              !shopifyStatus?.isConnected && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Step 2 — Install Application
                    </p>
                    <p className="text-xs text-gray-500">
                      Domain{' '}
                      <span className="font-medium text-gray-700 break-all">
                        {preRegisteredDomain}
                      </span>{' '}
                      saved. Authorise NimbleAI in your Shopify store.
                    </p>
                  </div>
                  <a
                    href={SHOPIFY_HARDCODED_INSTALL_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-4 py-2 bg-[#95BF47] text-white text-sm font-medium rounded-lg hover:bg-[#7a9d3a] transition-colors"
                  >
                    Install App on Shopify
                  </a>
                  <button
                    type="button"
                    onClick={fetchShopifyStatus}
                    className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors"
                  >
                    <ArrowPathIcon className={`h-3.5 w-3.5 ${isCheckingShopify ? 'animate-spin' : ''}`} />
                    Check connection status
                  </button>
                </div>
              )}

            {/* ── Card footer actions ── */}
            <div className="mt-auto pt-4">

              {/* Shopify — primary Connect button (shown before any step begins) */}
              {integration.id === 'shopify' &&
                integration.status !== 'connected' &&
                !showShopifyForm &&
                !preRegisteredDomain && (
                  <button
                    id="shopify-connect-btn"
                    onClick={() => { setShowShopifyForm(true); setShopifyFormError(''); }}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Connect Shopify
                  </button>
                )}

              {/* Shopify — refresh button when connected */}
              {integration.id === 'shopify' && integration.status === 'connected' && (
                <button
                  onClick={fetchShopifyStatus}
                  className="flex items-center justify-center gap-1.5 w-full px-3 py-2 border border-gray-200 text-gray-500 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                >
                  <ArrowPathIcon className={`h-3.5 w-3.5 ${isCheckingShopify ? 'animate-spin' : ''}`} />
                  Refresh status
                </button>
              )}

              {/* Non-Shopify cards */}
              {integration.id !== 'shopify' &&
                !(integration.id === 'whatsapp' && integration.status === 'connected') && (
                  integration.status === 'coming_soon' ? (
                    <button
                      disabled
                      className="w-full bg-gray-100 text-gray-400 px-3 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  ) : (
                    integration.id !== 'whatsapp' && (
                      <button className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        Connect
                      </button>
                    )
                  )
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationsPage;