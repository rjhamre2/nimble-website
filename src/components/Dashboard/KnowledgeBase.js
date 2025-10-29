import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { updateTrainingStatus, getUserDashboardStatus } from '../../services/firebaseService';


import {
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const KnowledgeBase = ({ onTrainingComplete }) => {
  const [faqs, setFaqs] = useState([
    {
      id: 1,
      question: 'How do I reset my password?',
      answer: 'To reset your password, go to the login page and click "Forgot Password". Enter your email address and follow the instructions sent to your inbox.',
      link: 'https://help.example.com/reset-password',
      isExpanded: false,
      isEditing: false
    },
    {
      id: 2,
      question: 'What is your return policy?',
      answer: 'We offer a 30-day return policy for all unused items in their original packaging. Returns must be initiated within 30 days of purchase.',
      link: 'https://help.example.com/returns',
      isExpanded: false,
      isEditing: false
    },
    {
      id: 3,
      question: 'How long does shipping take?',
      answer: 'Standard shipping takes 3-5 business days. Express shipping takes 1-2 business days. International shipping may take 7-14 business days.',
      link: 'https://help.example.com/shipping',
      isExpanded: false,
      isEditing: false
    },
    {
      id: 4,
      question: 'Do you ship internationally?',
      answer: 'Yes, we ship to most countries worldwide. International shipping rates and delivery times vary by location.',
      link: 'https://help.example.com/international',
      isExpanded: false,
      isEditing: false
    }
  ]);

  const [trainingText, setTrainingText] = useState('');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingError, setTrainingError] = useState(null);
  const [trainingSuccess, setTrainingSuccess] = useState(false);
  const [trainingDetails, setTrainingDetails] = useState(null);
  const [isLoadingTrainingDetails, setIsLoadingTrainingDetails] = useState(false);
  const { user } = useAuth(); // <-- ADDED to get the signed-in user

  // FAQ Management Functions
  const toggleFaq = (id) => {
    setFaqs(faqs.map(faq => 
      faq.id === id ? { ...faq, isExpanded: !faq.isExpanded } : faq
    ));
  };

  const startEditingFaq = (id) => {
    setFaqs(faqs.map(faq => 
      faq.id === id ? { ...faq, isEditing: true } : faq
    ));
  };

  const saveFaq = (id, updatedData) => {
    setFaqs(faqs.map(faq => 
      faq.id === id ? { ...faq, ...updatedData, isEditing: false } : faq
    ));
  };

  const cancelEditingFaq = (id) => {
    setFaqs(faqs.map(faq => 
      faq.id === id ? { ...faq, isEditing: false } : faq
    ));
  };

  const deleteFaq = (id) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      setFaqs(faqs.filter(faq => faq.id !== id));
    }
  };


  // Training Functions
  const handleTrainingTextChange = (event) => {
    setTrainingText(event.target.value);
    setTrainingError(null);
    setTrainingSuccess(false);
  };

  const handleRetrainAI = async () => {
    if (!user) {
      setTrainingError('Please sign in to train the AI agent');
      return;
    }

    if (!trainingText.trim()) {
      setTrainingError('Please enter some training content');
      return;
    }

    setIsTraining(true);
    setTrainingError(null);
    setTrainingSuccess(false);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setTrainingError('Authentication token not found. Please sign in again.');
        return;
      }
      
      // Call the new training API with text content
      const apiUrl = `${process.env.REACT_APP_DASHBOARD2EC2LAMBDA_BASE_URL}/api/proxy/train`;
      
      const trainingResponse = await axios.post(apiUrl, 
        { 
          user_id: user.uid,
          content: trainingText.trim()
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Training API response:', trainingResponse.data);
      
      // Update Firebase with training status
      const trainingData = {
        contentLength: trainingText.trim().length,
        faqsCount: faqs.length,
        lastTrainingDate: new Date().toISOString(),
        trainingResponse: trainingResponse.data
      };
      
      await updateTrainingStatus(user.uid, trainingData);
      
      // Show success message and clear text
      setTrainingSuccess(true);
      setTrainingText('');
      
      // Refetch training details to show updated last training time
      await fetchTrainingDetails();
      
      // Notify parent Dashboard component to refresh all statuses
      if (onTrainingComplete) {
        onTrainingComplete();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setTrainingSuccess(false);
      }, 3000);
      
    } catch (err) {
      console.error('Training failed:', err);
      const errorMessage = err.response?.data?.message || 'Training failed. Please try again.';
      setTrainingError(errorMessage);
    } finally {
      setIsTraining(false);
    }
  };

  // Function to fetch training details
  const fetchTrainingDetails = async () => {
    if (!user?.uid) return;
    
    setIsLoadingTrainingDetails(true);
    try {
      const dashboardData = await getUserDashboardStatus(user.uid);
      setTrainingDetails(dashboardData?.training || null);
    } catch (error) {
      console.error('Error fetching training details:', error);
    } finally {
      setIsLoadingTrainingDetails(false);
    }
  };

  // Fetch training details on component mount
  useEffect(() => {
    fetchTrainingDetails();
  }, [user?.uid]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Knowledge Base</h2>
          <p className="text-gray-600">Manage your AI training data and FAQs</p>
        </div>
        {/* <button
          onClick={() => setIsAddingFaq(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add FAQ</span>
        </button> */}
      </div>

      {/* Training Details Section - Show at the top */}
      {trainingDetails && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Last Training Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-blue-700 font-medium">Status</div>
              <div className="text-lg font-bold text-blue-900">
                {trainingDetails.status === 'completed' ? '✅ Completed' : 
                 trainingDetails.status === 'not_started' ? '⏳ Not Started' : 
                 '⏳ In Progress'}
              </div>
            </div>
            <div>
              <div className="text-sm text-blue-700 font-medium">Progress</div>
              <div className="text-lg font-bold text-blue-900">
                {typeof trainingDetails.progress === 'number' ? `${trainingDetails.progress}%` : '0%'}
              </div>
            </div>
            <div>
              <div className="text-sm text-blue-700 font-medium">Last Trained</div>
              <div className="text-lg font-bold text-blue-900">
                {trainingDetails.lastTrainedAt ? 
                  new Date(trainingDetails.lastTrainedAt).toLocaleString() : 
                  'Never'}
              </div>
            </div>
          </div>
        </div>
      )}


      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        {/* Training Content Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">AI Training Content</h3>
            <span className="text-sm text-gray-500">{trainingText.length} characters</span>
          </div>

          {/* Text Input Area */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 relative">
            <h4 className="text-lg font-medium text-gray-900 mb-2">Training Content</h4>
            <p className="text-gray-600 mb-4">Paste your training content here to train your AI agent</p>
            
            <textarea
              value={trainingText}
              onChange={handleTrainingTextChange}
              placeholder="Paste your training content here... (e.g., FAQ answers, product information, company policies, etc.)"
              className="w-full h-48 sm:h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm sm:text-base"
              disabled={isTraining}
            />
            
            <p className="text-xs text-gray-500 mt-2">
              Enter detailed information about your business, products, or services to train the AI agent.
            </p>

            {/* Loading overlay */}
            {isTraining && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                <div className="flex flex-col items-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-blue-600 font-medium">Training AI Agent...</span>
                </div>
              </div>
            )}

            {/* Success message overlay */}
            {trainingSuccess && (
              <div className="absolute inset-0 bg-green-50 bg-opacity-95 flex items-center justify-center rounded-lg border border-green-200">
                <div className="flex flex-col items-center space-y-3 text-center p-4">
                  <div className="text-green-600 text-4xl">✅</div>
                  <span className="text-green-800 font-medium text-lg">Training Completed Successfully!</span>
                  <span className="text-green-700 text-sm">Your content has been processed.</span>
                </div>
              </div>
            )}
          </div>

          {/* Train AI Button */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <button 
              onClick={handleRetrainAI}
              disabled={isTraining || !trainingText.trim()}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Train AI Agent
            </button>

            {trainingError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                ❌ {trainingError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase; 