const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const app = express();

// Initialize AWS Secrets Manager client
// Note: Firebase secret is in us-east-1, so we need to specify that region
const secretsClient = new SecretsManagerClient({ region: 'us-east-1' });

// Function to get Firebase credentials from Secrets Manager
async function getFirebaseCredentials() {
  try {
    const secretName = process.env.FIREBASE_SECRET_NAME;
    if (!secretName) {
      console.warn('⚠️ FIREBASE_SECRET_NAME not set, skipping Firebase initialization');
      return null;
    }

    console.log('🔐 Fetching Firebase credentials from Secrets Manager...');
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await secretsClient.send(command);
    
    if (response.SecretString) {
      const credentials = JSON.parse(response.SecretString);
      console.log('✅ Firebase credentials retrieved from Secrets Manager');
      return credentials;
    } else {
      console.error('❌ No secret string found in Secrets Manager');
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to get Firebase credentials from Secrets Manager:', error.message);
    return null;
  }
}

// Initialize Firebase Admin SDK
let firebaseApp;

async function initializeFirebase() {
  try {
    if (!admin.apps.length) {
      const credentials = await getFirebaseCredentials();
      
      if (credentials) {
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(credentials)
        });
        console.log('✅ Firebase Admin SDK initialized successfully with Secrets Manager credentials');
      } else {
        console.warn('⚠️ No Firebase credentials available, Firebase features will be disabled');
      }
    } else {
      firebaseApp = admin.app();
      console.log('✅ Firebase Admin SDK already initialized');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    // Don't fail the entire app, just log the error
  }
}

// Initialize Firebase on startup
initializeFirebase();

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://nimbleai.in',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    contentType: req.headers['content-type'],
    bodySize: req.body ? JSON.stringify(req.body).length : 0
  });
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Nimble WhatsApp Lambda API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    service: 'AWS Lambda',
    version: '1.0.0'
  });
});

// WhatsApp code exchange endpoint
app.post('/api/whatsapp/exchange-code', async (req, res) => {
  try {
    const { code, waba_id, phone_number_id } = req.body;
    
    console.log('=== WHATSAPP CODE EXCHANGE REQUEST ===');
    console.log('Received data:', {
      code: code ? `${code.substring(0, 10)}...` : 'undefined',
      waba_id,
      phone_number_id,
      hasAppId: !!process.env.FACEBOOK_APP_ID,
      hasAppSecret: !!process.env.FACEBOOK_APP_SECRET
    });
    
    // Validate required fields
    if (!code || !waba_id || !phone_number_id) {
      console.log('❌ Missing required fields:', { 
        code: !!code, 
        waba_id: !!waba_id, 
        phone_number_id: !!phone_number_id 
      });
      return res.status(400).json({ 
        error: 'Missing required fields: code, waba_id, phone_number_id',
        received: { code: !!code, waba_id: !!waba_id, phone_number_id: !!phone_number_id }
      });
    }

    // Validate environment variables
    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
      console.error('❌ Missing Facebook App credentials in environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error: Missing Facebook App credentials'
      });
    }

    console.log('🔄 Exchanging code for access token...');
    
    // Exchange the code for an access token - URGENT: codes expire in 30 seconds!
    const tokenResponse = await axios.post('https://graph.facebook.com/v23.0/oauth/access_token', {
      client_id: process.env.FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      code: code,
      grant_type: 'authorization_code'
    }, {
      timeout: 10000 // 10 second timeout for Facebook API call
    });

    const { access_token } = tokenResponse.data;
    
    console.log('✅ Successfully exchanged code for access token');
    console.log('Access token (first 10 chars):', access_token.substring(0, 10) + '...');

    // Store the integration data (you can replace this with your database)
    const integrationData = {
      waba_id,
      phone_number_id,
      access_token: access_token.substring(0, 10) + '...', // Log partial token for security
      created_at: new Date().toISOString(),
      status: 'active'
    };

    // Save to Firebase Firestore
    if (firebaseApp && admin.apps.length > 0) {
      try {
        const db = admin.firestore();
        const timestamp = new Date().toISOString();
        
        // 1. Save to whatsapp_integrations collection (main integration data)
        const integrationRef = db.collection('whatsapp_integrations');
        await integrationRef.doc(waba_id).set({
          waba_id,
          phone_number_id,
          access_token: access_token, // Store full token for API calls
          created_at: timestamp,
          updated_at: timestamp,
          status: 'active',
          facebook_app_id: process.env.FACEBOOK_APP_ID,
          integration_type: 'whatsapp_business_api',
          environment: process.env.NODE_ENV || 'production'
        });
        
        // 2. Save to integrations collection (general integrations)
        const generalIntegrationsRef = db.collection('integrations');
        await generalIntegrationsRef.doc(waba_id).set({
          type: 'whatsapp',
          waba_id,
          phone_number_id,
          access_token: access_token,
          created_at: timestamp,
          updated_at: timestamp,
          status: 'active',
          provider: 'facebook',
          environment: process.env.NODE_ENV || 'production'
        });
        
        // 3. Save to users collection (if you want to track by user)
        // You can modify this based on your user management system
        const usersRef = db.collection('users');
        const userId = 'default_user'; // You can modify this based on your auth system
        await usersRef.doc(userId).collection('integrations').doc(waba_id).set({
          type: 'whatsapp',
          waba_id,
          phone_number_id,
          access_token: access_token,
          created_at: timestamp,
          updated_at: timestamp,
          status: 'active'
        });
        
        console.log('✅ Integration data saved to Firestore successfully');
        console.log('📄 Firestore document ID:', waba_id);
        console.log('📊 Collections created/updated:');
        console.log('   - whatsapp_integrations (main WhatsApp data)');
        console.log('   - integrations (general integrations)');
        console.log('   - users/default_user/integrations (user-specific)');
        
        // Alternative: If you prefer just one collection, uncomment this:
        // await db.collection('whatsapp').doc(waba_id).set({...});
        
      } catch (firestoreError) {
        console.error('❌ Failed to save to Firestore:', firestoreError.message);
        // Don't fail the entire request, just log the error
        // The integration can still work without Firestore storage
      }
    } else {
      console.warn('⚠️ Firebase not initialized, skipping Firestore save');
    }
    
    console.log('💾 Integration data prepared:', integrationData);
    console.log('=== WHATSAPP CODE EXCHANGE COMPLETE ===');

    // Return success response
    res.json({
      success: true,
      message: 'WhatsApp integration setup completed successfully',
      integration: {
        waba_id,
        phone_number_id,
        status: 'active',
        created_at: integrationData.created_at
      }
    });

  } catch (error) {
    console.error('❌ Error in WhatsApp code exchange:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    if (error.response?.status === 400) {
      return res.status(400).json({ 
        error: 'Invalid authorization code or expired code',
        details: error.response.data
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to complete WhatsApp integration setup',
      details: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message
  });
});

// Export the serverless handler
module.exports.handler = serverless(app); 