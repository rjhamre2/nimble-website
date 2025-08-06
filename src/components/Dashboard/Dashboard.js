import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
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

const Dashboard = () => {
  const { user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

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
      {/* Onboarding Summary Banner */}
      <OnboardingBanner userData={userData} />
      <div className="flex">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
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