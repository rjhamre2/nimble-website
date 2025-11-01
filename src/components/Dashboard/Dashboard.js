import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  checkWhatsAppStatus,
  getUserDashboardStatus
} from '../../services/firebaseService';
import { onboardUser } from '../../services/onboardingService';
import { useNavigate } from 'react-router-dom';
import { apiConfig } from '../../config/api';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
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
  const { user, userData, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('team-inbox');
  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [pricingSubscriptionStatus, setPricingSubscriptionStatus] = useState(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [isCheckingWhatsapp, setIsCheckingWhatsapp] = useState(false);
  const [broadcastView, setBroadcastView] = useState('new-broadcast');
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(false);
  const [isLoadingTraining, setIsLoadingTraining] = useState(false);
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

  // Handle subscription status click
  const handleSubscriptionClick = () => {
    setActiveTab('subscriptions');
  };

  // Handle tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    
    // If dashboard tab is clicked, refresh modal status
    if (tabId === 'dashboard') {
      refreshDashboardStatus();
    }
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

  // Compute border colors for status cards
  const whatsappBorderClass = (() => {
    if (whatsappStatus?.success && whatsappStatus?.isIntegrated) return 'border-green-500';
    if (whatsappStatus === null) return 'border-gray-300';
    return 'border-yellow-400';
  })();

  const onboardingBorderClass = (() => {
    if (onboardingStatus?.status === 'completed') return 'border-green-500';
    //if (!onboardingStatus) return 'border-gray-300';
    return 'border-yellow-400';
  })();

  const trainingBorderClass = (() => {
    const s = trainingStatus?.status;
    if (s === 'completed') return 'border-green-500';
    //if (s === 'not_started' || !s) return 'border-gray-300';
    return 'border-yellow-400';
  })();

  const subscriptionBorderClass = (() => {
    if (isLoadingSubscription) return 'border-blue-500';
    const s = (pricingSubscriptionStatus?.status || '').toLowerCase();
    if (s === 'authenticated' || s === 'active') return 'border-green-500';
    if (s === 'inactive' || s === 'not_created' || !s) return 'border-gray-300';
    return 'border-yellow-400';
  })();

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

  // Fetch subscription status from pricing lambda
  const fetchPricingSubscriptionStatus = async () => {
    if (!user?.uid) return;
    
    setIsLoadingSubscription(true);
    try {
      console.log('🔍 Fetching subscription status from pricing lambda for user:', user.uid);
      const response = await fetch(apiConfig.endpoints.pricing.fetchSubscriptionStatus(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.uid
        })
      });

      const data = await response.json();
      console.log('✅ Pricing subscription status response:', data);
      
      if (data.success) {
        setPricingSubscriptionStatus(data);
      } else {
        console.error('❌ Failed to fetch pricing subscription status:', data.error);
        setPricingSubscriptionStatus(null);
      }
    } catch (error) {
      console.error('❌ Error fetching pricing subscription status:', error);
      setPricingSubscriptionStatus(null);
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  // Refresh dashboard status
  const refreshDashboardStatus = async () => {
    if (!user?.uid) return;
    
    setIsLoadingOnboarding(true);
    setIsLoadingTraining(true);
    try {
      const dashboard = await getUserDashboardStatus(user.uid);
      setOnboardingStatus(dashboard?.onboarding || null);
      setTrainingStatus(dashboard?.training || null);
      setSubscriptionDetails(dashboard?.subscription || null);
    } catch (error) {
      console.error('Error refreshing dashboard status:', error);
    } finally {
      setIsLoadingOnboarding(false);
      setIsLoadingTraining(false);
    }
  };

  // Refresh all statuses including WhatsApp and pricing subscription
  const refreshAllStatuses = async () => {
    if (!user?.uid) return;
    
    setIsCheckingWhatsapp(true);
    setIsLoadingOnboarding(true);
    setIsLoadingTraining(true);
    try {
      const [wa, ob, tr, sub, pricingSub] = await Promise.all([
        checkWhatsAppStatus(user.uid),
        getUserDashboardStatus(user.uid),
        fetchPricingSubscriptionStatus()
      ]);
      setWhatsappStatus(wa);
      setOnboardingStatus(ob?.onboarding || null);
      setTrainingStatus(ob?.training || null);
      setSubscriptionDetails(ob?.subscription || null);
      setPricingSubscriptionStatus(pricingSub);
    } catch (error) {
      console.error('Error refreshing all statuses:', error);
    } finally {
      setIsCheckingWhatsapp(false);
      setIsLoadingOnboarding(false);
      setIsLoadingTraining(false);
    }
  };

  // Call Firebase Lambda to check WhatsApp status when user is authenticated
  useEffect(() => {
    const fetchAllStatuses = async () => {
      if (!user?.uid) return;

      console.log('🔍 Fetching dashboard statuses for user:', user.uid);
      setIsCheckingWhatsapp(true);
      setIsLoadingOnboarding(true);
      setIsLoadingTraining(true);
      try {
        const [wa, ob, tr, sub, pricingSub] = await Promise.all([
          checkWhatsAppStatus(user.uid),
          getUserDashboardStatus(user.uid),
          fetchPricingSubscriptionStatus()
        ]);
        console.log('✅ Statuses:', { wa, ob, tr, sub, pricingSub });
        setWhatsappStatus(wa);
        setOnboardingStatus(ob?.onboarding || null);
        setTrainingStatus(ob?.training || null);
        setSubscriptionDetails(ob?.subscription || null);
      } catch (error) {
        console.error('❌ Error fetching statuses:', error);
        if (!whatsappStatus) setWhatsappStatus({ success: false, error: error.message });
      } finally {
        setIsCheckingWhatsapp(false);
        setIsLoadingOnboarding(false);
        setIsLoadingTraining(false);
      }
    };

    if (user?.uid && !whatsappStatus && !onboardingStatus && !trainingStatus && !subscriptionDetails && !pricingSubscriptionStatus && !isLoadingSubscription && !isCheckingWhatsapp) {
      fetchAllStatuses();
    }
  }, [user?.uid, whatsappStatus, onboardingStatus, trainingStatus, subscriptionDetails, pricingSubscriptionStatus, isLoadingSubscription, isCheckingWhatsapp]);

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
      case 'team-inbox':
        return <LiveChat />;
      
      case 'broadcast':
        return (
          <div className="w-full" style={{ height: 'calc(100vh - 64px)' }}>
            <div className="pl-0 pr-4 w-full" style={{ height: 'calc(100vh - 64px)' }}>
              <div className="grid grid-cols-1 lg:grid-cols-9 gap-0 w-full" style={{ height: 'calc(100vh - 64px)' }}>
                <div className="lg:col-span-2 rounded-lg shadow-lg flex flex-col bg-white" style={{ height: 'calc(100vh - 64px)' }}>
                <div className="pr-0 pl-0 pt-0 pb-0 border-b flex-shrink-0 border-gray-200">
                  <div className="flex items-center gap-0">
                    <div className="relative flex-1">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      className="w-10 h-10 flex items-center justify-center font-medium text-sm transition-colors flex-shrink-0 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      title="New Chat"
                    >
                      <span className="text-lg">+</span>
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 px-0 py-2 border-t border-gray-200">
                    <button 
                      onClick={() => setBroadcastView('new-broadcast')}
                      className={`w-full px-3 py-2 text-xs font-medium border rounded-lg transition-colors ${
                        broadcastView === 'new-broadcast' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      New Broadcast
                    </button>
                    <button 
                      onClick={() => setBroadcastView('templates')}
                      className={`w-full px-3 py-2 text-xs font-medium border rounded-lg transition-colors ${
                        broadcastView === 'templates' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Templates
                    </button>
                    <button 
                      onClick={() => setBroadcastView('analytics')}
                      className={`w-full px-3 py-2 text-xs font-medium border rounded-lg transition-colors ${
                        broadcastView === 'analytics' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Analytics
                    </button>
                  </div>
                </div>
                  <div className="flex-1 overflow-y-auto p-6">
                  </div>
                </div>
                {/* Right Panel */}
                <div className="lg:col-span-7 rounded-lg shadow-lg flex flex-col bg-white" style={{ height: 'calc(100vh - 64px)' }}>
                  <div className="flex-1 overflow-y-auto p-6">
                    {broadcastView === 'templates' && (
                      <div className="space-y-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Template Library</h2>
                            <p className="text-sm text-gray-600 mb-4">
                              Select or create your template and submit it for WhatsApp approval. All templates must adhere to WhatsApp's guidelines.
                            </p>
                          </div>
                          <button className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                            Watch Tutorial
                          </button>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                            New Template Message
                          </button>
                          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>English</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                          <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium whitespace-nowrap">
                            All
                          </button>
                          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 whitespace-nowrap">
                            Travel <span className="text-gray-500">(6)</span>
                          </button>
                          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 whitespace-nowrap">
                            Healthcare <span className="text-gray-500">(5)</span>
                          </button>
                          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 whitespace-nowrap">
                            E-Commerce <span className="text-gray-500">(14)</span>
                          </button>
                          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 whitespace-nowrap">
                            More...
                          </button>
                        </div>

                        <div className="space-y-4">
                          {/* Template 1 */}
                          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Login_Verification</h3>
                                <span className="text-xs text-gray-500">Others</span>
                              </div>
                              <button className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                                Use sample
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                              Hi {`{{name}}`},

                              To verify your login attempt, please enter the following code in the login page:

                              🔑 **Your Code**: [Verification Code]

                              This code will expire in **[Time Duration]**.

                              If this wasn't you, please reset your password or contact our support team at (support_method)
                            </p>
                          </div>

                          {/* Template 2 */}
                          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Login_Verification</h3>
                                <span className="text-xs text-gray-500">Others</span>
                              </div>
                              <button className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                                Use sample
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                              Hi {`{{name}}`},

                              To verify your login attempt, please enter the following code in the app or website:

                              🔑 **Your Code**: [Verification Code]

                              This code will expire in **[Time Duration]**.
                              Please do not share this code with anyone for your safety.

                              If this wasn't you, please reset your password or contact our support team at (support_method)
                            </p>
                          </div>

                          {/* Template 3 */}
                          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Login_Verification</h3>
                                <span className="text-xs text-gray-500">Others</span>
                              </div>
                              <button className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                                Use sample
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                              "Hi {`{{name}}`},

                              To complete your purchase, please enter the following OTP (One-Time Password) on our login page:

                              🛍️ **Your OTP**: [OTP Code]
                              Please do not share this code with anyone for your safety.
                              This OTP is valid for **[Time Duration]**. If you didn't request this, please contact our support team for assistance at (support_method)."
                            </p>
                          </div>

                          {/* Template 4 */}
                          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Two-Factor_Authentication (2FA) Code</h3>
                                <span className="text-xs text-gray-500">Others</span>
                              </div>
                              <button className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                                Use sample
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                              Hi {`{{name}}`},

                              For added security, please use the following code to complete your login:

                              🔑 **Your Code**: [Authentication Code]

                              Please do not share this code with anyone for your safety.

                              If you did not request this, please contact our support team immediately at (support_method).
                            </p>
                          </div>

                          {/* Template 5 */}
                          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">OTP_for_Checkout</h3>
                                <span className="text-xs text-gray-500">Others</span>
                              </div>
                              <button className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                                Use sample
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                              Hi {`{{name}}`},

                              To complete your purchase, please enter the following OTP (One-Time Password) on our checkout page:

                              🛍️ **Your OTP**: [OTP Code]

                              This OTP is valid for **[Time Duration]**. If you didn't request this, please contact our support team for assistance at (support_method).
                            </p>
                          </div>

                          {/* Template 6 */}
                          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Two-Factor_Authentication (2FA) Code</h3>
                                <span className="text-xs text-gray-500">Others</span>
                              </div>
                              <button className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                                Use sample
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                              Hi {`{{name}}`},

                              For added security, please use the following code to complete your login:

                              🔑 **Your Code**: [Authentication Code]

                              If you did not request this, please contact our support team immediately at (support_method).
                            </p>
                          </div>

                          {/* Template 7 */}
                          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Booking_Confirmation</h3>
                                <span className="text-xs text-gray-500">Travel</span>
                              </div>
                              <button className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                                Use sample
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                              Hi [Customer Name],

                              Great news! Your trip to [Destination] is confirmed! 🎉 Here are your booking details:

                              🌍 Destination: [Destination Name]

                              📅 Travel Dates: [Start Date] - [End Date]

                              ✈️ Flight Number: [Flight Number]

                              🏨 Hotel: [Hotel Name]

                              👉 You can access your full itinerary here: [Link]

                              If you have any questions or need further assistance, feel free to reply to this message or contact us at [Phone Number].

                              Safe travels and thank you for choosing [Travel Agency Name]!
                            </p>
                          </div>

                          {/* Template 8 */}
                          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Prescription_Renewal_Reminder</h3>
                                <span className="text-xs text-gray-500">Healthcare</span>
                              </div>
                              <button className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                                Use sample
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                              Hi {`{{name}}`},

                              This is a friendly reminder that it's time to renew your prescription for [Medication Name]. To ensure you don't run out of your medication, please submit a renewal request before [Date].
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {broadcastView === 'analytics' && (
                      <div className="space-y-6">
                        <div className="flex items-start justify-between">
                          <h2 className="text-2xl font-semibold text-gray-900">Broadcast Analytics</h2>
                          <button className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                            Watch Tutorial
                          </button>
                        </div>

                        <div className="flex items-center justify-end mb-4">
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                            New Broadcast
                          </button>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-4 bg-white">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Overview</h3>
                            <div className="flex items-center gap-2">
                              <button className="px-3 py-1 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                                Export
                              </button>
                              <button className="px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                                Preview with sample data
                              </button>
                            </div>
                          </div>

                          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">Your daily Meta messaging limit</span>
                              <button className="text-xs text-blue-600 hover:underline">What are limits?</button>
                            </div>
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">250/250</span> unique contacts
                            </p>
                          </div>

                          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-4">Consecutive days of messaging</p>
                            <div className="text-xs text-gray-500">Messaging Quality</div>
                            <div className="text-sm text-gray-700 font-medium mt-1">Quality Unavailable</div>
                          </div>

                          <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="text-center">
                              <div className="text-2xl font-semibold text-gray-900 mb-1">0</div>
                              <div className="text-xs text-gray-600">Sent</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-semibold text-gray-900 mb-1">0</div>
                              <div className="text-xs text-gray-600">Delivered</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-semibold text-gray-900 mb-1">0</div>
                              <div className="text-xs text-gray-600">Read</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-semibold text-gray-900 mb-1">0</div>
                              <div className="text-xs text-gray-600">Replied</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-semibold text-gray-900 mb-1">0</div>
                              <div className="text-xs text-gray-600">Sending</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-semibold text-gray-900 mb-1">0</div>
                              <div className="text-xs text-gray-600">Failed</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-semibold text-gray-900 mb-1">0</div>
                              <div className="text-xs text-gray-600">Processing</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-semibold text-gray-900 mb-1">0</div>
                              <div className="text-xs text-gray-600">Queued</div>
                            </div>
                          </div>
                        </div>

                        <div className="border border-gray-200 rounded-lg bg-white">
                          <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-gray-900">Broadcast list</h3>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600">Sorted by:</span>
                                <select className="px-3 py-1 text-xs border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                  <option>Latest</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-6 gap-4 text-xs font-medium text-gray-700 pb-2 border-b border-gray-200">
                              <div>Broadcast name</div>
                              <div>Total recipients</div>
                              <div>Successful</div>
                              <div>Read</div>
                              <div>Replied</div>
                              <div className="col-span-2 flex items-center justify-between">
                                <span>Website clicks</span>
                                <span>Actions</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-12 text-center">
                            <div className="text-gray-400 mb-2">
                              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">No data</p>
                            <p className="text-xs text-gray-500 mb-4">No Broadcasts here</p>
                            <p className="text-xs text-gray-600 mb-4">
                              Start sending broadcast messages on WhatsApp and monitor read rate, response rate, etc.
                            </p>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                              New Broadcast
                            </button>
                          </div>

                          <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <span>Rows per page:</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {broadcastView === 'new-broadcast' && (
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 mb-2">What message do you want to send?</h2>
                          <p className="text-sm text-gray-600 mb-4">Add broadcast name and template below</p>
                          
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Broadcast name</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter broadcast name"
                            />
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select template message</label>
                            <button className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left text-gray-700 hover:bg-gray-50 flex items-center justify-between">
                              <span>Select a template</span>
                              <span className="text-blue-600">+Add New Template</span>
                            </button>
                          </div>
                        </div>

                        <div className="border-t pt-6">
                          <h2 className="text-xl font-semibold text-gray-900 mb-2">Who is your audience?</h2>
                          <p className="text-sm text-gray-600 mb-4">Choose from pre-built segments, imported contacts, or manual selection</p>
                          
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Segments</label>
                            <div className="space-y-2">
                              <button className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 flex items-center gap-2">
                                <span>New</span>
                                <span className="text-gray-400 ml-auto">Share feedback</span>
                              </button>
                              <div className="grid grid-cols-2 gap-2">
                                <button className="px-3 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span>🤑</span>
                                    <span className="font-medium">Highly engaged</span>
                                  </div>
                                  <span className="text-xs text-gray-500">(0)</span>
                                </button>
                                <button className="px-3 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span>🚨</span>
                                    <span className="font-medium">Winback</span>
                                  </div>
                                  <span className="text-xs text-gray-500">(0)</span>
                                </button>
                                <button className="px-3 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span>😴</span>
                                    <span className="font-medium">At Risk</span>
                                  </div>
                                  <span className="text-xs text-gray-500">(0)</span>
                                </button>
                                <button className="px-3 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span>✅</span>
                                    <span className="font-medium">All valid</span>
                                  </div>
                                  <span className="text-xs text-gray-500">(0)</span>
                                </button>
                              </div>
                              <button className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-center text-gray-600 hover:bg-gray-50">
                                Add another filter +
                              </button>
                            </div>
                          </div>

                          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700 mb-2">
                              Selected: <span className="font-medium">0 / 250</span> Contacts remaining
                            </p>
                            <p className="text-sm text-gray-700">
                              Daily limit: <span className="font-medium">250/Day</span>
                            </p>
                          </div>

                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                              <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-700">
                                <div>Rupesh J</div>
                                <div>918419922107</div>
                                <div>TRUE</div>
                                <div>success</div>
                              </div>
                            </div>
                            <div className="bg-white px-4 py-3 border-b border-gray-200">
                              <div className="grid grid-cols-4 gap-4 text-xs text-gray-600">
                                <div>Rupesh J</div>
                                <div>918419922107</div>
                                <div>TRUE</div>
                                <div>success</div>
                              </div>
                            </div>
                            <div className="bg-white px-4 py-3 border-b border-gray-200">
                              <div className="grid grid-cols-4 gap-4 text-xs text-gray-600">
                                <div>WATI Test</div>
                                <div>85264318721</div>
                                <div>TRUE</div>
                                <div>success</div>
                              </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3">
                              <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>Rows per page:</span>
                                <span>1–2 of 2</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-6">
                          <h2 className="text-xl font-semibold text-gray-900 mb-4">When do you want to send it?</h2>
                          <div className="space-y-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="send-time" value="now" defaultChecked className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-700">Send now</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="send-time" value="schedule" className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-700">Schedule for a specific time</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'contacts':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Contacts</h2>
                  <p className="text-sm text-gray-600">
                    Contact list stores the list of numbers that you've interacted with. You can even manually export or import contacts.
                  </p>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                  Watch Tutorial
                </button>
              </div>

              <div className="flex items-center justify-between mb-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2">
                  <span>+</span>
                  <span>Add Contact</span>
                  <span className="text-xs bg-blue-700 px-2 py-1 rounded">2 in total</span>
                </button>
              </div>

              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">BUSINESS</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      Secure customer interactions by masking phone numbers during support conversations.
                    </p>
                    <button className="px-3 py-1 text-xs font-medium bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors">
                      Upgrade
                    </button>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Sorted by:</span>
                      <select className="px-3 py-1 text-xs border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>Last Updated</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                        Export
                      </button>
                      <button className="px-3 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                        Import
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4 text-xs font-medium text-gray-700 pb-2">
                    <div>Basic info</div>
                    <div>Phone number</div>
                    <div>Source</div>
                    <div>Contact Attributes</div>
                    <div>Edit/Delete</div>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {/* Contact 1 */}
                  <div className="p-4 hover:bg-gray-50">
                    <div className="grid grid-cols-5 gap-4 items-center">
                      <div className="text-sm font-medium text-gray-900">Rupesh J</div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span>🇮🇳</span>
                        <span>(+91)8419922107</span>
                      </div>
                      <div className="text-sm text-gray-700">Wati</div>
                      <div className="text-sm text-gray-700">
                        <div>lead_stage: New Lead</div>
                        <div>contact_owner:</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-2 py-1 text-xs text-blue-600 hover:underline">Edit</button>
                        <button className="px-2 py-1 text-xs text-red-600 hover:underline">Delete</button>
                      </div>
                    </div>
                  </div>

                  {/* Contact 2 */}
                  <div className="p-4 hover:bg-gray-50">
                    <div className="grid grid-cols-5 gap-4 items-center">
                      <div className="text-sm font-medium text-gray-900">WATI Test</div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span>🇭🇰</span>
                        <span>(+852)64318721</span>
                      </div>
                      <div className="text-sm text-gray-700">Wati</div>
                      <div className="text-sm text-gray-700">
                        <div>allowbroadcast: TRUE</div>
                        <div>allowsms: TRUE</div>
                        <button className="mt-2 text-xs text-blue-600 hover:underline">Show all attributes</button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-2 py-1 text-xs text-blue-600 hover:underline">Edit</button>
                        <button className="px-2 py-1 text-xs text-red-600 hover:underline">Delete</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Rows per page:</span>
                    <span>1–2 of 2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'automations':
        return (
          <div className="w-full" style={{ height: 'calc(100vh - 64px)' }}>
            <div className="pl-0 pr-4 w-full" style={{ height: 'calc(100vh - 64px)' }}>
              <div className="grid grid-cols-1 lg:grid-cols-9 gap-0 w-full" style={{ height: 'calc(100vh - 64px)' }}>
                {/* Left Panel */}
                <div className="lg:col-span-2 rounded-lg shadow-lg flex flex-col bg-white" style={{ height: 'calc(100vh - 64px)' }}>
                  <div className="flex-1 overflow-y-auto p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Automations</h2>
                    <div className="space-y-2">
                      <button className="w-full px-3 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg border border-blue-300 text-left">
                        Triggers
                      </button>
                      <button className="w-full px-3 py-2 text-sm font-medium bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 text-left">
                        Rules
                      </button>
                      <button className="w-full px-3 py-2 text-sm font-medium bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 text-left">
                        Recommended
                      </button>
                    </div>
                  </div>
                </div>
                {/* Right Panel */}
                <div className="lg:col-span-7 rounded-lg shadow-lg flex flex-col bg-white" style={{ height: 'calc(100vh - 64px)' }}>
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">

              <div className="mb-6">
                <div className="text-sm font-medium text-gray-900 mb-3">AI Support Agent</div>
                <div className="p-4 border border-gray-200 rounded-lg mb-4">
                  <div className="text-sm font-medium text-gray-900 mb-2">AI Support Agent</div>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm font-medium text-gray-900 mb-3">Actions Library</div>
                <div className="grid grid-cols-3 gap-3">
                  <button className="p-3 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors">
                    <div className="text-sm font-medium text-gray-900">Chatbots</div>
                  </button>
                  <button className="p-3 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors">
                    <div className="text-sm font-medium text-gray-900">Sequence</div>
                  </button>
                  <button className="p-3 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors">
                    <div className="text-sm font-medium text-gray-900">WhatsApp Flows</div>
                  </button>
                  <button className="p-3 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors">
                    <div className="text-sm font-medium text-gray-900">Routing</div>
                  </button>
                  <button className="p-3 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors">
                    <div className="text-sm font-medium text-gray-900">Reply Material</div>
                  </button>
                  <button className="p-3 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors">
                    <div className="text-sm font-medium text-gray-900">Others</div>
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <div className="p-3 border border-gray-200 rounded-lg mb-2">
                  <div className="text-sm font-medium text-gray-900">Default Action</div>
                  <div className="text-xs text-gray-500 mt-1">Legacy</div>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg">
                  <div className="text-sm font-medium text-gray-900">Keyword Action</div>
                  <div className="text-xs text-gray-500 mt-1">Legacy</div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Rules</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Create Rules to trigger automated messages, chat assignments, chatbots and more.
                  </p>
                  <div className="flex items-center gap-4 mb-4">
                    <button className="text-sm text-blue-600 hover:underline">How it works</button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                      + Create Rules
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">RULE NAME</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">TRIGGER TYPE</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">ACTION</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">STATUS</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">EXECUTED</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">LAST UPDATED</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">WA Out of Office</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">Built-In</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">New WhatsApp message is received</td>
                          <td className="px-4 py-3 text-sm text-gray-700">Send message</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Off</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">0</td>
                          <td className="px-4 py-3 text-sm text-gray-700">31/10/2025</td>
                          <td className="px-4 py-3 text-sm text-gray-700"></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">WA Welcome message</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">Built-In</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">New WhatsApp message is received</td>
                          <td className="px-4 py-3 text-sm text-gray-700">Send message</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Off</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">0</td>
                          <td className="px-4 py-3 text-sm text-gray-700">31/10/2025</td>
                          <td className="px-4 py-3 text-sm text-gray-700"></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">Unsubscribe from broadcast</td>
                          <td className="px-4 py-3 text-sm text-gray-700"></td>
                          <td className="px-4 py-3 text-sm text-gray-700">New WhatsApp message is received</td>
                          <td className="px-4 py-3 text-sm text-gray-700">Update contact attribute</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Off</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">0</td>
                          <td className="px-4 py-3 text-sm text-gray-700">31/10/2025</td>
                          <td className="px-4 py-3 text-sm text-gray-700"></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">WA Hello keyword sample rule</td>
                          <td className="px-4 py-3 text-sm text-gray-700"></td>
                          <td className="px-4 py-3 text-sm text-gray-700">New WhatsApp message is received</td>
                          <td className="px-4 py-3 text-sm text-gray-700">Send message</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">On</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">0</td>
                          <td className="px-4 py-3 text-sm text-gray-700">31/10/2025</td>
                          <td className="px-4 py-3 text-sm text-gray-700"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'ads':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ads</h2>
              <p className="text-gray-600">Manage and track your advertising campaigns.</p>
            </div>
          </div>
        );
      
      case 'analytics':
        return <AnalyticsReports />;
      
      case 'team-management':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Team Management</h2>
              <p className="text-gray-600">Manage team members, roles, and permissions.</p>
            </div>
          </div>
        );
      
      case 'integrations':
        return <IntegrationsPage onWhatsAppSetupComplete={refreshAllStatuses} />;
      
      case 'webhooks':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Webhooks</h2>
              <p className="text-gray-600">Configure and manage webhooks for real-time event notifications.</p>
            </div>
          </div>
        );
      
      case 'commerce':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Commerce</h2>
              <p className="text-gray-600">Manage products, orders, and e-commerce integrations.</p>
            </div>
          </div>
        );
      
      case 'account-details':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Details</h2>
              <p className="text-gray-600">View and manage your account information and settings.</p>
            </div>
          </div>
        );
      
      case 'channels':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Channels</h2>
              <p className="text-gray-600">Manage communication channels and integrations.</p>
            </div>
          </div>
        );
      
      case 'dashboard':
      case 'knowledge':
      case 'live-chat':
      case 'billing':
      case 'subscriptions':
      case 'settings':
        // Keep existing cases for backward compatibility
        switch (activeTab) {
          case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Status Indicators Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {/* WhatsApp Status */}
              <div 
                className={`bg-white rounded-xl shadow-sm border-2 ${whatsappBorderClass} hover:border-gray-400 p-6 cursor-pointer hover:shadow-md transition`}
                onClick={handleWhatsAppClick}
              >
                <div>
                  <span className="block text-lg font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded mb-2 mx-auto text-center">Step 1: WhatsApp</span>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 48 48">
                      <path fill="#fff" d="M4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98c-0.001,0,0,0,0,0h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303z"></path>
                      <path fill="#fff" d="M4.868,43.803c-0.132,0-0.26-0.052-0.355-0.148c-0.125-0.127-0.174-0.312-0.127-0.483l2.639-9.636c-1.636-2.906-2.499-6.206-2.497-9.556C4.532,13.238,13.273,4.5,24.014,4.5c5.21,0.002,10.105,2.031,13.784,5.713c3.679,3.683,5.704,8.577,5.702,13.781c-0.004,10.741-8.746,19.48-19.486,19.48c-3.189-0.001-6.344-0.788-9.144-2.277l-9.875,2.589C4.953,43.798,4.911,43.803,4.868,43.803z"></path>
                      <path fill="#cfd8dc" d="M24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,4C24.014,4,24.014,4,24.014,4C12.998,4,4.032,12.962,4.027,23.979c-0.001,3.367,0.849,6.685,2.461,9.622l-2.585,9.439c-0.094,0.345,0.002,0.713,0.254,0.967c0.19,0.192,0.447,0.297,0.711,0.297c0.085,0,0.17-0.011,0.254-0.033l9.687-2.54c2.828,1.468,5.998,2.243,9.197,2.244c11.024,0,19.99-8.963,19.995-19.98c0.002-5.339-2.075-10.359-5.848-14.135C34.378,6.083,29.357,4.002,24.014,4L24.014,4z"></path>
                      <path fill="#40c351" d="M35.176,12.832c-2.98-2.982-6.941-4.625-11.157-4.626c-8.704,0-15.783,7.076-15.787,15.774c-0.001,2.981,0.833,5.883,2.413,8.396l0.376,0.597l-1.595,5.821l5.973-1.566l0.577,0.342c2.422,1.438,5.2,2.198,8.032,2.199h0.006c8.698,0,15.777-7.077,15.78-15.776C39.795,19.778,38.156,15.814,35.176,12.832z"></path>
                      <path fill="#fff" fillRule="evenodd" d="M19.268,16.045c-0.355-0.79-0.729-0.806-1.068-0.82c-0.277-0.012-0.593-0.011-0.909-0.011c-0.316,0-0.83,0.119-1.265,0.594c-0.435,0.475-1.661,1.622-1.661,3.956c0,2.334,1.7,4.59,1.937,4.906c0.237,0.316,3.282,5.259,8.104,7.161c4.007,1.58,4.823,1.266,5.693,1.187c0.87-0.079,2.807-1.147,3.202-2.255c0.395-1.108,0.395-2.057,0.277-2.255c-0.119-0.198-0.435-0.316-0.909-0.554s-2.807-1.385-3.242-1.543c-0.435-0.158-0.751-0.237-1.068,0.238c-0.316,0.474-1.225,1.543-1.502,1.859c-0.277,0.317-0.554,0.357-1.028,0.119c-0.474-0.238-2.002-0.738-3.815-2.354c-1.41-1.257-2.362-2.81-2.639-3.285c-0.277-0.474-0.03-0.731,0.208-0.968c0.213-0.213,0.474-0.554,0.712-0.831c0.237-0.277,0.316-0.475,0.474-0.791c0.158-0.317,0.079-0.594-0.04-0.831C20.612,19.329,19.69,16.983,19.268,16.045z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 text-center mt-2">
                    {isCheckingWhatsapp ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading...</span>
                      </div>
                    ) : whatsappStatus?.success && whatsappStatus?.isIntegrated ? '✅ Connected' : '⏳ Pending'}
                  </p>
                </div>
              </div>

              {/* Onboarding Status */}
              <div 
                className={`bg-white rounded-xl shadow-sm border-2 ${onboardingBorderClass} hover:border-gray-400 p-6 cursor-pointer hover:shadow-md transition`}
                onClick={handleOnboardingClick}
              >
                <div>
                  <span className="block text-lg font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded mb-2 mx-auto text-center">Step 2: Onboarding</span>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-xl">🚀</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 text-center mt-2">
                    {isLoadingOnboarding ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading...</span>
                      </div>
                    ) : onboardingStatus?.status === 'completed' ? '✅ Complete' : '⏳ Pending'}
                  </p>
                  {onboardingStatus?.status === 'completed' && userData?.company && (
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {userData.company} • {userData.specialization}
                    </p>
                  )}
                </div>
              </div>

              {/* Training Status */}
              <div 
                className={`bg-white rounded-xl shadow-sm border-2 ${trainingBorderClass} hover:border-gray-400 p-6 cursor-pointer hover:shadow-md transition`}
                onClick={handleTrainingClick}
              >
                <div>
                  <span className="block text-lg font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded mb-2 mx-auto text-center">Step 3: Training</span>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-xl">🧠</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 text-center mt-2">
                    {isLoadingTraining ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading...</span>
                      </div>
                    ) : trainingStatus?.status === 'completed' ? '✅ Complete' : 
                     trainingStatus?.status === 'not_started' ? '⏳ Not Started' : '⏳ Pending'}
                  </p>
                  {trainingStatus?.progress > 0 && (
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {trainingStatus.progress}% Complete
                    </p>
                  )}
                </div>
              </div>

              {/* Subscription Details */}
              <div 
                className={`bg-white rounded-xl shadow-sm border-2 ${subscriptionBorderClass} hover:border-gray-400 p-6 cursor-pointer hover:shadow-md transition`}
                onClick={handleSubscriptionClick}
              >
                <div>
                  <span className="block text-lg font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded mb-2 mx-auto text-center">Step 4: Subscription</span>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-xl">💳</span>
                  </div>
                  {isLoadingSubscription ? (
                    <div className="flex items-center justify-center mt-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                      <p className="text-lg font-medium text-gray-500 ml-2">Loading...</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-gray-900 text-center mt-2">
                        {pricingSubscriptionStatus?.status === 'created' ? 'No Plan Selected' : 
                         pricingSubscriptionStatus?.plan_name || 'No Plan Selected'}
                      </p>
                      {pricingSubscriptionStatus?.status && pricingSubscriptionStatus.status !== 'not_created' && pricingSubscriptionStatus.status !== 'created' && (
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          {pricingSubscriptionStatus.status === 'authenticated' ? '✅ Active' : 
                           pricingSubscriptionStatus.status === 'inactive' ? '⏳ Inactive' : pricingSubscriptionStatus.status}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="space-y-6">
              <LiveAgentPreview />
              <RecentChats onNavigateToLiveChat={() => setActiveTab('live-chat')} />
            </div>
          </div>
        );
        case 'knowledge':
          return <KnowledgeBase onTrainingComplete={refreshAllStatuses} />;
        case 'live-chat':
          return <LiveChat />;
        case 'billing':
          return <PlanBilling onSubscriptionActivated={refreshAllStatuses} />;
        case 'subscriptions':
          return <PlanBilling onSubscriptionActivated={refreshAllStatuses} />;
        case 'settings':
          return <Settings />;
          default:
            break;
        }
        break;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
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
      <div className="flex flex-col lg:flex-row">
        {/* Left Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={handleTabChange}
          whatsappStatus={whatsappStatus}
          onboardingStatus={onboardingStatus}
          trainingStatus={trainingStatus}
          pricingSubscriptionStatus={pricingSubscriptionStatus}
        />
        {/* Main Content */}
        <div className={`flex-1 ${activeTab === 'team-inbox' || activeTab === 'broadcast' ? 'p-0 overflow-hidden' : 'p-4 lg:p-6'}`}>
          <div className={activeTab === 'team-inbox' || activeTab === 'broadcast' ? 'w-full h-full' : 'max-w-7xl mx-auto'}>
            {renderMainContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 