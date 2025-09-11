import React from 'react';
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  PuzzlePieceIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
    { id: 'integrations', name: 'Integrations', icon: PuzzlePieceIcon },
    { id: 'knowledge', name: 'Knowledge Base', icon: BookOpenIcon },
    { id: 'live-chat', name: 'Live Chat', icon: ChatBubbleLeftRightIcon },
    { id: 'subscriptions', name: 'Manage Subscriptions', icon: CreditCardIcon }
  ];

  return (
    <div className="w-64 bg-white shadow-lg min-h-screen">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="text-xl font-bold text-gray-900">NimbleAI</span>
        </div>
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
                  onClick={() => setActiveTab(item.id)}
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
  );
};

export default Sidebar; 