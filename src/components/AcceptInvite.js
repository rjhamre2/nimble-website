import React, { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';

const AcceptInvite = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Log immediately on render to verify component is mounting
  console.log('🔍 AcceptInvite component rendering');
  console.log('📍 Current location:', location.pathname);
  console.log('🔑 Token from params:', token);
  console.log('📧 Search params:', Object.fromEntries(searchParams.entries()));

  useEffect(() => {
    console.log('🔍 AcceptInvite component mounted (useEffect)');
    console.log('📍 Current location:', location.pathname);
    console.log('🔑 Token from params:', token);
    console.log('📧 Search params:', Object.fromEntries(searchParams.entries()));

    // Validate that token exists
    if (!token) {
      console.error('❌ No invitation token provided');
      // Redirect to home page if no token
      navigate('/', { replace: true });
      return;
    }

    // Get email from query parameter
    const encodedEmail = searchParams.get('email');
    let email = '';
    
    if (encodedEmail) {
      try {
        // Decode the email (it might be URL encoded)
        email = decodeURIComponent(encodedEmail);
        console.log('📧 Decoded email:', email);
      } catch (error) {
        console.error('Error decoding email:', error);
        // If decoding fails, use the raw value
        email = encodedEmail;
      }
    } else {
      console.warn('⚠️ No email parameter found in URL');
    }

    // Store invitation token and email in sessionStorage
    // Using sessionStorage so it's cleared when browser closes
    sessionStorage.setItem('invitationToken', token);
    console.log('✅ Stored invitation token in sessionStorage');
    
    if (email) {
      sessionStorage.setItem('invitationEmail', email);
      console.log('✅ Stored invitation email in sessionStorage:', email);
    }

    // Small delay to ensure storage is set before redirect
    setTimeout(() => {
      console.log('🔄 Redirecting to /start-now');
      navigate('/start-now', { replace: true });
    }, 100);
  }, [token, searchParams, navigate, location]);

  // Show loading state while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing invitation...</p>
        {token && (
          <p className="text-xs text-gray-400 mt-2">
            Token: {token.substring(0, 20)}...
          </p>
        )}
      </div>
    </div>
  );
};

export default AcceptInvite;

