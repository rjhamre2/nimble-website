import React, { useState } from 'react';
import { 
  HandRaisedIcon, 
  CheckIcon, 
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const LiveAgentPreview = () => {
  const [isOverrideMode, setIsOverrideMode] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Mock live chat data
  const liveChats = [
    {
      id: 1,
      customer: 'John Doe',
      platform: 'WhatsApp',
      message: 'Hi, I have a question about my order #12345',
      aiResponse: 'Hello John! I can help you with your order. Let me check the status for order #12345...',
      status: 'active',
      timestamp: '2 min ago'
    },
    {
      id: 2,
      customer: 'Sarah Wilson',
      platform: 'Instagram',
      message: 'When will my refund be processed?',
      aiResponse: 'Hi Sarah! I can see your refund request was submitted yesterday. It typically takes 3-5 business days to process...',
      status: 'active',
      timestamp: '5 min ago'
    }
  ];

  const handleOverride = (chatId) => {
    setIsOverrideMode(true);
    // Add logic to take over the conversation
    console.log('Taking over chat:', chatId);
  };

  const handleFeedback = (chatId, isCorrect) => {
    setFeedback({ chatId, isCorrect });
    // Add logic to send feedback to AI training
    console.log('Feedback:', { chatId, isCorrect });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-xl font-bold text-gray-900">Live Agent Preview</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Real-time monitoring</span>
        </div>
      </div>

      <div className="space-y-4">
        {liveChats.map((chat) => (
          <div key={chat.id} className="border border-gray-200 rounded-lg p-4">
            {/* Chat Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{chat.customer}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">{chat.platform}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{chat.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Active
                </span>
              </div>
            </div>

            {/* Customer Message */}
            <div className="mb-3">
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <strong>Customer:</strong> {chat.message}
              </p>
            </div>

            {/* AI Response */}
            <div className="mb-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-purple-600">AI</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 bg-purple-50 p-3 rounded-lg border-l-4 border-purple-200">
                    {chat.aiResponse}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleOverride(chat.id)}
                  className="flex items-center space-x-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-md text-sm hover:bg-orange-200 transition-colors"
                >
                  <HandRaisedIcon className="h-4 w-4" />
                  <span>Override</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Was this helpful?</span>
                <button
                  onClick={() => handleFeedback(chat.id, true)}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleFeedback(chat.id, false)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Feedback Confirmation */}
            {feedback && feedback.chatId === chat.id && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  {feedback.isCorrect ? '✅ Thank you for the feedback!' : '❌ We\'ll improve this response.'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* No Active Chats State */}
      {liveChats.length === 0 && (
        <div className="text-center py-8">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No active conversations right now</p>
          <p className="text-sm text-gray-400">AI agent is ready to help when customers reach out</p>
        </div>
      )}
    </div>
  );
};

export default LiveAgentPreview; 