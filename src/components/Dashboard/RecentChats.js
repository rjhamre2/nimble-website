import React, { useState } from 'react';
import {
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const RecentChats = () => {
  const [sortBy, setSortBy] = useState('time');
  const [sortOrder, setSortOrder] = useState('desc');

  // Mock recent chats data
  const recentChats = [
    {
      id: 1,
      customer: 'John Doe',
      customerNumber: '+1 (555) 123-4567',
      query: 'I have a question about my order #12345',
      channel: 'WhatsApp',
      status: 'resolved',
      timestamp: '2 hours ago',
      duration: '3 min'
    },
    {
      id: 2,
      customer: 'Sarah Wilson',
      customerNumber: '+1 (555) 987-6543',
      query: 'When will my refund be processed?',
      channel: 'Instagram',
      status: 'open',
      timestamp: '4 hours ago',
      duration: '5 min'
    },
    {
      id: 3,
      customer: 'Mike Johnson',
      customerNumber: '+1 (555) 456-7890',
      query: 'Need help with account login',
      channel: 'Website',
      status: 'escalated',
      timestamp: '6 hours ago',
      duration: '8 min'
    },
    {
      id: 4,
      customer: 'Emily Davis',
      customerNumber: '+1 (555) 321-0987',
      query: 'Product return policy question',
      channel: 'WhatsApp',
      status: 'resolved',
      timestamp: '1 day ago',
      duration: '2 min'
    },
    {
      id: 5,
      customer: 'David Brown',
      customerNumber: '+1 (555) 654-3210',
      query: 'Shipping delay inquiry',
      channel: 'Instagram',
      status: 'open',
      timestamp: '1 day ago',
      duration: '4 min'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'escalated':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'open':
        return <ClockIcon className="h-4 w-4" />;
      case 'escalated':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getChannelIcon = (channel) => {
    const channelColors = {
      WhatsApp: 'bg-green-500',
      Instagram: 'bg-pink-500',
      Website: 'bg-blue-500'
    };
    
    return (
      <div className={`w-6 h-6 rounded-full ${channelColors[channel]} flex items-center justify-center`}>
        <span className="text-white text-xs font-bold">{channel.charAt(0)}</span>
      </div>
    );
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const SortButton = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
    >
      <span>{children}</span>
      {sortBy === field && (
        sortOrder === 'asc' ? 
          <ChevronUpIcon className="h-4 w-4" /> : 
          <ChevronDownIcon className="h-4 w-4" />
      )}
    </button>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Recent Customer Chats</h3>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View All
        </button>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 mb-4">
        <div className="col-span-3">
          <SortButton field="customer">Customer</SortButton>
        </div>
        <div className="col-span-4">
          <SortButton field="query">Query</SortButton>
        </div>
        <div className="col-span-1">
          <SortButton field="channel">Channel</SortButton>
        </div>
        <div className="col-span-1">
          <SortButton field="status">Status</SortButton>
        </div>
        <div className="col-span-2">
          <SortButton field="time">Time</SortButton>
        </div>
        <div className="col-span-1">
          <SortButton field="duration">Duration</SortButton>
        </div>
      </div>

      {/* Table Body */}
      <div className="space-y-2">
        {recentChats.map((chat) => (
          <div
            key={chat.id}
            className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
          >
            {/* Customer */}
            <div className="col-span-3">
              <div>
                <p className="font-medium text-gray-900">{chat.customer}</p>
                <p className="text-sm text-gray-500">{chat.customerNumber}</p>
              </div>
            </div>

            {/* Query */}
            <div className="col-span-4">
              <p className="text-sm text-gray-700 truncate" title={chat.query}>
                {chat.query}
              </p>
            </div>

            {/* Channel */}
            <div className="col-span-1 flex items-center">
              {getChannelIcon(chat.channel)}
            </div>

            {/* Status */}
            <div className="col-span-1">
              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chat.status)}`}>
                {getStatusIcon(chat.status)}
                <span className="capitalize">{chat.status}</span>
              </span>
            </div>

            {/* Time */}
            <div className="col-span-2">
              <p className="text-sm text-gray-600">{chat.timestamp}</p>
            </div>

            {/* Duration */}
            <div className="col-span-1">
              <p className="text-sm text-gray-600">{chat.duration}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {recentChats.length === 0 && (
        <div className="text-center py-8">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No recent conversations</p>
          <p className="text-sm text-gray-400">Chats will appear here as customers reach out</p>
        </div>
      )}
    </div>
  );
};

export default RecentChats; 