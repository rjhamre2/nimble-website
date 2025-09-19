import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  checkWhatsAppStatus,
  getUserDashboardStatus
} from '../../services/firebaseService';
import { onboardUser } from '../../services/onboardingService';
import { useNavigate } from 'react-router-dom';
import OnboardingBanner from './OnboardingBanner';
import Sidebar from './Sidebar';
import OverviewCards from './OverviewCards';
import LiveAgentPreview from './LiveAgentPreview';
import RecentChats from './RecentChats';
import IntegrationsPage from './IntegrationsPage';
import KnowledgeBase from './KnowledgeBase';
import AnalyticsReports from './AnalyticsReports';
import PlanBilling from './PlanBilling';
import Settings from './Settings';
import LiveChat from '../LiveChat';

const Dashboard = () => {
  const { user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [isCheckingWhatsapp, setIsCheckingWhatsapp] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isEditingOnboarding, setIsEditingOnboarding] = useState(false);
  const [companyInput, setCompanyInput] = useState('');
  const [specializationInput, setSpecializationInput] = useState('');
  const [isSubmittingOnboarding, setIsSubmittingOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState('');
  const [onboardingMessage, setOnboardingMessage] = useState('');
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const navigate = useNavigate();

  // Handle training status click
  const handleTrainingClick = () => {
    // Navigate to knowledge base page
    setActiveTab('knowledge');
  };

  // Handle WhatsApp status click
  const handleWhatsAppClick = () => {
    if (whatsappStatus?.success && whatsappStatus?.isIntegrated) {
      // Show phone number ID modal
      setIsWhatsAppModalOpen(true);
    } else {
      // Navigate to integrations page
      setActiveTab('integrations');
    }
  };

  // Handle tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Handle onboarding status click
  const handleOnboardingClick = () => {
    setOnboardingError('');
    setOnboardingMessage('');
    setCompanyInput(userData?.company || '');
    setSpecializationInput(userData?.specialization || '');
    setIsEditingOnboarding(false);
    setIsOnboardingModalOpen(true);
  };

  const handleOnboardingSubmit = async (e) => {
    e?.preventDefault?.();
    if (!companyInput?.trim() || !specializationInput?.trim()) {
      setOnboardingError('Please provide both company and specialization.');
      return;
    }
    try {
      setIsSubmittingOnboarding(true);
      setOnboardingError('');
      setOnboardingMessage('');
      await onboardUser(companyInput.trim(), specializationInput.trim());
      setOnboardingMessage('Onboarding updated successfully.');
      // Refresh dashboard status
      const dashboard = await getUserDashboardStatus(user.uid);
      setOnboardingStatus(dashboard?.onboarding || null);
      setTrainingStatus(dashboard?.training || null);
      setSubscriptionDetails(dashboard?.subscription || null);
    } catch (err) {
      setOnboardingError(err?.message || 'Failed to update onboarding.');
    } finally {
      setIsSubmittingOnboarding(false);
    }
  };

  // Refresh dashboard status
  const refreshDashboardStatus = async () => {
    if (!user?.uid) return;
    
    try {
      const dashboard = await getUserDashboardStatus(user.uid);
      setOnboardingStatus(dashboard?.onboarding || null);
      setTrainingStatus(dashboard?.training || null);
      setSubscriptionDetails(dashboard?.subscription || null);
    } catch (error) {
      console.error('Error refreshing dashboard status:', error);
    }
  };

  // Call Firebase Lambda to check WhatsApp status when user is authenticated
  useEffect(() => {
    const fetchAllStatuses = async () => {
      if (!user?.uid) return;

      console.log('🔍 Fetching dashboard statuses for user:', user.uid);
      setIsCheckingWhatsapp(true);
      try {
        const [wa, ob, tr, sub] = await Promise.all([
          checkWhatsAppStatus(user.uid),
          getUserDashboardStatus(user.uid)
        ]);
        console.log('✅ Statuses:', { wa, ob, tr, sub });
        setWhatsappStatus(wa);
        setOnboardingStatus(ob?.onboarding || null);
        setTrainingStatus(ob?.training || null);
        setSubscriptionDetails(ob?.subscription || null);
      } catch (error) {
        console.error('❌ Error fetching statuses:', error);
        if (!whatsappStatus) setWhatsappStatus({ success: false, error: error.message });
      } finally {
        setIsCheckingWhatsapp(false);
      }
    };

    if (user?.uid && !whatsappStatus && !onboardingStatus && !trainingStatus && !subscriptionDetails && !isCheckingWhatsapp) {
      fetchAllStatuses();
    }
  }, [user?.uid, whatsappStatus, onboardingStatus, trainingStatus, subscriptionDetails, isCheckingWhatsapp]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Status Indicators Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* WhatsApp Status */}
              <div 
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={handleWhatsAppClick}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">WhatsApp</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {whatsappStatus ? '✅ Connected' : '❌ Not Connected'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📱</span>
                  </div>
                </div>
              </div>

              {/* Training Status */}
              <div 
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={handleTrainingClick}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Training</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {trainingStatus ? '✅ Complete' : '⏳ Pending'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🧠</span>
                  </div>
                </div>
              </div>

              {/* Subscription Details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Subscription</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {subscriptionDetails?.plan || 'No Plan Selected'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">💳</span>
                  </div>
                </div>
              </div>

              {/* Onboarding Status */}
              <div 
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={handleOnboardingClick}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Onboarding</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {onboardingStatus ? '✅ Complete' : '⏳ Pending'}
                    </p>
                    {onboardingStatus && userData?.company && (
                      <p className="text-xs text-gray-500 mt-1">
                        {userData.company} • {userData.specialization}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🚀</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="space-y-6">
              <LiveAgentPreview />
              <RecentChats />
            </div>
          </div>
        );
      
        case 'integrations':
          return <IntegrationsPage />;
        case 'knowledge':
          return <KnowledgeBase />;
        case 'live-chat':
          return <LiveChat />;
        case 'analytics':
          return <AnalyticsReports />;
        case 'billing':
          return <PlanBilling />;
        case 'subscriptions':
          return <PlanBilling />;
        case 'settings':
          return <Settings />;
      default:
        return (
          <div className="space-y-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to NimbleAI Dashboard</h2>
              <p className="text-gray-600">Select a section from the sidebar to get started.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isOnboardingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Onboarding</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsOnboardingModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {onboardingStatus?.status === 'completed' && !isEditingOnboarding ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-700">You are onboarded with:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Company</div>
                    <div className="text-sm font-medium text-gray-900">{userData?.company || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Specialization</div>
                    <div className="text-sm font-medium text-gray-900">{userData?.specialization || '-'}</div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                    onClick={() => setIsEditingOnboarding(true)}
                  >
                    Update
                  </button>
                  <button
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                    onClick={() => setIsOnboardingModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleOnboardingSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    placeholder="Enter your company"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    value={specializationInput}
                    onChange={(e) => setSpecializationInput(e.target.value)}
                    placeholder="Enter your specialization"
                  />
                </div>

                {onboardingError && (
                  <div className="text-sm text-red-600">{onboardingError}</div>
                )}
                {onboardingMessage && (
                  <div className="text-sm text-green-600">{onboardingMessage}</div>
                )}

                <div className="flex justify-end space-x-3">
                  {onboardingStatus?.status === 'completed' && (
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                      onClick={() => setIsEditingOnboarding(false)}
                      disabled={isSubmittingOnboarding}
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                    onClick={() => setIsOnboardingModalOpen(false)}
                    disabled={isSubmittingOnboarding}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded hover:bg-yellow-600 disabled:opacity-60"
                    disabled={isSubmittingOnboarding}
                  >
                    {isSubmittingOnboarding ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">WhatsApp Integration</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsWhatsAppModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div>
                  <h3 className="font-medium text-gray-900">Integration Status</h3>
                  <p className="text-sm text-green-600">✅ Active</p>
                </div>
              </div>
              
              {whatsappStatus?.phoneNumberId && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Phone Number ID</h4>
                  <div className="flex items-center justify-between">
                    <code className="text-sm bg-white px-3 py-2 rounded border font-mono">
                      {whatsappStatus.phoneNumberId}
                    </code>
                    <button
                      className="ml-2 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      onClick={() => {
                        navigator.clipboard.writeText(whatsappStatus.phoneNumberId);
                        // You could add a toast notification here
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() => setActiveTab('integrations')}
                >
                  Manage Integration
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() => setIsWhatsAppModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Onboarding Summary Banner - Commented out
      <OnboardingBanner userData={userData} />
      */}
      <div className="flex">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {renderMainContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 