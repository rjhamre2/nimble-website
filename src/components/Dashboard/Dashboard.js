import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { checkWhatsAppStatus } from '../../services/firebaseService';
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
import OnboardingTest from '../OnboardingTest';

const Dashboard = () => {
  const { user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [isCheckingWhatsapp, setIsCheckingWhatsapp] = useState(false);
  const navigate = useNavigate();

  // Handle tab changes
  const handleTabChange = (tabId) => {
    if (tabId === 'live-chat') {
      // Navigate to the LiveChat page
      navigate('/livechat');
    } else {
      setActiveTab(tabId);
    }
  };

  // Call Firebase Lambda to check WhatsApp status when user is authenticated
  useEffect(() => {
    const performWhatsAppStatusCheck = async () => {
      if (!user?.uid) return;
      
      console.log('🔍 Starting WhatsApp status check for user:', user.uid);
      setIsCheckingWhatsapp(true);
      try {
        // Call the Firebase Lambda service
        console.log('📡 Calling Firebase Lambda...');
        const data = await checkWhatsAppStatus(user.uid);
        console.log('✅ WhatsApp status check result:', data);
        setWhatsappStatus(data);
      } catch (error) {
        console.error('❌ Error checking WhatsApp status:', error);
        setWhatsappStatus({ success: false, error: error.message });
      } finally {
        setIsCheckingWhatsapp(false);
      }
    };

    // Only check when user is available and we haven't checked yet
    if (user?.uid && !whatsappStatus && !isCheckingWhatsapp) {
      console.log('🚀 Triggering WhatsApp status check...');
      performWhatsAppStatusCheck();
    }
  }, [user?.uid, whatsappStatus, isCheckingWhatsapp]);

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
            {/* WhatsApp Status Indicator */}
            {whatsappStatus && (
              <div className={`p-4 rounded-lg border ${
                whatsappStatus.success && whatsappStatus.isIntegrated 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      whatsappStatus.success && whatsappStatus.isIntegrated 
                        ? 'bg-green-500' 
                        : 'bg-blue-500'
                    }`}></div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        WhatsApp Business Integration
                      </h3>
                      <p className="text-sm text-gray-600">
                        {isCheckingWhatsapp 
                          ? 'Checking status...' 
                          : whatsappStatus.success 
                            ? (whatsappStatus.isIntegrated 
                                ? '✅ Integration is active' 
                                : '⚠️ Integration not active')
                            : `❌ Error: ${whatsappStatus.error}`
                        }
                      </p>
                    </div>
                  </div>
                  {isCheckingWhatsapp && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  )}
                </div>
              </div>
            )}
            
            <OnboardingTest />
            <OverviewCards />
            <LiveAgentPreview />
            <RecentChats />
          </div>
        );
      case 'integrations':
        return <IntegrationsPage />;
      case 'knowledge':
        return <KnowledgeBase />;
      case 'analytics':
        return <AnalyticsReports />;
      case 'billing':
        return <PlanBilling />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div className="space-y-6">
            <OverviewCards />
            <LiveAgentPreview />
            <RecentChats />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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