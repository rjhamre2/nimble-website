import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import Contacts from './sections/Contacts/Contacts';
import { MagnifyingGlassIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { getAuth } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { broadcastTemplates, getTemplatesByTag, getAllTags } from '../../data/broadcastTemplates';

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

// Initialize Firebase if not already initialized
let firebaseApp;
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'nimbleai-firebase.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'nimbleai-firebase',
};

if (firebaseConfig.apiKey && getApps().length === 0) {
  firebaseApp = initializeApp(firebaseConfig);
} else if (getApps().length > 0) {
  firebaseApp = getApps()[0];
}

const Dashboard = () => {
  const { user, userData, loading } = useAuth();
  const [isEmailVerified, setIsEmailVerified] = useState(null);
  const [isCheckingEmailVerification, setIsCheckingEmailVerification] = useState(false);
  const hasCheckedEmailVerification = useRef(false);
  const lastCheckedUserId = useRef(null);
  
  // Tab and view state
  const [activeTab, setActiveTab] = useState('overview');
  const [broadcastView, setBroadcastView] = useState('new-broadcast');
  const [templateSubView, setTemplateSubView] = useState(null); // 'template-library' or 'your-templates'
  const [selectedTemplateTag, setSelectedTemplateTag] = useState('All');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  // Template form state
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateLanguage, setTemplateLanguage] = useState('English');
  const [templateBody, setTemplateBody] = useState('');
  const [templateFooter, setTemplateFooter] = useState('');
  const [templateSampleContent, setTemplateSampleContent] = useState('');
  const [templateButtons, setTemplateButtons] = useState('');
  // Broadcast title state
  const [broadcastTitleType, setBroadcastTitleType] = useState('none'); // 'none', 'text', 'image', 'video', 'document'
  const [broadcastTitleText, setBroadcastTitleText] = useState('');
  const [broadcastTitleImageLink, setBroadcastTitleImageLink] = useState('');
  const [broadcastTitleVideoLink, setBroadcastTitleVideoLink] = useState('');
  const [broadcastTitleDocumentLink, setBroadcastTitleDocumentLink] = useState('');
  const [broadcastTitleImageFile, setBroadcastTitleImageFile] = useState(null);
  const [broadcastTitleVideoFile, setBroadcastTitleVideoFile] = useState(null);
  const [broadcastTitleDocumentFile, setBroadcastTitleDocumentFile] = useState(null);
  const [broadcastTitleError, setBroadcastTitleError] = useState('');

  // Populate form when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      setTemplateName(selectedTemplate.name || '');
      
      // Map category from template to dropdown format
      let category = '';
      if (selectedTemplate.category) {
        const categoryMap = {
          'AUTHENTICATION': 'Authentication',
          'MARKETING': 'Marketing',
          'UTILITY': 'Utility'
        };
        category = categoryMap[selectedTemplate.category] || selectedTemplate.category;
      }
      setTemplateCategory(category);
      
      setTemplateLanguage(selectedTemplate.language || 'English');
      setTemplateBody(selectedTemplate.content || '');
      setTemplateFooter(selectedTemplate.footer || '');
      setTemplateSampleContent('');
      setTemplateButtons('');
      // Reset broadcast title when selecting a new template
      setBroadcastTitleType('none');
      setBroadcastTitleText('');
      setBroadcastTitleImageLink('');
      setBroadcastTitleVideoLink('');
      setBroadcastTitleDocumentLink('');
      setBroadcastTitleImageFile(null);
      setBroadcastTitleVideoFile(null);
      setBroadcastTitleDocumentFile(null);
      setBroadcastTitleError('');
    }
  }, [selectedTemplate]);

  const [activeAutomationView, setActiveAutomationView] = useState('ai-agents');
  const [activeChannel, setActiveChannel] = useState('whatsapp');
  const [showConnectAccount, setShowConnectAccount] = useState(false);
  const [connectAccountStep, setConnectAccountStep] = useState(0);
  const [hasOfficialNumber, setHasOfficialNumber] = useState(true);
  const [connectPhoneCountry, setConnectPhoneCountry] = useState('IN');
  const [connectPhoneDialCode, setConnectPhoneDialCode] = useState('+91');
  const [connectPhoneNumber, setConnectPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [hasWebsiteUrl, setHasWebsiteUrl] = useState(true);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [setupData, setSetupData] = useState(null);
  const [whatsappSignupData, setWhatsappSignupData] = useState(null);
  const [whatsappAuthCode, setWhatsappAuthCode] = useState(null);
  const [isProcessingWhatsapp, setIsProcessingWhatsapp] = useState(false);
  
  // Carousel images
  const carouselImages = [
    require('../../images/carousel-1.png'),
    require('../../images/carousel-3.png'),
    require('../../images/carousel-4.png'),
    require('../../images/carousel-5.png'),
    require('../../images/carousel-6.png'),
    require('../../images/carousel-7.png'),
  ];
  
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
  const [contactPhones, setContactPhones] = useState([{ phone: '', type: 'MOBILE', countryCode: 'IN', dialCode: '+91' }]);
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
  const [teamManagementTab, setTeamManagementTab] = useState('users');
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [teamFormData, setTeamFormData] = useState({
    teamName: '',
    customTeamName: '',
    members: Array(5).fill(null).map(() => ({ name: '', email: '', role: '', customRole: '' }))
  });
  const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);
  const [teamError, setTeamError] = useState(null);
  const [teamsData, setTeamsData] = useState([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState(new Set());
  const [editingMember, setEditingMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);
  const [addingMember, setAddingMember] = useState(null);
  const [newMemberData, setNewMemberData] = useState({ name: '', email: '', selectedRole: '', customRole: '' });
  const [teamMembersData, setTeamMembersData] = useState([]);
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState(null);
  const [deletingTeamMember, setDeletingTeamMember] = useState(null);
  const [deletingTeam, setDeletingTeam] = useState(null);
  const [deletingInvitation, setDeletingInvitation] = useState(null);
  
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
  const [isWabaDetailsEmpty, setIsWabaDetailsEmpty] = useState(false);
  const [welcomeBusinessName, setWelcomeBusinessName] = useState('');
  const [welcomeError, setWelcomeError] = useState('');
  const [isSubmittingWelcome, setIsSubmittingWelcome] = useState(false);
  
  // CSV Import state
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvRows, setCsvRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [csvParseError, setCsvParseError] = useState('');
  const [importPreview, setImportPreview] = useState([]);
  const [importProgress, setImportProgress] = useState({ success: 0, failed: 0, total: 0 });
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

  // WhatsApp Embedded Signup message listener
  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.origin.endsWith('facebook.com')) return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          console.log('WhatsApp Embedded Signup message event:', data);
          
          // Handle successful completion
          if (data.event === 'FINISH' || data.event === 'FINISH_ONLY_WABA' || data.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING') {
            console.log('Raw Facebook event data:', data.data);
            const newWhatsappData = {
              phone_number_id: data.data.phone_number_id,
              waba_id: data.data.waba_id,
              business_id: data.data.business_id,
              event: data.event
            };
            console.log('Setting new WhatsApp data:', newWhatsappData);
            setWhatsappSignupData(newWhatsappData);
          }
          // Handle abandoned flow
          else if (data.event === 'CANCEL') {
            console.log(`Signup abandoned at step: ${data.data.current_step || 'Unknown'}`);
            setWhatsappSignupData(null);
          }
        }
      } catch (err) {
        console.log('WhatsApp Embedded Signup raw message event:', event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Process WhatsApp signup when both data and code are available
  useEffect(() => {
    if (whatsappSignupData && whatsappAuthCode && !isProcessingWhatsapp) {
      // Validate required fields
      if (!whatsappSignupData.phone_number_id) {
        console.error('Missing phone_number_id in whatsappData:', whatsappSignupData);
        return;
      }
      
      if (!whatsappSignupData.waba_id) {
        console.error('Missing waba_id in whatsappData:', whatsappSignupData);
        return;
      }
      
      setIsProcessingWhatsapp(true);
      
      sendWhatsappCodeToServer(whatsappAuthCode, whatsappSignupData.waba_id, whatsappSignupData.phone_number_id)
        .then(result => {
          console.log('WhatsApp integration completed successfully:', result);
          setWhatsappSignupData(null);
          setWhatsappAuthCode(null);
          setIsProcessingWhatsapp(false);
          
          // Refresh WhatsApp status
          if (user?.uid) {
            checkWhatsAppStatus(user.uid).then(data => {
              setWhatsappStatus(data);
            });
          }
          
          // Close the connect account flow
          setShowConnectAccount(false);
          setConnectAccountStep(0);
        })
        .catch(error => {
          console.error('Failed to send code to server:', error);
          setIsProcessingWhatsapp(false);
        });
    }
  }, [whatsappSignupData, whatsappAuthCode, isProcessingWhatsapp, user]);

  // Check email verification status - only once when user is available or when user changes
  useEffect(() => {
    // Use a ref to track if we've already checked for this user
    let isMounted = true;
    
    const checkEmailVerification = async () => {
      // Prevent multiple simultaneous checks
      const currentUserId = user?.uid || user?.email;
      
      // Skip if:
      // - No user or firebase app
      // - Already checking
      if (!user || !firebaseApp || isCheckingEmailVerification) {
        console.log('📧 [Email Verification] Skipping check:', {
          hasUser: !!user,
          hasFirebaseApp: !!firebaseApp,
          isChecking: isCheckingEmailVerification
        });
        return;
      }
      
      // If user changed, reset the check flag
      if (lastCheckedUserId.current !== currentUserId) {
        hasCheckedEmailVerification.current = false;
      }
      
      // If we've already checked for this user, skip
      if (hasCheckedEmailVerification.current && lastCheckedUserId.current === currentUserId) {
        return;
      }
      
      // Mark as checking for this user
      hasCheckedEmailVerification.current = true;
      lastCheckedUserId.current = currentUserId;
      
      console.log('📧 [Email Verification] Starting check...', { 
        hasUser: !!user, 
        hasFirebaseApp: !!firebaseApp,
        userId: user?.uid || user?.email 
      });
      
      setIsCheckingEmailVerification(true);
      try {
        const auth = getAuth(firebaseApp);
        const firebaseUser = auth.currentUser;
        
        console.log('📧 [Email Verification] Firebase Auth state:', {
          hasFirebaseUser: !!firebaseUser,
          firebaseUserEmail: firebaseUser?.email,
          firebaseUserId: firebaseUser?.uid
        });
        
        if (firebaseUser) {
          // CRITICAL STEP: Get the latest data from the Firebase server
          console.log('📧 [Email Verification] Reloading user data from Firebase server...');
          await firebaseUser.reload();
          
          if (!isMounted) return; // Component unmounted, don't update state
          
          console.log('📧 [Email Verification] User data after reload:', {
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            uid: firebaseUser.uid
          });
          
          // Check the updated property
          if (firebaseUser.emailVerified) {
            console.log("✅ [Email Verification] Email Verified: Access Granted!");
            setIsEmailVerified(true);
          } else {
            console.log("⚠️ [Email Verification] Email NOT Verified: Please check your inbox.");
            setIsEmailVerified(false);
          }
        } else {
          // If no Firebase user, we can't check verification
          // This might happen if user signed up with email/password but Firebase Auth isn't used
          // In this case, assume email is not verified and show warning
          if (!isMounted) return;
          console.warn("⚠️ [Email Verification] No Firebase user found. Cannot check email verification status.");
          console.warn("📝 [Email Verification] This might happen if user signed up with email/password but Firebase Auth isn't used.");
          console.warn("📝 [Email Verification] Showing warning banner as precaution.");
          // Set to false to show warning banner when we can't verify
          setIsEmailVerified(false);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("❌ [Email Verification] Error reloading user data:", error);
        console.error("❌ [Email Verification] Error details:", {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        setIsEmailVerified(null);
      } finally {
        if (isMounted) {
          setIsCheckingEmailVerification(false);
          console.log('📧 [Email Verification] Check completed.');
        }
      }
    };

    // Only check when user is available and not loading
    if (user && !loading) {
      console.log('📧 [Email Verification] Triggering check...', {
        hasUser: !!user,
        loading,
        userId: user?.uid || user?.email
      });
      checkEmailVerification();
    } else {
      console.log('📧 [Email Verification] Not checking:', {
        hasUser: !!user,
        loading
      });
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [user, loading]); // Removed isCheckingEmailVerification from dependencies

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isAddTeamModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAddTeamModalOpen]);

  // Fetch teams data function
  const fetchTeams = async () => {
    const dbId = userData?.db_id || user?.db_id;
    if (!dbId) {
      console.log('⚠️ No db_id found, cannot fetch teams');
      return;
    }

    setIsLoadingTeams(true);
    try {
      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
      if (!dbServerUrl) {
        throw new Error('DB Server URL is not configured');
      }

      const url = `${dbServerUrl}/api/teams/${dbId}`;
      console.log('🌐 [Fetch Teams] Calling API:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch teams: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [Fetch Teams] Teams fetched successfully:', result);

      if (result.success && result.data) {
        setTeamsData(result.data);
      } else {
        setTeamsData([]);
      }
    } catch (error) {
      console.error('❌ [Fetch Teams] Error:', error);
      setTeamsData([]);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  // Fetch teams data when teams tab is active
  useEffect(() => {
    if (activeTab !== 'team-management' || teamManagementTab !== 'teams') {
      return;
    }

    fetchTeams();
  }, [activeTab, teamManagementTab, userData, user]);

  // Fetch team members data when users tab is active
  const fetchTeamMembers = async () => {
    const dbId = userData?.db_id || user?.db_id;
    if (!dbId) {
      console.log('⚠️ No db_id found, cannot fetch team members');
      return;
    }

    setIsLoadingTeamMembers(true);
    try {
      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
      if (!dbServerUrl) {
        throw new Error('DB Server URL is not configured');
      }

      const url = `${dbServerUrl}/api/users/${dbId}/team-members`;
      console.log('🌐 [Fetch Team Members] Calling API:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch team members: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [Fetch Team Members] Team members fetched successfully:', result);

      if (result.success && result.data) {
        setTeamMembersData(result.data);
      } else {
        setTeamMembersData([]);
      }
    } catch (error) {
      console.error('❌ [Fetch Team Members] Error:', error);
      setTeamMembersData([]);
    } finally {
      setIsLoadingTeamMembers(false);
    }
  };

  // Fetch team members when users tab is active
  useEffect(() => {
    if (activeTab !== 'team-management' || teamManagementTab !== 'users') {
      return;
    }

    fetchTeamMembers();
  }, [activeTab, teamManagementTab, userData, user]);

  // Handle edit team member
  const handleEditMember = (teamId, memberIndex, member) => {
    // Determine if the current role is a predefined role or custom
    const predefinedRoles = ['Admin / Business Manager', 'Sales Manager', 'Support Manager', 'Marketing Manager'];
    const isPredefinedRole = predefinedRoles.includes(member.role);
    
    setEditingMember({ 
      teamId, 
      memberIndex, 
      member,
      selectedRole: isPredefinedRole ? member.role : 'Other',
      customRole: isPredefinedRole ? '' : member.role
    });
  };

  // Handle delete team member
  const handleDeleteMember = async (teamId, memberIndex, member) => {
    if (!window.confirm(`Are you sure you want to remove ${member.name} from this team?`)) {
      return;
    }

    setDeletingMember({ teamId, memberIndex });
    
    try {
      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
      if (!dbServerUrl) {
        throw new Error('Server configuration error.');
      }

      // Get member_id from member object (could be id, member_id, or email as fallback)
      const memberId = member.id || member.member_id || member.email;
      if (!memberId) {
        throw new Error('Member ID not found.');
      }

      const apiUrl = `${dbServerUrl}/api/teams/${teamId}/members/${memberId}`;
      
      console.log('🌐 [Delete Member] Calling API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete member: ${response.status} ${response.statusText}`);
      }

      console.log('✅ [Delete Member] Member deleted successfully');

      // Refresh teams data to get the updated member list
      const dbId = userData?.db_id || user?.db_id;
      if (dbId) {
        const teamsUrl = `${dbServerUrl}/api/teams/${dbId}`;
        const teamsResponse = await fetch(teamsUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (teamsResponse.ok) {
          const teamsResult = await teamsResponse.json();
          if (teamsResult.success && teamsResult.data) {
            setTeamsData(teamsResult.data);
          }
        }
      }

      setDeletingMember(null);
    } catch (error) {
      console.error('❌ [Delete Member] Error:', error);
      alert(`Failed to remove member: ${error.message}`);
      setDeletingMember(null);
    }
  };

  // Handle delete invitation
  const handleDeleteInvitation = async (teamId, invitationId, invitedEmail) => {
    if (!window.confirm(`Are you sure you want to cancel the invitation for ${invitedEmail}?`)) {
      return;
    }

    setDeletingInvitation({ teamId, invitationId });
    
    try {
      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
      if (!dbServerUrl) {
        throw new Error('Server configuration error.');
      }

      const apiUrl = `${dbServerUrl}/api/invitations/${invitationId}`;
      
      console.log('🌐 [Delete Invitation] Calling API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete invitation: ${response.status} ${response.statusText}`);
      }

      console.log('✅ [Delete Invitation] Invitation deleted successfully');

      // Refresh teams data to get the updated invitation list
      const dbId = userData?.db_id || user?.db_id;
      if (dbId) {
        const teamsUrl = `${dbServerUrl}/api/teams/${dbId}`;
        const teamsResponse = await fetch(teamsUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (teamsResponse.ok) {
          const teamsResult = await teamsResponse.json();
          if (teamsResult.success && teamsResult.data) {
            setTeamsData(teamsResult.data);
          }
        }
      }

      setDeletingInvitation(null);
    } catch (error) {
      console.error('❌ [Delete Invitation] Error:', error);
      alert(`Failed to cancel invitation: ${error.message}`);
      setDeletingInvitation(null);
    }
  };

  // Handle save edited member
  const handleSaveMember = async (teamId, memberIndex, updatedMember) => {
    try {
      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
      if (!dbServerUrl) {
        throw new Error('Server configuration error.');
      }

      // Get the original member to find member_id
      const team = teamsData.find(t => t.team_id === teamId);
      if (!team || !team.members || !team.members[memberIndex]) {
        throw new Error('Member not found.');
      }

      const originalMember = team.members[memberIndex];
      // Get member_id from member object (could be id, member_id, or email as fallback)
      const memberId = originalMember.id || originalMember.member_id || originalMember.email;
      if (!memberId) {
        throw new Error('Member ID not found.');
      }

      const apiUrl = `${dbServerUrl}/api/teams/${teamId}/members/${memberId}`;
      
      console.log('🌐 [Edit Member] Calling API:', apiUrl);
      console.log('📤 [Edit Member] Request data:', {
        name: updatedMember.name,
        email: updatedMember.email,
        role: updatedMember.role
      });

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: updatedMember.name,
          email: updatedMember.email,
          role: updatedMember.role
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update member: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [Edit Member] Member updated successfully:', result);

      // Refresh teams data to get the updated member list
      const dbId = userData?.db_id || user?.db_id;
      if (dbId) {
        const teamsUrl = `${dbServerUrl}/api/teams/${dbId}`;
        const teamsResponse = await fetch(teamsUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (teamsResponse.ok) {
          const teamsResult = await teamsResponse.json();
          if (teamsResult.success && teamsResult.data) {
            setTeamsData(teamsResult.data);
          }
        }
      }

      setEditingMember(null);
    } catch (error) {
      console.error('❌ [Edit Member] Error:', error);
      alert(`Failed to update member: ${error.message}`);
    }
  };

  // Handle add new member
  const handleAddMember = (teamId) => {
    setAddingMember(teamId);
    setNewMemberData({ name: '', email: '', selectedRole: '', customRole: '' });
  };

  // Handle save new member
  const handleSaveNewMember = async (teamId) => {
    try {
      if (!newMemberData.name || !newMemberData.email) {
        alert('Please fill in name and email');
        return;
      }

      if (!newMemberData.selectedRole) {
        alert('Please select a role');
        return;
      }

      if (newMemberData.selectedRole === 'Other' && !newMemberData.customRole) {
        alert('Please enter a role name');
        return;
      }

      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
      if (!dbServerUrl) {
        throw new Error('Server configuration error.');
      }

      const finalRole = newMemberData.selectedRole === 'Other' ? newMemberData.customRole : newMemberData.selectedRole;
      const apiUrl = `${dbServerUrl}/api/teams/${teamId}/members`;
      
      console.log('🌐 [Add Member] Calling API:', apiUrl);
      console.log('📤 [Add Member] Request data:', {
        name: newMemberData.name,
        email: newMemberData.email,
        role: finalRole
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newMemberData.name,
          email: newMemberData.email,
          role: finalRole
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to add member: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [Add Member] Member added successfully:', result);

      // Refresh teams data to get the updated member list
      const dbId = userData?.db_id || user?.db_id;
      if (dbId) {
        const teamsUrl = `${dbServerUrl}/api/teams/${dbId}`;
        const teamsResponse = await fetch(teamsUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (teamsResponse.ok) {
          const teamsResult = await teamsResponse.json();
          if (teamsResult.success && teamsResult.data) {
            setTeamsData(teamsResult.data);
          }
        }
      }

      setAddingMember(null);
      setNewMemberData({ name: '', email: '', selectedRole: '', customRole: '' });
    } catch (error) {
      console.error('❌ [Add Member] Error:', error);
      alert(`Failed to add member: ${error.message}`);
    }
  };

  // Handle edit team member from users tab
  const handleEditTeamMember = (member) => {
    // Determine if the current role is a predefined role or custom
    const predefinedRoles = ['Admin / Business Manager', 'Sales Manager', 'Support Manager', 'Marketing Manager'];
    const isPredefinedRole = predefinedRoles.includes(member.role);
    
    setEditingTeamMember({
      ...member,
      selectedRole: isPredefinedRole ? member.role : 'Other',
      customRole: isPredefinedRole ? '' : member.role
    });
  };

  // Handle delete team member from users tab
  const handleDeleteTeamMember = async (member) => {
    if (!window.confirm(`Are you sure you want to remove ${member.name} from ${member.team_name}?`)) {
      return;
    }

    setDeletingTeamMember(member.member_id);
    
    try {
      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
      if (!dbServerUrl) {
        throw new Error('Server configuration error.');
      }

      const apiUrl = `${dbServerUrl}/api/teams/${member.team_id}/members/${member.member_id}`;
      
      console.log('🌐 [Delete Team Member] Calling API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete member: ${response.status} ${response.statusText}`);
      }

      console.log('✅ [Delete Team Member] Member deleted successfully');

      // Refresh team members list
      await fetchTeamMembers();
      setDeletingTeamMember(null);
    } catch (error) {
      console.error('❌ [Delete Team Member] Error:', error);
      alert(`Failed to remove member: ${error.message}`);
      setDeletingTeamMember(null);
    }
  };

  // Handle save edited team member from users tab
  const handleSaveTeamMember = async (updatedMember) => {
    try {
      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
      if (!dbServerUrl) {
        throw new Error('Server configuration error.');
      }

      const apiUrl = `${dbServerUrl}/api/teams/${updatedMember.team_id}/members/${updatedMember.member_id}`;
      
      console.log('🌐 [Edit Team Member] Calling API:', apiUrl);
      console.log('📤 [Edit Team Member] Request data:', {
        name: updatedMember.name,
        email: updatedMember.email,
        role: updatedMember.role
      });

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: updatedMember.name,
          email: updatedMember.email,
          role: updatedMember.role
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update member: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [Edit Team Member] Member updated successfully:', result);

      // Refresh team members list
      await fetchTeamMembers();
      setEditingTeamMember(null);
    } catch (error) {
      console.error('❌ [Edit Team Member] Error:', error);
      alert(`Failed to update member: ${error.message}`);
    }
  };

  // Handle delete team
  const handleDeleteTeam = async (teamId, teamName) => {
    if (!window.confirm(`Are you sure you want to delete the team "${teamName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingTeam(teamId);
    
    try {
      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
      if (!dbServerUrl) {
        throw new Error('Server configuration error.');
      }

      const apiUrl = `${dbServerUrl}/api/teams/${teamId}`;
      
      console.log('🌐 [Delete Team] Calling API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete team: ${response.status} ${response.statusText}`);
      }

      console.log('✅ [Delete Team] Team deleted successfully');

      // Refresh teams list
      await fetchTeams();
      setDeletingTeam(null);
    } catch (error) {
      console.error('❌ [Delete Team] Error:', error);
      alert(`Failed to delete team: ${error.message}`);
      setDeletingTeam(null);
    }
  };

  // Function to send WhatsApp code to server
  const sendWhatsappCodeToServer = async (code, wabaId, phoneNumberId) => {
    try {
      console.log('Sending code to server for token exchange:', { 
        code: code ? `${code.substring(0, 10)}...` : 'undefined', 
        wabaId, 
        phoneNumberId 
      });
      
      if (!phoneNumberId || !wabaId || !code || !user?.uid) {
        throw new Error('Missing required parameters for WhatsApp setup');
      }
      
      const requestBody = {
        code,
        waba_id: wabaId,
        phone_number_id: phoneNumberId,
        user_id: user.uid,
      };
      
      const response = await fetch(apiConfig.endpoints.whatsapp(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Server exchange successful:', result);
        return result;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error exchanging code with server:', error);
      throw error;
    }
  };

  const handleOpenWhatsAppGuidelines = () => {
    const guidelinesHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Display name guidelines for the WhatsApp Business platform</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
            background-color: #fff;
        }
        h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 24px;
            color: #1a1a1a;
        }
        h2 {
            font-size: 24px;
            font-weight: 600;
            margin-top: 32px;
            margin-bottom: 16px;
            color: #1a1a1a;
        }
        p {
            margin-bottom: 16px;
            font-size: 16px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
            font-size: 14px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
            vertical-align: top;
        }
        th {
            background-color: #f5f5f5;
            font-weight: 600;
        }
        ul {
            margin: 16px 0;
            padding-left: 24px;
        }
        li {
            margin-bottom: 8px;
        }
        .accepted {
            color: #059669;
            font-weight: 500;
        }
        .not-accepted {
            color: #dc2626;
            font-weight: 500;
        }
        .note {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px 16px;
            margin: 16px 0;
        }
    </style>
</head>
<body>
    <h1>Display name guidelines for the WhatsApp Business platform</h1>
    
    <p>This article is intended for businesses that use WhatsApp Business platform. Understand the differences between the WhatsApp Business platform and WhatsApp Business app.</p>
    
    <p>Your WhatsApp Business display name is the name customers see when they have conversations with your business and on your WhatsApp Business profile. You can assign a display name to a phone number that you add to your WhatsApp Business account. Your business must qualify for a display name to be eligible for a display name review. Learn how to become eligible for a display name.</p>
    
    <p>The display name will undergo a review, and you must follow specific guidelines for approval. See the guidelines below.</p>
    
    <h2>Display name guidelines</h2>
    
    <p>This table outlines the guidelines for display names.</p>
    
    <table>
        <thead>
            <tr>
                <th>Principle</th>
                <th>Examples</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Compliance with policies</strong></td>
                <td>
                A display name should not violate <a href="https://business.whatsapp.com/policy" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; cursor: pointer;">WhatsApp Business Messaging Policy</a>. An example for a store that sells a variety of sporting goods:<br><br>
                <span class="accepted">Accepted: Sarah's Sporting Goods Shop</span><br><br>
                <span class="not-accepted">Not accepted: Sarah's Sporting Goods Shop – Guns department</span><br><br>
                Within your company, you may have separate WhatsApp Business accounts for different divisions; only those divisions that are compliant with WhatsApp's Commerce policy may have a WhatsApp Business account.
                </td>
            </tr>
            <tr>
                <td><strong>Accurate and clear representation of your business</strong></td>
                <td>
                A display name should accurately represent:<br><br>
                • A business or its service, product or department.<br>
                • A test account or a demo account and it must maintain an association to the business. Examples of what is and isn't acceptable are below:<br><br>
                <span class="accepted">Accepted: Fresh Produce Boston</span><br>
                <span class="accepted">Accepted: Fresh Produce Customer Service Department</span><br>
                <span class="accepted">Accepted: Fresh Produce by Global Grocers Inc.</span><br><br>
                <span class="not-accepted">Not accepted: Tom Ford Nike (unless the brand name is officially linked on external sources such as websites or social media pages)</span><br><br>
                <div class="note">
                    <strong>Note:</strong> If the display name uses a personal name, it should clearly indicate the nature of the business on external sources (e.g. Tom Ford Chiropractor).
                </div>
                A display name should not be:<br><br>
                • A generic term<br>
                <span class="not-accepted">Not accepted: Fashion</span><br><br>
                • A generic geographic location<br>
                <span class="not-accepted">Not accepted: New York</span><br><br>
                • Appearing to have verification, which can mislead customers to think your business has an endorsed status. Official or Verified shouldn't be in the name.<br>
                <span class="not-accepted">Not accepted: Fresh Produce official account</span><br>
                <span class="not-accepted">Not accepted: Verified Minni's Muffins</span><br><br>
                • A display name should not reference Meta or any of its family of apps. Examples of what is and isn't acceptable are below:<br>
                <span class="not-accepted">Not accepted: Minni's Muffins - Meta</span><br>
                <span class="not-accepted">Not accepted: Minni's Muffins WhatsApp</span><br>
                <span class="not-accepted">Not accepted: Minni's Muffins pop-up on Facebook</span><br><br>
                • A display name should reflect the business's name only. It shouldn't have any advertising or promotional language.<br>
                <span class="not-accepted">Not accepted: Sarah's Sporting Goods – 20% off sale</span><br>
                <span class="not-accepted">Not accepted: Sarah's Sporting Goods: Best rated sporting goods store in Texas, US</span><br><br>
                • A display name shouldn't be formatted as a website or email. This helps to prevent phishing and maintain professionalism on our platforms. Examples of what isn't acceptable are below:<br>
                <span class="not-accepted">Not accepted: https://minnismuffins.net</span><br>
                <span class="not-accepted">Not accepted: sarahssportinggoods.com</span><br>
                <span class="not-accepted">Not accepted: hello@freshproducejuices.com</span>
                </td>
            </tr>
            <tr>
                <td><strong>Clear relationship with your business's legal name and consistency with external branding</strong></td>
                <td>
                A display name must have a clear relationship with your business's legal name. For example:<br><br>
                <span class="accepted">Accepted: Legal name of a charity mentioned on a charity organisation's website</span><br><br>
                <span class="not-accepted">Not accepted: Legal name of a charity not mentioned on any external websites</span><br><br>
                If the relationship between your company and the brand is not obvious, indicate the relationship using "by [company name]".<br><br>
                <span class="accepted">Accepted: Fruit Snacks by Fresh Produce (Note that in this example, Fresh Produce is the parent company of the Fruit Snacks brand and their association is clearly mentioned on their external websites)</span><br><br>
                <span class="not-accepted">Not accepted: Fruit Snacks (Fresh Produce owns the Fruit Snacks brand but their association is not mentioned on any external websites)</span><br><br>
                If the display name represents a business that the company is working with (if the business is an agency, distributor, partner or parent company), then the relationship between the business represented in the display name and end-client business must be evident and clear in your business website.<br><br>
                For example, if Global Voyager signs up for WhatsApp and wants to use the display name Commercial Air, they must submit a link to a website page stating that Commercial Air is a subsidiary of Global Voyager.<br><br>
                A display name must also have consistent branding with external sources, such as a company's website or marketing, or with the company's verified legal name. Examples of what is and isn't acceptable are below:<br><br>
                <span class="accepted">Accepted: Fresh Produce Cold Pressed Juices (how it is branded on your website).</span><br>
                <span class="accepted">Accepted: Fresh Produce Cold Pressed Juices Mexico.</span><br>
                <span class="accepted">Accepted: Fresh Produce Juices - Jessica</span><br>
                <span class="accepted">Accepted: Fresh Produce Juices</span><br>
                <span class="accepted">Accepted: FP Cold Pressed Juices (you added an abbreviation to the company name)</span><br>
                <span class="accepted">Accepted: FPCP Juices</span><br>
                <span class="accepted">Accepted: XY Fresh Cold Pressed Juices Service New York</span><br><br>
                <span class="not-accepted">Not accepted: Digital Cloud Solutions (this can't be found anywhere on external sources such as on your website)</span><br>
                <span class="not-accepted">Not accepted: Juice (this is a generic term)</span>
                </td>
            </tr>
        </tbody>
    </table>
</body>
</html>
    `;
    
    const blob = new Blob([guidelinesHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Clean up the URL after a delay to free memory
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const resetContactForm = () => {
    setContactFirstName('');
    setContactLastName('');
    setContactPhones([{ phone: '', type: 'MOBILE', countryCode: 'IN', dialCode: '+91' }]);
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

  // Helper function to get dial code from country code
  const getDialCodeFromCountry = (countryCode) => {
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
    return countryDialCodes[countryCode] || '+1';
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
    setContactPhones([...contactPhones, { phone: '', type: 'MOBILE', countryCode: 'IN', dialCode: '+91' }]);
  };

  const removePhone = (index) => {
    setContactPhones(contactPhones.filter((_, i) => i !== index));
  };

  const updatePhone = (index, field, value) => {
    const newPhones = [...contactPhones];
    newPhones[index] = { ...newPhones[index], [field]: value };
    
    // If country code changes, update dial code
    if (field === 'countryCode') {
      newPhones[index].dialCode = getDialCodeFromCountry(value);
    }
    
    setContactPhones(newPhones);
  };

  // Contact utility functions
  const getContactDisplayName = (contact) => {
    const contactData = contact.contact_data || {};
    const name = contactData.name || {};
    if (name.first_name || name.last_name) {
      return `${name.first_name || ''} ${name.last_name || ''}`.trim() || name.formatted_name || 'No Name';
    }
    if (name.formatted_name) {
      return name.formatted_name;
    }
    if (contactData.phones && contactData.phones.length > 0) {
      return contactData.phones[0].phone || 'Unknown';
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

  // Fetch contacts data
  const fetchContacts = async () => {
    const dbId = userData?.db_id || user?.db_id;
    if (!dbId) {
      console.log('⚠️ No db_id found, cannot fetch contacts');
      return;
    }

    setContactsLoading(true);
    setContactsError(null);
    try {
      const apiUrl = apiConfig.endpoints.contacts.getUserContacts(dbId);
      
      console.log('🌐 [Fetch Contacts] Calling API:', apiUrl);

      const token = localStorage.getItem('authToken');
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch contacts: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [Fetch Contacts] Contacts fetched successfully:', result);

      if (result.success && result.data) {
        setContacts(result.data);
        setContactsPagination(prev => ({
          ...prev,
          total: result.data.length
        }));
      } else {
        setContacts([]);
        setContactsPagination(prev => ({
          ...prev,
          total: 0
        }));
      }
    } catch (error) {
      console.error('❌ [Fetch Contacts] Error:', error);
      setContactsError(error.message || 'Failed to fetch contacts');
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  };

  // Fetch contacts when contacts tab is active
  useEffect(() => {
    if (activeTab !== 'contacts') {
      return;
    }

    fetchContacts();
  }, [activeTab, userData, user]);

  // Contact handlers
  const handleAddContact = async (e) => {
    e.preventDefault();
    
    setIsSubmittingContact(true);
    setContactError('');
    setContactSuccess('');
    
    try {
      // Validate required fields
      if (!contactFirstName || !contactPhones[0]?.phone) {
        throw new Error('First name and phone number are required');
      }

      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
      if (!dbServerUrl) {
        throw new Error('Server configuration error.');
      }

      // Build contact data structure
      const contactData = {
        name: {
          first_name: contactFirstName,
          last_name: contactLastName || '',
          formatted_name: `${contactFirstName} ${contactLastName || ''}`.trim()
        },
        phones: contactPhones.filter(p => p.phone).map(p => ({
          phone: p.dialCode ? `${p.dialCode} ${p.phone}`.trim() : p.phone,
          type: p.type || 'MOBILE'
        })),
        emails: contactEmail ? [{
          email: contactEmail,
          type: contactEmailType || 'WORK'
        }] : [],
        addresses: contactAddresses.filter(addr => addr.street || addr.city),
        org: {
          company: contactCompany || '',
          department: contactDepartment || '',
          title: contactTitle || ''
        },
        urls: contactUrl ? [{
          url: contactUrl,
          type: contactUrlType || 'WORK'
        }] : [],
        birthday: contactBirthday || '',
        lead_stage: contactLeadStage || 'NEW'
      };

      const apiUrl = apiConfig.endpoints.contacts.createContact();
      
      console.log('🌐 [Add Contact] Calling API:', apiUrl);
      console.log('📤 [Add Contact] Request data:', {
        user_id: userData?.db_id || user?.db_id,
        contact_data: contactData
      });

      const token = localStorage.getItem('authToken');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          user_id: userData?.db_id || user?.db_id,
          contact_data: contactData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to add contact: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [Add Contact] Contact added successfully:', result);

      setContactSuccess('Contact added successfully');
      resetContactForm();
      setIsAddContactModalOpen(false);
      
      // Refresh contacts list
      await fetchContacts();
    } catch (error) {
      console.error('❌ [Add Contact] Error:', error);
      setContactError(error.message || 'Failed to add contact');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleUpdateContact = async (e) => {
    e.preventDefault();
    
    if (!editingContactId) return;
    
    setIsSubmittingContact(true);
    setContactError('');
    setContactSuccess('');
    
    try {
      // Validate required fields
      if (!contactFirstName || !contactPhones[0]?.phone) {
        throw new Error('First name and phone number are required');
      }

      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
      if (!dbServerUrl) {
        throw new Error('Server configuration error.');
      }

      // Build contact data structure
      const contactData = {
        name: {
          first_name: contactFirstName,
          last_name: contactLastName || '',
          formatted_name: `${contactFirstName} ${contactLastName || ''}`.trim()
        },
        phones: contactPhones.filter(p => p.phone).map(p => ({
          phone: p.dialCode ? `${p.dialCode} ${p.phone}`.trim() : p.phone,
          type: p.type || 'MOBILE'
        })),
        emails: contactEmail ? [{
          email: contactEmail,
          type: contactEmailType || 'WORK'
        }] : [],
        addresses: contactAddresses.filter(addr => addr.street || addr.city),
        org: {
          company: contactCompany || '',
          department: contactDepartment || '',
          title: contactTitle || ''
        },
        urls: contactUrl ? [{
          url: contactUrl,
          type: contactUrlType || 'WORK'
        }] : [],
        birthday: contactBirthday || '',
        lead_stage: contactLeadStage || 'NEW'
      };

      const apiUrl = apiConfig.endpoints.contacts.updateContact(editingContactId);
      
      console.log('🌐 [Update Contact] Calling API:', apiUrl);
      console.log('📤 [Update Contact] Request data:', {
        contact_data: contactData
      });

      const token = localStorage.getItem('authToken');
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          contact_data: contactData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update contact: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [Update Contact] Contact updated successfully:', result);

      setContactSuccess('Contact updated successfully');
      resetContactForm();
      setIsEditContactModalOpen(false);
      
      // Refresh contacts list
      await fetchContacts();
    } catch (error) {
      console.error('❌ [Update Contact] Error:', error);
      setContactError(error.message || 'Failed to update contact');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleEditContact = (contact) => {
    const contactData = contact.contact_data || {};
    const name = contactData.name || {};
    const phones = contactData.phones || [];
    const emails = contactData.emails || [];
    const addresses = contactData.addresses || [];
    const org = contactData.org || {};
    const urls = contactData.urls || [];
    
    // Parse phone numbers to extract country code and dial code
    const parsedPhones = phones.length > 0 ? phones.map(phoneObj => {
      const phoneNumber = phoneObj.phone || '';
      let phone = phoneNumber;
      let countryCode = 'IN';
      let dialCode = '+91';
      
      // Try to extract dial code from phone number
      if (phoneNumber.startsWith('+')) {
        // Find matching dial code
        const dialCodes = {
          '+91': 'IN', '+1': 'US', '+44': 'GB', '+61': 'AU', '+49': 'DE',
          '+33': 'FR', '+39': 'IT', '+34': 'ES', '+55': 'BR', '+52': 'MX',
          '+81': 'JP', '+86': 'CN', '+82': 'KR', '+65': 'SG', '+60': 'MY',
          '+66': 'TH', '+62': 'ID', '+63': 'PH', '+84': 'VN', '+852': 'HK',
          '+886': 'TW', '+64': 'NZ', '+971': 'AE', '+966': 'SA', '+27': 'ZA',
          '+7': 'RU', '+92': 'PK', '+880': 'BD', '+94': 'LK', '+977': 'NP', '+95': 'MM'
        };
        
        // Check for longer dial codes first (like +852, +886, +880, +977)
        const sortedCodes = Object.keys(dialCodes).sort((a, b) => b.length - a.length);
        for (const code of sortedCodes) {
          if (phoneNumber.startsWith(code)) {
            dialCode = code;
            countryCode = dialCodes[code];
            phone = phoneNumber.substring(code.length).trim();
            break;
          }
        }
      }
      
      return {
        phone: phone,
        type: phoneObj.type || 'MOBILE',
        countryCode: countryCode,
        dialCode: dialCode
      };
    }) : [{ phone: '', type: 'MOBILE', countryCode: 'IN', dialCode: '+91' }];
    
    setEditingContactId(contact.contact_id);
    setContactFirstName(name.first_name || '');
    setContactLastName(name.last_name || '');
    setContactPhones(parsedPhones);
    setContactEmail(emails.length > 0 ? emails[0].email || '' : '');
    setContactEmailType(emails.length > 0 ? emails[0].type || 'WORK' : 'WORK');
    setContactAddresses(addresses.length > 0 ? addresses : []);
    setContactCompany(org.company || '');
    setContactDepartment(org.department || '');
    setContactTitle(org.title || '');
    setContactUrl(urls.length > 0 ? urls[0].url || '' : '');
    setContactUrlType(urls.length > 0 ? urls[0].type || 'WORK' : 'WORK');
    setContactBirthday(contactData.birthday || '');
    setContactLeadStage(contactData.lead_stage || '');
    setIsEditContactModalOpen(true);
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
      if (!dbServerUrl) {
        throw new Error('Server configuration error.');
      }

      const apiUrl = apiConfig.endpoints.contacts.deleteContact(contactId);
      
      console.log('🌐 [Delete Contact] Calling API:', apiUrl);

      const token = localStorage.getItem('authToken');
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete contact: ${response.status} ${response.statusText}`);
      }

      console.log('✅ [Delete Contact] Contact deleted successfully');

      // Refresh contacts list
      await fetchContacts();
    } catch (error) {
      console.error('❌ [Delete Contact] Error:', error);
      alert(`Failed to delete contact: ${error.message}`);
    }
  };

  const handleQuickUpdateLeadStage = async (contactId, newStage) => {
    setUpdatingLeadStage({ [contactId]: true });
    try {
      // Find the contact to update
      const contact = contacts.find(c => c.contact_id === contactId);
      if (!contact) {
        throw new Error('Contact not found');
      }

      const contactData = contact.contact_data || {};
      const updatedContactData = {
        ...contactData,
        lead_stage: newStage
      };

      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
      if (!dbServerUrl) {
        throw new Error('Server configuration error.');
      }

      const apiUrl = apiConfig.endpoints.contacts.updateContact(contactId);
      
      console.log('🌐 [Update Lead Stage] Calling API:', apiUrl);

      const token = localStorage.getItem('authToken');
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          contact_data: updatedContactData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update lead stage: ${response.status} ${response.statusText}`);
      }

      console.log('✅ [Update Lead Stage] Lead stage updated successfully');

      // Update local state
      setContacts(prevContacts => 
        prevContacts.map(c => 
          c.contact_id === contactId 
            ? { ...c, contact_data: updatedContactData }
            : c
        )
      );
    } catch (error) {
      console.error('❌ [Update Lead Stage] Error:', error);
      alert(`Failed to update lead stage: ${error.message}`);
    } finally {
      setUpdatingLeadStage(prev => {
        const newState = { ...prev };
        delete newState[contactId];
        return Object.keys(newState).length > 0 ? newState : null;
      });
    }
  };

  const handleExportCsv = () => {
    try {
      if (contacts.length === 0) {
        alert('No contacts to export');
        return;
      }

      // Create CSV header
      const headers = ['Name', 'First Name', 'Last Name', 'Phone', 'Email', 'Company', 'Title', 'Lead Stage', 'Source'];
      
      // Create CSV rows
      const rows = contacts.map(contact => {
        const contactData = contact.contact_data || {};
        const name = contactData.name || {};
        const phones = contactData.phones || [];
        const emails = contactData.emails || [];
        const org = contactData.org || {};
        const primaryPhone = phones[0]?.phone || '';
        const primaryEmail = emails[0]?.email || '';
        const displayName = name.formatted_name || `${name.first_name || ''} ${name.last_name || ''}`.trim() || 'No Name';
        
        return [
          displayName,
          name.first_name || '',
          name.last_name || '',
          primaryPhone,
          primaryEmail,
          org.company || '',
          org.title || '',
          contactData.lead_stage || '',
          'NimbleAI'
        ];
      });

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `contacts_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ [Export CSV] Contacts exported successfully');
    } catch (error) {
      console.error('❌ [Export CSV] Error:', error);
      alert('Failed to export contacts. Please try again.');
    }
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
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          
          // Simple CSV parser - handles quoted fields and commas
          const parseCSV = (csvText) => {
            const lines = csvText.split('\n').filter(line => line.trim());
            if (lines.length === 0) {
              return { headers: [], rows: [] };
            }

            // Parse first line as headers
            const headers = parseCSVLine(lines[0]);
            
            // Parse remaining lines as data rows
            const rows = lines.slice(1)
              .map(line => parseCSVLine(line))
              .filter(row => row.some(cell => cell.trim())); // Filter out empty rows

            return { headers, rows };
          };

          // Helper function to parse a CSV line, handling quoted fields
          const parseCSVLine = (line) => {
            const result = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              const nextChar = line[i + 1];

              if (char === '"') {
                if (inQuotes && nextChar === '"') {
                  // Escaped quote
                  current += '"';
                  i++; // Skip next quote
                } else {
                  // Toggle quote state
                  inQuotes = !inQuotes;
                }
              } else if (char === ',' && !inQuotes) {
                // End of field
                result.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            
            // Add last field
            result.push(current.trim());
            
            return result;
          };

          const { headers, rows } = parseCSV(text);
          
          if (headers.length === 0) {
            throw new Error('CSV file appears to be empty or invalid');
          }

          // Update state
          setCsvHeaders(headers);
          setCsvRows(rows);
          setCsvParseError('');
          
          // Auto-map known fields if headers match
          const autoMapping = {};
          headers.forEach((header, index) => {
            const lowerHeader = header.toLowerCase().trim();
            knownFields.forEach(field => {
              const fieldVariations = getFieldVariations(field);
              if (fieldVariations.some(variation => lowerHeader.includes(variation) || variation.includes(lowerHeader))) {
                autoMapping[field] = index;
              }
            });
          });
          setMapping(autoMapping);

          console.log('✅ [CSV Import] File parsed successfully:', { headers, rowCount: rows.length });
          resolve({ headers, rows });
        } catch (error) {
          console.error('❌ [CSV Import] Parse error:', error);
          setCsvParseError(error.message || 'Failed to parse CSV file');
          setCsvHeaders([]);
          setCsvRows([]);
          reject(error);
        }
      };

      reader.onerror = () => {
        const error = new Error('Failed to read file');
        setCsvParseError(error.message);
        reject(error);
      };

      reader.readAsText(file);
    });
  };

  // Helper function to get field name variations for auto-mapping
  const getFieldVariations = (field) => {
    const variations = {
      'first_name': ['first name', 'firstname', 'fname', 'given name', 'first'],
      'last_name': ['last name', 'lastname', 'lname', 'surname', 'family name', 'last'],
      'phone': ['phone', 'mobile', 'cell', 'telephone', 'tel', 'number'],
      'email': ['email', 'e-mail', 'mail'],
      'company': ['company', 'organization', 'org', 'business'],
      'title': ['title', 'job title', 'position', 'role'],
      'address': ['address', 'street', 'location'],
      'city': ['city'],
      'state': ['state', 'province'],
      'zip': ['zip', 'postal code', 'postcode', 'zip code'],
      'country': ['country'],
      'birthday': ['birthday', 'birth date', 'dob', 'date of birth'],
      'lead_stage': ['lead stage', 'stage', 'status', 'lead status']
    };
    return variations[field] || [field];
  };

  const recomputePreview = () => {
    try {
      if (csvRows.length === 0) {
        setImportPreview([]);
        return;
      }

      // Generate preview based on mapping
      const preview = csvRows.slice(0, 5).map((row, rowIndex) => {
        const previewItem = {};
        
        // Map each known field to its CSV column value
        knownFields.forEach(field => {
          const csvColumnIndex = mapping[field];
          if (csvColumnIndex !== undefined && csvColumnIndex !== null && csvColumnIndex >= 0) {
            previewItem[field] = row[csvColumnIndex] || '';
          } else {
            previewItem[field] = '';
          }
        });

        return previewItem;
      });

      setImportPreview(preview);
      console.log('✅ [CSV Import] Preview recomputed:', preview);
    } catch (error) {
      console.error('❌ [CSV Import] Preview error:', error);
      setImportPreview([]);
    }
  };

  const handleChangeMapping = (field, csvColumn) => {
    setMapping({ ...mapping, [field]: csvColumn });
  };

  const handleStartImport = async () => {
    if (csvRows.length === 0) {
      alert('No contacts to import');
      return;
    }

    setIsImporting(true);
    setImportProgress({ success: 0, failed: 0, total: csvRows.length });
    setImportResults(null);
    
    try {
      const dbId = userData?.db_id || user?.db_id;
      if (!dbId) {
        throw new Error('User ID not found');
      }

      const token = localStorage.getItem('authToken');
      let successCount = 0;
      let failedCount = 0;

      // Import contacts one by one
      for (let i = 0; i < csvRows.length; i++) {
        const row = csvRows[i];
        
        try {
          // Build contact data from mapped row
          const contactData = {
            name: {
              first_name: mapping.first_name !== undefined ? (row[mapping.first_name] || '') : '',
              last_name: mapping.last_name !== undefined ? (row[mapping.last_name] || '') : '',
              formatted_name: ''
            },
            phones: [],
            emails: [],
            org: {},
            lead_stage: mapping.lead_stage !== undefined ? (row[mapping.lead_stage] || 'NEW') : 'NEW'
          };

          // Set formatted name
          const firstName = contactData.name.first_name;
          const lastName = contactData.name.last_name;
          contactData.name.formatted_name = `${firstName} ${lastName}`.trim() || 'No Name';

          // Add phone if mapped
          if (mapping.phone !== undefined && row[mapping.phone]) {
            contactData.phones.push({
              phone: row[mapping.phone],
              type: 'MOBILE'
            });
          }

          // Add email if mapped
          if (mapping.email !== undefined && row[mapping.email]) {
            contactData.emails.push({
              email: row[mapping.email],
              type: 'WORK'
            });
          }

          // Add company/title if mapped
          if (mapping.company !== undefined && row[mapping.company]) {
            contactData.org.company = row[mapping.company];
          }
          if (mapping.title !== undefined && row[mapping.title]) {
            contactData.org.title = row[mapping.title];
          }

          // Validate required fields
          if (!contactData.name.first_name || contactData.phones.length === 0) {
            throw new Error('Missing required fields: first name and phone');
          }

          // Make API call to create contact
          const apiUrl = apiConfig.endpoints.contacts.createContact();
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({
              user_id: dbId,
              contact_data: contactData
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to import contact: ${response.status}`);
          }

          successCount++;
    } catch (error) {
          console.error(`❌ [CSV Import] Failed to import row ${i + 1}:`, error);
          failedCount++;
        }

        // Update progress
        setImportProgress({
          success: successCount,
          failed: failedCount,
          total: csvRows.length
        });
      }

      setImportResults({
        success: true,
        imported: successCount,
        failed: failedCount,
        total: csvRows.length
      });

      // Refresh contacts list
      await fetchContacts();

      console.log(`✅ [CSV Import] Import completed: ${successCount} successful, ${failedCount} failed`);

      // Show confirmation and close modal after a short delay
      setTimeout(() => {
        // Reset form state
        setCsvHeaders([]);
        setCsvRows([]);
        setMapping({});
        setCsvParseError('');
        setImportPreview([]);
        setImportProgress({ success: 0, failed: 0, total: 0 });
        setImportResults(null);
        // Close modal
        setIsImportModalOpen(false);
      }, 2000); // 2 second delay to show confirmation message
    } catch (error) {
      console.error('❌ [CSV Import] Import error:', error);
      setImportResults({
        success: false,
        error: error.message,
        imported: importProgress.success,
        failed: importProgress.failed
      });
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
  const checkWelcomeModal = useCallback(async () => {
    if (!user || !userData) return;
    
    try {
      const dbId = userData?.db_id || user?.db_id;
      if (!dbId) {
        console.log('⚠️ No db_id found, cannot check welcome modal');
        return;
      }

      // Call DB Server API to check if user exists
      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
      if (!dbServerUrl) {
        console.error('❌ DB Server URL is not configured!');
        return;
      }
      
      const url = `${dbServerUrl}/api/users/${dbId}`;
      
      console.log('🌐 Checking user existence for welcome modal:', url);
      console.log('🌐 dbId:', dbId);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log('🌐 Check Welcome Modal API Response status :', response.status);
        //throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ User check response for welcome modal:', result);

      // If user exists (success: true with data), don't show welcome banner
      // If user not found (success: false with error "User not found"), show welcome banner
      // BUT skip welcome modal if user came from an invitation link
      const invitationToken = sessionStorage.getItem('invitationToken');
      const shouldShowWelcome = result.success === false && result.error === 'User not found' && !invitationToken;
      
      console.log('🎯 Welcome modal decision:', {
        shouldShowWelcome,
        success: result.success,
        hasData: !!result.data,
        error: result.error,
        hasInvitationToken: !!invitationToken
      });
      
      // Only show welcome modal if user not found AND no invitation token AND modal is not already open AND not currently submitting
      if (shouldShowWelcome && !isWelcomeModalOpen && !isSubmittingWelcome) {
        // Set default country and dial code when opening modal
        if (!welcomeCountry) {
          setWelcomeCountry('IN');
          setWelcomeDialCode('+91');
        }
        setIsWelcomeModalOpen(true);
      }
      
      // Clear invitation token after checking (whether welcome modal is shown or not)
      // This ensures invited users skip the welcome modal
      if (invitationToken) {
        console.log('✅ Clearing invitation token after welcome modal check');
        sessionStorage.removeItem('invitationToken');
        sessionStorage.removeItem('invitationEmail');
      }
    } catch (error) {
      console.error('❌ Error checking user for welcome modal:', error);
      // On error, default to not showing the welcome modal
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
      
      console.log('🌐 API Response status :', response.status);

      if (!response.ok) {
        console.log('🌐 API Response status :', response.status);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ WABA check response:', result);

      if (result.success && result.data) {
        const wabaDetails = result.data.waba_details || {};
        
        // Check if waba_details is an empty object
        const isEmpty = Object.keys(wabaDetails).length === 0;
        setIsWabaDetailsEmpty(isEmpty);
        
        if (isEmpty) {
          console.log('📋 waba_details is empty, navigating to channels and showing WABA modal');
          setUserName(result.data.username || userData?.username || user?.displayName || 'User');
          // Navigate to channels tab and select WhatsApp
          setActiveTab('channels');
          setActiveChannel('whatsapp');
          // Show WABA modal
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

  // Check WABA details when WhatsApp channel is selected in channels tab
  useEffect(() => {
    if (activeTab === 'channels' && activeChannel === 'whatsapp' && !isWabaModalOpen && user && userData && !isCheckingWaba && isWabaDetailsEmpty) {
      console.log('🔍 WhatsApp channel selected, checking WABA details...');
      checkWabaDetails();
    }
  }, [activeTab, activeChannel, isWabaModalOpen, user, userData, isCheckingWaba, isWabaDetailsEmpty, checkWabaDetails]);

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
              <div className="rounded-lg shadow-lg flex flex-col bg-white" style={{ height: 'calc(100vh - 64px)' }}>
                {/* Top Navigation Tabs */}
                <div className="border-b border-gray-200 flex-shrink-0">
                  <div className="flex items-center gap-2 px-6 py-3">
                    <button 
                      onClick={() => setBroadcastView('new-broadcast')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        broadcastView === 'new-broadcast' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-300' 
                          : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      New Broadcast
                    </button>
                    {/* Templates button with dropdown */}
                    <div 
                      className="relative"
                      onMouseEnter={() => setShowTemplatesDropdown(true)}
                      onMouseLeave={() => setShowTemplatesDropdown(false)}
                    >
                    <button 
                        onClick={() => {
                          setBroadcastView('templates');
                          setTemplateSubView('template-library'); // Default to template library
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        broadcastView === 'templates' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-300' 
                            : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      Templates
                    </button>
                      {/* Dropdown menu */}
                      {showTemplatesDropdown && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]">
                          <button
                            onClick={() => {
                              setBroadcastView('templates');
                              setTemplateSubView('template-library');
                              setShowTemplatesDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                              broadcastView === 'templates' && templateSubView === 'template-library'
                                ? 'bg-blue-50 text-blue-700' 
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            Template library
                          </button>
                          <button
                            onClick={() => {
                              setBroadcastView('templates');
                              setTemplateSubView('your-templates');
                              setShowTemplatesDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm font-medium rounded-b-lg transition-colors ${
                              broadcastView === 'templates' && templateSubView === 'your-templates'
                                ? 'bg-blue-50 text-blue-700' 
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            Your templates
                          </button>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => setBroadcastView('analytics')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        broadcastView === 'analytics' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-300' 
                          : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      Analytics
                    </button>
                    <button 
                      onClick={() => setBroadcastView('scheduled-broadcasts')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        broadcastView === 'scheduled-broadcasts' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-300' 
                          : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      Scheduled Broadcasts
                    </button>
                  </div>
                </div>
                {/* Content Area */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {broadcastView === 'templates' && (
                      <div className="space-y-6">
                        {templateSubView === 'template-library' ? (
                          selectedTemplate ? (
                            // Show template form when a template is selected
                            <div className="space-y-6">
                              {/* Back button and header */}
                              <div className="flex items-center justify-between mb-6">
                                <button
                                  onClick={() => {
                                    setSelectedTemplate(null);
                                    setTemplateName('');
                                    setTemplateCategory('');
                                    setTemplateLanguage('English');
                                    setTemplateBody('');
                                    setTemplateFooter('');
                                    setTemplateSampleContent('');
                                    setTemplateButtons('');
                                    setBroadcastTitleType('none');
                                    setBroadcastTitleText('');
                                    setBroadcastTitleImageLink('');
                                    setBroadcastTitleVideoLink('');
                                    setBroadcastTitleDocumentLink('');
                                    setBroadcastTitleImageFile(null);
                                    setBroadcastTitleVideoFile(null);
                                    setBroadcastTitleDocumentFile(null);
                                    setBroadcastTitleError('');
                                  }}
                                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                                >
                                  <ArrowLeftIcon className="h-5 w-5" />
                                  <span>New Templates</span>
                                </button>
                                
                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-3">
                                  <button
                                    type="button"
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                                    onClick={() => {
                                      setSelectedTemplate(null);
                                      setTemplateName('');
                                      setTemplateCategory('');
                                      setTemplateLanguage('English');
                                      setTemplateBody('');
                                      setTemplateFooter('');
                                      setTemplateSampleContent('');
                                      setTemplateButtons('');
                                      setBroadcastTitleType('none');
                                      setBroadcastTitleText('');
                                      setBroadcastTitleImageLink('');
                                      setBroadcastTitleVideoLink('');
                                      setBroadcastTitleDocumentLink('');
                                      setBroadcastTitleImageFile(null);
                                      setBroadcastTitleVideoFile(null);
                                      setBroadcastTitleDocumentFile(null);
                                      setBroadcastTitleError('');
                                    }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                                    onClick={() => {
                                      // Handle save as draft
                                      console.log('Template saved as draft:', {
                                        templateName,
                                        templateCategory,
                                        templateLanguage,
                                        templateBody,
                                        templateFooter,
                                        templateButtons,
                                        templateSampleContent
                                      });
                                      // Don't reset form, just save as draft
                                    }}
                                  >
                                    Save as draft
                                  </button>
                                  <button
                                    type="button"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                                    onClick={() => {
                                      // Handle form submission here
                                      console.log('Template form submitted:', {
                                        templateName,
                                        templateCategory,
                                        templateLanguage,
                                        templateBody,
                                        templateFooter,
                                        templateButtons,
                                        templateSampleContent
                                      });
                                      // Reset form after submission
                                      setSelectedTemplate(null);
                                      setTemplateName('');
                                      setTemplateCategory('');
                                      setTemplateLanguage('English');
                                      setTemplateBody('');
                                      setTemplateFooter('');
                                      setTemplateSampleContent('');
                                      setTemplateButtons('');
                                      setBroadcastTitleType('none');
                                      setBroadcastTitleText('');
                                      setBroadcastTitleImageLink('');
                                      setBroadcastTitleVideoLink('');
                                      setBroadcastTitleDocumentLink('');
                                      setBroadcastTitleImageFile(null);
                                      setBroadcastTitleVideoFile(null);
                                      setBroadcastTitleDocumentFile(null);
                                      setBroadcastTitleError('');
                                    }}
                                  >
                                    Save and submit
                                </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column - Form */}
                                <div className="space-y-6">
                                  {/* Template Name, Category, and Language in a single row */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Template Name */}
                                    <div className="flex flex-col">
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Template Name
                                      </label>
                                      <input
                                        type="text"
                                        value={templateName}
                                        onChange={(e) => {
                                          let value = e.target.value;
                                          // Convert spaces to underscores
                                          value = value.replace(/\s/g, '_');
                                          // Only allow lowercase alphanumeric characters and underscores
                                          value = value.replace(/[^a-z0-9_]/g, '');
                                          // Limit to 512 characters
                                          if (value.length <= 512) {
                                            setTemplateName(value);
                                          }
                                        }}
                                        maxLength={512}
                                        className="w-full h-8 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
                                        placeholder="Template Name"
                                      />
                                      <p className="text-xs text-gray-500 mt-1">
                                        Only lowercase alphanumeric characters and underscores, up to 512 characters
                                      </p>
                                    </div>

                                    {/* Category */}
                                    <div className="flex flex-col">
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category
                                      </label>
                                      <select
                                        value={templateCategory}
                                        onChange={(e) => setTemplateCategory(e.target.value)}
                                        className="w-full h-8  px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
                                      >
                                        <option value="">Select Category</option>
                                        <option value="Authentication">Authentication</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Utility">Utility</option>
                                      </select>
                                    </div>

                                    {/* Language */}
                                    <div className="flex flex-col">
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Language
                                      </label>
                                      <select
                                        value={templateLanguage}
                                        onChange={(e) => setTemplateLanguage(e.target.value)}
                                        className="w-full h-8  px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
                                      >
                                        <option value="English">English</option>
                                        <option value="Spanish">Spanish</option>
                                        <option value="French">French</option>
                                        <option value="German">German</option>
                                        <option value="Hindi">Hindi</option>
                                        <option value="Other">Other</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Broadcast Title */}
                                  <div>
                                    <div className="mb-2">
                                      <label className="block text-sm font-medium text-gray-700">
                                        Broadcast title (Optional)
                                      </label>
                                      <p className="text-xs text-gray-600 mt-1">
                                        Highlight your brand by using the images, videos or documents.
                                      </p>
                                    </div>
                                    
                                    {/* Radio Buttons */}
                                    <div className="flex flex-wrap gap-4 mb-4">
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name="broadcastTitleType"
                                          value="none"
                                          checked={broadcastTitleType === 'none'}
                                          onChange={(e) => {
                                            setBroadcastTitleType(e.target.value);
                                            setBroadcastTitleError('');
                                          }}
                                          className="mr-2"
                                        />
                                        <span className="text-sm text-gray-700">None</span>
                                      </label>
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name="broadcastTitleType"
                                          value="text"
                                          checked={broadcastTitleType === 'text'}
                                          onChange={(e) => {
                                            setBroadcastTitleType(e.target.value);
                                            setBroadcastTitleError('');
                                          }}
                                          className="mr-2"
                                        />
                                        <span className="text-sm text-gray-700">Text</span>
                                      </label>
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name="broadcastTitleType"
                                          value="image"
                                          checked={broadcastTitleType === 'image'}
                                          onChange={(e) => {
                                            setBroadcastTitleType(e.target.value);
                                            setBroadcastTitleError('');
                                          }}
                                          className="mr-2"
                                        />
                                        <span className="text-sm text-gray-700">Image</span>
                                      </label>
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name="broadcastTitleType"
                                          value="video"
                                          checked={broadcastTitleType === 'video'}
                                          onChange={(e) => {
                                            setBroadcastTitleType(e.target.value);
                                            setBroadcastTitleError('');
                                          }}
                                          className="mr-2"
                                        />
                                        <span className="text-sm text-gray-700">Video</span>
                                      </label>
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name="broadcastTitleType"
                                          value="document"
                                          checked={broadcastTitleType === 'document'}
                                          onChange={(e) => {
                                            setBroadcastTitleType(e.target.value);
                                            setBroadcastTitleError('');
                                          }}
                                          className="mr-2"
                                        />
                                        <span className="text-sm text-gray-700">Document</span>
                                      </label>
                                    </div>

                                    {/* Text Input */}
                                    {broadcastTitleType === 'text' && (
                                      <div className="mb-4">
                                        <div className="relative">
                                          <input
                                            type="text"
                                            value={broadcastTitleText}
                                            onChange={(e) => {
                                              if (e.target.value.length <= 60) {
                                                setBroadcastTitleText(e.target.value);
                                              }
                                            }}
                                            maxLength={60}
                                            className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter broadcast title text"
                                          />
                                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                                            {broadcastTitleText.length}/60
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Image Input */}
                                    {broadcastTitleType === 'image' && (
                                      <div className="mb-4">
                                        <div className="flex gap-2 items-center">
                                          <input
                                            type="text"
                                            value={broadcastTitleImageLink}
                                            onChange={(e) => {
                                              setBroadcastTitleImageLink(e.target.value);
                                              setBroadcastTitleError('');
                                            }}
                                            onBlur={(e) => {
                                              const link = e.target.value.trim();
                                              if (link) {
                                                const lowerLink = link.toLowerCase();
                                                const validExtensions = ['.jpeg', '.png'];
                                                const hasValidExtension = validExtensions.some(ext => lowerLink.endsWith(ext));
                                                if (!hasValidExtension) {
                                                  setBroadcastTitleError('Please paste a valid image link (must end with .jpeg or .png)');
                                                } else {
                                                  setBroadcastTitleError('');
                                                }
                                              }
                                            }}
                                            placeholder="Paste image link"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          />
                                          <span className="text-sm text-gray-500 flex-shrink-0">Or</span>
                                          <label className="flex-shrink-0">
                                            <input
                                              type="file"
                                              accept="image/jpeg,image/png"
                                              onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                  const fileName = file.name.toLowerCase();
                                                  const validExtensions = ['.jpeg', '.png'];
                                                  const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
                                                  
                                                  if (!hasValidExtension) {
                                                    setBroadcastTitleError('Please upload a valid image file (must be .jpeg or .png)');
                                                    setBroadcastTitleImageFile(null);
                                                  } else {
                                                    setBroadcastTitleImageFile(file);
                                                    setBroadcastTitleImageLink('');
                                                    setBroadcastTitleError('');
                                                  }
                                                }
                                              }}
                                              className="hidden"
                                            />
                                            <span className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 cursor-pointer inline-block text-sm whitespace-nowrap">
                                              Upload image
                                            </span>
                                          </label>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Valid formats: JPEG, PNG</p>
                                        {broadcastTitleError && broadcastTitleType === 'image' && (
                                          <p className="text-xs text-red-600 mt-1">{broadcastTitleError}</p>
                                        )}
                                      </div>
                                    )}

                                    {/* Video Input */}
                                    {broadcastTitleType === 'video' && (
                                      <div className="mb-4">
                                        <div className="flex gap-2 items-center">
                                          <input
                                            type="text"
                                            value={broadcastTitleVideoLink}
                                            onChange={(e) => {
                                              setBroadcastTitleVideoLink(e.target.value);
                                              setBroadcastTitleError('');
                                            }}
                                            onBlur={(e) => {
                                              const link = e.target.value.trim();
                                              if (link && !link.toLowerCase().endsWith('.mp4')) {
                                                setBroadcastTitleError('Please paste a valid video link (must end with .mp4)');
                                              } else {
                                                setBroadcastTitleError('');
                                              }
                                            }}
                                            placeholder="Paste video link"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          />
                                          <span className="text-sm text-gray-500 flex-shrink-0">Or</span>
                                          <label className="flex-shrink-0">
                                            <input
                                              type="file"
                                              accept="video/mp4"
                                              onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                  const fileName = file.name.toLowerCase();
                                                  
                                                  if (!fileName.endsWith('.mp4')) {
                                                    setBroadcastTitleError('Please upload a valid video file (must be .mp4)');
                                                    setBroadcastTitleVideoFile(null);
                                                  } else {
                                                    setBroadcastTitleVideoFile(file);
                                                    setBroadcastTitleVideoLink('');
                                                    setBroadcastTitleError('');
                                                  }
                                                }
                                              }}
                                              className="hidden"
                                            />
                                            <span className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 cursor-pointer inline-block text-sm whitespace-nowrap">
                                              Upload video
                                            </span>
                                          </label>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Valid formats: MP4</p>
                                        {broadcastTitleError && broadcastTitleType === 'video' && (
                                          <p className="text-xs text-red-600 mt-1">{broadcastTitleError}</p>
                                        )}
                                      </div>
                                    )}

                                    {/* Document Input */}
                                    {broadcastTitleType === 'document' && (
                                      <div className="mb-4">
                                        <div className="flex gap-2 items-center">
                                          <input
                                            type="text"
                                            value={broadcastTitleDocumentLink}
                                            onChange={(e) => {
                                              setBroadcastTitleDocumentLink(e.target.value);
                                              setBroadcastTitleError('');
                                            }}
                                            onBlur={(e) => {
                                              const link = e.target.value.trim();
                                              if (link && !link.toLowerCase().endsWith('.pdf')) {
                                                setBroadcastTitleError('Please paste a valid document link (must end with .pdf)');
                                              } else {
                                                setBroadcastTitleError('');
                                              }
                                            }}
                                            placeholder="Paste document link"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          />
                                          <span className="text-sm text-gray-500 flex-shrink-0">Or</span>
                                          <label className="flex-shrink-0">
                                            <input
                                              type="file"
                                              accept="application/pdf"
                                              onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                  setBroadcastTitleDocumentFile(file);
                                                  setBroadcastTitleDocumentLink('');
                                                  setBroadcastTitleError('');
                                                }
                                              }}
                                              className="hidden"
                                            />
                                            <span className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 cursor-pointer inline-block text-sm whitespace-nowrap">
                                              Upload document
                                            </span>
                                          </label>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Valid formats: PDF</p>
                                        {broadcastTitleError && broadcastTitleType === 'document' && (
                                          <p className="text-xs text-red-600 mt-1">{broadcastTitleError}</p>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Body */}
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="block text-sm font-medium text-gray-700">
                                        Body
                                      </label>
                                      <span className="text-xs text-gray-500">
                                        {templateBody.length}/1024
                                      </span>
                                    </div>
                                    <div className="mb-2">
                                      <p className="text-xs text-gray-600 italic">
                                        Content for authentication message templates can't be edited. You can add/remove additional content from the option below
                                      </p>
                                    </div>
                                    <textarea
                                      value={templateBody}
                                      onChange={(e) => {
                                        if (e.target.value.length <= 1024) {
                                          setTemplateBody(e.target.value);
                                        }
                                      }}
                                      rows={8}
                                      maxLength={1024}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                      placeholder="Enter template body"
                                    />
                                  </div>

                                  {/* Footer */}
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="block text-sm font-medium text-gray-700">
                                        Footer
                                      </label>
                                      <span className="text-xs text-gray-500">
                                        {templateFooter.length}/60
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-2 italic">
                                      (Optional) Footers are great to add any disclaimers or to add a thoughtful PS
                                    </p>
                                    <textarea
                                      value={templateFooter}
                                      onChange={(e) => {
                                        if (e.target.value.length <= 60) {
                                          setTemplateFooter(e.target.value);
                                        }
                                      }}
                                      rows={2}
                                      maxLength={60}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                      placeholder="Enter footer (optional)"
                                    />
                                  </div>

                                  {/* Buttons */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Buttons
                                    </label>
                                    <input
                                      type="text"
                                      value={templateButtons}
                                      onChange={(e) => setTemplateButtons(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Enter button text (optional)"
                                    />
                                  </div>

                                  {/* Sample Content */}
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="block text-sm font-medium text-gray-700">
                                        Sample Content
                                      </label>
                                      <span className="text-xs text-gray-500">
                                        {templateSampleContent.length}/200
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-2 italic">
                                      Just enter sample content here (it doesn't need to be exact!)
                                    </p>
                                    <textarea
                                      value={templateSampleContent}
                                      onChange={(e) => {
                                        if (e.target.value.length <= 200) {
                                          setTemplateSampleContent(e.target.value);
                                        }
                                      }}
                                      rows={3}
                                      maxLength={200}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                      placeholder="Enter sample content"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      Make sure not to include any actual user or customer information, and provide only sample content in your examples. <a href="https://developers.facebook.com/docs/whatsapp/message-templates/guidelines" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Learn more</a>
                                    </p>
                                  </div>
                                </div>

                                {/* Right Column - Preview */}
                                <div>
                                  <div className="sticky top-0">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                                    {/* Mobile Phone Mockup with WhatsApp Preview */}
                                    <div className="flex justify-center">
                                      <div className="relative w-[260px] h-[520px] bg-gray-900 rounded-[2.5rem] p-1.5 shadow-2xl">
                                        {/* Phone Frame */}
                                        <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden border-[3px] border-gray-800">
                                          {/* Status Bar */}
                                          <div className="bg-[#075e54] h-10 flex items-center justify-between px-3 text-white text-[10px]">
                                            <div className="flex items-center gap-1">
                                              <span>9:41</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                                              </svg>
                                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.076 13.308-5.076 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
                                              </svg>
                                            </div>
                                          </div>
                                          
                                          {/* WhatsApp Header */}
                                          <div className="bg-[#075e54] px-3 py-2 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                                              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"/>
                                              </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="text-white font-medium text-xs truncate">Business Name</div>
                                              <div className="text-[#d4edda] text-[10px]">online</div>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                              </svg>
                                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                                              </svg>
                                            </div>
                                          </div>
                                          
                                          {/* Chat Area */}
                                          <div className="bg-[#ece5dd] h-[calc(100%-10rem)] overflow-y-auto p-3" style={{
                                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%23d4d4d4' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)' opacity='0.1'/%3E%3C/svg%3E")`
                                          }}>
                                            {/* Template Message Bubble */}
                                            {(templateBody || broadcastTitleType !== 'none') ? (
                                              <div className="flex justify-start mb-2">
                                                <div className="max-w-[85%] bg-white rounded-lg shadow-sm p-2.5 relative">
                                                  {/* Message Header Badge */}
                                                  <div className="absolute -top-1.5 left-2.5 bg-[#25d366] text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium">
                                                    TEMPLATE
                                                  </div>
                                                  <div className="pt-1.5">
                                                    {/* Broadcast Title - Text */}
                                                    {broadcastTitleType === 'text' && broadcastTitleText && (
                                                      <div className="font-bold text-xs text-gray-800 mb-2">
                                                        {broadcastTitleText}
                                                      </div>
                                                    )}
                                                    
                                                    {/* Broadcast Title - Image */}
                                                    {broadcastTitleType === 'image' && (
                                                      <>
                                                        {broadcastTitleImageLink && (
                                                          <div className="mb-2">
                                                            <img 
                                                              src={broadcastTitleImageLink} 
                                                              alt="Broadcast" 
                                                              className="w-full rounded-lg object-cover max-h-32"
                                                              onError={(e) => {
                                                                e.target.style.display = 'none';
                                                              }}
                                                            />
                                                          </div>
                                                        )}
                                                        {broadcastTitleImageFile && (
                                                          <div className="mb-2">
                                                            <img 
                                                              src={URL.createObjectURL(broadcastTitleImageFile)} 
                                                              alt="Broadcast" 
                                                              className="w-full rounded-lg object-cover max-h-32"
                                                            />
                                                          </div>
                                                        )}
                                                      </>
                                                    )}
                                                    
                                                    {/* Broadcast Title - Video */}
                                                    {broadcastTitleType === 'video' && (
                                                      <>
                                                        {broadcastTitleVideoLink && (
                                                          <div className="mb-2 relative">
                                                            <video 
                                                              src={broadcastTitleVideoLink} 
                                                              className="w-full rounded-lg object-cover max-h-32"
                                                              controls={false}
                                                              onError={(e) => {
                                                                e.target.style.display = 'none';
                                                              }}
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                                                              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                                                              </svg>
                                                            </div>
                                                          </div>
                                                        )}
                                                        {broadcastTitleVideoFile && (
                                                          <div className="mb-2 relative">
                                                            <video 
                                                              src={URL.createObjectURL(broadcastTitleVideoFile)} 
                                                              className="w-full rounded-lg object-cover max-h-32"
                                                              controls={false}
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                                                              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                                                              </svg>
                                                            </div>
                                                          </div>
                                                        )}
                                                      </>
                                                    )}
                                                    
                                                    {/* Broadcast Title - Document */}
                                                    {broadcastTitleType === 'document' && (
                                                      <>
                                                        {broadcastTitleDocumentLink && (
                                                          <div className="mb-2 border border-gray-300 rounded-lg overflow-hidden bg-gray-50" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                                            <iframe 
                                                              src={broadcastTitleDocumentLink} 
                                                              className="w-full h-32"
                                                              title="Document preview"
                                                              onError={(e) => {
                                                                e.target.style.display = 'none';
                                                              }}
                                                            />
                                                          </div>
                                                        )}
                                                        {broadcastTitleDocumentFile && (
                                                          <div className="mb-2 border border-gray-300 rounded-lg overflow-hidden bg-gray-50" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                                            <iframe 
                                                              src={URL.createObjectURL(broadcastTitleDocumentFile)} 
                                                              className="w-full h-32"
                                                              title="Document preview"
                                                            />
                                                          </div>
                                                        )}
                                                      </>
                                                    )}
                                                    
                                                    {/* Message Body */}
                                        {templateBody && (
                                                      <div className="text-xs text-gray-800 whitespace-pre-wrap mb-1.5">
                                            {templateBody.replace(/\[.*?\]/g, templateSampleContent || '[Sample]')}
                                          </div>
                                        )}
                                                    
                                                    {/* Footer */}
                                        {templateFooter && (
                                                      <div className="text-[9px] text-gray-500 mt-1.5 pt-1.5 border-t border-gray-200">
                                            {templateFooter}
                                          </div>
                                        )}
                                                    
                                                    {/* Buttons */}
                                        {templateButtons && (
                                                      <div className="mt-2 space-y-1.5">
                                                        <button className="w-full px-2.5 py-1.5 bg-[#25d366] text-white text-[10px] rounded-lg hover:bg-[#20ba5a] transition-colors text-center">
                                              {templateButtons}
                                            </button>
                                          </div>
                                        )}
                                                    
                                                    {/* Timestamp */}
                                                    <div className="text-[9px] text-gray-400 mt-1.5 text-right">
                                                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                            ) : (
                                              <div className="flex items-center justify-center h-full">
                                                <p className="text-gray-400 text-xs italic">Preview will appear here</p>
                                              </div>
                                            )}
                              </div>

                                          {/* Input Area (Optional - for visual completeness) */}
                                          <div className="bg-gray-100 h-12 border-t border-gray-200 flex items-center px-3">
                                            <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-xs text-gray-500">
                                              Type a message
                                            </div>
                                            <div className="ml-1.5 w-8 h-8 bg-[#25d366] rounded-full flex items-center justify-center">
                                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                                              </svg>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            // Show template library when no template is selected
                          <>
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
                          <button 
                            onClick={() => {
                              // Set selectedTemplate to empty object to show form, but don't populate fields
                              setSelectedTemplate({});
                              // Reset all form fields
                              setTemplateName('');
                              setTemplateCategory('');
                              setTemplateLanguage('English');
                              setTemplateBody('');
                              setTemplateFooter('');
                              setTemplateSampleContent('');
                              setTemplateButtons('');
                              setBroadcastTitleType('none');
                              setBroadcastTitleText('');
                              setBroadcastTitleImageLink('');
                              setBroadcastTitleVideoLink('');
                              setBroadcastTitleDocumentLink('');
                              setBroadcastTitleImageFile(null);
                              setBroadcastTitleVideoFile(null);
                              setBroadcastTitleDocumentFile(null);
                              setBroadcastTitleError('');
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                          >
                            New Template Message
                          </button>
                          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>English</option>
                          </select>
                </div>

                            {/* Tag Filter Buttons */}
                        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                              {getAllTags().map((tag) => {
                                const count = tag === 'All' 
                                  ? broadcastTemplates.length 
                                  : getTemplatesByTag(tag).length;
                                return (
                                  <button
                                    key={tag}
                                    onClick={() => setSelectedTemplateTag(tag)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                      selectedTemplateTag === tag
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    {tag} <span className="text-gray-500">({count})</span>
                          </button>
                                );
                              })}
              </div>

                            {/* Search Bar */}
                            <div className="mb-6">
                              <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                  type="text"
                                  placeholder="Search templates by name, tag, or content..."
                                  value={templateSearchQuery}
                                  onChange={(e) => setTemplateSearchQuery(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                              </div>
                            </div>

                            {/* Templates grouped by selected tag and filtered by search */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {(() => {
                                // First filter by tag
                                let filteredTemplates = getTemplatesByTag(selectedTemplateTag);
                                
                                // Then filter by search query if provided
                                if (templateSearchQuery.trim()) {
                                  const query = templateSearchQuery.toLowerCase().trim();
                                  filteredTemplates = filteredTemplates.filter(template => {
                                    const nameMatch = template.name?.toLowerCase().includes(query);
                                    const tagsMatch = template.tags?.some(tag => tag.toLowerCase().includes(query));
                                    const contentMatch = template.content?.toLowerCase().includes(query);
                                    return nameMatch || tagsMatch || contentMatch;
                                  });
                                }
                                
                                return filteredTemplates.map((template) => (
                                <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-gray-900 mb-1 truncate">{template.name}</h3>
                                      <span className="text-xs text-gray-500">{template.tags ? template.tags.join(', ') : ''}</span>
                              </div>
                              <button 
                                onClick={() => {
                                  setSelectedTemplate(template);
                                }}
                                className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors flex-shrink-0 ml-2"
                              >
                                Use sample
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2 flex-1 overflow-y-auto max-h-48">
                                    {template.content}
                            </p>
                          </div>
                                ));
                              })()}
                              </div>
                              
                              {/* Show message if no templates found */}
                              {(() => {
                                let filteredTemplates = getTemplatesByTag(selectedTemplateTag);
                                if (templateSearchQuery.trim()) {
                                  const query = templateSearchQuery.toLowerCase().trim();
                                  filteredTemplates = filteredTemplates.filter(template => {
                                    const nameMatch = template.name?.toLowerCase().includes(query);
                                    const tagsMatch = template.tags?.some(tag => tag.toLowerCase().includes(query));
                                    const contentMatch = template.content?.toLowerCase().includes(query);
                                    return nameMatch || tagsMatch || contentMatch;
                                  });
                                }
                                return filteredTemplates.length === 0 && (
                                  <div className="col-span-full text-center py-12">
                                    <p className="text-gray-500 text-sm">
                                      {templateSearchQuery.trim() 
                                        ? `No templates found matching "${templateSearchQuery}"`
                                        : 'No templates available'}
                            </p>
                          </div>
                                );
                              })()}
                          </>
                          )
                        ) : templateSubView === 'your-templates' ? (
                          <div className="space-y-6">
                            <div className="flex items-start justify-between">
                              <div>
                                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your Templates</h2>
                                <p className="text-sm text-gray-600 mb-4">
                                  Manage your custom templates here.
                            </p>
                              </div>
                              <button className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                                Watch Tutorial
                              </button>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-8 text-center">
                              <p className="text-gray-500">No custom templates yet. Create your first template to get started.</p>
                          </div>
                              </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="flex items-start justify-between">
                              <div>
                                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Templates</h2>
                                <p className="text-sm text-gray-600 mb-4">
                                  Select "Template library" or "Your templates" from the sidebar to get started.
                            </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {broadcastView === 'broadcast-history' && (
                      <div className="space-y-6">
                        <div className="flex items-start justify-between">
                              <div>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Broadcast History</h2>
                            <p className="text-sm text-gray-600 mb-4">
                              View all your past broadcast messages and their performance.
                            </p>
                              </div>
                          <button className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                            Watch Tutorial
                              </button>
                            </div>

                        <div className="border border-gray-200 rounded-lg bg-white">
                          <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-gray-900">Past Broadcasts</h3>
                              <div className="flex items-center gap-2">
                                <button className="px-3 py-1 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                                  Export
                                </button>
                                <button className="px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                                  Filter
                                </button>
                          </div>
                              </div>
                            </div>
                          <div className="p-8 text-center">
                            <div className="text-gray-400 mb-4">
                              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">No broadcast history</p>
                            <p className="text-xs text-gray-500 mb-4">You haven't sent any broadcasts yet.</p>
                            <p className="text-xs text-gray-600 mb-4">
                              Start sending broadcast messages and they will appear here.
                            </p>
                            <button 
                              onClick={() => setBroadcastView('new-broadcast')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                            >
                              New Broadcast
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {broadcastView === 'scheduled-broadcasts' && (
                      <div className="space-y-6">
                        <div className="flex items-start justify-between">
                              <div>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Scheduled Broadcasts</h2>
                            <p className="text-sm text-gray-600 mb-4">
                              Manage your scheduled broadcast messages.
                            </p>
                              </div>
                          <button className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                            Watch Tutorial
                              </button>
                            </div>

                        <div className="border border-gray-200 rounded-lg bg-white">
                          <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-gray-900">Upcoming Broadcasts</h3>
                              <div className="flex items-center gap-2">
                                <button className="px-3 py-1 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                                  Export
                                </button>
                                <button className="px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                                  Filter
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="p-8 text-center">
                            <div className="text-gray-400 mb-4">
                              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">No scheduled broadcasts</p>
                            <p className="text-xs text-gray-500 mb-4">You don't have any scheduled broadcasts yet.</p>
                            <p className="text-xs text-gray-600 mb-4">
                              Schedule a broadcast message and it will appear here.
                            </p>
                            <button 
                              onClick={() => setBroadcastView('new-broadcast')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                            >
                              New Broadcast
                            </button>
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
        );
      case 'contacts':
        return <Contacts />;
      
      case 'contacts_old':
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
                                disabled={updatingLeadStage && !!updatingLeadStage[contact.contact_id]}
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
                    <button 
                      onClick={() => setIsAddTeamModalOpen(true)}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      Add Team
                    </button>
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
                {isLoadingTeamMembers ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading team members...</p>
                  </div>
                ) : teamMembersData.length === 0 ? (
                  <div className="text-sm text-gray-600">No team members found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-sm">
                        {teamMembersData.map((member) => {
                          const isEditing = editingTeamMember?.member_id === member.member_id;
                          const isDeleting = deletingTeamMember === member.member_id;
                          
                          if (isEditing) {
                            const editState = editingTeamMember;
                            return (
                              <tr key={member.member_id} className="bg-blue-50">
                                <td className="px-4 py-2">
                                  <input
                                    type="text"
                                    defaultValue={member.name}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    id={`edit-name-${member.member_id}`}
                                  />
                                </td>
                                <td className="px-4 py-2 text-gray-700">{member.team_name}</td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={editState.selectedRole || ''}
                                      onChange={(e) => {
                                        setEditingTeamMember({
                                          ...editState,
                                          selectedRole: e.target.value,
                                          customRole: e.target.value !== 'Other' ? '' : editState.customRole
                                        });
                                      }}
                                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                      <option value="">Select role</option>
                                      <option value="Admin / Business Manager">Admin / Business Manager</option>
                                      <option value="Sales Manager">Sales Manager</option>
                                      <option value="Support Manager">Support Manager</option>
                                      <option value="Marketing Manager">Marketing Manager</option>
                                      <option value="Other">Other</option>
                                    </select>
                                    {editState.selectedRole === 'Other' && (
                                      <input
                                        type="text"
                                        value={editState.customRole || ''}
                                        onChange={(e) => {
                                          setEditingTeamMember({
                                            ...editState,
                                            customRole: e.target.value
                                          });
                                        }}
                                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                        placeholder="Role name"
                                      />
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="email"
                                    defaultValue={member.email}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    id={`edit-email-${member.member_id}`}
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        const name = document.getElementById(`edit-name-${member.member_id}`).value;
                                        const email = document.getElementById(`edit-email-${member.member_id}`).value;
                                        const selectedRole = editState.selectedRole;
                                        const customRole = editState.customRole;
                                        
                                        if (!name || !email || !selectedRole) {
                                          alert('Please fill in all required fields');
                                          return;
                                        }
                                        
                                        if (selectedRole === 'Other' && !customRole) {
                                          alert('Please enter a role name');
                                          return;
                                        }
                                        
                                        const finalRole = selectedRole === 'Other' ? customRole : selectedRole;
                                        
                                        handleSaveTeamMember({
                                          ...member,
                                          name,
                                          email,
                                          role: finalRole
                                        });
                                      }}
                                      className="text-green-600 hover:text-green-800"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingTeamMember(null)}
                                      className="text-gray-600 hover:text-gray-800"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }
                          
                          return (
                            <tr key={member.member_id}>
                              <td className="px-4 py-2 text-gray-900">{member.name}</td>
                              <td className="px-4 py-2 text-gray-700">{member.team_name}</td>
                              <td className="px-4 py-2 text-gray-700">{member.role}</td>
                              <td className="px-4 py-2 text-gray-700">{member.email}</td>
                              <td className="px-4 py-2">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditTeamMember(member)}
                                    disabled={isDeleting}
                                    className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTeamMember(member)}
                                    disabled={isDeleting}
                                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                  >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Teams</h3>
                
                {isLoadingTeams ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading teams...</p>
                  </div>
                ) : teamsData.length === 0 ? (
                  <div className="text-sm text-gray-600">No teams added yet. Use the "Add Team" button to create your first team.</div>
                ) : (
                  <div className="space-y-4">
                    {teamsData.map((team) => {
                      const isExpanded = expandedTeams.has(team.team_id);
                      return (
                        <div key={team.team_id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div 
                            className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                            onClick={() => {
                              const newExpanded = new Set(expandedTeams);
                              if (isExpanded) {
                                newExpanded.delete(team.team_id);
                              } else {
                                newExpanded.add(team.team_id);
                              }
                              setExpandedTeams(newExpanded);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900">{team.name}</h4>
                                <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                                  <span>{team.member_count} {team.member_count === '1' ? 'member' : 'members'}</span>
                                  {team.invitations && team.invitations.length > 0 && (
                                    <>
                                      <span>•</span>
                                      <span>{team.invitations.length} {team.invitations.length === 1 ? 'invitation' : 'invitations'}</span>
                                    </>
                                  )}
                                  <span>•</span>
                                  <span>Created: {new Date(team.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTeam(team.team_id, team.name);
                                  }}
                                  disabled={deletingTeam === team.team_id}
                                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                  title="Delete team"
                                >
                                  {deletingTeam === team.team_id ? (
                                    <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  )}
                                </button>
                                <svg 
                                  className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="p-4 bg-white border-t border-gray-200">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-sm font-semibold text-gray-700">Team Members</h5>
                                {!addingMember && (
                                  <button
                                    onClick={() => handleAddMember(team.team_id)}
                                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Member
                                  </button>
                                )}
                              </div>
                              <div className="space-y-2">
                                {/* Add Member Form */}
                                {addingMember === team.team_id && (
                                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="text"
                                        value={newMemberData.name}
                                        onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
                                        className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        placeholder="Name"
                                        required
                                      />
                                      <input
                                        type="email"
                                        value={newMemberData.email}
                                        onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                                        className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        placeholder="Email"
                                        required
                                      />
                                      <select
                                        value={newMemberData.selectedRole}
                                        onChange={(e) => {
                                          setNewMemberData({
                                            ...newMemberData,
                                            selectedRole: e.target.value,
                                            customRole: e.target.value !== 'Other' ? '' : newMemberData.customRole
                                          });
                                        }}
                                        className="w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      >
                                        <option value="">Select role</option>
                                        <option value="Admin / Business Manager">Admin / Business Manager</option>
                                        <option value="Sales Manager">Sales Manager</option>
                                        <option value="Support Manager">Support Manager</option>
                                        <option value="Marketing Manager">Marketing Manager</option>
                                        <option value="Other">Other</option>
                                      </select>
                                      <div className="w-[150px]">
                                        {newMemberData.selectedRole === 'Other' && (
                                          <input
                                            type="text"
                                            value={newMemberData.customRole}
                                            onChange={(e) => setNewMemberData({ ...newMemberData, customRole: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Role name"
                                          />
                                        )}
                                      </div>
                                      <button
                                        onClick={() => handleSaveNewMember(team.team_id)}
                                        className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 whitespace-nowrap"
                                      >
                                        Add
                                      </button>
                                      <button
                                        onClick={() => {
                                          setAddingMember(null);
                                          setNewMemberData({ name: '', email: '', selectedRole: '', customRole: '' });
                                        }}
                                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 whitespace-nowrap"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {team.members && team.members.length > 0 && team.members.map((member, index) => {
                                  const isEditing = editingMember?.teamId === team.team_id && editingMember?.memberIndex === index;
                                  const isDeleting = deletingMember?.teamId === team.team_id && deletingMember?.memberIndex === index;
                                  
                                  if (isEditing) {
                                    const editState = editingMember;
                                    return (
                                      <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center gap-3">
                                          <input
                                            type="text"
                                            defaultValue={member.name}
                                            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            placeholder="Name"
                                            id={`edit-name-${team.team_id}-${index}`}
                                          />
                                          <input
                                            type="email"
                                            defaultValue={member.email}
                                            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            placeholder="Email"
                                            id={`edit-email-${team.team_id}-${index}`}
                                          />
                                          <select
                                            value={editState.selectedRole || ''}
                                            onChange={(e) => {
                                              setEditingMember({
                                                ...editState,
                                                selectedRole: e.target.value,
                                                customRole: e.target.value !== 'Other' ? '' : editState.customRole
                                              });
                                            }}
                                            className="w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          >
                                            <option value="">Select role</option>
                                            <option value="Admin / Business Manager">Admin / Business Manager</option>
                                            <option value="Sales Manager">Sales Manager</option>
                                            <option value="Support Manager">Support Manager</option>
                                            <option value="Marketing Manager">Marketing Manager</option>
                                            <option value="Other">Other</option>
                                          </select>
                                          <div className="w-[150px]">
                                            {editState.selectedRole === 'Other' && (
                                              <input
                                                type="text"
                                                value={editState.customRole || ''}
                                                onChange={(e) => {
                                                  setEditingMember({
                                                    ...editState,
                                                    customRole: e.target.value
                                                  });
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Role name"
                                              />
                                            )}
                                          </div>
                                          <button
                                            onClick={() => {
                                              const name = document.getElementById(`edit-name-${team.team_id}-${index}`).value;
                                              const email = document.getElementById(`edit-email-${team.team_id}-${index}`).value;
                                              const selectedRole = editState.selectedRole;
                                              const customRole = editState.customRole;
                                              
                                              if (!name || !email || !selectedRole) {
                                                alert('Please fill in all required fields');
                                                return;
                                              }
                                              
                                              if (selectedRole === 'Other' && !customRole) {
                                                alert('Please enter a role name');
                                                return;
                                              }
                                              
                                              const finalRole = selectedRole === 'Other' ? customRole : selectedRole;
                                              
                                              handleSaveMember(team.team_id, index, {
                                                ...member,
                                                name,
                                                email,
                                                role: finalRole
                                              });
                                            }}
                                            className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 whitespace-nowrap"
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={() => setEditingMember(null)}
                                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 whitespace-nowrap"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  }
                                  
                                  return (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                      <span className="font-medium text-gray-900 flex-1 min-w-[200px]">{member.name}</span>
                                      <span className="text-sm text-gray-600 flex-1 min-w-[200px]">{member.email}</span>
                                      <span className="w-[200px] px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm text-center">{member.role}</span>
                                      <div className="w-[150px]"></div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => handleEditMember(team.team_id, index, member)}
                                          disabled={isDeleting}
                                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                                          title="Edit member"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                          </svg>
                                        </button>
                                        <button
                                          onClick={() => handleDeleteMember(team.team_id, index, member)}
                                          disabled={isDeleting}
                                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                          title="Delete member"
                                        >
                                          {isDeleting ? (
                                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                          ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                                
                                {/* Invited Users Section */}
                                {team.invitations && team.invitations.length > 0 && (
                                  <>
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                      <h5 className="text-sm font-semibold text-gray-700 mb-3">Invited Users</h5>
                                      <div className="space-y-2">
                                        {team.invitations.map((invitation, invIndex) => {
                                          const isExpired = new Date(invitation.expires_at) < new Date();
                                          const statusColor = invitation.status === 'Accepted' 
                                            ? 'bg-green-100 text-green-800' 
                                            : invitation.status === 'Pending' && !isExpired
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800';
                                          
                                          return (
                                            <div key={invitation.invitation_id || invIndex} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                              <span className="font-medium text-gray-900 flex-1 min-w-[200px]">{invitation.name || invitation.invited_name || 'N/A'}</span>
                                              <span className="text-sm text-gray-600 flex-1 min-w-[200px]">{invitation.invited_email}</span>
                                              <span className="w-[200px] px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm text-center">{invitation.role || invitation.invited_role || 'N/A'}</span>
                                              <span className="text-sm text-gray-600 flex-1 min-w-[200px]">
                                                {invitation.accepted_at 
                                                  ? `Accepted: ${new Date(invitation.accepted_at).toLocaleDateString()}`
                                                  : `Invited: ${new Date(invitation.created_at).toLocaleDateString()}`
                                                }
                                              </span>
                                              <span className={`w-[200px] px-2 py-1 ${statusColor} rounded text-sm text-center`}>
                                                {invitation.status} {isExpired && invitation.status === 'Pending' ? '(Expired)' : ''}
                                              </span>
                                              <span className="w-[150px] text-xs text-gray-500 text-center">
                                                {isExpired && invitation.status === 'Pending' 
                                                  ? 'Expired'
                                                  : invitation.expires_at 
                                                    ? `Expires: ${new Date(invitation.expires_at).toLocaleDateString()}`
                                                    : ''
                                                }
                                              </span>
                                              <div className="w-[100px] flex justify-end">
                                                <button
                                                  onClick={() => handleDeleteInvitation(team.team_id, invitation.invitation_id, invitation.invited_email)}
                                                  disabled={deletingInvitation?.teamId === team.team_id && deletingInvitation?.invitationId === invitation.invitation_id}
                                                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                                  title="Cancel invitation"
                                                >
                                                  {deletingInvitation?.teamId === team.team_id && deletingInvitation?.invitationId === invitation.invitation_id ? (
                                                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                                  ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                  )}
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Add Team Modal */}
            {isAddTeamModalOpen && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setIsAddTeamModalOpen(false);
                    setTeamFormData({
                      teamName: '',
                      customTeamName: '',
                      members: Array(5).fill(null).map(() => ({ name: '', email: '', role: '', customRole: '' }))
                    });
                  }
                }}
              >
                <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Add Team</h2>
                      <button
                        onClick={() => {
                          setIsAddTeamModalOpen(false);
                          setTeamFormData({
                            teamName: '',
                            customTeamName: '',
                            members: Array(5).fill(null).map(() => ({ name: '', email: '', role: '', customRole: '' }))
                          });
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setIsSubmittingTeam(true);
                      setTeamError(null);
                      
                      try {
                        // Get owner_id (db_id)
                        const dbId = userData?.db_id || user?.db_id;
                        if (!dbId) {
                          throw new Error('User ID not found. Please try again.');
                        }

                        // Determine team name
                        const teamName = teamFormData.teamName === 'Other' 
                          ? teamFormData.customTeamName 
                          : teamFormData.teamName;

                        if (!teamName) {
                          throw new Error('Team name is required.');
                        }

                        // Filter and format members (only include non-empty members)
                        const members = teamFormData.members
                          .filter(member => member.name && member.email && member.role)
                          .map(member => ({
                            name: member.name,
                            email: member.email,
                            role: member.role === 'Other' ? member.customRole : member.role
                          }));

                        if (members.length === 0) {
                          throw new Error('At least one team member is required.');
                        }

                        // Get DB Server URL
                        const dbServerUrl = apiConfig.dbServerConfig.baseURL;
                        if (!dbServerUrl) {
                          throw new Error('Server configuration error. Please contact support.');
                        }

                        const apiUrl = `${dbServerUrl}/api/teams`;
                        
                        console.log('🌐 [Create Team] Calling API:', apiUrl);
                        console.log('📤 [Create Team] Request data:', {
                          owner_id: dbId,
                          name: teamName,
                          members: members
                        });

                        const response = await fetch(apiUrl, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            owner_id: dbId,
                            name: teamName,
                            members: members
                          }),
                        });

                        if (!response.ok) {
                          const errorData = await response.json().catch(() => ({}));
                          throw new Error(errorData.error || `Failed to create team: ${response.status} ${response.statusText}`);
                        }

                        const result = await response.json();
                        console.log('✅ [Create Team] Team created successfully:', result);

                        // Close modal and reset form
                        setIsAddTeamModalOpen(false);
                        setTeamFormData({
                          teamName: '',
                          customTeamName: '',
                          members: Array(5).fill(null).map(() => ({ name: '', email: '', role: '', customRole: '' }))
                        });

                        // Refresh teams list
                        await fetchTeams();
                      } catch (error) {
                        console.error('❌ [Create Team] Error:', error);
                        setTeamError(error.message || 'Failed to create team. Please try again.');
                        setIsSubmittingTeam(false);
                      }
                    }} className="space-y-6">
                      {/* Team Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Team Name <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={teamFormData.teamName}
                          onChange={(e) => setTeamFormData({ ...teamFormData, teamName: e.target.value, customTeamName: '' })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select team name</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Sales">Sales</option>
                          <option value="Support">Support</option>
                          <option value="Business owner">Business owner</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Custom Team Name (if Other is selected) */}
                      {teamFormData.teamName === 'Other' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Team Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={teamFormData.customTeamName}
                            onChange={(e) => setTeamFormData({ ...teamFormData, customTeamName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter team name"
                          />
                        </div>
                      )}

                      {/* Error Message */}
                      {teamError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start">
                            <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-red-800">
                                {teamError}
                              </p>
                            </div>
                            <button
                              onClick={() => setTeamError(null)}
                              className="ml-2 text-red-600 hover:text-red-700"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Members Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          Team Members (up to 5) <span className="text-red-500">*</span>
                        </label>
                        
                        <div className="space-y-3">
                          {teamFormData.members.map((member, index) => (
                            <div key={index} className="grid grid-cols-12 gap-3 items-start">
                              {/* Member Name */}
                              <div className="col-span-3">
                                <input
                                  type="text"
                                  value={member.name}
                                  onChange={(e) => {
                                    const newMembers = [...teamFormData.members];
                                    newMembers[index].name = e.target.value;
                                    setTeamFormData({ ...teamFormData, members: newMembers });
                                  }}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Name"
                                />
                              </div>

                              {/* Member Email */}
                              <div className="col-span-3">
                                <input
                                  type="email"
                                  value={member.email}
                                  onChange={(e) => {
                                    const newMembers = [...teamFormData.members];
                                    newMembers[index].email = e.target.value;
                                    setTeamFormData({ ...teamFormData, members: newMembers });
                                  }}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Email"
                                />
                              </div>

                              {/* Member Role */}
                              <div className="col-span-3">
                                <select
                                  value={member.role}
                                  onChange={(e) => {
                                    const newMembers = [...teamFormData.members];
                                    newMembers[index].role = e.target.value;
                                    newMembers[index].customRole = '';
                                    setTeamFormData({ ...teamFormData, members: newMembers });
                                  }}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select role</option>
                                  <option value="Admin / Business Manager">Admin / Business Manager</option>
                                  <option value="Sales Manager">Sales Manager</option>
                                  <option value="Support Manager">Support Manager</option>
                                  <option value="Marketing Manager">Marketing Manager</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>

                              {/* Custom Role (if Other is selected) */}
                              {member.role === 'Other' ? (
                                <div className="col-span-2">
                                  <input
                                    type="text"
                                    required={member.role === 'Other'}
                                    value={member.customRole}
                                    onChange={(e) => {
                                      const newMembers = [...teamFormData.members];
                                      newMembers[index].customRole = e.target.value;
                                      setTeamFormData({ ...teamFormData, members: newMembers });
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Role name"
                                  />
                                </div>
                              ) : (
                                <div className="col-span-2"></div>
                              )}

                              {/* Clear Row Button */}
                              <div className="col-span-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newMembers = [...teamFormData.members];
                                    newMembers[index] = { name: '', email: '', role: '', customRole: '' };
                                    setTeamFormData({ ...teamFormData, members: newMembers });
                                  }}
                                  className="text-gray-400 hover:text-red-600 transition-colors"
                                  title="Clear row"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddTeamModalOpen(false);
                            setTeamFormData({
                              teamName: '',
                              customTeamName: '',
                              members: Array(5).fill(null).map(() => ({ name: '', email: '', role: '', customRole: '' }))
                            });
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingTeam}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmittingTeam ? 'Creating...' : 'Create Team'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
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
          <div className="w-full" style={{ height: 'calc(100vh - 64px)' }}>
            <div className="pl-0 pr-4 w-full" style={{ height: 'calc(100vh - 64px)' }}>
              <div className="grid grid-cols-1 lg:grid-cols-8 gap-0 w-full" style={{ height: 'calc(100vh - 64px)' }}>
                {/* Left Panel - Channel Buttons (2 columns) */}
                <div className="lg:col-span-2 rounded-lg shadow-lg flex flex-col bg-white relative z-10" style={{ height: 'calc(100vh - 64px)' }}>
                  <div className="pr-0 pl-0 pt-4 pb-4 border-b flex-shrink-0 border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 px-4 mb-4">Channels</h2>
                    <div className="flex flex-col gap-2 px-4">
                    <button
                        onClick={() => {
                          setActiveChannel('whatsapp');
                          // Check and show WABA modal if waba_details is empty
                          if (isWabaDetailsEmpty && !isCheckingWaba) {
                            checkWabaDetails();
                          }
                        }}
                        className={`w-full px-3 py-2 text-sm font-medium rounded-lg border text-left transition-colors ${
                          activeChannel === 'whatsapp' 
                            ? 'bg-blue-50 text-blue-700 border-blue-300' 
                            : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      WhatsApp
                    </button>
                    <button
                        onClick={() => {
                          setActiveChannel('instagram');
                          // Close WABA modal when switching to Instagram
                          if (isWabaModalOpen) {
                            setIsWabaModalOpen(false);
                          }
                        }}
                        className={`w-full px-3 py-2 text-sm font-medium rounded-lg border text-left transition-colors ${
                          activeChannel === 'instagram' 
                            ? 'bg-blue-50 text-blue-700 border-blue-300' 
                            : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Instagram
                    </button>
                    </div>
                  </div>
                </div>
                
                {/* Right Panel - Channel Content (6 columns) */}
                <div className="lg:col-span-6 bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
                  <div className="h-full overflow-y-auto p-6">
                  {showConnectAccount && activeChannel === 'whatsapp' && connectAccountStep === 1 ? (
                    // Step 1/2: Connect Account In-Process Form
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setConnectAccountStep(0)}
                            className="mr-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Go back"
                          >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <h1 className="text-2xl font-bold text-gray-900">Connect Account</h1>
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">In-Process</span>
                        </div>
                      </div>

                      {/* Form Card */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        {/* Step Indicator */}
                        <div className="text-sm text-gray-500 mb-6">Step 1/2</div>

                          {/* Connect your WhatsApp Phone Number */}
                          <div className="space-y-4 mb-8">
                            <h2 className="text-lg font-semibold text-gray-900">Connect your WhatsApp Phone Number</h2>
                            
                            <ul className="space-y-2 text-sm text-gray-700">
                              <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>
                                  NimbleAI recommends using your official business phone number. Please ensure the number you register is not already linked to any existing WhatsApp account (personal or business).
                                </span>
                              </li>
                              <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>
                                  Meta may provide a free phone number or a display-name-only option in the following steps. However, if you select this option, you'll need to submit official documents later to activate your WhatsApp account. Step-by-step guidance will be provided.
                                </span>
                              </li>
                            </ul>

                            {/* Radio Buttons */}
                            <div className="space-y-3 mt-4">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="radio"
                                  name="phoneNumberType"
                                  checked={hasOfficialNumber}
                                  onChange={() => setHasOfficialNumber(true)}
                                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-sm text-gray-700">I have an official number</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="radio"
                                  name="phoneNumberType"
                                  checked={!hasOfficialNumber}
                                  onChange={() => setHasOfficialNumber(false)}
                                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-sm text-gray-700">I will be using Meta's free number</span>
                              </label>
                            </div>

                            {/* Phone Number Input */}
                            {hasOfficialNumber && (
                              <div className="mt-4">
                                <div className="flex border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-400">
                                  <select
                                    className="border-r border-gray-300 px-3 py-3 text-sm focus:outline-none bg-white"
                                    value={connectPhoneCountry}
                                    onChange={(e) => {
                                      const country = e.target.value;
                                      setConnectPhoneCountry(country);
                                      const countryDialCodes = {
                                        'IN': '+91', 'US': '+1', 'GB': '+44', 'CA': '+1', 'AU': '+61',
                                        'DE': '+49', 'FR': '+33', 'IT': '+39', 'ES': '+34', 'BR': '+55',
                                        'MX': '+52', 'JP': '+81', 'CN': '+86', 'KR': '+82', 'SG': '+65'
                                      };
                                      setConnectPhoneDialCode(countryDialCodes[country] || '+1');
                                    }}
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
                                  </select>
                                  <div className="flex items-center px-3 bg-gray-50 border-r border-gray-300 text-gray-700 text-sm font-medium">
                                    {connectPhoneDialCode}
                                  </div>
                                  <input
                                    type="tel"
                                    className={`flex-1 px-4 py-3 text-sm focus:outline-none ${
                                      formErrors.phoneNumber ? 'border-red-500' : ''
                                    }`}
                                    value={connectPhoneNumber}
                                    onChange={(e) => {
                                      setConnectPhoneNumber(e.target.value);
                                      if (formErrors.phoneNumber) {
                                        setFormErrors(prev => {
                                          const newErrors = { ...prev };
                                          delete newErrors.phoneNumber;
                                          return newErrors;
                                        });
                                      }
                                    }}
                                    placeholder="Enter phone number"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Choose your WhatsApp Business Display Name */}
                          <div className="space-y-4 mb-8">
                            <h2 className="text-lg font-semibold text-gray-900">Choose your WhatsApp Business Display Name</h2>
                            <p className="text-sm text-gray-700">
                              This is what customers will see as your WhatsApp business account name. It must align with your legal business name, match your external branding, and follow these{' '}
                    <button
                                className="text-blue-600 hover:text-blue-700 underline"
                                onClick={handleOpenWhatsAppGuidelines}
                              >
                                WhatsApp's Guidelines
                              </button>.
                            </p>
                            <input
                              type="text"
                              className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 ${
                                formErrors.displayName 
                                  ? 'border-red-500 focus:ring-red-400' 
                                  : 'border-gray-300 focus:ring-green-400'
                              }`}
                              value={displayName}
                              onChange={(e) => {
                                setDisplayName(e.target.value);
                                if (formErrors.displayName) {
                                  setFormErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.displayName;
                                    return newErrors;
                                  });
                                }
                              }}
                              placeholder="Enter display name"
                            />
                          </div>

                          {/* Your business website URL */}
                          <div className="space-y-4 mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">Your business website URL</h2>
                            
                            <ul className="space-y-2 text-sm text-gray-700">
                              <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>For account approval, NimbleAI strongly recommends entering your official website URL.</span>
                              </li>
                              <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>If you provide Facebook or Instagram profile page links, Meta will ban your account.</span>
                              </li>
                              <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>
                                  Meta may allow you to skip providing a website, but if you choose this, you must submit official documents later to use the WhatsApp account (step-by-step guidance will be available).
                                </span>
                              </li>
                            </ul>

                            <label className="flex items-center gap-3 cursor-pointer mt-4">
                              <input
                                type="checkbox"
                                checked={hasWebsiteUrl}
                                onChange={(e) => setHasWebsiteUrl(e.target.checked)}
                                className="w-4 h-4 text-green-600 focus:ring-green-500 rounded"
                              />
                              <span className="text-sm text-gray-700">I have an official website URL</span>
                            </label>

                            {hasWebsiteUrl && (
                              <input
                                type="url"
                                className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 mt-2 ${
                                  formErrors.websiteUrl 
                                    ? 'border-red-500 focus:ring-red-400' 
                                    : 'border-gray-300 focus:ring-green-400'
                                }`}
                                value={websiteUrl}
                                onChange={(e) => {
                                  setWebsiteUrl(e.target.value);
                                  if (formErrors.websiteUrl) {
                                    setFormErrors(prev => {
                                      const newErrors = { ...prev };
                                      delete newErrors.websiteUrl;
                                      return newErrors;
                                    });
                                  }
                                }}
                                placeholder="https://example.com"
                              />
                            )}
                          </div>

                          {/* Error Messages */}
                          {Object.keys(formErrors).length > 0 && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                                {Object.values(formErrors).map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Navigation Buttons */}
                          <div className="flex justify-between pt-4 border-t border-gray-200">
                            <button
                              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors duration-200"
                              onClick={() => {
                                setFormErrors({});
                                setConnectAccountStep(0);
                              }}
                            >
                              Back
                            </button>
                            <button
                              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors duration-200"
                              onClick={() => {
                                // Validate form
                                const errors = {};
                                
                                // Validate display name (mandatory)
                                if (!displayName || displayName.trim() === '') {
                                  errors.displayName = 'Display name is required';
                                }
                                
                                // Validate phone number if official number is selected
                                if (hasOfficialNumber && (!connectPhoneNumber || connectPhoneNumber.trim() === '')) {
                                  errors.phoneNumber = 'Phone number is required when using an official number';
                                }
                                
                                // Validate website URL if checkbox is checked
                                if (hasWebsiteUrl && (!websiteUrl || websiteUrl.trim() === '')) {
                                  errors.websiteUrl = 'Website URL is required when you have an official website';
                                }
                                
                                setFormErrors(errors);
                                
                                // If no errors, create setup object and proceed
                                if (Object.keys(errors).length === 0) {
                                  // Create setup object
                                  const setup = {
                                    business: {
                                      id: '',
                                      name: '',
                                      email: '',
                                      website: hasWebsiteUrl ? websiteUrl.trim() : '',
                                      address: {
                                        streetAddress1: '',
                                        streetAddress2: '',
                                        city: '',
                                        state: '',
                                        zipPostal: '',
                                        country: ''
                                      },
                                      phone: hasOfficialNumber ? {
                                        code: parseInt(connectPhoneDialCode.replace('+', '')),
                                        number: connectPhoneNumber.trim()
                                      } : {
                                        code: null,
                                        number: ''
                                      },
                                      timezone: ''
                                    }
                                  };
                                  
                                  setSetupData(setup);
                                setConnectAccountStep(2);
                                }
                              }}
                            >
                              Next
                    </button>
                  </div>
                </div>
                      </div>
                    ) : showConnectAccount && activeChannel === 'whatsapp' && connectAccountStep === 2 ? (
                      // Step 2: Carousel with Connect with Facebook button
                      <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setConnectAccountStep(1)}
                            className="mr-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Go back"
                          >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <h1 className="text-2xl font-bold text-gray-900">Connect Account</h1>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">In-Process</span>
                        </div>
                        
                        {/* Carousel Section */}
                        <div className="relative w-full max-w-4xl mx-auto">
                          <div className="flex gap-8">
                            {/* Left space for text */}
                            <div className="w-80 flex-shrink-0 flex items-center">
                              {carouselIndex === 0 && (
                                <div className="bg-white/95 rounded-lg p-6 shadow-lg w-full">
                                  <h3 className="text-xl font-bold text-gray-900 mb-2">Step 1</h3>
                                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Login to Facebook</h4>
                                  <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-start">
                                      <span className="mr-2">•</span>
                                      <span>Ensure it's the admin account for your Meta Business Manager</span>
                                    </li>
                                  </ul>
                                </div>
                              )}
                              {carouselIndex === 1 && (
                                <div className="bg-white/95 rounded-lg p-6 shadow-lg w-full">
                                  <h3 className="text-xl font-bold text-gray-900 mb-2">Step 2</h3>
                                  <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-start">
                                      <span className="mr-2">•</span>
                                      <span>Grant required permissions</span>
                                    </li>
                                  </ul>
                                </div>
                              )}
                              {carouselIndex === 2 && (
                                <div className="bg-white/95 rounded-lg p-6 shadow-lg w-full">
                                  <h3 className="text-xl font-bold text-gray-900 mb-2">Step 3</h3>
                                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Enter Your Business Information</h4>
                                  <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-start">
                                      <span className="mr-2">•</span>
                                      <span>NimbleAI recommends choosing your existing business portfolio.</span>
                                    </li>
                                    <li className="flex items-start">
                                      <span className="mr-2">•</span>
                                      <span>To prevent any onboarding issues, please include your official website URL.</span>
                                    </li>
                                    <li className="flex items-start">
                                      <span className="mr-2">•</span>
                                      <span>If you skip adding your website, you'll be required to submit official documents to verify and activate your WhatsApp account later.</span>
                                    </li>
                                  </ul>
                                </div>
                              )}
                              {carouselIndex === 3 && (
                                <div className="bg-white/95 rounded-lg p-6 shadow-lg w-full">
                                  <h3 className="text-xl font-bold text-gray-900 mb-2">Step 4</h3>
                                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Create or connect a WhatsApp Business Account and Profile</h4>
                                  <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-start">
                                      <span className="mr-2">•</span>
                                      <span>NimbleAI recommends setting up a new business account and profile.</span>
                                    </li>
                                    <li className="flex items-start">
                                      <span className="mr-2">•</span>
                                      <span className="text-red-600">If you connect an existing Whatsapp Business Account, all your chat history will be lost</span>
                                    </li>
                                  </ul>
                                </div>
                              )}
                              {carouselIndex === 4 && (
                                <div className="bg-white/95 rounded-lg p-6 shadow-lg w-full">
                                  <h3 className="text-xl font-bold text-gray-900 mb-2">Step 5</h3>
                                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Provide WhatsApp Business profile info.</h4>
                                  <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-start">
                                      <span className="mr-2">•</span>
                                      <span>Ensure your display name complies with Meta's naming policies</span>
                                    </li>
                                  </ul>
                                </div>
                              )}
                              {carouselIndex === 5 && (
                                <div className="bg-white/95 rounded-lg p-6 shadow-lg w-full">
                                  <h3 className="text-xl font-bold text-gray-900 mb-2">Step 6</h3>
                                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Add or verify your Business Number</h4>
                                  <div className="space-y-3 text-gray-700">
                                    <p>The "Get a free WhatsApp number" option isn't eligible for Click-to-WhatsApp Ads and will require you to submit official documents after your WhatsApp account is connected.</p>
                                    <p>Enter the verification code received via text or voice call.</p>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Carousel Container */}
                            <div className="flex-1 relative">
                              <div className="relative overflow-hidden rounded-lg bg-white" style={{ height: '500px' }}>
                            {/* Carousel Images */}
                            <div 
                              className="flex transition-transform duration-500 ease-in-out h-full"
                              style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
                            >
                              {carouselImages.map((image, index) => (
                                <div key={index} className="min-w-full h-full relative flex items-center justify-center bg-white">
                                  <img 
                                    src={image} 
                                    alt={`Carousel image ${index + 1}`}
                                    className="max-w-full max-h-full object-contain border-2 border-black"
                                  />
                                </div>
                              ))}
                            </div>

                            {/* Left Navigation Button */}
                            {carouselIndex > 0 && (
                              <button
                                onClick={() => setCarouselIndex((prev) => prev - 1)}
                                className="absolute top-1/2 transform -translate-y-1/2 bg-gray-500 hover:bg-gray-600 text-white rounded-full p-2.5 shadow-lg transition-all duration-200 hover:scale-110 z-10"
                                style={{ left: '15px' }}
                                aria-label="Previous image"
                              >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                            )}

                            {/* Right Navigation Button */}
                            {carouselIndex < carouselImages.length - 1 && (
                              <button
                                onClick={() => setCarouselIndex((prev) => prev + 1)}
                                className="absolute top-1/2 transform -translate-y-1/2 bg-gray-500 hover:bg-gray-600 text-white rounded-full p-2.5 shadow-lg transition-all duration-200 hover:scale-110 z-10"
                                style={{ right: '15px' }}
                                aria-label="Next image"
                              >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            )}

                            {/* Carousel Indicators */}
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                              {carouselImages.map((_, index) => (
                                <button
                                  key={index}
                                  onClick={() => setCarouselIndex(index)}
                                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                    carouselIndex === index ? 'bg-white w-8' : 'bg-white/50'
                                  }`}
                                  aria-label={`Go to slide ${index + 1}`}
                                />
                              ))}
                            </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Connect with Facebook Button */}
                        <div className="flex justify-center pt-6">
                          <button
                            onClick={() => {
                              // Check if Facebook SDK is available
                              if (!window.FB) {
                                alert('Facebook SDK is not loaded. Please refresh the page.');
                                return;
                              }
                              
                              // Launch WhatsApp Embedded Signup with setup data
                              const CONFIGURATION_ID = '1464707537999245'; // Same as in WhatsAppEmbeddedSignup
                              
                              // Facebook login callback
                              const fbLoginCallback = (response) => {
                                console.log('Facebook login callback received:', response);
                                
                                if (response.authResponse) {
                                  const code = response.authResponse.code;
                                  console.log('WhatsApp Embedded Signup response code:', code);
                                  
                                  // Store the auth code - the useEffect will handle processing when both code and data are available
                                  setWhatsappAuthCode(code);
                                } else {
                                  console.log('WhatsApp Embedded Signup was cancelled or failed');
                                  setWhatsappAuthCode(null);
                                }
                              };
                              
                              // Launch WhatsApp Embedded Signup
                              window.FB.login(fbLoginCallback, {
                                config_id: CONFIGURATION_ID,
                                response_type: 'code',
                                override_default_response_type: true,
                                extras: {
                                  setup: setupData || {},
                                  featureType: '',
                                  sessionInfoVersion: '3'
                                }
                              });
                            }}
                            className="flex items-center gap-3 px-8 py-4 bg-[#0084FF] hover:bg-[#0066CC] text-white rounded-lg font-semibold text-lg shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
                          >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Connect with Facebook
                          </button>
                        </div>
                      </div>
                    ) : showConnectAccount && activeChannel === 'whatsapp' && connectAccountStep === 0 ? (
                    // Connect Account initial page (before clicking Connect)
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setShowConnectAccount(false)}
                            className="mr-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Go back"
                          >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <h1 className="text-2xl font-bold text-gray-900">Connect Account</h1>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">Not Started</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span className="text-sm font-medium">Help Guide</span>
                          </button>
                          <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium">Watch Tutorial</span>
                          </button>
                        </div>
                      </div>

                      {/* Main Content - Two Column Layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Panel - Benefits */}
                        <div className="space-y-4">
                          <h2 className="text-lg font-semibold text-gray-900">Benefits of connecting your own number</h2>
                          <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-gray-700">Sending messages from your brand name</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-gray-700">Free 100 INR credits</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-gray-700">Respond to unlimited customer initiated conversations</span>
                            </li>
                          </ul>
                          <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                              If you are not the Admin of your business, please{' '}
                              <button className="text-blue-600 hover:text-blue-700 underline">invite your team</button>
                            </p>
                          </div>
                        </div>

                        {/* Right Panel - Connect Card */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                          {/* Icons */}
                          <div className="flex items-center justify-center gap-4 mb-6">
                            <svg className="w-12 h-12" fill="#25D366" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                            </svg>
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                            <svg className="w-12 h-12" fill="#0084FF" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          </div>

                          {/* Heading */}
                          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                            To experience messaging, connect your WhatsApp number
                          </h3>
                          <p className="text-sm text-gray-600 text-center mb-6">
                            Once connected, you can start messaging contacts or receive messages from them
                          </p>

                          {/* Key Detail Box */}
                          <div className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Key detail to check before you connect</h4>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">Meta Business Manager</p>
                                  <p className="text-xs text-gray-600 mt-1">You must have Admin access to your Meta Business manager</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Connect Button */}
                          <button
                            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-base font-medium transition-colors duration-200"
                            onClick={() => {
                              // Show Step 1 of the connect form
                              setShowConnectAccount(true);
                              setConnectAccountStep(1);
                            }}
                          >
                            Connect
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : activeChannel === 'whatsapp' && isWabaDetailsEmpty ? (
                    // WABA content as page content
                    <div className="h-full flex flex-col">
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

                        {/* Button positioned at bottom */}
                        <div className="mt-auto pt-4" style={{ marginBottom: '120px' }}>
                          <button
                            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-base font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                            onClick={() => {
                              // Show Connect Account page
                              setShowConnectAccount(true);
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
                  ) : activeChannel === 'whatsapp' ? (
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
                  ) : activeChannel === 'instagram' ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Instagram Channel</h3>
                        <p className="text-sm text-gray-600">Manage your Instagram integration</p>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-600">Instagram channel configuration coming soon.</p>
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
      {/* Email Verification Banner - Show when email is not verified */}
      {/* Debug: Current verification status */}
      {console.log('🔍 [Email Verification Banner] Current state:', { 
        isEmailVerified, 
        isCheckingEmailVerification, 
        hasUser: !!user,
        shouldShow: isEmailVerified === false,
        type: typeof isEmailVerified
      })}
      {/* Temporary test banner - remove after debugging */}

      {/* Show banner when email is not verified (false) or when status is unknown (null) but we have a user */}
      {(isEmailVerified === false || (isEmailVerified === null && user && !isCheckingEmailVerification)) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-yellow-700">
                Please verify your email by clicking on the link sent to your email address
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={async () => {
                  if (isCheckingEmailVerification || !firebaseApp) return;
                  
                  setIsCheckingEmailVerification(true);
                  try {
                    const auth = getAuth(firebaseApp);
                    const firebaseUser = auth.currentUser;
                    if (firebaseUser) {
                      await firebaseUser.reload();
                      setIsEmailVerified(firebaseUser.emailVerified);
                    }
                  } catch (error) {
                    console.error("Error reloading user data:", error);
                  } finally {
                    setIsCheckingEmailVerification(false);
                  }
                }}
                className="text-sm text-yellow-700 hover:text-yellow-900 underline"
                disabled={isCheckingEmailVerification}
              >
                {isCheckingEmailVerification ? 'Checking...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      )}
      
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
                        <div className="flex border rounded overflow-hidden focus-within:ring-2 focus-within:ring-blue-400">
                          <select
                            className="border-r border-gray-300 px-2 py-2 text-sm focus:outline-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                            value={phoneObj.countryCode || 'IN'}
                            onChange={(e) => updatePhone(index, 'countryCode', e.target.value)}
                            disabled={isSubmittingContact}
                            style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23374151\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em 1em', paddingRight: '1.75rem' }}
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
                          <div className="flex items-center px-2 bg-gray-50 border-r border-gray-300 text-gray-700 text-sm font-medium min-w-[50px]">
                            {phoneObj.dialCode || '+91'}
                          </div>
                        <input
                          type="tel"
                            className="flex-1 px-3 py-2 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={phoneObj.phone}
                          onChange={(e) => updatePhone(index, 'phone', e.target.value)}
                          required={index === 0}
                          disabled={isSubmittingContact}
                            placeholder="Enter phone number"
                        />
                        </div>
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
                  setImportProgress({ success: 0, failed: 0, total: 0 });
                  setImportResults(null);
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
                    if (file) {
                      handleCsvFile(file)
                        .then(() => {
                          recomputePreview();
                        })
                        .catch((error) => {
                          console.error('Failed to parse CSV file:', error);
                        });
                    }
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

              {/* Import Results/Confirmation */}
              {importResults && (
                <div className={`p-4 rounded-lg border ${
                  importResults.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  {importResults.success ? (
                    <div className="flex items-start space-x-3">
                      <span className="text-green-600 text-xl">✅</span>
                      <div className="flex-1">
                        <p className="font-semibold text-green-800 mb-1">
                          Import Completed Successfully!
                        </p>
                        <p className="text-sm text-green-700">
                          {importResults.imported} contact{importResults.imported !== 1 ? 's' : ''} imported successfully.
                          {importResults.failed > 0 && (
                            <span className="block mt-1">
                              {importResults.failed} contact{importResults.failed !== 1 ? 's' : ''} failed to import.
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-green-600 mt-2">
                          The modal will close automatically...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start space-x-3">
                      <span className="text-red-600 text-xl">❌</span>
                      <div className="flex-1">
                        <p className="font-semibold text-red-800 mb-1">
                          Import Failed
                        </p>
                        <p className="text-sm text-red-700">
                          {importResults.error || 'An error occurred during import'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Import */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-xs text-gray-600">
                  {importProgress.total > 0 && !importResults && (
                    <span>Imported {importProgress.success}/{importProgress.total} successful, {importProgress.failed} failed.</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                    onClick={() => {
                      setIsImportModalOpen(false);
                      setCsvHeaders([]);
                      setCsvRows([]);
                      setMapping({});
                      setCsvParseError('');
                      setImportPreview([]);
                      setImportProgress({ success: 0, failed: 0, total: 0 });
                      setImportResults(null);
                    }}
                    disabled={isImporting}
                  >
                    {importResults ? 'Close' : 'Cancel'}
                  </button>
                  {!importResults && (
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
                  )}
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
                        <div className="flex border rounded overflow-hidden focus-within:ring-2 focus-within:ring-blue-400">
                          <select
                            className="border-r border-gray-300 px-2 py-2 text-sm focus:outline-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                            value={phoneObj.countryCode || 'IN'}
                            onChange={(e) => updatePhone(index, 'countryCode', e.target.value)}
                            disabled={isSubmittingContact}
                            style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23374151\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em 1em', paddingRight: '1.75rem' }}
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
                          <div className="flex items-center px-2 bg-gray-50 border-r border-gray-300 text-gray-700 text-sm font-medium min-w-[50px]">
                            {phoneObj.dialCode || '+91'}
                          </div>
                        <input
                          type="tel"
                            className="flex-1 px-3 py-2 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={phoneObj.phone}
                          onChange={(e) => updatePhone(index, 'phone', e.target.value)}
                          required={index === 0}
                          disabled={isSubmittingContact}
                            placeholder="Enter phone number"
                        />
                        </div>
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
          isWabaDetailsEmpty={isWabaDetailsEmpty}
        />
        {/* Main Content */}
        <div className={`flex-1 ${activeTab === 'team-inbox' || activeTab === 'broadcast' || activeTab === 'channels' ? 'p-0 overflow-hidden' : 'p-4 lg:p-6'}`}>
          <div className={activeTab === 'team-inbox' || activeTab === 'broadcast' || activeTab === 'channels' ? 'w-full h-full' : 'max-w-7xl mx-auto'}>
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