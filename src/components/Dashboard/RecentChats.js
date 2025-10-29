import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import websocketService from '../../services/websocketService';
import { formatRelativeTime } from '../../services/chatService';
import {
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const RecentChats = ({ onNavigateToLiveChat }) => {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState('time');
  const [sortOrder, setSortOrder] = useState('desc');
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch recent chats from the same source as Live Chat (WebSocket DB messages)
  useEffect(() => {
    if (!user?.uid) return;

    // Connect if not already connected; this will also request messages
    websocketService.connect(user.uid);

    const handleDatabaseMessages = (data) => {
      try {
        if (data.messages && data.messages.length > 0) {
          // Group by sender and derive last message info
          const groupedBySender = data.messages.reduce((acc, msg) => {
            const senderKey = msg.sender_number || msg.sender_name || 'Unknown';
            if (!acc[senderKey]) {
              acc[senderKey] = {
                sender_name: msg.sender_name || 'Unknown',
                sender_number: msg.sender_number || '',
                messages: []
              };
            }
            acc[senderKey].messages.push(msg);
            return acc;
          }, {});

          const chats = Object.values(groupedBySender).map((entry) => {
            const sorted = entry.messages.sort((a, b) => new Date(a.created_at || a.time_stamp) - new Date(b.created_at || b.time_stamp));
            const last = sorted[sorted.length - 1];
            return {
              id: `${entry.sender_number}-${sorted[0]?.conversation_id || 'conv'}`,
              customer: entry.sender_name || 'Unknown',
              customerNumber: entry.sender_number || '',
              query: last?.message || '',
              channel: entry.sender_number ? 'WhatsApp' : 'Website',
              status: 'open',
              timestamp: last?.created_at || last?.time_stamp,
              duration: ''
            };
          })
          // Sort most recent first
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          // Limit to latest 5-10
          .slice(0, 10);

          setRecentChats(chats);
        } else {
          setRecentChats([]);
        }
      } catch (e) {
        console.error('Error processing database messages for recent chats:', e);
        setRecentChats([]);
      } finally {
        setLoading(false);
      }
    };

    const handleNewMessage = (data) => {
      // Re-request messages for freshness when a new one arrives
      websocketService.requestUserMessages(user.uid);
    };

    websocketService.onMessage('database_messages', handleDatabaseMessages);
    websocketService.onMessage('new_message', handleNewMessage);

    // Initial fetch in case already connected
    websocketService.requestUserMessages(user.uid);

    return () => {
      websocketService.offMessage('database_messages', handleDatabaseMessages);
      websocketService.offMessage('new_message', handleNewMessage);
    };
  }, [user?.uid]);

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
      <div className={`w-6 h-6 rounded-full ${channelColors[channel] || 'bg-gray-400'} flex items-center justify-center`}>
        <span className="text-white text-xs font-bold">{(channel || '?').charAt(0)}</span>
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

  const sortedChats = [...recentChats].sort((a, b) => {
    const dir = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'customer') return a.customer.localeCompare(b.customer) * dir;
    if (sortBy === 'query') return a.query.localeCompare(b.query) * dir;
    if (sortBy === 'channel') return a.channel.localeCompare(b.channel) * dir;
    if (sortBy === 'status') return a.status.localeCompare(b.status) * dir;
    if (sortBy === 'time') return (new Date(a.timestamp) - new Date(b.timestamp)) * dir;
    if (sortBy === 'duration') return (a.duration || '').localeCompare(b.duration || '') * dir;
    return 0;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Recent Customer Chats</h3>
        <button 
          onClick={() => onNavigateToLiveChat && onNavigateToLiveChat()}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View All
        </button>
      </div>

      {/* Desktop Table Header */}
      <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 mb-4">
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
        {!loading && sortedChats.map((chat) => (
          <div key={chat.id}>
            {/* Desktop Layout */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
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
                <p className="text-sm text-gray-600">{formatRelativeTime(chat.timestamp)}</p>
              </div>

              {/* Duration */}
              <div className="col-span-1">
                <p className="text-sm text-gray-600">{chat.duration}</p>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-medium text-gray-900 truncate">{chat.customer}</p>
                    {getChannelIcon(chat.channel)}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{chat.customerNumber}</p>
                </div>
                <div className="flex items-center space-x-2 ml-2">
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chat.status)}`}>
                    {getStatusIcon(chat.status)}
                    <span className="capitalize">{chat.status}</span>
                  </span>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-sm text-gray-700 line-clamp-2" title={chat.query}>
                  {chat.query}
                </p>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatRelativeTime(chat.timestamp)}</span>
                {chat.duration && <span>Duration: {chat.duration}</span>}
              </div>
            </div>
          </div>
        ))}

        {!loading && sortedChats.length === 0 && (
          <div className="text-center py-8">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No recent conversations</p>
            <p className="text-sm text-gray-400">Chats will appear here as customers reach out</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        )}
      </div>
    </div>
  );
};

export default RecentChats; 