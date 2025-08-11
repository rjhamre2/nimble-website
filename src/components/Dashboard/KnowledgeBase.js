import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import React, { useState } from 'react';


import {
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const KnowledgeBase = () => {
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

  const [uploadError, setUploadError] = useState(null);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', link: '' });
  const [isAddingFaq, setIsAddingFaq] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingError, setTrainingError] = useState(null);
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

  const addNewFaq = () => {
    if (newFaq.question.trim() && newFaq.answer.trim()) {
      const newId = Math.max(...faqs.map(f => f.id)) + 1;
      setFaqs([...faqs, {
        id: newId,
        question: newFaq.question,
        answer: newFaq.answer,
        link: newFaq.link,
        isExpanded: true,
        isEditing: false
      }]);
      setNewFaq({ question: '', answer: '', link: '' });
      setIsAddingFaq(false);
    }
  };

  // File Upload Functions
  const handleFileUpload = async (event) => {
    const file = event.target.files[0]; // Assuming one file
    if (!file || !user) {
      return;
    }

    setIsUploading(true);
    setUploadError(null); // Reset previous errors

    try {
      const token = await user.getIdToken();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user.uid); // Add user_id to FormData

      const apiUrl = `${process.env.REACT_APP_DASHBOARD2EC2LAMBDA_BASE_URL}/api/proxy/faqs/upload`;

      const response = await axios.post(apiUrl, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      const newFile = {
        id: Date.now(),
        name: file.name,
        size: file.size,
        uploadDate: new Date().toISOString(),
        status: 'uploaded',
        backendMessage: response.data.message
      };
      
      setUploadedFiles(prevFiles => [...prevFiles, newFile]);

    } catch (err) {
      console.error(`Failed to upload ${file.name}:`, err);
      const errorMessage = err.response?.data?.message || 'The upload failed. Please try again.';
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
      event.target.value = ''; // Reset file input
    }
  };

  const deleteFile = (id) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      setUploadedFiles(uploadedFiles.filter(file => file.id !== id));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleRetrainAI = async () => {
    if (!user) {
      setTrainingError('Please sign in to retrain the AI agent');
      return;
    }

    setIsTraining(true);
    setTrainingError(null);

    try {
      const token = await user.getIdToken();
      
      const apiUrl = `${process.env.REACT_APP_DASHBOARD2EC2LAMBDA_BASE_URL}/api/proxy/train`;
      
      const response = await axios.post(apiUrl, 
        { user_id: user.uid },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      
      // Show success message
      alert('AI Agent training completed successfully!');
      
    } catch (err) {
      console.error('Training failed:', err);
      const errorMessage = err.response?.data?.message || 'Training failed. Please try again.';
      setTrainingError(errorMessage);
    } finally {
      setIsTraining(false);
    }
  };

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

      <div className="max-w-2xl mx-auto">

        {/* Right Side - File Upload */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Training Documents</h3>
            <span className="text-sm text-gray-500">{uploadedFiles.length} files</span>
          </div>

          {/* File Upload Area */}
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Training Files</h4>
            <p className="text-gray-600 mb-4">Upload .txt files to train your AI agent</p>
            
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
              <div className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2">
                <DocumentTextIcon className="h-5 w-5" />
                <span>{isUploading ? 'Uploading...' : 'Choose Files'}</span>
              </div>
            </label>
            
            <p className="text-xs text-gray-500 mt-2">Maximum file size: 10MB</p>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Uploaded Files</h4>
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)} • {new Date(file.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {file.status}
                      </span>
                      <button
                        onClick={() => deleteFile(file.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Training Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Training Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last trained</span>
                <span className="text-sm font-medium">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Training documents</span>
                <span className="text-sm font-medium">{uploadedFiles.length} files</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">FAQ entries</span>
                <span className="text-sm font-medium">{faqs.length} questions</span>
              </div>
            </div>
            <button 
              onClick={handleRetrainAI}
              disabled={isTraining}
              className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTraining ? 'Training...' : 'Train AI Agent'}
            </button>
            
            {trainingError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                {trainingError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase; 