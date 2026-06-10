import React, { useState, useEffect } from 'react';
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
  XMarkIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';
import { id } from 'zod/v4/locales';

const Sidebar = ({ activeTab, setActiveTab, whatsappStatus, onboardingStatus, trainingStatus, pricingSubscriptionStatus, isWabaDetailsEmpty, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  //const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Calculate progress based on dashboard steps
  console.log("Sidebar received isMobileMenuOpen:", typeof isMobileMenuOpen);
  console.log("Sidebar received setIsMobileMenuOpen:", typeof setIsMobileMenuOpen);
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
    { id: 'dashboard', name: 'Dashboard', icon: ChartPieIcon },
    { id: 'setup', name: 'Setup', icon: ClipboardDocumentCheckIcon },
    { id: 'team-inbox', name: 'Inbox', icon: InboxIcon },
    { id: 'broadcast', name: 'Broadcast', icon: MegaphoneIcon },
    { id: 'contacts', name: 'Customers', icon: UserGroupIcon },
    //{ id: 'automations', name: 'Automations', icon: BoltIcon },
    //{ id: 'ads', name: 'Ads', icon: SpeakerWaveIcon },
    //{ id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
    //{ id: 'team-management', name: 'Team management', icon: UserCircleIcon },
    //{ id: 'integrations', name: 'Integrations', icon: PuzzlePieceIcon },
    //{ id: 'webhooks', name: 'Webhooks', icon: LinkIcon },
    //{ id: 'commerce', name: 'Commerce', icon: ShoppingBagIcon },
    { id: 'account-details', name: 'Account Details', icon: IdentificationIcon },
    //{ id: 'channels', name: 'Channels', icon: ChatBubbleLeftRightIcon }
  ];
useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup: Ensure scrolling is re-enabled if the component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);
  return (
    <>
      {/* Mobile Overlay - Now with a subtle blur effect */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-transparent z-20"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static left-0 z-30 w-64 lg:w-48 bg-white border-r border-gray-100 shadow-xl lg:shadow-none
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
       `} style={{ height: 'calc(100vh - 64px)' }}>


      {/* Progress Bar */}
{/* Hiding the Progress Bar for the time being */}
{/*
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
}
      {/* Navigation Menu */}
      <nav className="p-3 flex-1 overflow-y-auto space-y-0.5">
        {/* <ul className="space-y-1"> */}
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const showWarning = item.id === 'channels' && isWabaDetailsEmpty;
            
            return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-[#25D366]/10 text-[#1a9c4e] font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-[#25D366]' : 'text-gray-400'}`} />
                  <span className="text-[13px] font-medium truncate flex-1">{item.name}</span>
                  {showWarning && (
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                  )}
                </button>
            
            );
          })}
        {/* </ul> */}
      </nav>
      </div>
    </>
  );
};

export default Sidebar; 