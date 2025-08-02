// API Configuration for different environments
const API_CONFIG = {
  // Development environment (local Express server)
  development: {
    baseURL: 'http://localhost:5001',
    endpoints: {
      whatsapp: '/api/whatsapp/exchange-code',
      health: '/api/health'
    }
  },
  
  // Production environment (AWS Lambda)
  production: {
    // Your actual Lambda Function URL
    baseURL: 'https://ozpmzjnghswkf5fzen5rqle7p40wnxrk.lambda-url.ap-south-1.on.aws',
    endpoints: {
      whatsapp: '/api/whatsapp/exchange-code',
      health: '/api/health'
    }
  }
};

// Determine current environment
const getCurrentEnvironment = () => {
  // Force production mode for testing Lambda
  // TODO: Change this back to normal detection after testing
  return 'production';
  
  // Check if we're in development (localhost) or production
  // if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  //   return 'development';
  // }
  // return 'production';
};

// Get current API configuration
const getApiConfig = () => {
  const env = getCurrentEnvironment();
  return API_CONFIG[env];
};

// Helper function to build full API URLs
const buildApiUrl = (endpoint) => {
  const config = getApiConfig();
  return `${config.baseURL}${config.endpoints[endpoint] || endpoint}`;
};

// Export configuration and helper functions
export const apiConfig = {
  // Current environment
  environment: getCurrentEnvironment(),
  
  // Current configuration
  config: getApiConfig(),
  
  // Helper functions
  buildUrl: buildApiUrl,
  
  // Direct endpoint access
  endpoints: {
    whatsapp: () => buildApiUrl('whatsapp'),
    health: () => buildApiUrl('health')
  }
};

export default apiConfig; 