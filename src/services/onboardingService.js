import { getCurrentUser } from './authService';
import { apiConfig } from '../config/api';

// Function to call the onboarding API via Lambda proxy
export const onboardUser = async (company, specialization) => {
  try {
    // Validate mandatory fields
    if (!company || typeof company !== 'string') {
      throw new Error('Company is required and must be a string');
    }
    if (!specialization || typeof specialization !== 'string') {
      throw new Error('Specialization is required and must be a string');
    }

    const user = getCurrentUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }

    // Get the user's authentication token
    const idToken = localStorage.getItem('authToken');
    if (!idToken) {
      throw new Error('No authentication token available');
    }
    
    // Build the proxy URL for the onboarding endpoint
    const proxyUrl = `${apiConfig.config.baseURL}/api/proxy/onboard_user`;
    
    console.log('Calling onboarding API for user:', user.uid);
    console.log('Full URL being called:', proxyUrl);
    console.log('User ID token length:', idToken ? idToken.length : 'undefined');
    console.log('Company:', company);
    console.log('Specialization:', specialization);
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test: true,
        user_id: user.uid,
        company: company,
        specialization: specialization,
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response status:', response.status);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      console.error('Response body:', errorText);
      throw new Error(`Onboarding API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Onboarding successful:', result);
    return result;
    
  } catch (error) {
    console.error('Onboarding API call failed:', error);
    throw error;
  }
};

 