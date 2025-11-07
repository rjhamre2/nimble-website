import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { checkWhatsAppStatus, getUserDashboardStatus } from '../../services/firebaseService';
import { apiConfig } from '../../config/api';
import LiveChat from '../LiveChat';
import Sidebar from './Sidebar';
import RecentChats from './RecentChats';
import IntegrationsPage from './IntegrationsPage';
import KnowledgeBase from './KnowledgeBase';
import PlanBilling from './PlanBilling';
import Settings from './Settings';
import OnboardingBanner from './OnboardingBanner';
import LiveAgentPreview from './LiveAgentPreview';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Fetch pricing subscription status
const fetchPricingSubscriptionStatus = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
    if (!currentUser?.uid) return null;

    const response = await fetch(apiConfig.endpoints.pricing.fetchSubscriptionStatus(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        user_id: currentUser.uid
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.success ? data : null;
  } catch (error) {
    console.error('Error fetching pricing subscription status:', error);
    return null;
  }
};

const Dashboard = () => {
  const { user, userData, loading } = useAuth();
  
  // Tab and view state
  const [activeTab, setActiveTab] = useState('overview');
  const [broadcastView, setBroadcastView] = useState('new-broadcast');
  const [activeAutomationView, setActiveAutomationView] = useState('ai-agents');
  const [activeChannel, setActiveChannel] = useState('whatsapp');
  
  // Status state
  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [pricingSubscriptionStatus, setPricingSubscriptionStatus] = useState(null);
  
  // Loading states
  const [isCheckingWhatsapp, setIsCheckingWhatsapp] = useState(false);
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(false);
  const [isLoadingTraining, setIsLoadingTraining] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [isCheckingWaba, setIsCheckingWaba] = useState(false);
  
  // Modal states
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [isWabaModalOpen, setIsWabaModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isEditingOnboarding, setIsEditingOnboarding] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditContactModalOpen, setIsEditContactModalOpen] = useState(false);
  
  // Contact form state
  const [contactsSort, setContactsSort] = useState('name');
  const [editingContactId, setEditingContactId] = useState(null);
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactPhones, setContactPhones] = useState([{ phone: '', type: 'MOBILE' }]);
  const [contactEmail, setContactEmail] = useState('');
  const [contactEmailType, setContactEmailType] = useState('WORK');
  const [contactAddresses, setContactAddresses] = useState([]);
  const [contactCompany, setContactCompany] = useState('');
  const [contactDepartment, setContactDepartment] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [contactUrl, setContactUrl] = useState('');
  const [contactUrlType, setContactUrlType] = useState('WORK');
  const [contactError, setContactError] = useState('');
  const [contactSuccess, setContactSuccess] = useState('');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactBirthday, setContactBirthday] = useState('');
  const [contactLeadStage, setContactLeadStage] = useState('');
  
  // Contacts data state
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState(null);
  const [contactsPagination, setContactsPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [updatingLeadStage, setUpdatingLeadStage] = useState(null);
  
  // Team management state
  const [teamManagementTab, setTeamManagementTab] = useState('members');
  
  // Account details state
  const [accountDetailsTab, setAccountDetailsTab] = useState('profile');
  
  // Onboarding form state
  const [companyInput, setCompanyInput] = useState('');
  const [specializationInput, setSpecializationInput] = useState('');
  const [onboardingError, setOnboardingError] = useState('');
  const [onboardingMessage, setOnboardingMessage] = useState('');
  const [isSubmittingOnboarding, setIsSubmittingOnboarding] = useState(false);
  
  // Welcome modal state
  const [welcomeName, setWelcomeName] = useState('');
  const [welcomeEmail, setWelcomeEmail] = useState('');
  const [welcomeCountry, setWelcomeCountry] = useState('');
  const [welcomeDialCode, setWelcomeDialCode] = useState('');
  const [welcomePhone, setWelcomePhone] = useState('');
  const [welcomePhoneNumber, setWelcomePhoneNumber] = useState('');
  const [welcomeBusinessType, setWelcomeBusinessType] = useState('');
  const [welcomeBusinessName, setWelcomeBusinessName] = useState('');
  const [welcomeError, setWelcomeError] = useState('');
  const [isSubmittingWelcome, setIsSubmittingWelcome] = useState(false);
  
  // CSV Import state
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvRows, setCsvRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [csvParseError, setCsvParseError] = useState('');
  const [importPreview, setImportPreview] = useState([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  
  // Other state
  const [userName, setUserName] = useState('');
  
  // Lead stages constant
  const LEAD_STAGES = [
    'NEW',
    'CONTACTED',
    'QUALIFIED',
    'PROPOSAL',
    'NEGOTIATION',
    'WON',
    'LOST'
  ];

  // Border classes for status indicators
  const whatsappBorderClass = whatsappStatus?.success && whatsappStatus?.isIntegrated 
    ? 'border-green-500' 
    : 'border-gray-300';
  const onboardingBorderClass = onboardingStatus?.status === 'completed' 
    ? 'border-yellow-500' 
    : 'border-gray-300';
  const trainingBorderClass = trainingStatus?.status === 'completed' 
    ? 'border-blue-500' 
    : 'border-gray-300';
  const subscriptionBorderClass = pricingSubscriptionStatus?.status === 'authenticated' || pricingSubscriptionStatus?.status === 'active'
    ? 'border-purple-500' 
    : 'border-gray-300';

  // Handler functions
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleWhatsAppClick = () => {
    setActiveTab('integrations');
  };

  const handleOnboardingClick = () => {
    setIsOnboardingModalOpen(true);
  };

  const handleTrainingClick = () => {
    setActiveTab('knowledge-base');
  };

  const handleSubscriptionClick = () => {
    setActiveTab('plan-billing');
  };

  const resetContactForm = () => {
    setContactFirstName('');
    setContactLastName('');
    setContactPhones([{ phone: '', type: 'MOBILE' }]);
    setContactEmail('');
    setContactEmailType('WORK');
    setContactAddresses([]);
    setContactCompany('');
    setContactDepartment('');
    setContactTitle('');
    setContactUrl('');
    setContactUrlType('WORK');
    setContactError('');
    setContactSuccess('');
    setEditingContactId(null);
  };

  const addAddress = () => {
    setContactAddresses([...contactAddresses, {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      country_code: '',
      type: 'HOME'
    }]);
  };

  const updateAddress = (index, field, value) => {
    const newAddresses = [...contactAddresses];
    newAddresses[index] = { ...newAddresses[index], [field]: value };
    setContactAddresses(newAddresses);
  };

  const removeAddress = (index) => {
    setContactAddresses(contactAddresses.filter((_, i) => i !== index));
  };

  const addPhone = () => {
    setContactPhones([...contactPhones, { phone: '', type: 'MOBILE' }]);
  };

  const removePhone = (index) => {
    setContactPhones(contactPhones.filter((_, i) => i !== index));
  };

  const updatePhone = (index, field, value) => {
    const newPhones = [...contactPhones];
    newPhones[index] = { ...newPhones[index], [field]: value };
    setContactPhones(newPhones);
  };

  // Contact utility functions
  const getContactDisplayName = (contact) => {
    if (contact.first_name || contact.last_name) {
      return `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    }
    if (contact.phones && contact.phones.length > 0) {
      return contact.phones[0].phone || 'Unknown';
    }
    return 'Unknown Contact';
  };

  const getCountryCodeFromPhone = (phone) => {
    // Simple extraction - assumes phone starts with country code
    if (phone && phone.length > 0) {
      return phone.substring(0, 2);
    }
    return '';
  };

  const getCountryFlag = (countryCode) => {
    // Simple emoji mapping - can be enhanced
    const flags = {
      'US': '🇺🇸',
      'IN': '🇮🇳',
      'GB': '🇬🇧',
      'CA': '🇨🇦',
      'AU': '🇦🇺'
    };
    return flags[countryCode] || '🌍';
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Simple formatting - can be enhanced
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  // Contact handlers
  const handleAddContact = async () => {
    setIsSubmittingContact(true);
    setContactError('');
    setContactSuccess('');
    
    try {
      // Implementation would call API to add contact
      setContactSuccess('Contact added successfully');
      resetContactForm();
      setIsAddContactModalOpen(false);
      // Refresh contacts list
    } catch (error) {
      setContactError(error.message || 'Failed to add contact');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleUpdateContact = async () => {
    if (!editingContactId) return;
    
    setIsSubmittingContact(true);
    setContactError('');
    setContactSuccess('');
    
    try {
      // Implementation would call API to update contact
      setContactSuccess('Contact updated successfully');
      resetContactForm();
      setIsEditContactModalOpen(false);
      // Refresh contacts list
    } catch (error) {
      setContactError(error.message || 'Failed to update contact');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleEditContact = (contact) => {
    setEditingContactId(contact.id);
    setContactFirstName(contact.first_name || '');
    setContactLastName(contact.last_name || '');
    setContactPhones(contact.phones || [{ phone: '', type: 'MOBILE' }]);
    setContactEmail(contact.email || '');
    setContactEmailType(contact.email_type || 'WORK');
    setContactAddresses(contact.addresses || []);
    setContactCompany(contact.company || '');
    setContactDepartment(contact.department || '');
    setContactTitle(contact.title || '');
    setContactUrl(contact.url || '');
    setContactUrlType(contact.url_type || 'WORK');
    setContactBirthday(contact.birthday || '');
    setContactLeadStage(contact.lead_stage || '');
    setIsEditContactModalOpen(true);
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      // Implementation would call API to delete contact
      // Refresh contacts list
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  const handleQuickUpdateLeadStage = async (contactId, newStage) => {
    setUpdatingLeadStage(contactId);
    try {
      // Implementation would call API to update lead stage
      // Refresh contacts list
    } catch (error) {
      console.error('Failed to update lead stage:', error);
    } finally {
      setUpdatingLeadStage(null);
    }
  };

  const handleExportCsv = () => {
    // Implementation to export contacts as CSV
    console.log('Exporting contacts to CSV...');
  };

  // Onboarding handlers
  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingOnboarding(true);
    setOnboardingError('');
    setOnboardingMessage('');
    
    try {
      // Implementation would call API to submit onboarding
      setOnboardingMessage('Onboarding completed successfully');
      setIsOnboardingModalOpen(false);
      refreshAllStatuses();
    } catch (error) {
      setOnboardingError(error.message || 'Failed to submit onboarding');
    } finally {
      setIsSubmittingOnboarding(false);
    }
  };

  // Welcome modal handlers
  const handleWelcomeCountryChange = (country) => {
    setWelcomeCountry(country);
    // Set dial code based on country
    const countryDialCodes = {
      'IN': '+91',
      'US': '+1',
      'GB': '+44',
      'CA': '+1',
      'AU': '+61',
      'DE': '+49',
      'FR': '+33',
      'IT': '+39',
      'ES': '+34',
      'BR': '+55',
      'MX': '+52',
      'JP': '+81',
      'CN': '+86',
      'KR': '+82',
      'SG': '+65',
      'MY': '+60',
      'TH': '+66',
      'ID': '+62',
      'PH': '+63',
      'VN': '+84',
      'HK': '+852',
      'TW': '+886',
      'NZ': '+64',
      'AE': '+971',
      'SA': '+966',
      'ZA': '+27',
      'RU': '+7',
      'PK': '+92',
      'BD': '+880',
      'LK': '+94',
      'NP': '+977',
      'MM': '+95'
    };
    const dialCode = countryDialCodes[country] || '+1';
    setWelcomeDialCode(dialCode);
  };

  const handleWelcomeSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingWelcome(true);
    setWelcomeError('');
    
    try {
      const dbId = userData?.db_id || user?.db_id;
      if (!dbId) {
        throw new Error('User ID not found');
      }

      // Prepare the request body
      const requestBody = {
        uid: dbId,
        username: welcomeName || userData?.username || user?.displayName || '',
        email: welcomeEmail || userData?.email || user?.email || '',
        password_hash: 'sdafdsfsdf', // Not needed for this flow
        business_name: welcomeBusinessName || '',
        business_type: welcomeBusinessType || '',
        signup_mobile_number: welcomePhone || (welcomePhoneNumber ? `${welcomeDialCode || '+91'} ${welcomePhoneNumber}` : ''),
        waba_details: {}
      };

      // Call DB Server API to create/update user
      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
      const url = `${dbServerUrl}/api/users`;
      
      console.log('🌐 Calling create/update user API:', url);
      console.log('📤 Request body:', requestBody);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ User created/updated:', result);
      console.log('✅ API Response data:', result);

      // Mark that welcome form has been submitted (prevent it from showing again)
      localStorage.setItem('nimble_first_time', '0');
      
      // Close welcome modal immediately
      setIsWelcomeModalOpen(false);
      
      // Navigate to dashboard/overview
      setActiveTab('overview');
      
      // Refresh statuses
      refreshAllStatuses();
      
      // After API returns successfully, check WABA details
      // The API should have created the user with empty waba_details, so we check if modal should show
      console.log('🔍 ========== POST API completed, now checking WABA details ==========');
      console.log('🔍 About to call checkWabaDetails...');
      console.log('🔍 Current state:', { 
        hasUser: !!user, 
        hasUserData: !!userData, 
        isWelcomeModalOpen: false, // We just set it to false
        dbId: userData?.db_id || user?.db_id 
      });
      
      // Small delay to ensure modal state is updated, then check WABA
      setTimeout(async () => {
        console.log('🔍 ========== Calling checkWabaDetails after welcome form submission ==========');
        try {
          await checkWabaDetails();
          console.log('✅ checkWabaDetails completed');
        } catch (error) {
          console.error('❌ Error in checkWabaDetails:', error);
        }
      }, 500);
    } catch (error) {
      console.error('❌ Error submitting welcome form:', error);
      setWelcomeError(error.message || 'Failed to submit form');
    } finally {
      setIsSubmittingWelcome(false);
    }
  };

  // CSV Import handlers
  const handleCsvFile = (file) => {
    // Implementation to parse CSV file
    console.log('Handling CSV file:', file);
  };

  const recomputePreview = () => {
    // Implementation to recompute import preview
    console.log('Recomputing preview...');
  };

  const handleChangeMapping = (field, csvColumn) => {
    setMapping({ ...mapping, [field]: csvColumn });
  };

  const handleStartImport = async () => {
    setIsImporting(true);
    setImportProgress({ current: 0, total: csvRows.length });
    
    try {
      // Implementation to import contacts
      setImportResults({ success: true, imported: csvRows.length });
    } catch (error) {
      setImportResults({ success: false, error: error.message });
    } finally {
      setIsImporting(false);
    }
  };

  const knownFields = [
    'first_name',
    'last_name',
    'phone',
    'email',
    'company',
    'title'
  ];

  // Refresh all statuses
  const refreshAllStatuses = useCallback(async () => {
    if (!user?.uid) return;
    
    setIsCheckingWhatsapp(true);
    setIsLoadingOnboarding(true);
    setIsLoadingTraining(true);
    setIsLoadingSubscription(true);
    
    try {
      const [wa, ob, pricingSub] = await Promise.all([
        checkWhatsAppStatus(user.uid),
        getUserDashboardStatus(user.uid),
        fetchPricingSubscriptionStatus()
      ]);
      
      setWhatsappStatus(wa);
      setOnboardingStatus(ob?.onboarding || null);
      setTrainingStatus(ob?.training || null);
      setSubscriptionDetails(ob?.subscription || null);
      setPricingSubscriptionStatus(pricingSub);
    } catch (error) {
      console.error('Error refreshing statuses:', error);
    } finally {
      setIsCheckingWhatsapp(false);
      setIsLoadingOnboarding(false);
      setIsLoadingTraining(false);
      setIsLoadingSubscription(false);
    }
  }, [user]);

  // Check welcome modal
  const checkWelcomeModal = useCallback(() => {
    if (!user || !userData) return;
    
    const storedFirstTime = localStorage.getItem('nimble_first_time');
    const isFirstTime = storedFirstTime === '1';
    
    // Only show welcome modal if it's first time AND modal is not already open AND not currently submitting
    if (isFirstTime && !isWelcomeModalOpen && !isSubmittingWelcome) {
      // Set default country and dial code when opening modal
      if (!welcomeCountry) {
        setWelcomeCountry('IN');
        setWelcomeDialCode('+91');
      }
      setIsWelcomeModalOpen(true);
    }
  }, [user, userData, isWelcomeModalOpen, welcomeCountry, isSubmittingWelcome]);

  // Check WABA details
  const checkWabaDetails = useCallback(async () => {
    console.log('🔍 checkWabaDetails called', { hasUser: !!user, hasUserData: !!userData });
    
    if (!user || !userData) {
      console.log('⚠️ Early return: missing user or userData', { user: !!user, userData: !!userData });
      return;
    }
    
    setIsCheckingWaba(true);
    try {
      const dbId = userData?.db_id || user?.db_id;
      console.log('🔍 dbId check:', { dbId, userDataDbId: userData?.db_id, userDbId: user?.db_id });
      
      if (!dbId) {
        console.log('⚠️ No db_id found, skipping WABA check');
        setIsCheckingWaba(false);
        return;
      }

      // Call DB Server API to get user details including waba_details
      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
      if (!dbServerUrl) {
        console.error('❌ DB Server URL is not configured!');
        setIsCheckingWaba(false);
        return;
      }
      
      const url = `${dbServerUrl}/api/users/${dbId}`;
      
      console.log('🌐 ========== WABA API CALL START ==========');
      console.log('🌐 Calling WABA check API:', url);
      console.log('🌐 DB Server URL from config:', dbServerUrl);
      console.log('🌐 dbId:', dbId);
      console.log('🌐 Full URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('🌐 API Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ WABA check response:', result);

      if (result.success && result.data) {
        const wabaDetails = result.data.waba_details || {};
        
        // Check if waba_details is an empty object
        const isEmpty = Object.keys(wabaDetails).length === 0;
        
        if (isEmpty) {
          console.log('📋 waba_details is empty, showing WABA modal');
          setUserName(result.data.username || userData?.username || user?.displayName || 'User');
          setIsWabaModalOpen(true);
        } else {
          console.log('✅ waba_details exists, not showing modal');
        }
      }
    } catch (error) {
      console.error('❌ Error checking WABA details:', error);
      console.error('❌ Error stack:', error.stack);
    } finally {
      setIsCheckingWaba(false);
    }
  }, [user, userData, isWelcomeModalOpen, isWabaModalOpen]);

  useEffect(() => {
    checkWelcomeModal();
  }, [checkWelcomeModal]);

  // Call checkWabaDetails when userData becomes available
  useEffect(() => {
    if (user && userData && !loading && !isWelcomeModalOpen) {
      console.log('🚀 User data available, checking WABA details...');
      // Small delay to ensure welcome modal check completes first
      const timer = setTimeout(() => {
        checkWabaDetails();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, userData, loading, isWelcomeModalOpen, checkWabaDetails]);

  // Debug: Track when WABA modal state changes
  useEffect(() => {
    console.log('🔄 WABA Modal state changed:', isWabaModalOpen);
    if (isWabaModalOpen) {
      console.log('✅ WABA Modal is now OPEN - should be visible');
    } else {
      console.log('❌ WABA Modal is now CLOSED');
    }
  }, [isWabaModalOpen]);

  // Check WABA details automatically when user is authenticated and welcome modal is closed
  // This runs:
  // 1. When user loads dashboard and welcome modal is not shown (isFirstTime = false)
  // 2. After welcome form submission (when welcome modal closes)
  useEffect(() => {
    console.log('🔄 WABA check useEffect triggered', {
      user: !!user,
      userData: !!userData,
      loading,
      isWelcomeModalOpen,
      isCheckingWaba,
      isWabaModalOpen
    });
    
    // Only check if:
    // 1. User is authenticated
    // 2. UserData is available (needed for db_id)
    // 3. Not currently loading
    // 4. Welcome modal is not open
    // 5. Not currently checking (to avoid duplicate calls)
    // 6. Modal is not already open (to avoid re-checking while it's open)
    if (user && userData && !loading && !isWelcomeModalOpen && !isCheckingWaba && !isWabaModalOpen) {
      // Check if user is first-time
      const storedFirstTime = localStorage.getItem('nimble_first_time');
      const isFirstTime = storedFirstTime === '1';
      
      console.log('🔍 WABA check conditions:', {
        user: !!user,
        loading,
        isWelcomeModalOpen,
        isCheckingWaba,
        isWabaModalOpen,
        storedFirstTime,
        isFirstTime
      });
      
      // Trigger WABA check if user is NOT first-time (welcome modal won't show)
      // isFirstTime is only true if storedFirstTime === '1'
      // If it's null, '0', or anything else, treat as not first-time
      if (!isFirstTime) {
        console.log('🔄 Auto-checking WABA details (user not first-time)...', {
          hasUser: !!user,
          loading,
          isWelcomeModalOpen,
          isCheckingWaba,
          isWabaModalOpen,
          isFirstTime,
          storedFirstTime,
          userId: user?.uid,
          userDbId: userData?.db_id || user?.db_id
        });
        
        checkWabaDetails();
      } else {
        console.log('⏸️ Skipping WABA auto-check - user is first-time, welcome modal will show', {
          isFirstTime,
          storedFirstTime
        });
      }
    } else {
      console.log('⏸️ Skipping WABA auto-check:', {
        hasUser: !!user,
        loading,
        isWelcomeModalOpen,
        isCheckingWaba,
        isWabaModalOpen
      });
    }
  }, [user, loading, isWelcomeModalOpen, isCheckingWaba, isWabaModalOpen, checkWabaDetails, userData]);

  // Also listen for auth state changes to re-check immediately
  useEffect(() => {
    const handleAuthChange = () => {
      console.log('🔄 Auth state changed, re-checking welcome modal...');
      // Small delay to ensure localStorage is updated
      setTimeout(checkWelcomeModal, 200);
    };
    
    const handleStorageChange = (e) => {
      // Check if nimble_first_time was set
      if (e.key === 'nimble_first_time' || e.key === 'userData') {
        console.log('💾 localStorage changed:', e.key, 're-checking welcome modal...');
        setTimeout(checkWelcomeModal, 100);
      }
    };
    
    const handleFirstTimeSet = (e) => {
      console.log('🎯 firstTime flag was set:', e.detail, 're-checking welcome modal immediately...');
      setTimeout(checkWelcomeModal, 50);
    };
    
    window.addEventListener('authStateChanged', handleAuthChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('firstTimeSet', handleFirstTimeSet);
    
    // Also poll localStorage periodically when user is null (during sign-in)
    const pollInterval = !user && !userData ? setInterval(() => {
      const firstTime = localStorage.getItem('nimble_first_time');
      if (firstTime === '1') {
        console.log('🔍 Polling detected firstTime flag, re-checking...');
        checkWelcomeModal();
      }
    }, 500) : null;
    
    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('firstTimeSet', handleFirstTimeSet);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [checkWelcomeModal, user, userData]);

  // Call Firebase Lambda to check WhatsApp status when user is authenticated
  useEffect(() => {
    const fetchAllStatuses = async () => {
      if (!user?.uid) return;

      console.log('🔍 Fetching dashboard statuses for user:', user.uid);
      setIsCheckingWhatsapp(true);
      setIsLoadingOnboarding(true);
      setIsLoadingTraining(true);
      try {
        const [wa, ob, tr, sub, pricingSub] = await Promise.all([
          checkWhatsAppStatus(user.uid),
          getUserDashboardStatus(user.uid),
          fetchPricingSubscriptionStatus()
        ]);
        console.log('✅ Statuses:', { wa, ob, tr, sub, pricingSub });
        setWhatsappStatus(wa);
        setOnboardingStatus(ob?.onboarding || null);
        setTrainingStatus(ob?.training || null);
        setSubscriptionDetails(ob?.subscription || null);
      } catch (error) {
        console.error('❌ Error fetching statuses:', error);
        if (!whatsappStatus) setWhatsappStatus({ success: false, error: error.message });
      } finally {
        setIsCheckingWhatsapp(false);
        setIsLoadingOnboarding(false);
        setIsLoadingTraining(false);
      }
    };

    if (user?.uid && !whatsappStatus && !onboardingStatus && !trainingStatus && !subscriptionDetails && !pricingSubscriptionStatus && !isLoadingSubscription && !isCheckingWhatsapp) {
      fetchAllStatuses();
    }
  }, [user, userData, whatsappStatus, onboardingStatus, trainingStatus, subscriptionDetails, pricingSubscriptionStatus, isLoadingSubscription, isCheckingWhatsapp]);

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  const renderMainContent = () => {
    switch (activeTab) {
      case 'team-inbox':
        return <LiveChat />;
      
      case 'broadcast':
        return (
          <div className="w-full" style={{ height: 'calc(100vh - 64px)' }}>
            <div className="pl-0 pr-4 w-full" style={{ height: 'calc(100vh - 64px)' }}>
              <div className="grid grid-cols-1 lg:grid-cols-9 gap-0 w-full" style={{ height: 'calc(100vh - 64px)' }}>
                <div className="lg:col-span-2 rounded-lg shadow-lg flex flex-col bg-white" style={{ height: 'calc(100vh - 64px)' }}>
                <div className="pr-0 pl-0 pt-0 pb-0 border-b flex-shrink-0 border-gray-200">
                  <div className="flex items-center gap-0">
                    <div className="relative flex-1">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      className="w-10 h-10 flex items-center justify-center font-medium text-sm transition-colors flex-shrink-0 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      title="New Chat"
                    >
                      <span className="text-lg">+</span>
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 px-0 py-2 border-t border-gray-200">
                    <button 
                      onClick={() => setBroadcastView('new-broadcast')}
                      className={`w-full px-3 py-2 text-xs font-medium border rounded-lg transition-colors ${
                        broadcastView === 'new-broadcast' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      New Broadcast
                    </button>
                    <button 
                      onClick={() => setBroadcastView('templates')}
                      className={`w-full px-3 py-2 text-xs font-medium border rounded-lg transition-colors ${
                        broadcastView === 'templates' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Templates
                    </button>
                    <button 
                      onClick={() => setBroadcastView('analytics')}
                      className={`w-full px-3 py-2 text-xs font-medium border rounded-lg transition-colors ${
                        broadcastView === 'analytics' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Analytics
                    </button>
                  </div>
                </div>
                  <div className="flex-1 overflow-y-auto p-6">
                  </div>
                </div>
                {/* Right Panel */}
                <div className="lg:col-span-7 rounded-lg shadow-lg flex flex-col bg-white" style={{ height: 'calc(100vh - 64px)' }}>
                  <div className="flex-1 overflow-y-auto p-6">
                    {broadcastView === 'templates' && (
                      <div className="space-y-6">
                        <div className="flex items-start justify-between">
                  <div>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Template Library</h2>
                            <p className="text-sm text-gray-600 mb-4">
                              Select or create your template and submit it for WhatsApp approval. All templates must adhere to WhatsApp's guidelines.
                    </p>
                  </div>
                          <button className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                            Watch Tutorial
                          </button>
                  </div>

                        <div className="flex items-center justify-between mb-4">
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                            New Template Message
                          </button>
                          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>English</option>
                          </select>
                </div>

                        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                          <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium whitespace-nowrap">
                            All
                          </button>
                          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 whitespace-nowrap">
                            Travel <span className="text-gray-500">(6)</span>
                          </button>
                          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 whitespace-nowrap">
                            Healthcare <span className="text-gray-500">(5)</span>
                          </button>
                          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 whitespace-nowrap">
                            E-Commerce <span className="text-gray-500">(14)</span>
                          </button>
                          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 whitespace-nowrap">
                            More...
                          </button>
              </div>

                        <div className="space-y-4">
                          {/* Template 1 */}
                          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Login_Verification</h3>
                                <span className="text-xs text-gray-500">Others</span>
                              </div>
                              <button className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                                Use sample
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                              Hi {`{{name}}`},

                              To verify your login attempt, please enter the following code in the login page:

                              🔑 **Your Code**: [Verification Code]

                              This code will expire in **[Time Duration]**.

                              If this wasn't you, please reset your password or contact our support team at (support_method)
                            </p>
                          </div>

                          {/* Template 2 */}
                          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Login_Verification</h3>
                                <span className="text-xs text-gray-500">Others</span>
                              </div>
                              <button className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                                Use sample
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                              Hi {`{{name}}`},

                              To verify your login attempt, please enter the following code in the app or website:

                              🔑 **Your Code**: [Verification Code]

                              This code will expire in **[Time Duration]**.
                              Please do not share this code with anyone for your safety.

                              If this wasn't you, please reset your password or contact our support team at (support_method)
                            </p>
                          </div>

                          {/* Template 3 */}
                          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Login_Verification</h3>
                                <span className="text-xs text-gray-500">Others</span>
                              </div>
                              <button className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                                Use sample
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                              "Hi {`{{name}}`},

                              To complete your purchase, please enter the following OTP (One-Time Password) on our login page:

                              🛍️ **Your OTP**: [OTP Code]
                              Please do not share this code with anyone for your safety.
                              This OTP is valid for **[Time Duration]**. If you didn't request this, please contact our support team for assistance at (support_method)."
                            </p>
                          </div>

                          {/* Template 4 */}
                          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Two-Factor_Authentication (2FA) Code</h3>
                                <span className="text-xs text-gray-500">Others</span>
                              </div>
                              <button className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                                Use sample
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                              Hi {`{{name}}`},

                              For added security, please use the following code to complete your login:

                              🔑 **Your Code**: [Authentication Code]

                              Please do not share this code with anyone for your safety.

                              If you did not request this, please contact our support team immediately at (support_method).
                            </p>
                          </div>

                          {/* Template 5 */}
                          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">OTP_for_Checkout</h3>
                                <span className="text-xs text-gray-500">Others</span>
                              </div>
                              <button className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                                Use sample
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                              Hi {`{{name}}`},

                              To complete your purchase, please enter the following OTP (One-Time Password) on our checkout page:

                              🛍️ **Your OTP**: [OTP Code]

                              This OTP is valid for **[Time Duration]**. If you didn't request this, please contact our support team for assistance at (support_method).
                            </p>
                          </div>

                          {/* Template 6 */}
                          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Two-Factor_Authentication (2FA) Code</h3>
                                <span className="text-xs text-gray-500">Others</span>
                              </div>
                              <button className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                                Use sample
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                              Hi {`{{name}}`},

                              For added security, please use the following code to complete your login:

                              🔑 **Your Code**: [Authentication Code]

                              If you did not request this, please contact our support team immediately at (support_method).
                            </p>
                          </div>

                          {/* Template 7 */}
                          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Booking_Confirmation</h3>
                                <span className="text-xs text-gray-500">Travel</span>
                              </div>
                              <button className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                                Use sample
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                              Hi [Customer Name],

                              Great news! Your trip to [Destination] is confirmed! 🎉 Here are your booking details:

                              🌍 Destination: [Destination Name]

                              📅 Travel Dates: [Start Date] - [End Date]

                              ✈️ Flight Number: [Flight Number]

                              🏨 Hotel: [Hotel Name]

                              👉 You can access your full itinerary here: [Link]

                              If you have any questions or need further assistance, feel free to reply to this message or contact us at [Phone Number].

                              Safe travels and thank you for choosing [Travel Agency Name]!
                            </p>
                          </div>

                          {/* Template 8 */}
                          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Prescription_Renewal_Reminder</h3>
                                <span className="text-xs text-gray-500">Healthcare</span>
                              </div>
                              <button className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                                Use sample
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                              Hi {`{{name}}`},

                              This is a friendly reminder that it's time to renew your prescription for [Medication Name]. To ensure you don't run out of your medication, please submit a renewal request before [Date].
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {broadcastView === 'analytics' && (
                      <div className="space-y-6">
                        <div className="flex items-start justify-between">
                          <h2 className="text-2xl font-semibold text-gray-900">Broadcast Analytics</h2>
                          <button className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                            Watch Tutorial
                          </button>
                        </div>

                        <div className="flex items-center justify-end mb-4">
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                            New Broadcast
                          </button>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-4 bg-white">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Overview</h3>
                            <div className="flex items-center gap-2">
                              <button className="px-3 py-1 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                                Export
                              </button>
                              <button className="px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                                Preview with sample data
                              </button>
                            </div>
                          </div>

                          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">Your daily Meta messaging limit</span>
                              <button className="text-xs text-blue-600 hover:underline">What are limits?</button>
                            </div>
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">250/250</span> unique contacts
                            </p>
                          </div>

                          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-4">Consecutive days of messaging</p>
                            <div className="text-xs text-gray-500">Messaging Quality</div>
                            <div className="text-sm text-gray-700 font-medium mt-1">Quality Unavailable</div>
                          </div>

                          <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="text-center">
                              <div className="text-2xl font-semibold text-gray-900 mb-1">0</div>
                              <div className="text-xs text-gray-600">Sent</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-semibold text-gray-900 mb-1">0</div>
                              <div className="text-xs text-gray-600">Delivered</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-semibold text-gray-900 mb-1">0</div>
                              <div className="text-xs text-gray-600">Read</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-semibold text-gray-900 mb-1">0</div>
                              <div className="text-xs text-gray-600">Replied</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-semibold text-gray-900 mb-1">0</div>
                              <div className="text-xs text-gray-600">Sending</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-semibold text-gray-900 mb-1">0</div>
                              <div className="text-xs text-gray-600">Failed</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-semibold text-gray-900 mb-1">0</div>
                              <div className="text-xs text-gray-600">Processing</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-semibold text-gray-900 mb-1">0</div>
                              <div className="text-xs text-gray-600">Queued</div>
                            </div>
                          </div>
                        </div>

                        <div className="border border-gray-200 rounded-lg bg-white">
                          <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-gray-900">Broadcast list</h3>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600">Sorted by:</span>
                                <select className="px-3 py-1 text-xs border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                  <option>Latest</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-6 gap-4 text-xs font-medium text-gray-700 pb-2 border-b border-gray-200">
                              <div>Broadcast name</div>
                              <div>Total recipients</div>
                              <div>Successful</div>
                              <div>Read</div>
                              <div>Replied</div>
                              <div className="col-span-2 flex items-center justify-between">
                                <span>Website clicks</span>
                                <span>Actions</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-12 text-center">
                            <div className="text-gray-400 mb-2">
                              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">No data</p>
                            <p className="text-xs text-gray-500 mb-4">No Broadcasts here</p>
                            <p className="text-xs text-gray-600 mb-4">
                              Start sending broadcast messages on WhatsApp and monitor read rate, response rate, etc.
                            </p>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                              New Broadcast
                            </button>
                          </div>

                          <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <span>Rows per page:</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {broadcastView === 'new-broadcast' && (
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 mb-2">What message do you want to send?</h2>
                          <p className="text-sm text-gray-600 mb-4">Add broadcast name and template below</p>
                          
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Broadcast name</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter broadcast name"
                            />
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select template message</label>
                            <button className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left text-gray-700 hover:bg-gray-50 flex items-center justify-between">
                              <span>Select a template</span>
                              <span className="text-blue-600">+Add New Template</span>
                            </button>
                          </div>
                        </div>

                        <div className="border-t pt-6">
                          <h2 className="text-xl font-semibold text-gray-900 mb-2">Who is your audience?</h2>
                          <p className="text-sm text-gray-600 mb-4">Choose from pre-built segments, imported contacts, or manual selection</p>
                          
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Segments</label>
                            <div className="space-y-2">
                              <button className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 flex items-center gap-2">
                                <span>New</span>
                                <span className="text-gray-400 ml-auto">Share feedback</span>
                              </button>
                              <div className="grid grid-cols-2 gap-2">
                                <button className="px-3 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span>🤑</span>
                                    <span className="font-medium">Highly engaged</span>
                                  </div>
                                  <span className="text-xs text-gray-500">(0)</span>
                                </button>
                                <button className="px-3 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span>🚨</span>
                                    <span className="font-medium">Winback</span>
                                  </div>
                                  <span className="text-xs text-gray-500">(0)</span>
                                </button>
                                <button className="px-3 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span>😴</span>
                                    <span className="font-medium">At Risk</span>
                                  </div>
                                  <span className="text-xs text-gray-500">(0)</span>
                                </button>
                                <button className="px-3 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span>✅</span>
                                    <span className="font-medium">All valid</span>
                                  </div>
                                  <span className="text-xs text-gray-500">(0)</span>
                                </button>
                              </div>
                              <button className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-center text-gray-600 hover:bg-gray-50">
                                Add another filter +
                              </button>
                            </div>
                          </div>

                          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700 mb-2">
                              Selected: <span className="font-medium">0 / 250</span> Contacts remaining
                            </p>
                            <p className="text-sm text-gray-700">
                              Daily limit: <span className="font-medium">250/Day</span>
                            </p>
                          </div>

                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                              <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-700">
                                <div>Rupesh J</div>
                                <div>918419922107</div>
                                <div>TRUE</div>
                                <div>success</div>
                              </div>
                            </div>
                            <div className="bg-white px-4 py-3 border-b border-gray-200">
                              <div className="grid grid-cols-4 gap-4 text-xs text-gray-600">
                                <div>Rupesh J</div>
                                <div>918419922107</div>
                                <div>TRUE</div>
                                <div>success</div>
                              </div>
                            </div>
                            <div className="bg-white px-4 py-3 border-b border-gray-200">
                              <div className="grid grid-cols-4 gap-4 text-xs text-gray-600">
                                <div>NimbleAI Test</div>
                                <div>85264318721</div>
                                <div>TRUE</div>
                                <div>success</div>
                              </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3">
                              <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>Rows per page:</span>
                                <span>1–2 of 2</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-6">
                          <h2 className="text-xl font-semibold text-gray-900 mb-4">When do you want to send it?</h2>
                          <div className="space-y-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="send-time" value="now" defaultChecked className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-700">Send now</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="send-time" value="schedule" className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-700">Schedule for a specific time</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'contacts':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Contacts</h2>
                  <p className="text-sm text-gray-600">
                    Contact list stores the list of numbers that you've interacted with. You can even manually export or import contacts.
                  </p>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                  Watch Tutorial
                </button>
              </div>

              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={() => {
                    setIsAddContactModalOpen(true);
                    resetContactForm();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
                >
                  <span>+</span>
                  <span>Add Contact</span>
                  <span className="text-xs bg-blue-700 px-2 py-1 rounded">{contactsPagination.total || contacts.length} in total</span>
                </button>
              </div>

              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">BUSINESS</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      Secure customer interactions by masking phone numbers during support conversations.
                    </p>
                    <button className="px-3 py-1 text-xs font-medium bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors">
                      Upgrade
                    </button>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Sorted by:</span>
                      <select
                        className="px-3 py-1 text-xs border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={contactsSort}
                        onChange={(e) => setContactsSort(e.target.value)}
                      >
                        <option value="lastUpdated">Last Updated</option>
                        <option value="alpha">Alphabetical (A–Z)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExportCsv}
                        className="px-3 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        Export
                      </button>
                      <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-3 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        Import
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4 text-xs font-medium text-gray-700 pb-2">
                    <div>Basic info</div>
                    <div>Phone number</div>
                    <div>Source</div>
                    <div>Lead Stage</div>
                    <div>Edit/Delete</div>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {contactsLoading ? (
                    <div className="p-8 text-center text-gray-500">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-sm">Loading contacts...</p>
                    </div>
                  ) : contactsError ? (
                    <div className="p-4 text-center text-red-600 text-sm">
                      {contactsError}
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      No contacts found. Click "Add Contact" to create your first contact.
                    </div>
                  ) : (
                    (contactsSort === 'alpha'
                      ? [...contacts].sort((a, b) => getContactDisplayName(a).localeCompare(getContactDisplayName(b)))
                      : [...contacts].sort((a, b) => (new Date(b.updated_at || b.created_at || 0)) - (new Date(a.updated_at || a.created_at || 0)))
                    ).map((contact) => {
                      const contactData = contact.contact_data || {};
                      const name = contactData.name || {};
                      const displayName = name.formatted_name || `${name.first_name || ''} ${name.last_name || ''}`.trim() || 'No Name';
                      const phones = contactData.phones || [];
                      const primaryPhone = phones[0];
                      const phoneNumber = primaryPhone?.phone || '';
                      const countryCode = phoneNumber ? getCountryCodeFromPhone(phoneNumber) : '';
                      const countryFlag = countryCode ? getCountryFlag(countryCode) : '';
                      const formattedPhone = phoneNumber ? formatPhoneNumber(phoneNumber, countryCode) : 'No phone';
                      
                      // Get contact attributes (excluding nested objects)
                      const attributes = Object.entries(contactData)
                        .filter(([key]) => !['name', 'phones', 'emails', 'addresses', 'org', 'urls', 'birthday'].includes(key))
                        .map(([key, value]) => ({ key, value }));
                      const leadStage = contactData.lead_stage;
                      
                      return (
                        <div key={contact.contact_id} className="p-4 hover:bg-gray-50">
                          <div className="grid grid-cols-5 gap-4 items-center">
                            <div className="text-sm font-medium text-gray-900">{displayName}</div>
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              {countryFlag && <span>{countryFlag}</span>}
                              <span>{formattedPhone}</span>
                            </div>
                            <div className="text-sm text-gray-700">NimbleAI</div>
                            <div className="text-sm text-gray-700">
                              <select
                                className="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                value={leadStage || 'New Lead'}
                                onChange={(e) => handleQuickUpdateLeadStage(contact.contact_id, e.target.value)}
                                disabled={!!updatingLeadStage[contact.contact_id]}
                              >
                                {LEAD_STAGES.map(stage => (
                                  <option key={stage} value={stage}>{stage}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleEditContact(contact)}
                                className="px-2 py-1 text-xs text-blue-600 hover:underline"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteContact(contact.contact_id)}
                                className="px-2 py-1 text-xs text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Rows per page:</span>
                    <span>
                      {contacts.length > 0 
                        ? `${contactsPagination.offset + 1}–${Math.min(contactsPagination.offset + contacts.length, contactsPagination.total)} of ${contactsPagination.total}`
                        : '0 of 0'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'automations':
        return (
          <div className="w-full" style={{ height: 'calc(100vh - 64px)' }}>
            <div className="pl-0 pr-4 w-full" style={{ height: 'calc(100vh - 64px)' }}>
              <div className="grid grid-cols-1 lg:grid-cols-9 gap-0 w-full" style={{ height: 'calc(100vh - 64px)' }}>
                {/* Left Panel */}
                <div className="lg:col-span-2 rounded-lg shadow-lg flex flex-col bg-white" style={{ height: 'calc(100vh - 64px)' }}>
                  <div className="flex-1 overflow-y-auto p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Automations</h2>
                    <div className="space-y-2">
                      <button 
                        onClick={() => setActiveAutomationView('ai-agents')}
                        className={`w-full px-3 py-2 text-sm font-medium rounded-lg border text-left ${
                          activeAutomationView === 'ai-agents' 
                            ? 'bg-blue-50 text-blue-700 border-blue-300' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        AI Agents
                      </button>
                      <button 
                        onClick={() => setActiveAutomationView('chatbots')}
                        className={`w-full px-3 py-2 text-sm font-medium rounded-lg border text-left ${
                          activeAutomationView === 'chatbots' 
                            ? 'bg-blue-50 text-blue-700 border-blue-300' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Chatbots
                      </button>
                      <button 
                        onClick={() => setActiveAutomationView('sequence')}
                        className={`w-full px-3 py-2 text-sm font-medium rounded-lg border text-left ${
                          activeAutomationView === 'sequence' 
                            ? 'bg-blue-50 text-blue-700 border-blue-300' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        sequence
                      </button>
                      <button 
                        onClick={() => setActiveAutomationView('whatsapp-flows')}
                        className={`w-full px-3 py-2 text-sm font-medium rounded-lg border text-left ${
                          activeAutomationView === 'whatsapp-flows' 
                            ? 'bg-blue-50 text-blue-700 border-blue-300' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        whatsapp flows
                      </button>
                      <button 
                        onClick={() => setActiveAutomationView('human-routing')}
                        className={`w-full px-3 py-2 text-sm font-medium rounded-lg border text-left ${
                          activeAutomationView === 'human-routing' 
                            ? 'bg-blue-50 text-blue-700 border-blue-300' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Human Routing
                      </button>
                      <button 
                        onClick={() => setActiveAutomationView('reply-material')}
                        className={`w-full px-3 py-2 text-sm font-medium rounded-lg border text-left ${
                          activeAutomationView === 'reply-material' 
                            ? 'bg-blue-50 text-blue-700 border-blue-300' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Reply material
                      </button>
                    </div>
                  </div>
                </div>
                {/* Right Panel */}
                <div className="lg:col-span-7 rounded-lg shadow-lg flex flex-col bg-white" style={{ height: 'calc(100vh - 64px)' }}>
                  <div className="flex-1 overflow-y-auto p-6">
                    {activeAutomationView === 'human-routing' ? (
                      <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900">Human Routing</h2>
                        <div className="space-y-3">
                          <button className="w-full px-3 py-2 text-sm font-medium rounded-lg border text-left bg-white text-gray-700 border-gray-300 hover:bg-gray-50">Send Notification</button>
                          <button className="w-full px-3 py-2 text-sm font-medium rounded-lg border text-left bg-white text-gray-700 border-gray-300 hover:bg-gray-50">Assign to User</button>
                          <button className="w-full px-3 py-2 text-sm font-medium rounded-lg border text-left bg-white text-gray-700 border-gray-300 hover:bg-gray-50">Assign to Team</button>
                        </div>
                  <div>
                          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Add</button>
                        </div>
                      </div>
                    ) : activeAutomationView === 'reply-material' ? (
                      <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900">Reply material</h2>
                        <div className="grid grid-cols-8 gap-6">
                          <div className="col-span-2">
                            <div className="space-y-2">
                              <button className="w-full px-3 py-2 text-sm font-medium rounded-lg border text-left bg-white text-gray-700 border-gray-300 hover:bg-gray-50">text</button>
                              <button className="w-full px-3 py-2 text-sm font-medium rounded-lg border text-left bg-white text-gray-700 border-gray-300 hover:bg-gray-50">documents</button>
                              <button className="w-full px-3 py-2 text-sm font-medium rounded-lg border text-left bg-white text-gray-700 border-gray-300 hover:bg-gray-50">video</button>
                              <button className="w-full px-3 py-2 text-sm font-medium rounded-lg border text-left bg-white text-gray-700 border-gray-300 hover:bg-gray-50">stickers</button>
                              <button className="w-full px-3 py-2 text-sm font-medium rounded-lg border text-left bg-white text-gray-700 border-gray-300 hover:bg-gray-50">chatbots</button>
                              <button className="w-full px-3 py-2 text-sm font-medium rounded-lg border text-left bg-white text-gray-700 border-gray-300 hover:bg-gray-50">sequences</button>
                              <button className="w-full px-3 py-2 text-sm font-medium rounded-lg border text-left bg-white text-gray-700 border-gray-300 hover:bg-gray-50">contacts</button>
                              <button className="w-full px-3 py-2 text-sm font-medium rounded-lg border text-left bg-white text-gray-700 border-gray-300 hover:bg-gray-50">template</button>
                              <button className="w-full px-3 py-2 text-sm font-medium rounded-lg border text-left bg-white text-gray-700 border-gray-300 hover:bg-gray-50">catalog</button>
                            </div>
                          </div>
                          <div className="col-span-6">
                            <div className="h-full w-full border border-gray-200 rounded-lg p-4 text-sm text-gray-500">
                              Select an item from the list to view details.
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : activeAutomationView === 'sequence' ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-xl font-bold text-gray-900">Sequences</h2>
                          <div className="flex gap-3">
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                              Watch Tutorial
                            </button>
                            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                              Add Sequence
                            </button>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                  Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                  Messages
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                  Triggered
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                  Completed
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                  Edit/Delete
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  Test Sequence
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  0
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  0
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  0%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex gap-2">
                                    <button className="text-blue-600 hover:text-blue-900">Edit</button>
                                    <span className="text-gray-300">/</span>
                                    <button className="text-red-600 hover:text-red-900">Delete</button>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                    <div className="space-y-6">

              <div className="mb-6">
                <div className="text-sm font-medium text-gray-900 mb-3">AI Support Agent</div>
                <div className="p-4 border border-gray-200 rounded-lg mb-4">
                  <div className="text-sm font-medium text-gray-900 mb-2">AI Support Agent</div>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm font-medium text-gray-900 mb-3">Actions Library</div>
                <div className="grid grid-cols-3 gap-3">
                  <button className="p-3 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors">
                    <div className="text-sm font-medium text-gray-900">Chatbots</div>
                  </button>
                  <button className="p-3 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors">
                    <div className="text-sm font-medium text-gray-900">Sequence</div>
                  </button>
                  <button className="p-3 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors">
                    <div className="text-sm font-medium text-gray-900">WhatsApp Flows</div>
                  </button>
                  <button className="p-3 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors">
                    <div className="text-sm font-medium text-gray-900">Routing</div>
                  </button>
                  <button className="p-3 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors">
                    <div className="text-sm font-medium text-gray-900">Reply Material</div>
                  </button>
                  <button className="p-3 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors">
                    <div className="text-sm font-medium text-gray-900">Others</div>
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <div className="p-3 border border-gray-200 rounded-lg mb-2">
                  <div className="text-sm font-medium text-gray-900">Default Action</div>
                  <div className="text-xs text-gray-500 mt-1">Legacy</div>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg">
                  <div className="text-sm font-medium text-gray-900">Keyword Action</div>
                  <div className="text-xs text-gray-500 mt-1">Legacy</div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Rules</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Create Rules to trigger automated messages, chat assignments, chatbots and more.
                  </p>
                  <div className="flex items-center gap-4 mb-4">
                    <button className="text-sm text-blue-600 hover:underline">How it works</button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                      + Create Rules
                    </button>
                  </div>
                  </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">RULE NAME</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">TRIGGER TYPE</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">ACTION</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">STATUS</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">EXECUTED</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">LAST UPDATED</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">WA Out of Office</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">Built-In</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">New WhatsApp message is received</td>
                          <td className="px-4 py-3 text-sm text-gray-700">Send message</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Off</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">0</td>
                          <td className="px-4 py-3 text-sm text-gray-700">31/10/2025</td>
                          <td className="px-4 py-3 text-sm text-gray-700"></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">WA Welcome message</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">Built-In</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">New WhatsApp message is received</td>
                          <td className="px-4 py-3 text-sm text-gray-700">Send message</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Off</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">0</td>
                          <td className="px-4 py-3 text-sm text-gray-700">31/10/2025</td>
                          <td className="px-4 py-3 text-sm text-gray-700"></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">Unsubscribe from broadcast</td>
                          <td className="px-4 py-3 text-sm text-gray-700"></td>
                          <td className="px-4 py-3 text-sm text-gray-700">New WhatsApp message is received</td>
                          <td className="px-4 py-3 text-sm text-gray-700">Update contact attribute</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Off</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">0</td>
                          <td className="px-4 py-3 text-sm text-gray-700">31/10/2025</td>
                          <td className="px-4 py-3 text-sm text-gray-700"></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">WA Hello keyword sample rule</td>
                          <td className="px-4 py-3 text-sm text-gray-700"></td>
                          <td className="px-4 py-3 text-sm text-gray-700">New WhatsApp message is received</td>
                          <td className="px-4 py-3 text-sm text-gray-700">Send message</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">On</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">0</td>
                          <td className="px-4 py-3 text-sm text-gray-700">31/10/2025</td>
                          <td className="px-4 py-3 text-sm text-gray-700"></td>
                        </tr>
                      </tbody>
                    </table>
                </div>
              </div>
              </div>
                    </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'ads':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ads</h2>
              <p className="text-gray-600">Manage and track your advertising campaigns.</p>
            </div>
          </div>
        );
      
      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Team Inbox Analytics</h2>
              <p className="text-gray-600 mb-4">Get an overview of all your important team, operator and ticket metrics here</p>
                <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Data shown is for representation purpose only</span>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Preview with sample data</button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Schedule Report</button>
              <div className="text-xl font-semibold text-gray-900">Overview</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">2</div>
                <div className="text-xs text-gray-500">Open</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">99</div>
                <div className="text-xs text-gray-500">Solved</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">31</div>
                <div className="text-xs text-gray-500">Solved by bot</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">68</div>
                <div className="text-xs text-gray-500">Solved by operator</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">140</div>
                <div className="text-xs text-gray-500">Expired</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">127</div>
                <div className="text-xs text-gray-500">Missed chats</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                  <div>
                  <div className="text-sm font-medium text-gray-900">Ticket status over time</div>
                  <div className="text-xs text-gray-500">Opened • Pending • Solved • Solved by bot • Solved by operator • Expired • Missed chats</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Download SVG</button>
                  <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Download PNG</button>
                  <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Download CSV</button>
                </div>
              </div>
              <div className="h-56 bg-gray-50 border border-dashed border-gray-300 rounded flex items-center justify-center text-sm text-gray-500">Chart placeholder</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-900">Total ticket count by status</div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Download SVG</button>
                  <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Download PNG</button>
                  <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Download CSV</button>
                </div>
              </div>
              <div className="h-56 bg-gray-50 border border-dashed border-gray-300 rounded flex items-center justify-center text-sm text-gray-500">Bar chart placeholder</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-900">Operator performance</div>
                <div className="text-sm text-gray-600">All users</div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Open</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Solved</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Solved by bot</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Solved by operator</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">FRT</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ART</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">TTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    <tr>
                      <td className="px-4 py-2 text-gray-900">Samson<br/><span className="text-gray-500">samson@productsupport.com</span></td>
                      <td className="px-4 py-2">10</td>
                      <td className="px-4 py-2">6</td>
                      <td className="px-4 py-2">30</td>
                      <td className="px-4 py-2">11</td>
                      <td className="px-4 py-2">2</td>
                      <td className="px-4 py-2">0d 0h 2m 17s</td>
                      <td className="px-4 py-2">0d 2h 2m 17s</td>
                      <td className="px-4 py-2">0d 2h 2m 17s</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-900">Rahul Verma<br/><span className="text-gray-500">rahul.verma@productsupport.com</span></td>
                      <td className="px-4 py-2">6</td>
                      <td className="px-4 py-2">4</td>
                      <td className="px-4 py-2">20</td>
                      <td className="px-4 py-2">15</td>
                      <td className="px-4 py-2">1</td>
                      <td className="px-4 py-2">0d 0h 2m 57s</td>
                      <td className="px-4 py-2">0d 2h 2m 0s</td>
                      <td className="px-4 py-2">0d 2h 2m 0s</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-900">Elliot Wong<br/><span className="text-gray-500">elliot@productsupport.com</span></td>
                      <td className="px-4 py-2">5</td>
                      <td className="px-4 py-2">2</td>
                      <td className="px-4 py-2">15</td>
                      <td className="px-4 py-2">10</td>
                      <td className="px-4 py-2">0</td>
                      <td className="px-4 py-2">0d 0h 0m 17s</td>
                      <td className="px-4 py-2">0d 2h 1m 5s</td>
                      <td className="px-4 py-2">0d 2h 1m 5s</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-900">Priyanka Patil<br/><span className="text-gray-500">priyanka.patil@productsupport.com</span></td>
                      <td className="px-4 py-2">4</td>
                      <td className="px-4 py-2">2</td>
                      <td className="px-4 py-2">10</td>
                      <td className="px-4 py-2">4</td>
                      <td className="px-4 py-2">1</td>
                      <td className="px-4 py-2">0d 0h 2m 10s</td>
                      <td className="px-4 py-2">0d 9h 2m 1s</td>
                      <td className="px-4 py-2">0d 9h 2m 1s</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-900">Jyoti<br/><span className="text-gray-500">jyoti@productsupport.com</span></td>
                      <td className="px-4 py-2">2</td>
                      <td className="px-4 py-2">0</td>
                      <td className="px-4 py-2">5</td>
                      <td className="px-4 py-2">6</td>
                      <td className="px-4 py-2">0</td>
                      <td className="px-4 py-2">0d 0h 0m 30s</td>
                      <td className="px-4 py-2">0d 3h 2m 1s</td>
                      <td className="px-4 py-2">0d 3h 2m 1s</td>
                    </tr>
                  </tbody>
                </table>
                <div className="mt-2 text-xs text-gray-500">Rows per page: 1–5 of 5</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-900">Count of tags</div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Download SVG</button>
                  <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Download PNG</button>
                  <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Download CSV</button>
                </div>
              </div>
              <div className="h-56 bg-gray-50 border border-dashed border-gray-300 rounded flex items-center justify-center text-sm text-gray-500">Bar chart placeholder</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-900">Ticket duration v/s count</div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Download SVG</button>
                  <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Download PNG</button>
                  <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Download CSV</button>
                </div>
              </div>
              <div className="h-56 bg-gray-50 border border-dashed border-gray-300 rounded flex items-center justify-center text-sm text-gray-500">Line chart placeholder</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-900">Sent v/s received messages</div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Download SVG</button>
                  <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Download PNG</button>
                  <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Download CSV</button>
                </div>
              </div>
              <div className="h-56 bg-gray-50 border border-dashed border-gray-300 rounded flex items-center justify-center text-sm text-gray-500">Line chart placeholder</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-900">Sent messages by type</div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Download SVG</button>
                  <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Download PNG</button>
                  <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Download CSV</button>
                </div>
              </div>
              <div className="h-56 bg-gray-50 border border-dashed border-gray-300 rounded flex items-center justify-center text-sm text-gray-500">Stacked bar chart placeholder</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-sm font-medium text-gray-900 mb-2">Message delivery status</div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="h-56 bg-gray-50 border border-dashed border-gray-300 rounded flex items-center justify-center text-sm text-gray-500">Delivery chart placeholder</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 mb-2">Total messages by type</div>
                  <div className="text-xs text-gray-500 mb-4">Starting July 1, 2025, this chart shows data based on message-level statistics instead of conversations. Historical conversation data before this date is no longer available in this chart.</div>
                  <div className="h-56 bg-gray-50 border border-dashed border-gray-300 rounded flex items-center justify-center text-sm text-gray-500">Message type chart placeholder</div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Download SVG</button>
                <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Download PNG</button>
                <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Download CSV</button>
              </div>
            </div>
          </div>
        );
      
      case 'team-management':
        return (
          <div className="space-y-6">
            {/* Header and Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Watch Tutorial</button>
                  {teamManagementTab === 'users' ? (
                    <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Add User</button>
                  ) : (
                    <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Add Team</button>
                  )}
            </div>
              </div>
              {/* Tabs */}
              <div className="mt-6 border-b">
                <nav className="flex space-x-4" aria-label="Tabs">
                  <button
                    onClick={() => setTeamManagementTab('users')}
                    className={`${teamManagementTab === 'users' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-600 hover:text-gray-800'} px-3 py-2 text-sm font-medium`}
                  >
                    Users
                  </button>
                  <button
                    onClick={() => setTeamManagementTab('teams')}
                    className={`${teamManagementTab === 'teams' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-600 hover:text-gray-800'} px-3 py-2 text-sm font-medium`}
                  >
                    Teams
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {teamManagementTab === 'users' ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Users</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Online Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email/Phone</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Teams</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                      <tr>
                        <td className="px-4 py-2 text-gray-900">User NimbleAI</td>
                        <td className="px-4 py-2"><span className="inline-flex items-center text-xs text-gray-600">Offline</span></td>
                        <td className="px-4 py-2 text-gray-700">rupesh@nimbleai.in</td>
                        <td className="px-4 py-2 text-gray-700">TEMPLATE MANAGER</td>
                        <td className="px-4 py-2 text-gray-700">All Teams</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button className="text-blue-600 hover:text-blue-800">Edit</button>
                            <button className="text-red-600 hover:text-red-800">Remove</button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-gray-900">User NimbleAI</td>
                        <td className="px-4 py-2"><span className="inline-flex items-center text-xs text-gray-600">Offline</span></td>
                        <td className="px-4 py-2 text-gray-700">pj248254@gmail.com</td>
                        <td className="px-4 py-2 text-gray-700">BROADCAST MANAGER</td>
                        <td className="px-4 py-2 text-gray-700">All Teams</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button className="text-blue-600 hover:text-blue-800">Edit</button>
                            <button className="text-red-600 hover:text-red-800">Remove</button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-gray-900">User NimbleAI</td>
                        <td className="px-4 py-2"><span className="inline-flex items-center text-xs text-gray-600">Offline</span></td>
                        <td className="px-4 py-2 text-gray-700">mahak.mhk1@gmail.com</td>
                        <td className="px-4 py-2 text-gray-700">CONTACT MANAGER</td>
                        <td className="px-4 py-2 text-gray-700">All Teams</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button className="text-blue-600 hover:text-blue-800">Edit</button>
                            <button className="text-red-600 hover:text-red-800">Remove</button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-gray-900">User NimbleAI</td>
                        <td className="px-4 py-2"><span className="inline-flex items-center text-xs text-gray-600">Offline</span></td>
                        <td className="px-4 py-2 text-gray-700">ujhamre2@gmail.com</td>
                        <td className="px-4 py-2 text-gray-700">ADMINISTRATOR</td>
                        <td className="px-4 py-2 text-gray-700">All Teams</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button className="text-blue-600 hover:text-blue-800">Edit</button>
                            <button className="text-red-600 hover:text-red-800">Remove</button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-gray-900">Rupesh Jhamre</td>
                        <td className="px-4 py-2"><span className="inline-flex items-center text-xs text-green-600">Online</span></td>
                        <td className="px-4 py-2 text-gray-700">rjhamre2@gmail.com</td>
                        <td className="px-4 py-2 text-gray-700">ADMINISTRATOR</td>
                        <td className="px-4 py-2 text-gray-700">All Teams</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button className="text-blue-600 hover:text-blue-800">Edit</button>
                            <button className="text-red-600 hover:text-red-800">Remove</button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Teams</h3>
                <div className="text-sm text-gray-600">No teams added yet. Use the "Add Team" button to create your first team.</div>
              </div>
            )}
          </div>
        );
      
      case 'integrations':
        return <IntegrationsPage onWhatsAppSetupComplete={refreshAllStatuses} />;
      
      case 'webhooks':
        return (
          <div className="space-y-6">
            {/* Header + Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Webhooks</h2>
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Learn More</button>
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Watch Tutorial</button>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Add Webhook</button>
                </div>
              </div>
              <p className="text-gray-600 mt-3">You can add a webhook to receive event callbacks for events such as new message received, when a message is read, etc.</p>
            </div>

            {/* Logs + Table */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-900">Logs</div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Url</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Webhook.EventTypes</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Updated</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">No data</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-600">No webhooks added.</div>
              <div className="mt-1 text-sm text-gray-600">You can add a webhook to receive event callbacks for events such as new message received, when a message is read, etc.</div>
              <div className="mt-4">
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Add Webhook</button>
              </div>
            </div>
          </div>
        );
      
      case 'commerce':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Commerce</h2>
              <p className="text-gray-600">Manage products, orders, and e-commerce integrations.</p>
            </div>
          </div>
        );
      
      case 'account-details':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900">Account Details</h2>
              <p className="text-gray-600 mt-1">View and manage your account information and settings.</p>
              {/* Tabs */}
              <div className="mt-6 border-b">
                <nav className="flex space-x-4" aria-label="Tabs">
                  <button
                    onClick={() => setAccountDetailsTab('account-settings')}
                    className={`${accountDetailsTab === 'account-settings' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-600 hover:text-gray-800'} px-3 py-2 text-sm font-medium`}
                  >
                    Account settings
                  </button>
                  <button
                    onClick={() => setAccountDetailsTab('subscription')}
                    className={`${accountDetailsTab === 'subscription' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-600 hover:text-gray-800'} px-3 py-2 text-sm font-medium`}
                  >
                    Subscription
                  </button>
                </nav>
            </div>
            </div>

            {/* Tab Content */}
            {accountDetailsTab === 'subscription' ? (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <p className="text-sm text-gray-700">
                    You are trialing Pro plan. Select the plan you want to purchase. To disconnect your WhatsApp business number from NimbleAI visit <span className="text-blue-600 hover:underline cursor-pointer">Whatsapp Manager</span>
                    </p>
                  </div>

                {/* Zero subscription card */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex flex-col lg:flex-row gap-6 items-start">
                    <div className="flex-1 space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900">Zero subscription, pay-as-you-go plan</h3>
                      <p className="text-sm text-gray-600">Cheapest plan if you send up to ~2,100 messages in 3 months.</p>
                      <div className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-100 text-yellow-800">New <span className="text-gray-700">Sync your WhatsApp Business App with NimbleAI to chat and send campaigns seamlessly, together.</span></div>
                      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                        <li>Pay INR 999 to get started & get INR 999 back as message credits</li>
                        <li>Use the INR 999 credits for sending out up to 500 messages</li>
                        <li>Top up credits as you need</li>
                        <li>Account validity: 3 months. Send messages regularly to extend validity.</li>
                        <li>Complete analytics for your bulk campaigns</li>
                        <li>Self-serve onboarding & support</li>
                      </ul>
                      <div>
                        <button className="mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Buy Now</button>
                  </div>
                    </div>
                    <div className="w-full lg:w-64 h-32 border border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-500">payGIllustration</div>
                  </div>
                </div>

                {/* Billing toggle */}
                <div className="flex items-center gap-4">
                  <button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg">Monthly</button>
                  <button className="px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Annually</button>
                  <span className="text-sm text-gray-600">Up to ~25% off with annual subscription</span>
                </div>

                {/* Plans grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Growth Plan */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border">
                    <h3 className="text-lg font-semibold text-gray-900">Growth</h3>
                    <p className="text-sm text-gray-600 mt-1">Send WhatsApp messages to thousands of users in one click to improve reach</p>
                    <p className="text-sm text-green-700 mt-1">Free dedicated onboarding</p>
                    <div className="mt-4">
                      <div className="text-2xl font-bold text-gray-900">₹1,999 <span className="text-base font-medium text-gray-500">/ month</span></div>
                      <div className="text-xs text-gray-500">billed annually</div>
                    </div>
                    <div className="mt-3 text-sm text-gray-700">3 Users Included<br/>No Additional Users<br/>Additional charges apply for messages</div>
                    <button className="mt-4 w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Select Plan</button>
                    <div className="mt-4">
                      <div className="text-sm font-medium text-gray-900">Key features</div>
                      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 mt-2">
                        <li><span className="font-medium">Zero-fee WhatsApp setup:</span> Get Official WhatsApp API, Blue tick verification help</li>
                        <li><span className="font-medium">Omnichannel inbox:</span> WhatsApp, FB, Instagram, QR code, widget, wa.me</li>
                        <li><span className="font-medium">Standard promotions:</span> Run multimedia campaigns, view open & read rates</li>
                        <li><span className="font-medium">Acquire leads:</span> Run CTWA ads and capture leads on WhatsApp</li>
                        <li><span className="font-medium">Team inbox staples:</span> Assign, track, automate follow-ups, tag & report</li>
                        <li><span className="font-medium">E-Commerce tools:</span> WhatsApp Catalog, Shopify abandon cart & order templates$</li>
                        <li><span className="font-medium">24x5 Email Support</span> in English, Portuguese, with basic SLA coverage</li>
                      </ul>
                      <div className="mt-3">
                        <div className="text-sm font-medium text-gray-900">Usage</div>
                        <div className="text-sm text-gray-700">15k Broadcast/mon, Standard rates<br/>1,000 Free Automation triggers/mon<br/>2 select Commerce/CRM integrations<br/>10k API calls/mon, No webhooks</div>
                      </div>
                    </div>
                  </div>

                  {/* Pro Plan */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border relative">
                    <div className="absolute -top-3 right-4 px-2 py-0.5 text-[10px] rounded bg-yellow-200 text-yellow-900 font-semibold">BEST VALUE</div>
                    <h3 className="text-lg font-semibold text-gray-900">Pro</h3>
                    <p className="text-sm text-gray-600 mt-1">Set up automations, integrations and get powerful analytics to boost conversion</p>
                    <p className="text-sm text-green-700 mt-1">Free dedicated onboarding</p>
                    <div className="mt-4">
                      <div className="text-2xl font-bold text-gray-900">₹4,499 <span className="text-base font-medium text-gray-500">/ month</span></div>
                      <div className="text-xs text-gray-500">billed annually</div>
                    </div>
                    <div className="mt-3 text-sm text-gray-700">5 Users Included<br/>Additional Users @ ₹1299/user/month<br/>Additional charges apply for messages</div>
                    <button className="mt-4 w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Select Plan</button>
                    <div className="mt-4">
                      <div className="text-sm font-medium text-gray-900">Everything in Growth, plus:</div>
                      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 mt-2">
                        <li><span className="font-medium">Auto-qualify leads:</span> Advanced chatbots, forms, integrations & IG Automation</li>
                        <li><span className="font-medium">Boost conversion:</span> Smart retargeting, Carousel template & Catalog pay options</li>
                        <li><span className="font-medium">Optimize campaigns:</span> CTWA source tags, click tracking & engagement insights</li>
                        <li><span className="font-medium">AI automation:</span> Answer queries, collect info, send reminders and more</li>
                        <li><span className="font-medium">Advanced team inbox:</span> Teams, auto routing, and operator reports</li>
                        <li><span className="font-medium">Drive Shopify$ sales:</span> Campaign based on buyer data, Shopflo/Gokwik checkout</li>
                        <li><span className="font-medium">24x7 Email & Chat Support:</span> Standard SLAs to support your operations</li>
                      </ul>
                      <div className="mt-3">
                        <div className="text-sm font-medium text-gray-900">Usage</div>
                        <div className="text-sm text-gray-700">Unlimited Broadcasts, Standard rates<br/>2,000 Free Automation triggers/mon<br/>5 integrations incl. HubSpot<br/>200k API calls/mon, Limited webhooks<br/>250 Free AI Support Agent replies/mon</div>
                      </div>
                    </div>
                  </div>

                  {/* Business Plan */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border">
                    <h3 className="text-lg font-semibold text-gray-900">Business</h3>
                    <p className="text-sm text-gray-600 mt-1">Unlock the full potential of WhatsApp with advanced workflows and expert support</p>
                    <p className="text-sm text-green-700 mt-1">Free dedicated onboarding</p>
                    <div className="mt-4">
                      <div className="text-2xl font-bold text-gray-900">₹13,499 <span className="text-base font-medium text-gray-500">/ month</span></div>
                      <div className="text-xs text-gray-500">billed annually</div>
                    </div>
                    <div className="mt-3 text-sm text-gray-700">5 Users Included<br/>Additional Users @ ₹3999/user/month<br/>Additional charges apply for messages</div>
                    <button className="mt-4 w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Select Plan</button>
                    <div className="mt-4">
                      <div className="text-sm font-medium text-gray-900">Everything in Pro, plus:</div>
                      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 mt-2">
                        <li><span className="font-medium">Ultra-fast, Affordable messaging:</span> Send 4k messages/min with volume discounts & SMS fallbackBeta</li>
                        <li><span className="font-medium">Official Google Partner:</span> Asia's only Google ads to WhatsApp Partner</li>
                        <li><span className="font-medium">Best-in-class ROI:</span> Optimize CTWA ads, track conversion, use WhatsApp Pay API</li>
                        <li><span className="font-medium">Scale effortlessly:</span> Multiple WhatsApp numbers & round-robin chat assignment</li>
                        <li><span className="font-medium">Dedicated Customer Success Manager</span> for strategic recommendations</li>
                        <li><span className="font-medium">Enhance privacy & compliance:</span> Phone number masking, Roles & IP Whitelisting</li>
                        <li><span className="font-medium">24x7 Priority Email & Chat support,</span> with access to paid TAM services</li>
                      </ul>
                      <div className="mt-3">
                        <div className="text-sm font-medium text-gray-900">Usage</div>
                        <div className="text-sm text-gray-700">Unlimited Broadcasts, Volume discounts<br/>5,000 Free Automation triggers/mon<br/>Unlimited integrations incl. Salesforce<br/>20M API calls/mon, Extensive webhooks<br/>1000 Free AI Support Agent replies/mon<br/>Blitz add-on: Send up to 12k messages/min</div>
                        <div className="text-xs text-gray-500 mt-2">$ - Requires purchase of $4.9/mo Shopify app</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-blue-600 hover:underline cursor-pointer">Compare plans in detail</div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account settings</h3>
                <div className="text-sm text-gray-600">Update your profile, company details, and preferences here.</div>
              </div>
            )}
          </div>
        );
      
      case 'channels':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Channels</h2>
              <p className="text-gray-600">Manage communication channels and integrations.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-8 gap-6">
                <div className="col-span-2">
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveChannel('whatsapp')}
                      className={`w-full px-3 py-2 text-sm font-medium rounded-lg border text-left ${
                        activeChannel === 'whatsapp' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      WhatsApp
                    </button>
                    <button
                      onClick={() => setActiveChannel('instagram')}
                      className={`w-full px-3 py-2 text-sm font-medium rounded-lg border text-left ${
                        activeChannel === 'instagram' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Instagram
                    </button>
                    <button
                      onClick={() => setActiveChannel('messenger')}
                      className={`w-full px-3 py-2 text-sm font-medium rounded-lg border text-left ${
                        activeChannel === 'messenger' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Messenger
                    </button>
                  </div>
                </div>
                <div className="col-span-6">
                  {activeChannel === 'whatsapp' ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Channel Status</h3>
                        <p className="text-sm text-gray-600">View and manage your connections</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="text-sm text-gray-500 mb-1">WhatsappSvg</div>
                          <div className="text-sm font-medium text-gray-900">WhatsApp</div>
                        </div>
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="text-sm text-gray-500 mb-1">InstagramSvg</div>
                          <div className="text-sm font-medium text-gray-900">Instagram</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-1 rounded bg-green-100 text-green-700">Messenger</span>
                        <span className="px-2 py-1 rounded bg-blue-100 text-blue-700">New</span>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-900">15558316639</div>
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Add</button>
                          <span className="text-xs text-gray-500">Mandatory</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">Connect Account</div>
                          <div className="text-xs text-gray-500">Link your Business Manager & Number</div>
                        </div>
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">Business Verification(Action Required)</div>
                          <div className="text-xs text-gray-500">Verify your Meta Business Manager</div>
                        </div>
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">Others</div>
                          <div className="text-xs text-gray-500">Messaging limit</div>
                          <div className="text-xs text-gray-500">Know your Messaging Limits</div>
                        </div>
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">WhatsApp Approval Status</div>
                          <div className="text-xs text-gray-500">Check WhatsApp Account Approval status</div>
                        </div>
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">WhatsApp Display Name</div>
                          <div className="text-xs text-gray-500">Know your WhatsApp Display Name Status</div>
                        </div>
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">Phone Number Status</div>
                          <div className="text-xs text-gray-500">Check Number Connection Status</div>
                        </div>
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">Quality Rating</div>
                          <div className="text-xs text-gray-500">Know phone number's quality rating</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">Connect Account</div>
                          <div className="text-xs text-green-600">Completed</div>
                        </div>
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">Help Guide</div>
                          <button className="mt-2 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Watch Tutorial</button>
                        </div>
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="text-xs text-gray-500">Last Updated : Nov 4, 2025 5:22 PM</div>
                          <div className="text-sm text-gray-700 mt-1">Your account is connected.</div>
                          <div className="text-sm text-gray-700">You are ready to engage your customers!</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-sm font-medium text-gray-900">As next steps, we suggest the following:</div>
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">Upload your contacts</div>
                          <div className="text-xs text-gray-500">You can upload your contacts and easily interact with them</div>
                          <button className="mt-2 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Contacts</button>
                        </div>
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">Prepare broadcast templates</div>
                          <div className="text-xs text-gray-500">You can create a broadcast template to engage your customers</div>
                          <button className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Create Template message</button>
                        </div>
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Change Account/Number</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full w-full border border-gray-200 rounded-lg p-4 text-sm text-gray-500">
                      Select a channel on the left to configure details.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'dashboard':
      case 'knowledge':
      case 'live-chat':
      case 'billing':
      case 'subscriptions':
      case 'settings':
        // Keep existing cases for backward compatibility
        switch (activeTab) {
          case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Status Indicators Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {/* WhatsApp Status */}
              <div 
                className={`bg-white rounded-xl shadow-sm border-2 ${whatsappBorderClass} hover:border-gray-400 p-6 cursor-pointer hover:shadow-md transition`}
                onClick={handleWhatsAppClick}
              >
                <div>
                  <span className="block text-lg font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded mb-2 mx-auto text-center">Step 1: WhatsApp</span>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 48 48">
                      <path fill="#fff" d="M4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98c-0.001,0,0,0,0,0h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303z"></path>
                      <path fill="#fff" d="M4.868,43.803c-0.132,0-0.26-0.052-0.355-0.148c-0.125-0.127-0.174-0.312-0.127-0.483l2.639-9.636c-1.636-2.906-2.499-6.206-2.497-9.556C4.532,13.238,13.273,4.5,24.014,4.5c5.21,0.002,10.105,2.031,13.784,5.713c3.679,3.683,5.704,8.577,5.702,13.781c-0.004,10.741-8.746,19.48-19.486,19.48c-3.189-0.001-6.344-0.788-9.144-2.277l-9.875,2.589C4.953,43.798,4.911,43.803,4.868,43.803z"></path>
                      <path fill="#cfd8dc" d="M24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,4C24.014,4,24.014,4,24.014,4C12.998,4,4.032,12.962,4.027,23.979c-0.001,3.367,0.849,6.685,2.461,9.622l-2.585,9.439c-0.094,0.345,0.002,0.713,0.254,0.967c0.19,0.192,0.447,0.297,0.711,0.297c0.085,0,0.17-0.011,0.254-0.033l9.687-2.54c2.828,1.468,5.998,2.243,9.197,2.244c11.024,0,19.99-8.963,19.995-19.98c0.002-5.339-2.075-10.359-5.848-14.135C34.378,6.083,29.357,4.002,24.014,4L24.014,4z"></path>
                      <path fill="#40c351" d="M35.176,12.832c-2.98-2.982-6.941-4.625-11.157-4.626c-8.704,0-15.783,7.076-15.787,15.774c-0.001,2.981,0.833,5.883,2.413,8.396l0.376,0.597l-1.595,5.821l5.973-1.566l0.577,0.342c2.422,1.438,5.2,2.198,8.032,2.199h0.006c8.698,0,15.777-7.077,15.78-15.776C39.795,19.778,38.156,15.814,35.176,12.832z"></path>
                      <path fill="#fff" fillRule="evenodd" d="M19.268,16.045c-0.355-0.79-0.729-0.806-1.068-0.82c-0.277-0.012-0.593-0.011-0.909-0.011c-0.316,0-0.83,0.119-1.265,0.594c-0.435,0.475-1.661,1.622-1.661,3.956c0,2.334,1.7,4.59,1.937,4.906c0.237,0.316,3.282,5.259,8.104,7.161c4.007,1.58,4.823,1.266,5.693,1.187c0.87-0.079,2.807-1.147,3.202-2.255c0.395-1.108,0.395-2.057,0.277-2.255c-0.119-0.198-0.435-0.316-0.909-0.554s-2.807-1.385-3.242-1.543c-0.435-0.158-0.751-0.237-1.068,0.238c-0.316,0.474-1.225,1.543-1.502,1.859c-0.277,0.317-0.554,0.357-1.028,0.119c-0.474-0.238-2.002-0.738-3.815-2.354c-1.41-1.257-2.362-2.81-2.639-3.285c-0.277-0.474-0.03-0.731,0.208-0.968c0.213-0.213,0.474-0.554,0.712-0.831c0.237-0.277,0.316-0.475,0.474-0.791c0.158-0.317,0.079-0.594-0.04-0.831C20.612,19.329,19.69,16.983,19.268,16.045z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 text-center mt-2">
                    {isCheckingWhatsapp ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading...</span>
                      </div>
                    ) : whatsappStatus?.success && whatsappStatus?.isIntegrated ? '✅ Connected' : '⏳ Pending'}
                  </p>
                </div>
              </div>

              {/* Onboarding Status */}
              <div 
                className={`bg-white rounded-xl shadow-sm border-2 ${onboardingBorderClass} hover:border-gray-400 p-6 cursor-pointer hover:shadow-md transition`}
                onClick={handleOnboardingClick}
              >
                  <div>
                  <span className="block text-lg font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded mb-2 mx-auto text-center">Step 2: Onboarding</span>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-xl">🚀</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 text-center mt-2">
                    {isLoadingOnboarding ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading...</span>
                      </div>
                    ) : onboardingStatus?.status === 'completed' ? '✅ Complete' : '⏳ Pending'}
                  </p>
                  {onboardingStatus?.status === 'completed' && userData?.company && (
                    <p className="text-xs text-gray-500 mt-1 text-center">
                        {userData.company} • {userData.specialization}
                      </p>
                    )}
                  </div>
                  </div>

              {/* Training Status */}
              <div 
                className={`bg-white rounded-xl shadow-sm border-2 ${trainingBorderClass} hover:border-gray-400 p-6 cursor-pointer hover:shadow-md transition`}
                onClick={handleTrainingClick}
              >
                <div>
                  <span className="block text-lg font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded mb-2 mx-auto text-center">Step 3: Training</span>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-xl">🧠</span>
                </div>
                  <p className="text-2xl font-bold text-gray-900 text-center mt-2">
                    {isLoadingTraining ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading...</span>
                      </div>
                    ) : trainingStatus?.status === 'completed' ? '✅ Complete' : 
                     trainingStatus?.status === 'not_started' ? '⏳ Not Started' : '⏳ Pending'}
                  </p>
                  {trainingStatus?.progress > 0 && (
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {trainingStatus.progress}% Complete
                    </p>
                  )}
                </div>
              </div>

              {/* Subscription Details */}
              <div 
                className={`bg-white rounded-xl shadow-sm border-2 ${subscriptionBorderClass} hover:border-gray-400 p-6 cursor-pointer hover:shadow-md transition`}
                onClick={handleSubscriptionClick}
              >
                <div>
                  <span className="block text-lg font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded mb-2 mx-auto text-center">Step 4: Subscription</span>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-xl">💳</span>
                  </div>
                  {isLoadingSubscription ? (
                    <div className="flex items-center justify-center mt-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                      <p className="text-lg font-medium text-gray-500 ml-2">Loading...</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-gray-900 text-center mt-2">
                        {pricingSubscriptionStatus?.status === 'created' ? 'No Plan Selected' : 
                         pricingSubscriptionStatus?.plan_name || 'No Plan Selected'}
                      </p>
                      {pricingSubscriptionStatus?.status && pricingSubscriptionStatus.status !== 'not_created' && pricingSubscriptionStatus.status !== 'created' && (
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          {pricingSubscriptionStatus.status === 'authenticated' ? '✅ Active' : 
                           pricingSubscriptionStatus.status === 'inactive' ? '⏳ Inactive' : pricingSubscriptionStatus.status}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="space-y-6">
              <LiveAgentPreview />
              <RecentChats onNavigateToLiveChat={() => setActiveTab('live-chat')} />
            </div>
          </div>
        );
        case 'knowledge':
          return <KnowledgeBase onTrainingComplete={refreshAllStatuses} />;
        case 'live-chat':
          return <LiveChat />;
        case 'billing':
          return <PlanBilling onSubscriptionActivated={refreshAllStatuses} />;
        case 'subscriptions':
          return <PlanBilling onSubscriptionActivated={refreshAllStatuses} />;
        case 'settings':
          return <Settings />;
          default:
            break;
        }
        break;
      default:
        return (
          <div className="space-y-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to NimbleAI Dashboard</h2>
              <p className="text-gray-600">Select a section from the sidebar to get started.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isOnboardingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Onboarding</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsOnboardingModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {onboardingStatus?.status === 'completed' && !isEditingOnboarding ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-700">You are onboarded with:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Company</div>
                    <div className="text-sm font-medium text-gray-900">{userData?.company || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Specialization</div>
                    <div className="text-sm font-medium text-gray-900">{userData?.specialization || '-'}</div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                    onClick={() => setIsEditingOnboarding(true)}
                  >
                    Update
                  </button>
                  <button
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                    onClick={() => setIsOnboardingModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleOnboardingSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    placeholder="Enter your company"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    value={specializationInput}
                    onChange={(e) => setSpecializationInput(e.target.value)}
                    placeholder="Enter your specialization"
                  />
                </div>

                {onboardingError && (
                  <div className="text-sm text-red-600">{onboardingError}</div>
                )}
                {onboardingMessage && (
                  <div className="text-sm text-green-600">{onboardingMessage}</div>
                )}

                <div className="flex justify-end space-x-3">
                  {onboardingStatus?.status === 'completed' && (
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                      onClick={() => setIsEditingOnboarding(false)}
                      disabled={isSubmittingOnboarding}
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                    onClick={() => setIsOnboardingModalOpen(false)}
                    disabled={isSubmittingOnboarding}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded hover:bg-yellow-600 disabled:opacity-60"
                    disabled={isSubmittingOnboarding}
                  >
                    {isSubmittingOnboarding ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      
      {/* First-time Welcome Modal */}
      {isWelcomeModalOpen && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="w-full h-full flex flex-col">
            {/* Logo at top */}
            <div className="container mx-auto px-4 py-4 flex justify-center items-center border-b border-gray-200">
              <img 
                src={require('../../logo.png')} 
                alt='Nimble AI Logo' 
                className="h-12 w-auto object-contain" 
              />
            </div>
            
            <div className="flex flex-col lg:flex-row flex-1">
              {/* Left Side - Features */}
              <div className="w-full lg:w-1/2 p-6 sm:p-8 lg:p-12 flex flex-col">
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">Transform your business growth with WhatsApp</h2>
                </div>

              <div className="space-y-3 text-base text-gray-700 flex-1">
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Launch personalized campaigns that drive conversions</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Send updates and reminders with ready-to-use templates</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Engage customers 24/7 with intelligent, no-code chatbots</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Automate workflows to resolve customer issues instantly</span>
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 p-6 sm:p-8 lg:p-12 bg-gray-50 lg:bg-white border-t lg:border-t-0 lg:border-l border-gray-200">
              <div className="max-w-lg mx-auto space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-base text-blue-800">
                  Get started with a demo account on NimbleAI
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">Name & Email</label>
                    <div className="flex border rounded-lg overflow-hidden">
                      <div className="flex-1 px-4 py-3 bg-gray-50 border-r border-gray-300">
                        <span className="text-base text-gray-700">
                          {welcomeName || userData?.displayName || user?.displayName || ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 min-w-[200px]">
                        {(userData?.photoURL || user?.photoURL) && (
                          <img 
                            src={userData?.photoURL || user?.photoURL} 
                            alt="User avatar" 
                            className="w-10 h-10 rounded-full object-cover" 
                          />
                        )}
                        <span className="text-base text-gray-700 flex-1">
                          {welcomeEmail || userData?.email || user?.email || ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">Phone</label>
                    <div className="flex border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-400">
                      <select
                        className="border-r border-gray-300 px-3 py-3 text-base focus:outline-none bg-white"
                        value={welcomeCountry}
                        onChange={(e) => handleWelcomeCountryChange(e.target.value)}
                        style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23374151\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                      >
                        <option value="IN">🇮🇳 IN</option>
                        <option value="US">🇺🇸 US</option>
                        <option value="GB">🇬🇧 GB</option>
                        <option value="CA">🇨🇦 CA</option>
                        <option value="AU">🇦🇺 AU</option>
                        <option value="DE">🇩🇪 DE</option>
                        <option value="FR">🇫🇷 FR</option>
                        <option value="IT">🇮🇹 IT</option>
                        <option value="ES">🇪🇸 ES</option>
                        <option value="BR">🇧🇷 BR</option>
                        <option value="MX">🇲🇽 MX</option>
                        <option value="JP">🇯🇵 JP</option>
                        <option value="CN">🇨🇳 CN</option>
                        <option value="KR">🇰🇷 KR</option>
                        <option value="SG">🇸🇬 SG</option>
                        <option value="MY">🇲🇾 MY</option>
                        <option value="TH">🇹🇭 TH</option>
                        <option value="ID">🇮🇩 ID</option>
                        <option value="PH">🇵🇭 PH</option>
                        <option value="VN">🇻🇳 VN</option>
                        <option value="HK">🇭🇰 HK</option>
                        <option value="TW">🇹🇼 TW</option>
                        <option value="NZ">🇳🇿 NZ</option>
                        <option value="AE">🇦🇪 AE</option>
                        <option value="SA">🇸🇦 SA</option>
                        <option value="ZA">🇿🇦 ZA</option>
                        <option value="RU">🇷🇺 RU</option>
                        <option value="PK">🇵🇰 PK</option>
                        <option value="BD">🇧🇩 BD</option>
                        <option value="LK">🇱🇰 LK</option>
                        <option value="NP">🇳🇵 NP</option>
                        <option value="MM">🇲🇲 MM</option>
                      </select>
                      <div className="flex items-center px-3 bg-gray-50 border-r border-gray-300 text-gray-700 text-base font-medium min-w-[60px]">
                        {welcomeDialCode || '+91'}
                      </div>
                      <input
                        type="tel"
                        className="flex-1 px-4 py-3 text-base focus:outline-none"
                        value={welcomePhoneNumber}
                        onChange={(e) => {
                          const phoneNumber = e.target.value;
                          setWelcomePhoneNumber(phoneNumber);
                          setWelcomePhone(phoneNumber ? `${welcomeDialCode || '+91'} ${phoneNumber}` : '');
                        }}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">Business Type</label>
                    <select
                      className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                      value={welcomeBusinessType}
                      onChange={(e) => setWelcomeBusinessType(e.target.value)}
                      style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23374151\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                    >
                      <option value="">Select business type</option>
                      <option value="Automotive">Automotive</option>
                      <option value="Beauty, spa and salon">Beauty, spa and salon</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Education">Education</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Online gambling and gaming">Online gambling and gaming</option>
                      <option value="Non-online gambling and gaming(e.g. brick and mortar)">Non-online gambling and gaming(e.g. brick and mortar)</option>
                      <option value="Event planning and service">Event planning and service</option>
                      <option value="Finance and banking">Finance and banking</option>
                      <option value="Food and groceries">Food and groceries</option>
                      <option value="Alcoholic drinks">Alcoholic drinks</option>
                      <option value="Public service">Public service</option>
                      <option value="Hotel and lodging">Hotel and lodging</option>
                      <option value="Medical and health">Medical and health</option>
                      <option value="Over-the-counter medicine">Over-the-counter medicine</option>
                      <option value="Charity">Charity</option>
                      <option value="Professional services">Professional services</option>
                      <option value="Shopping and retail">Shopping and retail</option>
                      <option value="Travel and transportation">Travel and transportation</option>
                      <option value="Restaurant">Restaurant</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">Business Name</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={welcomeBusinessName}
                      onChange={(e) => setWelcomeBusinessName(e.target.value)}
                      placeholder="Enter your business name"
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  By signing up, you agree to the Terms & Conditions and Privacy Policy, and consent to receive marketing communications from NimbleAI and our service partners. Your information will also be shared with NimbleAI's Service Partners to facilitate your NimbleAI signup, product inquiries and enable your use of the NimbleAI service.
                </div>

                {welcomeError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    {welcomeError}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4">
                  <button
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleWelcomeSubmit}
                    disabled={isSubmittingWelcome}
                  >
                    {isSubmittingWelcome ? 'Submitting...' : 'Start my trial'}
                  </button>
                  <button
                    className="text-base text-gray-600 hover:underline"
                    onClick={() => {
                      const key = `nimble_welcome_shown_${userData?.uid || user?.uid || 'anon'}`;
                      localStorage.setItem(key, '1');
                      localStorage.removeItem('nimble_first_time');
                      setIsWelcomeModalOpen(false);
                    }}
                  >
                    Already have an account? Sign in
                  </button>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* WABA Modal - Rectangle between sidebar and right edge */}
      {isWabaModalOpen && (
        <>
          <div className="fixed top-16 bottom-0 z-40 bg-white shadow-2xl overflow-y-auto" style={{ left: '10rem', width: 'calc(100% - 10rem)' }}>
          <div className="h-full flex flex-col p-6">
            {/* Close button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  setIsWabaModalOpen(false);
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Hello {userName}
                  </h1>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Welcome to NimbleAI
                  </h2>
                </div>

                <div className="space-y-4">
                  <p className="text-base text-gray-700">
                    Ready to start using your Live Trial Account?
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left space-y-3">
                    <p className="text-sm font-medium text-gray-900">
                      Connect your number now to unlock the full potential of NimbleAI and enjoy exclusive benefits such as:
                    </p>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Sending messages with your brand name</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>₹100 free credits</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Unlimited responses to customer-initiated conversations</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Button positioned at bottom to align with Channels in sidebar */}
              <div className="mt-auto pt-4" style={{ marginBottom: '120px' }}>
                <button
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-base font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                  onClick={() => {
                    // Close modal and navigate to integrations
                    setIsWabaModalOpen(false);
                    setActiveTab('integrations');
                  }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  Create Whatsapp Business Account
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Backdrop overlay when WABA modal is open - only covers the modal area */}
        <div 
          className="fixed top-16 bottom-0 bg-black bg-opacity-30 z-30"
          style={{ left: '10rem', width: 'calc(100% - 10rem)' }}
          onClick={() => {
            setIsWabaModalOpen(false);
          }}
        />
        </>
      )}
      
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">WhatsApp Integration</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsWhatsAppModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div>
                  <h3 className="font-medium text-gray-900">Integration Status</h3>
                  <p className="text-sm text-green-600">✅ Active</p>
                </div>
              </div>
              
              {whatsappStatus?.phoneNumberId && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Phone Number ID</h4>
                  <div className="flex items-center justify-between">
                    <code className="text-sm bg-white px-3 py-2 rounded border font-mono">
                      {whatsappStatus.phoneNumberId}
                    </code>
                    <button
                      className="ml-2 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      onClick={() => {
                        navigator.clipboard.writeText(whatsappStatus.phoneNumberId);
                        // You could add a toast notification here
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() => setActiveTab('integrations')}
                >
                  Manage Integration
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() => setIsWhatsAppModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isAddContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Add Contact</h2>
              <button
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  setIsAddContactModalOpen(false);
                  resetContactForm();
                }}
                aria-label="Close"
                disabled={isSubmittingContact}
              >
                ✕
              </button>
            </div>

            <form className={`space-y-6 ${isSubmittingContact ? 'opacity-60' : ''}`} onSubmit={handleAddContact}>
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={contactFirstName}
                      onChange={(e) => setContactFirstName(e.target.value)}
                      disabled={isSubmittingContact}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={contactLastName}
                      onChange={(e) => setContactLastName(e.target.value)}
                      disabled={isSubmittingContact}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birthday (Optional)
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={contactBirthday}
                    onChange={(e) => setContactBirthday(e.target.value)}
                    disabled={isSubmittingContact}
                  />
                </div>
              </div>

              {/* Phone Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Phone Information</h3>
                </div>
                {contactPhones.map((phoneObj, index) => (
                  <div key={index} className="space-y-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Phone {index + 1}</span>
                      {contactPhones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePhone(index)}
                          className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isSubmittingContact}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number {index === 0 && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="tel"
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={phoneObj.phone}
                          onChange={(e) => updatePhone(index, 'phone', e.target.value)}
                          required={index === 0}
                          disabled={isSubmittingContact}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={phoneObj.type}
                          onChange={(e) => updatePhone(index, 'type', e.target.value)}
                          disabled={isSubmittingContact}
                        >
                          <option value="MOBILE">Mobile</option>
                          <option value="HOME">Home</option>
                          <option value="WORK">Work</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPhone}
                  className="w-full px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmittingContact}
                >
                  + Add Another Phone
                </button>
              </div>

              {/* Email Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Email Information (Optional)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      disabled={isSubmittingContact}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={contactEmailType}
                      onChange={(e) => setContactEmailType(e.target.value)}
                      disabled={isSubmittingContact}
                    >
                      <option value="WORK">Work</option>
                      <option value="HOME">Home</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Address Information (Optional)</h3>
                </div>
                {contactAddresses.map((address, index) => (
                  <div key={index} className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Address {index + 1}</span>
                      {contactAddresses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAddress(index)}
                          className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isSubmittingContact}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street
                      </label>
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        value={address.street}
                        onChange={(e) => updateAddress(index, 'street', e.target.value)}
                        disabled={isSubmittingContact}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={address.city}
                          onChange={(e) => updateAddress(index, 'city', e.target.value)}
                          disabled={isSubmittingContact}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={address.state}
                          onChange={(e) => updateAddress(index, 'state', e.target.value)}
                          disabled={isSubmittingContact}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={address.zip}
                          onChange={(e) => updateAddress(index, 'zip', e.target.value)}
                          disabled={isSubmittingContact}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={address.country}
                          onChange={(e) => updateAddress(index, 'country', e.target.value)}
                          disabled={isSubmittingContact}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country Code
                        </label>
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={address.country_code}
                          onChange={(e) => updateAddress(index, 'country_code', e.target.value)}
                          maxLength={2}
                          disabled={isSubmittingContact}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Type
                      </label>
                      <select
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        value={address.type}
                        onChange={(e) => updateAddress(index, 'type', e.target.value)}
                        disabled={isSubmittingContact}
                      >
                        <option value="HOME">Home</option>
                        <option value="WORK">Work</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addAddress}
                  className="w-full px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmittingContact}
                >
                  + Add Another Address
                </button>
              </div>

              {/* Organization Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Organization Information (Optional)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={contactCompany}
                      onChange={(e) => setContactCompany(e.target.value)}
                      disabled={isSubmittingContact}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={contactDepartment}
                      onChange={(e) => setContactDepartment(e.target.value)}
                      disabled={isSubmittingContact}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={contactTitle}
                      onChange={(e) => setContactTitle(e.target.value)}
                      disabled={isSubmittingContact}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead Stage</label>
                  <select
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={contactLeadStage}
                    onChange={(e) => setContactLeadStage(e.target.value)}
                    disabled={isSubmittingContact}
                  >
                    <option>New Lead</option>
                    <option>Contacted</option>
                    <option>Qualified</option>
                    <option>Proposal Sent</option>
                    <option>Deal Won</option>
                    <option>Deal Lost</option>
                  </select>
                </div>
              </div>

              {/* URL Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">URL Information (Optional)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL
                    </label>
                    <input
                      type="url"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={contactUrl}
                      onChange={(e) => setContactUrl(e.target.value)}
                      disabled={isSubmittingContact}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={contactUrlType}
                      onChange={(e) => setContactUrlType(e.target.value)}
                      disabled={isSubmittingContact}
                    >
                      <option value="WORK">Work</option>
                      <option value="HOME">Home</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead Stage</label>
                  <select
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={contactLeadStage}
                    onChange={(e) => setContactLeadStage(e.target.value)}
                    disabled={isSubmittingContact}
                  >
                    <option>New Lead</option>
                    <option>Contacted</option>
                    <option>Qualified</option>
                    <option>Proposal Sent</option>
                    <option>Deal Won</option>
                    <option>Deal Lost</option>
                  </select>
                </div>
              </div>

              {contactError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-4 rounded-lg flex items-start space-x-2">
                  <span className="text-red-500 text-lg">⚠️</span>
                  <span>{contactError}</span>
                </div>
              )}
              {contactSuccess && (
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 p-4 rounded-lg flex items-start space-x-2">
                  <span className="text-green-600 text-lg">✅</span>
                  <div className="flex-1">
                    <p className="font-semibold text-green-800">{contactSuccess}</p>
                    <p className="text-xs text-green-600 mt-1">The contact has been saved to your contact list.</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() => {
                    setIsAddContactModalOpen(false);
                    resetContactForm();
                  }}
                  disabled={isSubmittingContact}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center space-x-2"
                  disabled={isSubmittingContact}
                >
                  {isSubmittingContact && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{isSubmittingContact ? 'Creating Contact...' : 'Create Contact'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Import Contacts Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Import Contacts (CSV)</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setCsvHeaders([]);
                  setCsvRows([]);
                  setMapping({});
                  setCsvParseError('');
                  setImportPreview([]);
                  setImportProgress({ total: 0, success: 0, failed: 0 });
                  setImportResults([]);
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Upload */}
            <div className="space-y-4">
              <div className="border border-dashed border-gray-300 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-3">Upload a CSV file. The first row should be headers.</p>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCsvFile(file).then(recomputePreview);
                  }}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {csvParseError && (
                  <div className="mt-2 text-sm text-red-600">{csvParseError}</div>
                )}
                {csvHeaders.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">Detected {csvRows.length} rows. {csvHeaders.length} columns.</div>
                )}
              </div>

              {/* Step 2: Mapping */}
              {csvHeaders.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">Map Columns</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {csvHeaders.map((header) => (
                      <div key={header} className="flex items-center gap-2">
                        <div className="w-1/2 text-xs text-gray-700 truncate" title={header}>{header || '(unnamed column)'}</div>
                        <select
                          className="w-1/2 border rounded px-2 py-1 text-xs"
                          value={mapping[header] || ''}
                          onChange={(e) => handleChangeMapping(header, e.target.value)}
                        >
                          <option value="">Ignore</option>
                          {knownFields.map(f => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Preview */}
              {importPreview.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">Preview (first 5 rows)</h3>
                  <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(importPreview, null, 2)}</pre>
                </div>
              )}

              {/* Step 4: Import */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-xs text-gray-600">
                  {importProgress.total > 0 && (
                    <span>Imported {importProgress.success}/{importProgress.total} successful, {importProgress.failed} failed.</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                    onClick={() => {
                      setIsImportModalOpen(false);
                    }}
                    disabled={isImporting}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
                    disabled={isImporting || csvRows.length === 0}
                    onClick={handleStartImport}
                  >
                    {isImporting && (
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isImporting ? 'Importing...' : 'Start Import'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block dashboard until welcome form is submitted */}
      {!isWelcomeModalOpen && (
        <>
      
      {/* Edit Contact Modal */}
      {isEditContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Edit Contact</h2>
              <button
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  setIsEditContactModalOpen(false);
                  resetContactForm();
                  setEditingContactId(null);
                }}
                aria-label="Close"
                disabled={isSubmittingContact}
              >
                ✕
              </button>
            </div>

            <form className={`space-y-6 ${isSubmittingContact ? 'opacity-60' : ''}`} onSubmit={handleUpdateContact}>
              {/* Reuse all the form fields from Add Contact Modal - they're already in the same state variables */}
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={contactFirstName}
                      onChange={(e) => setContactFirstName(e.target.value)}
                      disabled={isSubmittingContact}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={contactLastName}
                      onChange={(e) => setContactLastName(e.target.value)}
                      disabled={isSubmittingContact}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birthday (Optional)
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={contactBirthday}
                    onChange={(e) => setContactBirthday(e.target.value)}
                    disabled={isSubmittingContact}
                  />
                </div>
              </div>

              {/* Phone Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Phone Information</h3>
                </div>
                {contactPhones.map((phoneObj, index) => (
                  <div key={index} className="space-y-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Phone {index + 1}</span>
                      {contactPhones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePhone(index)}
                          className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isSubmittingContact}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number {index === 0 && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="tel"
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={phoneObj.phone}
                          onChange={(e) => updatePhone(index, 'phone', e.target.value)}
                          required={index === 0}
                          disabled={isSubmittingContact}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={phoneObj.type}
                          onChange={(e) => updatePhone(index, 'type', e.target.value)}
                          disabled={isSubmittingContact}
                        >
                          <option value="MOBILE">Mobile</option>
                          <option value="HOME">Home</option>
                          <option value="WORK">Work</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPhone}
                  className="w-full px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmittingContact}
                >
                  + Add Another Phone
                </button>
              </div>

              {/* Email Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Email Information (Optional)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      disabled={isSubmittingContact}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={contactEmailType}
                      onChange={(e) => setContactEmailType(e.target.value)}
                      disabled={isSubmittingContact}
                    >
                      <option value="WORK">Work</option>
                      <option value="HOME">Home</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Address Information (Optional)</h3>
                </div>
                {contactAddresses.map((address, index) => (
                  <div key={index} className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Address {index + 1}</span>
                      {contactAddresses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAddress(index)}
                          className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isSubmittingContact}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street
                      </label>
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        value={address.street}
                        onChange={(e) => updateAddress(index, 'street', e.target.value)}
                        disabled={isSubmittingContact}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={address.city}
                          onChange={(e) => updateAddress(index, 'city', e.target.value)}
                          disabled={isSubmittingContact}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={address.state}
                          onChange={(e) => updateAddress(index, 'state', e.target.value)}
                          disabled={isSubmittingContact}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={address.zip}
                          onChange={(e) => updateAddress(index, 'zip', e.target.value)}
                          disabled={isSubmittingContact}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={address.country}
                          onChange={(e) => updateAddress(index, 'country', e.target.value)}
                          disabled={isSubmittingContact}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country Code
                        </label>
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={address.country_code}
                          onChange={(e) => updateAddress(index, 'country_code', e.target.value)}
                          maxLength={2}
                          disabled={isSubmittingContact}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Type
                      </label>
                      <select
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        value={address.type}
                        onChange={(e) => updateAddress(index, 'type', e.target.value)}
                        disabled={isSubmittingContact}
                      >
                        <option value="HOME">Home</option>
                        <option value="WORK">Work</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addAddress}
                  className="w-full px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmittingContact}
                >
                  + Add Another Address
                </button>
              </div>

              {/* Organization Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Organization Information (Optional)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={contactCompany}
                      onChange={(e) => setContactCompany(e.target.value)}
                      disabled={isSubmittingContact}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={contactDepartment}
                      onChange={(e) => setContactDepartment(e.target.value)}
                      disabled={isSubmittingContact}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={contactTitle}
                      onChange={(e) => setContactTitle(e.target.value)}
                      disabled={isSubmittingContact}
                    />
                  </div>
                </div>
              </div>

              {/* URL Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">URL Information (Optional)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL
                    </label>
                    <input
                      type="url"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={contactUrl}
                      onChange={(e) => setContactUrl(e.target.value)}
                      disabled={isSubmittingContact}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={contactUrlType}
                      onChange={(e) => setContactUrlType(e.target.value)}
                      disabled={isSubmittingContact}
                    >
                      <option value="WORK">Work</option>
                      <option value="HOME">Home</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {contactError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-4 rounded-lg flex items-start space-x-2">
                  <span className="text-red-500 text-lg">⚠️</span>
                  <span>{contactError}</span>
                </div>
              )}
              {contactSuccess && (
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 p-4 rounded-lg flex items-start space-x-2">
                  <span className="text-green-600 text-lg">✅</span>
                  <div className="flex-1">
                    <p className="font-semibold text-green-800">{contactSuccess}</p>
                    <p className="text-xs text-green-600 mt-1">The contact has been updated in your contact list.</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() => {
                    setIsEditContactModalOpen(false);
                    resetContactForm();
                    setEditingContactId(null);
                  }}
                  disabled={isSubmittingContact}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center space-x-2"
                  disabled={isSubmittingContact}
                >
                  {isSubmittingContact && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{isSubmittingContact ? 'Updating Contact...' : 'Update Contact'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Onboarding Summary Banner - Commented out
      <OnboardingBanner userData={userData} />
      */}
      
      
      <div className="flex flex-col lg:flex-row">
        {/* Left Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={handleTabChange}
          whatsappStatus={whatsappStatus}
          onboardingStatus={onboardingStatus}
          trainingStatus={trainingStatus}
          pricingSubscriptionStatus={pricingSubscriptionStatus}
        />
        {/* Main Content */}
        <div className={`flex-1 ${activeTab === 'team-inbox' || activeTab === 'broadcast' ? 'p-0 overflow-hidden' : 'p-4 lg:p-6'}`}>
          <div className={activeTab === 'team-inbox' || activeTab === 'broadcast' ? 'w-full h-full' : 'max-w-7xl mx-auto'}>
            {renderMainContent()}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default Dashboard; 