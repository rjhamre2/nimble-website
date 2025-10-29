import React, { useState } from 'react';
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  PuzzlePieceIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  QuestionMarkCircleIcon,
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
    { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
    { id: 'integrations', name: 'Integrations', icon: PuzzlePieceIcon },
    { id: 'knowledge', name: 'Knowledge Base', icon: BookOpenIcon },
    { id: 'live-chat', name: 'Live Chat', icon: ChatBubbleLeftRightIcon },
    { id: 'subscriptions', name: 'Manage Subscriptions', icon: CreditCardIcon }
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
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg min-h-screen
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo/Brand */}
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-xl font-bold text-gray-900">NimbleAI</span>
          </div>
        </div>

      {/* Progress Bar */}
      <div className="px-6 py-4 border-b border-gray-200">
        {progress.percentage < 100 ? (
          <button
            onClick={() => setActiveTab('dashboard')}
            className="w-full text-left hover:bg-gray-50 rounded-lg p-3 transition-colors"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Setup Progress</span>
              <span className="text-sm text-gray-500">{progress.completed}/{progress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              {progress.percentage}% Complete - Click to continue setup
            </div>
          </button>
        ) : (
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Setup Progress</span>
              <span className="text-sm text-gray-500">{progress.completed}/{progress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ✅ Setup Complete
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="p-4">
        <ul className="space-y-2">
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
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="font-medium">{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section - Quick actions */}
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
        <div className="space-y-3">
          {/* <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Training Mode
          </button>
          <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
            Invite Team
          </button> */}
        </div>
      </div>
      </div>
    </>
  );
};

export default Sidebar; 