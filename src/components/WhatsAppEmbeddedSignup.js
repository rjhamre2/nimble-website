import React, { useEffect, useState } from 'react';
import apiConfig from '../config/api';

const WhatsAppEmbeddedSignup = ({ isDarkMode }) => {
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [signupData, setSignupData] = useState(null);
  const [error, setError] = useState(null);
  const [pendingCode, setPendingCode] = useState(null);
  
  // New state to track both pieces of data separately
  const [whatsappData, setWhatsappData] = useState(null);
  const [authCode, setAuthCode] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Configuration - Replace with your actual values
  const CONFIG = {
    APP_ID: '1110256151158809', // Your Facebook App ID
    GRAPH_API_VERSION: 'v23.0',
    CONFIGURATION_ID: '1464707537999245', // Your actual Configuration ID
    FEATURE_TYPE: '' // Leave blank for default flow
  };

  useEffect(() => {
    console.log('WhatsApp Embedded Signup: Starting SDK initialization...');
    
    // Check if Facebook SDK is already loaded
    const checkFacebookSDK = () => {
      if (window.FB) {
        console.log('WhatsApp Embedded Signup: FB SDK already available');
        setIsSDKReady(true);
        return true;
      }
      return false;
    };

    // Try to check immediately
    if (!checkFacebookSDK()) {
      // If not available, wait for it to load
      const checkInterval = setInterval(() => {
        if (checkFacebookSDK()) {
          clearInterval(checkInterval);
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.FB) {
          console.error('WhatsApp Embedded Signup: FB SDK not available after timeout');
          setError('Facebook SDK not available. Please refresh the page.');
        }
      }, 10000);
    }

    // Session logging message event listener
    window.addEventListener('message', (event) => {
      if (!event.origin.endsWith('facebook.com')) return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          console.log('WhatsApp Embedded Signup message event:', data);
          
          // Handle successful completion
          if (data.event === 'FINISH' || data.event === 'FINISH_ONLY_WABA' || data.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING') {
            const newWhatsappData = {
              phone_number_id: data.data.phone_number_id,
              waba_id: data.data.waba_id,
              business_id: data.data.business_id,
              event: data.event
            };
            console.log('Setting new WhatsApp data:', newWhatsappData);
            setWhatsappData(newWhatsappData);
            setSignupData(newWhatsappData); // Keep for backward compatibility
            setError(null);
          }
          // Handle abandoned flow
          else if (data.event === 'CANCEL') {
            setError(`Signup abandoned at step: ${data.data.current_step || 'Unknown'}`);
            setSignupData(null);
            setWhatsappData(null);
          }
        }
      } catch (err) {
        console.log('WhatsApp Embedded Signup raw message event:', event.data);
      }
    });

    return () => {
      // Cleanup event listener
      window.removeEventListener('message', () => {});
    };
  }, []);

  // New useEffect to watch for when both pieces of data are available
  useEffect(() => {
    if (whatsappData && authCode && !isProcessing) {
      console.log('Both WhatsApp data and auth code available - calling Lambda');
      setIsProcessing(true);
      
      sendCodeToServer(authCode, whatsappData.waba_id, whatsappData.phone_number_id)
        .then(result => {
          console.log('WhatsApp integration completed successfully:', result);
          setError(null);
          // Clear the data after successful processing
          setWhatsappData(null);
          setAuthCode(null);
          setPendingCode(null);
          setIsProcessing(false);
        })
        .catch(error => {
          console.error('Failed to send code to Lambda backend:', error);
          setIsProcessing(false);
        });
    }
  }, [whatsappData, authCode, isProcessing]);

  const sendCodeToServer = async (code, wabaId, phoneNumberId) => {
    try {
      console.log('Sending code to Lambda backend for token exchange:', { 
        code: code ? `${code.substring(0, 10)}...` : 'undefined', 
        wabaId, 
        phoneNumberId 
      });
      console.log('API URL:', apiConfig.endpoints.whatsapp());
      
      const requestBody = {
        code,
        waba_id: wabaId,
        phone_number_id: phoneNumberId,
      };
      console.log('Request body:', requestBody);
      
      const response = await fetch(apiConfig.endpoints.whatsapp(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('Lambda backend exchange successful:', result);
        return result;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Lambda backend error response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error exchanging code with Lambda:', error);
      setError(`Failed to complete setup: ${error.message}`);
      throw error;
    }
  };

  // Response callback for successful completion
  const fbLoginCallback = (response) => {
    console.log('Facebook login callback received:', response);
    
    if (response.authResponse) {
      const code = response.authResponse.code;
      console.log('WhatsApp Embedded Signup response code:', code);
      console.log('Current WhatsApp data:', whatsappData);
      
      // Store the auth code and let useEffect handle the Lambda call
      console.log('Storing auth code for processing');
      setAuthCode(code);
      setPendingCode(code); // Keep for backward compatibility
      
    } else {
      console.log('WhatsApp Embedded Signup response (no authResponse):', response);
      setError('Signup was cancelled or failed');
    }
  };

  // Launch WhatsApp Embedded Signup
  const launchWhatsAppSignup = () => {
    if (!isSDKReady) {
      setError('Facebook SDK not ready. Please try again.');
      return;
    }

    setError(null);
    setSignupData(null);
    setWhatsappData(null);
    setAuthCode(null);
    setPendingCode(null);
    setIsProcessing(false);

    // eslint-disable-next-line no-undef
    FB.login(fbLoginCallback, {
      config_id: CONFIG.CONFIGURATION_ID,
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {},
        featureType: CONFIG.FEATURE_TYPE,
        sessionInfoVersion: '3'
      }
    });
  };

  return (
    <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
        WhatsApp Business Setup
      </h3>
      
      <div className="space-y-4">
        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Set up your WhatsApp Business Account to start using Nimble AI with WhatsApp.
        </p>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {signupData && (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            <h4 className="font-semibold mb-2">✅ Setup Successful!</h4>
            <div className="text-sm space-y-1">
              <p><strong>Phone Number ID:</strong> {signupData.phone_number_id}</p>
              <p><strong>WABA ID:</strong> {signupData.waba_id}</p>
              <p><strong>Business ID:</strong> {signupData.business_id}</p>
              <p><strong>Event:</strong> {signupData.event}</p>
            </div>
            {pendingCode && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-xs">
                ⏳ Processing authorization code...
              </div>
            )}
            {isProcessing && (
              <div className="mt-2 p-2 bg-blue-100 border border-blue-400 text-blue-700 rounded text-xs">
                🔄 Sending data to Lambda backend...
              </div>
            )}
          </div>
        )}

        <button
          onClick={launchWhatsAppSignup}
          disabled={!isSDKReady || isProcessing}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
            isSDKReady && !isProcessing
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-gray-400 text-gray-600 cursor-not-allowed'
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
          </svg>
          {isSDKReady ? (isProcessing ? 'Processing...' : 'Setup WhatsApp Business') : 'Loading...'}
        </button>
      </div>

      <div className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        <p>• This will open Facebook's WhatsApp Business setup flow</p>
        <p>• You'll need to complete the verification process</p>
        <p>• Your WhatsApp Business Account will be created</p>
        <p>• You can then use WhatsApp with Nimble AI</p>
      </div>
    </div>
  );
};

export default WhatsAppEmbeddedSignup; 