import React, { useState } from 'react';
import { 
  HandRaisedIcon, 
  CheckIcon, 
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const LiveAgentPreview = () => {
  const [isTakingOver, setIsTakingOver] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleTakeOver = async (chatId) => {
    setIsTakingOver(true);
    try {
      // Simulate API call to take over chat
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFeedback({ type: 'success', message: 'Chat taken over successfully' });
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to take over chat' });
    } finally {
      setIsTakingOver(false);
    }
  };

  const handleFeedback = async (chatId, isCorrect) => {
    try {
      // Simulate API call to submit feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      setFeedback({ type: 'success', message: 'Feedback submitted successfully' });
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to submit feedback' });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* <h2 className="text-xl font-semibold mb-4">Live Agent Preview</h2>
      
      <div className="space-y-4">
        <div className="border rounded p-4">
          <h3 className="font-medium mb-2">Sample Chat</h3>
          <div className="space-y-2 text-sm">
            <div className="bg-gray-100 p-2 rounded">
              <strong>Customer:</strong> I need help with my order
            </div>
            <div className="bg-blue-100 p-2 rounded">
              <strong>AI:</strong> I'd be happy to help! Can you provide your order number?
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => handleTakeOver('chat-123')}
            disabled={isTakingOver}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isTakingOver ? 'Taking Over...' : 'Take Over Chat'}
          </button>
          
          <button
            onClick={() => handleFeedback('chat-123', true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Correct Response
          </button>
          
          <button
            onClick={() => handleFeedback('chat-123', false)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Incorrect Response
          </button>
        </div>

        {feedback && (
          <div className={`p-3 rounded ${
            feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {feedback.message}
          </div>
        )}
      </div> */}
    </div>
  );
};

export default LiveAgentPreview; 