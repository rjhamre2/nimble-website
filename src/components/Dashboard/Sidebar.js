import React, { useState } from 'react';
import {
  InboxIcon,
  MegaphoneIcon,
  UserGroupIcon,
  BoltIcon,
  SpeakerWaveIcon,
  ChartBarIcon,
  UserCircleIcon,
  PuzzlePieceIcon,
  LinkIcon,
  ShoppingBagIcon,
  IdentificationIcon,
  ChatBubbleLeftRightIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ activeTab, setActiveTab, whatsappStatus, onboardingStatus, trainingStatus, pricingSubscriptionStatus }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Calculate progress based on dashboard steps
  const calculateProgress = () => {
    let completedSteps = 0;
    const totalSteps = 4;

    // Step 1: WhatsApp Integration
    if (whatsappStatus?.success && whatsappStatus?.isIntegrated) {
      completedSteps++;
    }

    // Step 2: Onboarding
    if (onboardingStatus?.status === 'completed') {
      completedSteps++;
    }

    // Step 3: Training
    if (trainingStatus?.status === 'completed') {
      completedSteps++;
    }

    // Step 4: Subscription
    const subscriptionStatus = pricingSubscriptionStatus?.status?.toLowerCase();
    if (subscriptionStatus === 'authenticated' || subscriptionStatus === 'active') {
      completedSteps++;
    }

    return {
      completed: completedSteps,
      total: totalSteps,
      percentage: Math.round((completedSteps / totalSteps) * 100)
    };
  };

  const progress = calculateProgress();

  const menuItems = [
    { id: 'team-inbox', name: 'Team inbox', icon: InboxIcon },
    { id: 'broadcast', name: 'Broadcast', icon: MegaphoneIcon },
    { id: 'contacts', name: 'Contacts', icon: UserGroupIcon },
    { id: 'automations', name: 'Automations', icon: BoltIcon },
    { id: 'ads', name: 'Ads', icon: SpeakerWaveIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
    { id: 'team-management', name: 'Team management', icon: UserCircleIcon },
    { id: 'integrations', name: 'Integrations', icon: PuzzlePieceIcon },
    { id: 'webhooks', name: 'Webhooks', icon: LinkIcon },
    { id: 'commerce', name: 'Commerce', icon: ShoppingBagIcon },
    { id: 'account-details', name: 'Account Details', icon: IdentificationIcon },
    { id: 'channels', name: 'Channels', icon: ChatBubbleLeftRightIcon }
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white p-2 rounded-lg shadow-lg border border-gray-200"
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          ) : (
            <Bars3Icon className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static left-0 z-50 w-40 bg-white shadow-lg
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ height: 'calc(100vh - 64px)' }}>
        {/* Logo/Brand */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">N</span>
            </div>
            <span className="text-sm font-bold text-gray-900">NimbleAI</span>
          </div>
        </div>

      {/* Progress Bar */}
      <div className="px-3 py-3 border-b border-gray-200">
        {progress.percentage < 100 ? (
          <button
            onClick={() => setActiveTab('dashboard')}
            className="w-full text-left hover:bg-gray-50 rounded-lg p-2 transition-colors"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-700">Setup Progress</span>
              <span className="text-xs text-gray-500">{progress.completed}/{progress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 leading-tight">
              {progress.percentage}% Complete
            </div>
          </button>
        ) : (
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-700">Setup Progress</span>
              <span className="text-xs text-gray-500">{progress.completed}/{progress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ✅ Complete
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="p-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-2 py-2 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium truncate">{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      </div>
    </>
  );
};

export default Sidebar; 