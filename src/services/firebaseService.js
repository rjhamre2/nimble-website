import { apiConfig } from '../config/api';

// Retry utility function for API calls
const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiCall();
      if (result && result.success !== false) {
        return result;
      }
      throw new Error(`API returned unsuccessful response: ${JSON.stringify(result)}`);
    } catch (error) {
      console.log(`🔄 Attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

// Check WhatsApp integration status for a user
export const checkWhatsAppStatus = async (userId) => {
  return retryApiCall(async () => {
    const url = apiConfig.endpoints.firebase.checkWhatsappStatus();
    console.log('🌐 Calling URL:', url);
    console.log('📤 Request body:', { user_id: userId });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId
      }),
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error text:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Response data:', data);
    return data;
  });
};

// Get WhatsApp link for a user
export const getWhatsAppLink = async (userId) => {
  try {
    const url = apiConfig.endpoints.firebase.getWhatsappLink();
    console.log('🌐 Calling WhatsApp link URL:', url);
    console.log('📤 Request body:', { user_id: userId });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId
      }),
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error text:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ WhatsApp link response data:', data);
    return data;
  } catch (error) {
    console.error('❌ Error getting WhatsApp link:', error);
    throw error;
  }
};

// Get user dashboard status (onboarding, training, subscription)
export const getUserDashboardStatus = async (userId) => {
  return retryApiCall(async () => {
    const url = apiConfig.endpoints.firebase.getUserDashboardStatus();
    console.log('🌐 Calling Dashboard Status URL:', url);
    console.log('📤 Request body:', { user_id: userId });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error text:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Dashboard status response data:', data);
    return data;
  });
};

// Update training status in Firebase
export const updateTrainingStatus = async (userId, trainingData = {}) => {
  try {
    const url = apiConfig.endpoints.firebase.updateTrainingStatus();
    console.log('🌐 Calling Training Status Update URL:', url);
    console.log('📤 Request body:', { user_id: userId, training_data: trainingData });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        training_data: trainingData
      }),
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error text:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Training status update response data:', data);
    return data;
  } catch (error) {
    console.error('❌ Error updating training status:', error);
    throw error;
  }
};

// Health check for Firebase Lambda
export const checkFirebaseLambdaHealth = async () => {
  try {
    const response = await fetch(apiConfig.firebaseLambdaConfig.baseURL + '/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking Firebase Lambda health:', error);
    throw error;
  }
};
