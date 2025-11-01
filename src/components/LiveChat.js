import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import websocketService from '../services/websocketService';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const LiveChat = ({ isDarkMode }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedSender, setSelectedSender] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const selectedSenderRef = useRef(null);

  // WebSocket connection and message handling
  useEffect(() => {
    if (!user?.uid) return;

    console.log('🔌 Attempting to connect to WebSocket for user:', user.uid);
    
    // Connect to WebSocket
    websocketService.connect(user.uid);

    // Handle connection status
    const connectionHandler = (status, error) => {
      console.log('🔌 WebSocket connection status:', status, error);
      
      if (status === 'error') {
        console.error('❌ WebSocket connection error:', error);
      }
    };
    const connectionId = websocketService.onConnection(connectionHandler);

    // Handle database messages
    const handleDatabaseMessages = (data) => {
      if (data.messages && data.messages.length > 0) {
        // Group messages by sender_number to show one conversation per sender
        const groupedBySender = data.messages.reduce((acc, msg) => {
          const senderKey = msg.sender_number || msg.sender_name || 'Unknown';
          if (!acc[senderKey]) {
            acc[senderKey] = {
              sender_name: msg.sender_name || 'Unknown',
              sender_number: msg.sender_number || '',
              messages: []
            };
          }
          acc[senderKey].messages.push({
            id: msg.id,
            message: msg.message,
            sender_name: msg.sender_name,
            sender_number: msg.sender_number,
            time_stamp: msg.time_stamp,
            created_at: msg.created_at,
            message_type: msg.message_type || 'user',
            conversation_id: msg.conversation_id
          });
          return acc;
        }, {});

        // Convert to conversations array with proper sorting
        const conversationsList = Object.entries(groupedBySender).map(([senderKey, senderData]) => {
          const sortedMessages = senderData.messages.sort((a, b) => 
            new Date(a.created_at || a.time_stamp) - new Date(b.created_at || b.time_stamp)
          );
          
          return {
            conversation_id: senderKey, // Use sender as conversation ID
            sender_name: senderData.sender_name,
            sender_number: senderData.sender_number,
            message_count: senderData.messages.length,
            last_message: sortedMessages[sortedMessages.length - 1]?.message || '',
            last_timestamp: sortedMessages[sortedMessages.length - 1]?.created_at || 
                           sortedMessages[sortedMessages.length - 1]?.time_stamp || '',
            messages: sortedMessages
          };
        }).sort((a, b) => new Date(b.last_timestamp) - new Date(a.last_timestamp)); // Most recent first

        setConversations(conversationsList);
        setLoading(false);
      } else {
        setConversations([]);
        setLoading(false);
      }
    };

    // Handle new message stored in database
    const handleNewMessage = (data) => {
      if (data.message) {
        const newMessage = {
          id: data.id,
          message: data.message,
          sender_name: data.sender_name,
          sender_number: data.sender_number,
          time_stamp: data.time_stamp,
          created_at: data.created_at,
          message_type: data.message_type || 'user',
          conversation_id: data.conversation_id
        };

        // Update conversations with new message
        setConversations(prev => {
          const updated = [...prev];
          const senderKey = data.sender_number || data.sender_name || 'Unknown';
          const conversationIndex = updated.findIndex(conv => 
            conv.sender_number === data.sender_number || conv.sender_name === data.sender_name
          );
          
          if (conversationIndex >= 0) {
            // Update existing conversation
            updated[conversationIndex] = {
              ...updated[conversationIndex],
              message_count: updated[conversationIndex].message_count + 1,
              last_message: data.message,
              last_timestamp: data.created_at || data.time_stamp,
              messages: [...updated[conversationIndex].messages, newMessage]
            };
            
            // If this conversation is currently selected, update the selectedSender and messages
            if (selectedSenderRef.current && (
              selectedSenderRef.current.sender_number === data.sender_number || 
              selectedSenderRef.current.sender_name === data.sender_name
            )) {
              setSelectedSender(updated[conversationIndex]);
              selectedSenderRef.current = updated[conversationIndex];
              setMessages(updated[conversationIndex].messages);
              setIsNewMessage(true); // Flag that this is a new message, not conversation selection
            }
          } else {
            // Add new conversation
            const newConversation = {
              conversation_id: senderKey,
              sender_name: data.sender_name,
              sender_number: data.sender_number || '',
              message_count: 1,
              last_message: data.message,
              last_timestamp: data.created_at || data.time_stamp,
              messages: [newMessage]
            };
            updated.push(newConversation);
            
            // If this is the first message from this sender and no conversation is selected, select it
            if (!selectedSenderRef.current) {
              setSelectedSender(newConversation);
              selectedSenderRef.current = newConversation;
              setMessages(newConversation.messages);
              setIsNewMessage(true);
            }
          }
          
          // Sort conversations by latest message timestamp (most recent first)
          return updated.sort((a, b) => new Date(b.last_timestamp) - new Date(a.last_timestamp));
        });
      }
    };

    const handleConnectionStatus = (data) => {
      console.log('WebSocket connection status:', data);
    };

    // Register message handlers
    websocketService.onMessage('database_messages', handleDatabaseMessages);
    websocketService.onMessage('new_message', handleNewMessage);
    websocketService.onMessage('connection_status', handleConnectionStatus);

    // Cleanup on unmount
    return () => {
      websocketService.offConnection(connectionId);
      websocketService.offMessage('database_messages', handleDatabaseMessages);
      websocketService.offMessage('new_message', handleNewMessage);
      websocketService.offMessage('connection_status', handleConnectionStatus);
    };
  }, [user?.uid]);

  // Track if we're adding a new message vs selecting a conversation
  const [isNewMessage, setIsNewMessage] = useState(false);

  // Auto-scroll to bottom only when new messages arrive, not when selecting conversation
  useEffect(() => {
    if (isNewMessage) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
        setIsNewMessage(false);
      }, 50);
    }
  }, [messages, isNewMessage]);

  // Scroll to bottom when messages change (for conversation selection)
  useEffect(() => {
    if (messages.length > 0 && !isNewMessage) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages, isNewMessage]);

  // Handle conversation selection
  const handleSelectConversation = (conversation) => {
    setSelectedSender(conversation);
    selectedSenderRef.current = conversation;
    setMessages(conversation.messages);
    // Don't set isNewMessage flag when selecting conversation
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return timestamp;
    }
  };

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }
    const query = searchQuery.toLowerCase();
    return conversations.filter(conv => 
      conv.sender_name?.toLowerCase().includes(query) ||
      conv.sender_number?.toLowerCase().includes(query) ||
      conv.last_message?.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);



  return (
    <div className={`w-full ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`} style={{ height: 'calc(100vh - 64px)' }}>
      <div className="pl-0 pr-4 w-full" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="grid grid-cols-1 lg:grid-cols-9 gap-0 w-full" style={{ height: 'calc(100vh - 64px)' }}>
          {/* Conversations List */}
          <div className={`lg:col-span-2 rounded-lg shadow-lg flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} style={{ height: 'calc(100vh - 64px)' }}>
            <div className={`pr-0 pl-0 pt-0 pb-0 border-b flex-shrink-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-0">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <button
                  className={`w-10 h-10 flex items-center justify-center font-medium text-sm transition-colors flex-shrink-0 rounded-lg ${
                    isDarkMode
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  title="New Chat"
                >
                  <span className="text-lg">+</span>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchQuery ? 'No conversations match your search' : 'No conversations found'}
                </div>
              ) : (
                filteredConversations.map((conversation, index) => (
                  <div
                    key={conversation.conversation_id || index}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`p-4 border-b cursor-pointer transition-colors ${
                      isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                    } ${selectedSender?.sender_number === conversation.sender_number ? 
                      (isDarkMode ? 'bg-gray-700' : 'bg-blue-50') : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{conversation.sender_name}</h3>
                        {conversation.sender_number && (
                          <p className="text-sm text-gray-500">{conversation.sender_number}</p>
                        )}
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {conversation.message_count} messages • {conversation.messages.length > 0 ? 
                            (conversation.messages[conversation.messages.length - 1].message.length > 30 
                              ? conversation.messages[conversation.messages.length - 1].message.substring(0, 30) + '...' 
                              : conversation.messages[conversation.messages.length - 1].message) : 'No messages'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(conversation.last_timestamp)}
                        </span>
                        <div className="mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {conversation.message_count} messages
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Messages Panel */}
          <div className={`lg:col-span-7 rounded-lg shadow-lg flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} style={{ height: 'calc(100vh - 64px)' }}>
            {selectedSender ? (
              <>
                <div className={`p-4 border-b flex-shrink-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h2 className="text-xl font-semibold">{selectedSender.sender_name}</h2>
                  {selectedSender.sender_number && (
                    <p className="text-sm text-gray-500">{selectedSender.sender_number}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedSender.message_count} messages • Conversation started {formatTimestamp(selectedSender.messages[0]?.created_at || selectedSender.messages[0]?.time_stamp)}
                  </p>
                </div>
                
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4">
                  {messages.map((msg, index) => {
                    const isUserMessage = msg.message_type === 'user';
                    const isAIMessage = msg.message_type === 'ai';
                    
                    return (
                      <div key={msg.id || index} className={`mb-2 flex ${isUserMessage ? 'justify-start' : 'justify-end'}`}>
                        <div className={`p-3 rounded-lg max-w-[80%] ${
                          isUserMessage 
                            ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                            : (isDarkMode ? 'bg-gray-700' : 'bg-gray-100')
                        }`}>
                          <p className="text-sm">{msg.message}</p>
                          <div className={`text-xs mt-1 ${
                            isUserMessage 
                              ? 'text-blue-100' 
                              : 'text-gray-500'
                          }`}>
                            {formatTimestamp(msg.created_at || msg.time_stamp)}
                            {isAIMessage && <span className="ml-2">🤖 AI</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="text-lg">Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveChat;
