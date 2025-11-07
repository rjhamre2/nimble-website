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

// Pricing Lambda configuration
const PRICING_LAMBDA_CONFIG = {
  development: {
    baseURL: process.env.REACT_APP_PRICING_LAMBDA || 'https://your-pricing-lambda-url.amazonaws.com',
  },
  production: {
    baseURL: process.env.REACT_APP_PRICING_LAMBDA || 'https://your-pricing-lambda-url.amazonaws.com',
  }
};

// Contacts API configuration
const CONTACTS_CONFIG = {
  development: {
    baseURL: process.env.REACT_APP_CONTACTS_API || 'https://your-contacts-api-url.amazonaws.com',
  },
  production: {
    baseURL: process.env.REACT_APP_CONTACTS_API || 'https://your-contacts-api-url.amazonaws.com',
  }
};

// DB Server configuration
const DB_SERVER_CONFIG = {
  development: {
    baseURL: process.env.REACT_APP_DB_SERVER_URL || 'https://your-db-server-url.com',
  },
  production: {
    baseURL: process.env.REACT_APP_DB_SERVER_URL || 'https://your-db-server-url.com',
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

// Get current Pricing Lambda configuration
const getPricingLambdaConfig = () => {
  const env = getCurrentEnvironment();
  return PRICING_LAMBDA_CONFIG[env];
};

// Get current Contacts API configuration
const getContactsConfig = () => {
  const env = getCurrentEnvironment();
  return CONTACTS_CONFIG[env];
};

// Get current DB Server configuration
const getDbServerConfig = () => {
  const env = getCurrentEnvironment();
  return DB_SERVER_CONFIG[env];
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
    google: '/google',
    logout: '/logout',
    verify: '/verify',
    health: '/health'
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
    checkWhatsappStatus: '/check_whatsapp_status',
    getWhatsappLink: '/get_whatsapp_link',
    getUserDashboardStatus: '/get_user_dashboard_status',
    updateTrainingStatus: '/update_training_status'
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

// Helper function to build Pricing Lambda API URLs
const buildPricingLambdaUrl = (endpoint) => {
  const config = getPricingLambdaConfig();
  const pricingEndpoints = {
    fetchProductsAndPricing: '/fetch_products_and_pricing',
    subscribe: '/subscribe',
    fetchSubscriptionStatus: '/fetch_subscription_status'
  };
  const url = `${config.baseURL}${pricingEndpoints[endpoint] || endpoint}`;
  console.log('🔧 Building Pricing Lambda URL:', {
    endpoint,
    baseURL: config.baseURL,
    fullURL: url,
    env: process.env.REACT_APP_PRICING_LAMBDA
  });
  return url;
};

// Helper function to build Contacts API URLs
const buildContactsUrl = (endpoint, params = {}) => {
  const config = getContactsConfig();
  const contactsEndpoints = {
    createContact: '/create_contact',
    getUserContacts: (dbId) => `/user/${dbId}`,
    updateContact: (contactId) => `/${contactId}`,
    deleteContact: (contactId) => `/${contactId}`
  };
  
  let url;
  if (endpoint === 'getUserContacts' && params.dbId) {
    url = `${config.baseURL}${contactsEndpoints.getUserContacts(params.dbId)}`;
  } else if (endpoint === 'updateContact' && params.contactId) {
    url = `${config.baseURL}${contactsEndpoints.updateContact(params.contactId)}`;
  } else if (endpoint === 'deleteContact' && params.contactId) {
    url = `${config.baseURL}${contactsEndpoints.deleteContact(params.contactId)}`;
  } else {
    url = `${config.baseURL}${contactsEndpoints[endpoint] || endpoint}`;
  }
  
  console.log('🔧 Building Contacts API URL:', {
    endpoint,
    baseURL: config.baseURL,
    fullURL: url,
    envVar: process.env.REACT_APP_CONTACTS_API,
    envVarExists: !!process.env.REACT_APP_CONTACTS_API,
    allEnvVars: Object.keys(process.env).filter(key => key.includes('CONTACTS'))
  });
  
  // Warn if using fallback URL
  if (config.baseURL === 'https://your-contacts-api-url.amazonaws.com') {
    console.warn('⚠️ Using fallback Contacts API URL. REACT_APP_CONTACTS_API environment variable is not set or not loaded.');
    console.warn('💡 Make sure:');
    console.warn('   1. REACT_APP_CONTACTS_API is set in your .env file');
    console.warn('   2. The .env file is in the project root directory');
    console.warn('   3. You have restarted the development server after adding the variable');
    console.warn('   4. The variable name is exactly REACT_APP_CONTACTS_API (case-sensitive)');
  }
  
  return url;
};

// Helper function to build DB Server API URLs
const buildDbServerUrl = (endpoint) => {
  const config = getDbServerConfig();
  const dbServerEndpoints = {
    createUser: '/api/users'
  };
  const url = `${config.baseURL}${dbServerEndpoints[endpoint] || endpoint}`;
  console.log('🔧 Building DB Server URL:', {
    endpoint,
    baseURL: config.baseURL,
    fullURL: url,
    envVar: process.env.REACT_APP_DB_SERVER_URL,
    envVarExists: !!process.env.REACT_APP_DB_SERVER_URL
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
  pricingLambdaConfig: getPricingLambdaConfig(),
  contactsConfig: getContactsConfig(),
  dbServerConfig: getDbServerConfig(),
  
  // Helper functions
  buildUrl: buildApiUrl,
  buildAuthUrl: buildAuthUrl,
  buildWaEsUrl: buildWaEsUrl,
  buildFirebaseLambdaUrl: buildFirebaseLambdaUrl,
  buildPricingLambdaUrl: buildPricingLambdaUrl,
  buildContactsUrl: buildContactsUrl,
  buildDbServerUrl: buildDbServerUrl,
  
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
      getWhatsappLink: () => buildFirebaseLambdaUrl('getWhatsappLink'),
      getUserDashboardStatus: () => buildFirebaseLambdaUrl('getUserDashboardStatus'),
      updateTrainingStatus: () => buildFirebaseLambdaUrl('updateTrainingStatus')
    },
    // Pricing Lambda endpoints
    pricing: {
      fetchProductsAndPricing: () => buildPricingLambdaUrl('fetchProductsAndPricing'),
      subscribe: () => buildPricingLambdaUrl('subscribe'),
      fetchSubscriptionStatus: () => buildPricingLambdaUrl('fetchSubscriptionStatus')
    },
    // Contacts API endpoints
    contacts: {
      createContact: () => buildContactsUrl('createContact'),
      getUserContacts: (dbId) => buildContactsUrl('getUserContacts', { dbId }),
      updateContact: (contactId) => buildContactsUrl('updateContact', { contactId }),
      deleteContact: (contactId) => buildContactsUrl('deleteContact', { contactId })
    },
    // DB Server endpoints
    dbServer: {
      createUser: () => buildDbServerUrl('createUser')
    }
  }
};

export default apiConfig; 