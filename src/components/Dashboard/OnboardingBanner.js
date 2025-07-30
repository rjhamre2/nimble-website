import React from 'react';
import { CheckCircleIcon, SparklesIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const OnboardingBanner = ({ userData }) => {
  // Mock data - replace with real data from your backend
  const planData = {
    name: 'Pro Plan',
    activationDate: '2024-01-15',
    nextBilling: '2024-02-15',
    aiAgentName: 'Nimble Assistant',
    platformsIntegrated: ['WhatsApp', 'Instagram', 'Website'],
    status: 'active'
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Left side - Plan and AI info */}
          <div className="flex items-center space-x-6">
            {/* Plan Status */}
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="h-6 w-6 text-green-300" />
              <div>
                <p className="text-sm text-blue-100">Plan Status</p>
                <p className="font-semibold">{planData.name} • Active</p>
              </div>
            </div>

            {/* AI Agent */}
            <div className="flex items-center space-x-3">
              <SparklesIcon className="h-6 w-6 text-yellow-300" />
              <div>
                <p className="text-sm text-blue-100">AI Agent</p>
                <p className="font-semibold">{planData.aiAgentName}</p>
              </div>
            </div>

            {/* Platforms */}
            <div className="flex items-center space-x-3">
              <GlobeAltIcon className="h-6 w-6 text-green-300" />
              <div>
                <p className="text-sm text-blue-100">Platforms</p>
                <p className="font-semibold">{planData.platformsIntegrated.length} Connected</p>
              </div>
            </div>
          </div>

          {/* Right side - Dates and actions */}
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-sm text-blue-100">Activated</p>
              <p className="font-semibold">{new Date(planData.activationDate).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Next Billing</p>
              <p className="font-semibold">{new Date(planData.nextBilling).toLocaleDateString()}</p>
            </div>
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm font-medium transition-all">
              Manage Plan
            </button>
          </div>
        </div>

        {/* Platform badges */}
        <div className="mt-4 flex items-center space-x-2">
          <span className="text-sm text-blue-100">Connected:</span>
          {planData.platformsIntegrated.map((platform, index) => (
            <span
              key={index}
              className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs font-medium"
            >
              {platform}
            </span>
          ))}
          <button className="text-blue-100 hover:text-white text-sm font-medium">
            + Add Platform
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingBanner; 