// API Configuration for different environments
const API_CONFIG = {
  // Development environment (same as production - Lambda URLs)
  development: {
    // Use environment variable for Lambda Function URL (same as production)
    baseURL: process.env.REACT_APP_DASHBOARD2EC2LAMBDA_BASE_URL || 'https://your-lambda-function-url.amazonaws.com',
    endpoints: {
      whatsapp: '/api/whatsapp/exchange-code',
      health: '/api/health',
      onboard: '/api/proxy/onboard_user',
      // Authentication endpoints
      auth: {
        google: '/api/proxy/auth/google',
        logout: '/api/proxy/auth/logout',
        verify: '/api/proxy/auth/verify',
        health: '/api/proxy/auth/health'
      }
    }
  },
  
  // Production environment (AWS Lambda)
  production: {
    // Use environment variable for Lambda Function URL
    baseURL: process.env.REACT_APP_DASHBOARD2EC2LAMBDA_BASE_URL || 'https://your-lambda-function-url.amazonaws.com',
    endpoints: {
      whatsapp: '/api/whatsapp/exchange-code',
      health: '/api/health',
      onboard: '/api/proxy/onboard_user',
      // Authentication endpoints
      auth: {
        google: '/api/proxy/auth/google',
        logout: '/api/proxy/auth/logout',
        verify: '/api/proxy/auth/verify',
        health: '/api/proxy/auth/health'
      }
    }
  }
};

// Authentication Lambda configuration (separate from main Lambda)
const AUTH_CONFIG = {
  development: {
    baseURL: process.env.REACT_APP_AUTH_LAMBDA_BASE_URL || 'https://mp74jdohju4t5773wfvwmfnoza0gvckw.lambda-url.ap-south-1.on.aws',
  },
  production: {
    baseURL: process.env.REACT_APP_AUTH_LAMBDA_BASE_URL || 'https://mp74jdohju4t5773wfvwmfnoza0gvckw.lambda-url.ap-south-1.on.aws',
  }
};

// WhatsApp Embedded Signup Lambda configuration
const WA_ES_CONFIG = {
  development: {
    baseURL: process.env.REACT_APP_WA_ES_LAMBDA || 'https://your-wa-es-lambda-url.amazonaws.com',
  },
  production: {
    baseURL: process.env.REACT_APP_WA_ES_LAMBDA || 'https://your-wa-es-lambda-url.amazonaws.com',
  }
};

// Firebase Lambda configuration (for checking WhatsApp status)
const FIREBASE_LAMBDA_CONFIG = {
  development: {
    baseURL: process.env.REACT_APP_FRONTEND2FIREBASE || 'https://your-firebase-lambda-url.amazonaws.com',
  },
  production: {
    baseURL: process.env.REACT_APP_FRONTEND2FIREBASE || 'https://your-firebase-lambda-url.amazonaws.com',
  }
};

// Determine current environment
const getCurrentEnvironment = () => {
  // Check if we're in development (localhost) or production
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'development';
  }
  return 'production';
};

// Get current API configuration
const getApiConfig = () => {
  const env = getCurrentEnvironment();
  return API_CONFIG[env];
};

// Get current Auth configuration
const getAuthConfig = () => {
  const env = getCurrentEnvironment();
  return AUTH_CONFIG[env];
};

// Get current WhatsApp Embedded Signup configuration
const getWaEsConfig = () => {
  const env = getCurrentEnvironment();
  return WA_ES_CONFIG[env];
};

// Get current Firebase Lambda configuration
const getFirebaseLambdaConfig = () => {
  const env = getCurrentEnvironment();
  return FIREBASE_LAMBDA_CONFIG[env];
};

// Helper function to build full API URLs
const buildApiUrl = (endpoint) => {
  const config = getApiConfig();
  return `${config.baseURL}${config.endpoints[endpoint] || endpoint}`;
};

// Helper function to build auth API URLs
const buildAuthUrl = (authEndpoint) => {
  const config = getAuthConfig();
  const authEndpoints = {
    google: '/api/proxy/auth/google',
    logout: '/api/proxy/auth/logout',
    verify: '/api/proxy/auth/verify',
    health: '/api/proxy/auth/health'
  };
  return `${config.baseURL}${authEndpoints[authEndpoint]}`;
};

// Helper function to build WhatsApp Embedded Signup API URLs
const buildWaEsUrl = (endpoint) => {
  const config = getWaEsConfig();
  const waEsEndpoints = {
    exchange: '/api/whatsapp/exchange-code'
  };
  return `${config.baseURL}${waEsEndpoints[endpoint] || endpoint}`;
};

// Helper function to build Firebase Lambda API URLs
const buildFirebaseLambdaUrl = (endpoint) => {
  const config = getFirebaseLambdaConfig();
  const firebaseEndpoints = {
    checkWhatsappStatus: '/api/check_whatsapp_status',
    getWhatsappLink: '/api/get_whatsapp_link'
  };
  const url = `${config.baseURL}${firebaseEndpoints[endpoint] || endpoint}`;
  console.log('🔧 Building Firebase Lambda URL:', {
    endpoint,
    baseURL: config.baseURL,
    fullURL: url,
    env: process.env.REACT_APP_FRONTEND2FIREBASE
  });
  return url;
};

// Export configuration and helper functions
export const apiConfig = {
  // Current environment
  environment: getCurrentEnvironment(),
  
  // Current configuration
  config: getApiConfig(),
  authConfig: getAuthConfig(),
  waEsConfig: getWaEsConfig(),
  firebaseLambdaConfig: getFirebaseLambdaConfig(),
  
  // Helper functions
  buildUrl: buildApiUrl,
  buildAuthUrl: buildAuthUrl,
  buildWaEsUrl: buildWaEsUrl,
  buildFirebaseLambdaUrl: buildFirebaseLambdaUrl,
  
  // Direct endpoint access
  endpoints: {
    whatsapp: () => buildWaEsUrl('exchange'), // Now uses the new WA_ES_LAMBDA
    health: () => buildApiUrl('health'),
    onboard: () => buildApiUrl('onboard'),
    // Authentication endpoints
    auth: {
      google: () => buildAuthUrl('google'),
      logout: () => buildAuthUrl('logout'),
      verify: () => buildAuthUrl('verify'),
      health: () => buildAuthUrl('health')
    },
    // Firebase Lambda endpoints
    firebase: {
      checkWhatsappStatus: () => buildFirebaseLambdaUrl('checkWhatsappStatus'),
      getWhatsappLink: () => buildFirebaseLambdaUrl('getWhatsappLink')
    }
  }
};

export default apiConfig; 