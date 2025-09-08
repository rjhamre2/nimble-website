import { apiConfig } from '../config/api';

// Check WhatsApp integration status for a user
export const checkWhatsAppStatus = async (userId) => {
  try {
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
  } catch (error) {
    console.error('❌ Error checking WhatsApp status:', error);
    throw error;
  }
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
  try {
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
  } catch (error) {
    console.error('❌ Error getting dashboard status:', error);
    throw error;
  }
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
