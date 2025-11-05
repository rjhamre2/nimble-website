import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  checkWhatsAppStatus,
  getUserDashboardStatus
} from '../../services/firebaseService';
import { onboardUser } from '../../services/onboardingService';
import { useNavigate } from 'react-router-dom';
import { apiConfig } from '../../config/api';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import OnboardingBanner from './OnboardingBanner';
import Sidebar from './Sidebar';
import OverviewCards from './OverviewCards';
import LiveAgentPreview from './LiveAgentPreview';
import RecentChats from './RecentChats';
import IntegrationsPage from './IntegrationsPage';
import KnowledgeBase from './KnowledgeBase';
import AnalyticsReports from './AnalyticsReports';
import PlanBilling from './PlanBilling';
import Settings from './Settings';
import LiveChat from '../LiveChat';

// Helper function to extract country code from phone number
const getCountryCodeFromPhone = (phone) => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Common country code patterns
  const countryCodes = {
    '91': 'IN', // India
    '852': 'HK', // Hong Kong
    '1': 'US', // USA/Canada
    '44': 'GB', // UK
    '86': 'CN', // China
    '81': 'JP', // Japan
    '49': 'DE', // Germany
    '33': 'FR', // France
    '39': 'IT', // Italy
    '34': 'ES', // Spain
    '61': 'AU', // Australia
    '7': 'RU', // Russia
    '55': 'BR', // Brazil
    '52': 'MX', // Mexico
    '27': 'ZA', // South Africa
    '971': 'AE', // UAE
    '966': 'SA', // Saudi Arabia
    '65': 'SG', // Singapore
    '60': 'MY', // Malaysia
    '62': 'ID', // Indonesia
    '66': 'TH', // Thailand
    '84': 'VN', // Vietnam
    '63': 'PH', // Philippines
  };
  
  // Try to match country codes (checking longest first)
  const sortedCodes = Object.keys(countryCodes).sort((a, b) => b.length - a.length);
  for (const code of sortedCodes) {
    if (digits.startsWith(code)) {
      return countryCodes[code];
    }
  }
  
  // Default to first 1-3 digits if no match
  if (digits.length >= 3) {
    return digits.substring(0, 3);
  }
  return digits.substring(0, 1);
};

// Helper function to get country flag emoji from country code
const getCountryFlag = (countryCode) => {
  const flagMap = {
    'IN': '🇮🇳', 'HK': '🇭🇰', 'US': '🇺🇸', 'GB': '🇬🇧', 'CN': '🇨🇳',
    'JP': '🇯🇵', 'DE': '🇩🇪', 'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸',
    'AU': '🇦🇺', 'RU': '🇷🇺', 'BR': '🇧🇷', 'MX': '🇲🇽', 'ZA': '🇿🇦',
    'AE': '🇦🇪', 'SA': '🇸🇦', 'SG': '🇸🇬', 'MY': '🇲🇾', 'ID': '🇮🇩',
    'TH': '🇹🇭', 'VN': '🇻🇳', 'PH': '🇵🇭'
  };
  return flagMap[countryCode] || '🌐';
};

// Helper function to format phone number
const formatPhoneNumber = (phone, countryCode) => {
  const digits = phone.replace(/\D/g, '');
  
  // Common formatting patterns by country
  const formats = {
    'IN': (d) => d.length >= 10 ? `+91 ${d.substring(d.length - 10)}` : phone,
    'HK': (d) => d.length >= 8 ? `+852 ${d.substring(d.length - 8)}` : phone,
    'US': (d) => d.length === 10 ? `+1 (${d.substring(0, 3)}) ${d.substring(3, 6)}-${d.substring(6)}` : phone,
  };
  
  if (countryCode && formats[countryCode]) {
    return formats[countryCode](digits);
  }
  
  // Default formatting
  if (digits.length > 0) {
    return `+${digits}`;
  }
  
  return phone;
};

// Country to dial code mapping
const countryDialCodes = {
  'IN': '+91', 'US': '+1', 'GB': '+44', 'CA': '+1', 'AU': '+61',
  'DE': '+49', 'FR': '+33', 'IT': '+39', 'ES': '+34', 'NL': '+31',
  'BE': '+32', 'CH': '+41', 'AT': '+43', 'SE': '+46', 'NO': '+47',
  'DK': '+45', 'FI': '+358', 'PL': '+48', 'CZ': '+420', 'IE': '+353',
  'PT': '+351', 'GR': '+30', 'BR': '+55', 'MX': '+52', 'AR': '+54',
  'CL': '+56', 'CO': '+57', 'PE': '+51', 'VE': '+58', 'ZA': '+27',
  'EG': '+20', 'NG': '+234', 'KE': '+254', 'AE': '+971', 'SA': '+966',
  'IL': '+972', 'TR': '+90', 'JP': '+81', 'CN': '+86', 'KR': '+82',
  'SG': '+65', 'MY': '+60', 'TH': '+66', 'ID': '+62', 'PH': '+63',
  'VN': '+84', 'HK': '+852', 'TW': '+886', 'NZ': '+64', 'RU': '+7',
  'PK': '+92', 'BD': '+880', 'LK': '+94', 'NP': '+977', 'MM': '+95',
  'KH': '+855', 'LA': '+856', 'BN': '+673', 'FJ': '+679', 'PG': '+675',
  'SB': '+677', 'VU': '+678', 'NC': '+687', 'PF': '+689', 'WS': '+685',
  'TO': '+676', 'KI': '+686', 'TV': '+688', 'NR': '+674', 'PW': '+680',
  'FM': '+691', 'MH': '+692', 'AS': '+1684', 'GU': '+1671', 'MP': '+1670',
  'VI': '+1340', 'PR': '+1939', 'DO': '+1809', 'HT': '+509', 'JM': '+1876',
  'TT': '+1868', 'BB': '+1246', 'BS': '+1242', 'BZ': '+501', 'GT': '+502',
  'SV': '+503', 'HN': '+504', 'NI': '+505', 'CR': '+506', 'PA': '+507',
  'CU': '+53', 'KY': '+1345', 'BM': '+1441', 'AG': '+1268', 'LC': '+1758',
  'VC': '+1784', 'GD': '+1473', 'DM': '+1767', 'KN': '+1869', 'AI': '+1264',
  'MS': '+1664', 'VG': '+1284', 'TC': '+1649', 'AW': '+297', 'AN': '+599',
  'CW': '+599', 'SX': '+1721', 'BO': '+591', 'PY': '+595', 'UY': '+598',
  'GF': '+594', 'SR': '+597', 'GY': '+592', 'EC': '+593', 'CO': '+57',
  'PE': '+51', 'BO': '+591', 'PY': '+595', 'UY': '+598', 'CL': '+56',
  'AR': '+54', 'BR': '+55', 'VE': '+58', 'GY': '+592', 'SR': '+597',
  'GF': '+594', 'FK': '+500', 'GS': '+500', 'AQ': '+672', 'TF': '+262',
  'HM': '+672', 'CC': '+61', 'CX': '+61', 'NF': '+672', 'UM': '+1',
  'IO': '+246', 'PN': '+870', 'SH': '+290', 'AC': '+247', 'TA': '+290',
  'EH': '+212', 'MA': '+212', 'DZ': '+213', 'TN': '+216', 'LY': '+218',
  'SD': '+249', 'ET': '+251', 'ER': '+291', 'DJ': '+253', 'SO': '+252',
  'UG': '+256', 'TZ': '+255', 'RW': '+250', 'BI': '+257', 'MW': '+265',
  'ZM': '+260', 'ZW': '+263', 'BW': '+267', 'SZ': '+268', 'LS': '+266',
  'MZ': '+258', 'MG': '+261', 'MU': '+230', 'SC': '+248', 'KM': '+269',
  'YT': '+262', 'RE': '+262', 'CV': '+238', 'ST': '+239', 'AO': '+244',
  'CD': '+243', 'CG': '+242', 'GA': '+241', 'GQ': '+240', 'CM': '+237',
  'CF': '+236', 'TD': '+235', 'NE': '+227', 'ML': '+223', 'BF': '+226',
  'GH': '+233', 'TG': '+228', 'BJ': '+229', 'SN': '+221', 'GM': '+220',
  'GN': '+224', 'GW': '+245', 'SL': '+232', 'LR': '+231', 'CI': '+225',
  'MR': '+222', 'MA': '+212', 'EH': '+212', 'DZ': '+213', 'TN': '+216',
  'LY': '+218', 'SD': '+249', 'ET': '+251', 'ER': '+291', 'DJ': '+253',
  'SO': '+252', 'UG': '+256', 'TZ': '+255', 'RW': '+250', 'BI': '+257',
  'MW': '+265', 'ZM': '+260', 'ZW': '+263', 'BW': '+267', 'SZ': '+268',
  'LS': '+266', 'MZ': '+258', 'MG': '+261', 'MU': '+230', 'SC': '+248',
  'KM': '+269', 'YT': '+262', 'RE': '+262', 'CV': '+238', 'ST': '+239',
  'AO': '+244', 'CD': '+243', 'CG': '+242', 'GA': '+241', 'GQ': '+240',
  'CM': '+237', 'CF': '+236', 'TD': '+235', 'NE': '+227', 'ML': '+223',
  'BF': '+226', 'GH': '+233', 'TG': '+228', 'BJ': '+229', 'SN': '+221',
  'GM': '+220', 'GN': '+224', 'GW': '+245', 'SL': '+232', 'LR': '+231',
  'CI': '+225', 'MR': '+222'
};

const Dashboard = () => {
  const { user, userData, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('team-inbox');
  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [pricingSubscriptionStatus, setPricingSubscriptionStatus] = useState(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [isCheckingWhatsapp, setIsCheckingWhatsapp] = useState(false);
  const [broadcastView, setBroadcastView] = useState('new-broadcast');
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(false);
  const [isLoadingTraining, setIsLoadingTraining] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isEditingOnboarding, setIsEditingOnboarding] = useState(false);
  const [companyInput, setCompanyInput] = useState('');
  const [specializationInput, setSpecializationInput] = useState('');
  const [isSubmittingOnboarding, setIsSubmittingOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState('');
  const [onboardingMessage, setOnboardingMessage] = useState('');
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [activeAutomationView, setActiveAutomationView] = useState('ai-agents');
  const [teamManagementTab, setTeamManagementTab] = useState('users');
  const [activeChannel, setActiveChannel] = useState('whatsapp');
  const [accountDetailsTab, setAccountDetailsTab] = useState('account-settings');
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState(null);
  const [isEditContactModalOpen, setIsEditContactModalOpen] = useState(false);
  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvRows, setCsvRows] = useState([]);
  const [csvParseError, setCsvParseError] = useState('');
  const [mapping, setMapping] = useState({}); // header -> field
  const [importPreview, setImportPreview] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ total: 0, success: 0, failed: 0 });
  const [importResults, setImportResults] = useState([]);
  // Contacts sorting
  const [contactsSort, setContactsSort] = useState('lastUpdated');
  // Quick lead stage update loading state
  const [updatingLeadStage, setUpdatingLeadStage] = useState({});

  const LEAD_STAGES = [
    'New Lead',
    'Contacted',
    'Qualified',
    'Proposal Sent',
    'Deal Won',
    'Deal Lost'
  ];
  // Name fields
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  // Phone fields - array of objects
  const [contactPhones, setContactPhones] = useState([{ phone: '', type: 'MOBILE' }]);
  // Email fields
  const [contactEmail, setContactEmail] = useState('');
  const [contactEmailType, setContactEmailType] = useState('WORK');
  // Address fields - array of objects
  const [contactAddresses, setContactAddresses] = useState([{
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    country_code: '',
    type: 'HOME'
  }]);
  // Other fields
  const [contactBirthday, setContactBirthday] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactDepartment, setContactDepartment] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [contactUrl, setContactUrl] = useState('');
  const [contactUrlType, setContactUrlType] = useState('WORK');
  const [contactLeadStage, setContactLeadStage] = useState('New Lead');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactError, setContactError] = useState('');
  const [contactSuccess, setContactSuccess] = useState('');
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState('');
  const [contactsPagination, setContactsPagination] = useState({ total: 0, limit: 100, offset: 0, hasMore: false });
  const navigate = useNavigate();
  // First-time welcome modal
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');
  const [welcomeEmail, setWelcomeEmail] = useState('');
  const [welcomeCountry, setWelcomeCountry] = useState('IN');
  const [welcomeDialCode, setWelcomeDialCode] = useState('+91');
  const [welcomePhone, setWelcomePhone] = useState('');

  // Handle country change and update dial code
  const handleWelcomeCountryChange = (e) => {
    const selectedCountry = e.target.value;
    const newDialCode = countryDialCodes[selectedCountry] || '+1';
    setWelcomeCountry(selectedCountry);
    setWelcomeDialCode(newDialCode);
    
    // Update phone number to include new dial code if phone has value
    if (welcomePhone) {
      // Remove old dial code if present, then add new one
      const phoneWithoutDialCode = welcomePhone.replace(/^\+\d+\s*/, '');
      setWelcomePhone(`${newDialCode} ${phoneWithoutDialCode}`);
    }
  };

  // Handle phone number change
  const handleWelcomePhoneChange = (e) => {
    let value = e.target.value;
    // Remove any existing dial code pattern
    const dialCodePattern = /^\+\d+\s*/;
    const phoneWithoutDialCode = value.replace(dialCodePattern, '');
    
    // If user types a number, always prepend the current dial code
    if (phoneWithoutDialCode) {
      value = `${welcomeDialCode} ${phoneWithoutDialCode}`;
    } else {
      // If empty, just show dial code
      value = welcomeDialCode;
    }
    setWelcomePhone(value);
  };

  // Handle training status click
  const handleTrainingClick = () => {
    // Navigate to knowledge base page
    setActiveTab('knowledge');
  };

  // Handle WhatsApp status click
  const handleWhatsAppClick = () => {
    if (whatsappStatus?.success && whatsappStatus?.isIntegrated) {
      // Show phone number ID modal
      setIsWhatsAppModalOpen(true);
    } else {
      // Navigate to integrations page
      setActiveTab('integrations');
    }
  };

  // Handle subscription status click
  const handleSubscriptionClick = () => {
    setActiveTab('subscriptions');
  };

  // Handle add contact
  const handleAddContact = async (e) => {
    e?.preventDefault?.();
    
    // Validate that at least one phone number is provided
    const validPhones = contactPhones.filter(p => p.phone?.trim());
    if ((!contactFirstName?.trim() && !contactLastName?.trim()) || validPhones.length === 0) {
      setContactError('Please provide at least first or last name and at least one phone number.');
      return;
    }

    if (!user?.uid && !user?.db_id) {
      setContactError('User not authenticated.');
      return;
    }

    try {
      setIsSubmittingContact(true);
      setContactError('');
      setContactSuccess('');

      // Build formatted name
      const formattedName = [contactFirstName.trim(), contactLastName.trim()].filter(Boolean).join(' ') || contactFirstName.trim() || contactLastName.trim();
      
      // Build phones array - only include phones with valid phone numbers
      const phones = validPhones.map(phoneObj => {
        const phoneNumber = phoneObj.phone.trim().replace(/[\s\-\(\)]/g, '');
        const waId = phoneNumber.replace(/\D/g, '');
        return {
          phone: phoneNumber,
          type: phoneObj.type,
          wa_id: waId
        };
      });

      // Build contact_data object
      const contactData = {
        name: {
          formatted_name: formattedName,
          first_name: contactFirstName.trim() || '',
          last_name: contactLastName.trim() || ''
        },
        phones: phones
      };

      // Add email if provided
      if (contactEmail?.trim()) {
        contactData.emails = [{
          email: contactEmail.trim(),
          type: contactEmailType
        }];
      }

      // Add addresses - only include addresses with at least one field filled
      const validAddresses = contactAddresses.filter(addr => 
        addr.street?.trim() || addr.city?.trim() || addr.state?.trim() || 
        addr.zip?.trim() || addr.country?.trim()
      );
      if (validAddresses.length > 0) {
        contactData.addresses = validAddresses.map(addr => ({
          street: addr.street?.trim() || '',
          city: addr.city?.trim() || '',
          state: addr.state?.trim() || '',
          zip: addr.zip?.trim() || '',
          country: addr.country?.trim() || '',
          country_code: addr.country_code?.trim() || '',
          type: addr.type
        }));
      }

      // Add birthday if provided
      if (contactBirthday?.trim()) {
        contactData.birthday = contactBirthday.trim();
      }

      // Add org if any org field is provided
      if (contactCompany?.trim() || contactDepartment?.trim() || contactTitle?.trim()) {
        contactData.org = {};
        if (contactCompany?.trim()) contactData.org.company = contactCompany.trim();
        if (contactDepartment?.trim()) contactData.org.department = contactDepartment.trim();
        if (contactTitle?.trim()) contactData.org.title = contactTitle.trim();
      }

      // Add URL if provided
      if (contactUrl?.trim()) {
        contactData.urls = [{
          url: contactUrl.trim(),
          type: contactUrlType
        }];
      }

      // Add lead stage
      if (contactLeadStage) {
        contactData.lead_stage = contactLeadStage;
      }

      const url = apiConfig.endpoints.contacts.createContact();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.db_id || parseInt(user?.uid) || user?.uid,
          contact_data: contactData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create contact');
      }

      // Show success message - keep form disabled during this time
      setContactSuccess('Contact created successfully!');
      setContactError('');
      
      // Refresh contacts list after successful creation
      if (activeTab === 'contacts') {
        fetchContacts();
      }
      
      // Keep form disabled and show success message for 2.5 seconds
      setTimeout(() => {
        // Reset form
        setContactFirstName('');
        setContactLastName('');
        setContactPhones([{ phone: '', type: 'MOBILE' }]);
        setContactEmail('');
        setContactEmailType('WORK');
        setContactAddresses([{
          street: '',
          city: '',
          state: '',
          zip: '',
          country: '',
          country_code: '',
          type: 'HOME'
        }]);
        setContactBirthday('');
        setContactCompany('');
        setContactDepartment('');
        setContactTitle('');
        setContactUrl('');
        setContactUrlType('WORK');
        setContactError('');
        
        // Re-enable form only after success message is shown
        setIsSubmittingContact(false);
        
        // Close modal after a brief moment
        setTimeout(() => {
          setIsAddContactModalOpen(false);
          setContactSuccess('');
        }, 500);
      }, 2500);
    } catch (err) {
      console.error('Error creating contact:', err);
      setContactError(err?.message || 'Failed to create contact. Please try again.');
      // Re-enable form on error so user can try again
      setIsSubmittingContact(false);
    }
  };

  // Reset contact form
  const resetContactForm = () => {
    setContactFirstName('');
    setContactLastName('');
    setContactPhones([{ phone: '', type: 'MOBILE' }]);
    setContactEmail('');
    setContactEmailType('WORK');
    setContactAddresses([{
      street: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      country_code: '',
      type: 'HOME'
    }]);
    setContactBirthday('');
    setContactCompany('');
    setContactDepartment('');
    setContactTitle('');
    setContactUrl('');
    setContactUrlType('WORK');
    setContactLeadStage('New Lead');
    setContactError('');
    setContactSuccess('');
  };

  // Add another phone number
  const addPhone = () => {
    setContactPhones([...contactPhones, { phone: '', type: 'MOBILE' }]);
  };

  // Remove phone number at index
  const removePhone = (index) => {
    if (contactPhones.length > 1) {
      setContactPhones(contactPhones.filter((_, i) => i !== index));
    }
  };

  // Update phone at index
  const updatePhone = (index, field, value) => {
    const updated = [...contactPhones];
    updated[index] = { ...updated[index], [field]: value };
    setContactPhones(updated);
  };

  // Add another address
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

  // Remove address at index
  const removeAddress = (index) => {
    if (contactAddresses.length > 1) {
      setContactAddresses(contactAddresses.filter((_, i) => i !== index));
    }
  };

  // Update address at index
  const updateAddress = (index, field, value) => {
    const updated = [...contactAddresses];
    updated[index] = { ...updated[index], [field]: value };
    setContactAddresses(updated);
  };

  // --- CSV Import Helpers ---
  const knownFields = [
    { value: 'name.first_name', label: 'First Name' },
    { value: 'name.last_name', label: 'Last Name' },
    { value: 'name.formatted_name', label: 'Formatted Name' },
    { value: 'phones[0].phone', label: 'Phone' },
    { value: 'phones[0].type', label: 'Phone Type' },
    { value: 'emails[0].email', label: 'Email' },
    { value: 'emails[0].type', label: 'Email Type' },
    { value: 'birthday', label: 'Birthday (YYYY-MM-DD)' },
    { value: 'org.company', label: 'Company' },
    { value: 'org.department', label: 'Department' },
    { value: 'org.title', label: 'Title' },
    { value: 'addresses[0].street', label: 'Street' },
    { value: 'addresses[0].city', label: 'City' },
    { value: 'addresses[0].state', label: 'State' },
    { value: 'addresses[0].zip', label: 'Zip' },
    { value: 'addresses[0].country', label: 'Country' },
    { value: 'addresses[0].country_code', label: 'Country Code' },
    { value: 'addresses[0].type', label: 'Address Type' },
    { value: 'urls[0].url', label: 'URL' },
    { value: 'urls[0].type', label: 'URL Type' },
    { value: 'lead_stage', label: 'Lead Stage' },
  ];

  const guessFieldForHeader = (header) => {
    const h = (header || '').toLowerCase().trim();
    if (/first/.test(h)) return 'name.first_name';
    if (/last/.test(h)) return 'name.last_name';
    if (/name/.test(h)) return 'name.formatted_name';
    if (/phone|mobile|whats/.test(h)) return 'phones[0].phone';
    if (/phone.*type/.test(h)) return 'phones[0].type';
    if (/email/.test(h) && /type/.test(h)) return 'emails[0].type';
    if (/email/.test(h)) return 'emails[0].email';
    if (/birthday|dob/.test(h)) return 'birthday';
    if (/company|org/.test(h)) return 'org.company';
    if (/department/.test(h)) return 'org.department';
    if (/title|designation/.test(h)) return 'org.title';
    if (/street|address1|line1/.test(h)) return 'addresses[0].street';
    if (/city/.test(h)) return 'addresses[0].city';
    if (/state/.test(h)) return 'addresses[0].state';
    if (/zip|pincode|postal/.test(h)) return 'addresses[0].zip';
    if (/country code/.test(h)) return 'addresses[0].country_code';
    if (/country/.test(h)) return 'addresses[0].country';
    if (/address.*type/.test(h)) return 'addresses[0].type';
    if (/url|website/.test(h)) return 'urls[0].url';
    if (/url.*type/.test(h)) return 'urls[0].type';
    if (/lead.*stage|stage/.test(h)) return 'lead_stage';
    return '';
  };

  const parseCsv = (text) => {
    // Simple CSV parser handling quotes and commas
    const rows = [];
    let cur = '';
    let inQuotes = false;
    let row = [];
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];
      if (c === '"') {
        if (inQuotes && next === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push(cur);
        cur = '';
      } else if ((c === '\n' || c === '\r') && !inQuotes) {
        if (cur.length > 0 || row.length > 0) {
          row.push(cur);
          rows.push(row);
          row = [];
          cur = '';
        }
        // handle \r\n
        if (c === '\r' && next === '\n') i++;
      } else {
        cur += c;
      }
    }
    if (cur.length > 0 || row.length > 0) {
      row.push(cur);
      rows.push(row);
    }
    return rows;
  };

  const handleCsvFile = async (file) => {
    setCsvParseError('');
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (!rows || rows.length === 0) {
        setCsvParseError('CSV appears to be empty.');
        return;
      }
      const headers = rows[0].map(h => (h || '').trim());
      const dataRows = rows.slice(1).filter(r => r.some(cell => (cell || '').trim().length > 0));
      setCsvHeaders(headers);
      setCsvRows(dataRows);
      // auto mapping
      const autoMap = {};
      headers.forEach(h => { autoMap[h] = guessFieldForHeader(h); });
      setMapping(autoMap);
    } catch (e) {
      setCsvParseError(e?.message || 'Failed to parse CSV file.');
    }
  };

  const setDeep = (obj, path, value) => {
    if (!path) return;
    // paths like phones[0].phone
    const parts = path.replace(/\]/g, '').split(/\.|\[/);
    let cur = obj;
    for (let i = 0; i < parts.length; i++) {
      const key = parts[i];
      const isLast = i === parts.length - 1;
      if (key === '') continue;
      if (isLast) {
        cur[key] = value;
      } else {
        if (!(key in cur)) {
          const nextKey = parts[i + 1];
          cur[key] = /\d+/.test(nextKey) ? [] : {};
        }
        cur = cur[key];
      }
    }
  };

  // --- Contacts sort helpers ---
  const getContactDisplayName = (c) => {
    const cd = c.contact_data || {};
    const name = cd.name || {};
    const display = name.formatted_name || `${name.first_name || ''} ${name.last_name || ''}`.trim();
    return (display || '').toLowerCase();
  };

  const buildContactDataFromRow = (row) => {
    const contactData = { name: {}, phones: [], emails: [], addresses: [], org: {}, urls: [] };
    csvHeaders.forEach((header, idx) => {
      const field = mapping[header];
      if (!field) return;
      const value = (row[idx] || '').trim();
      if (value === '') return;
      // special handling for arrays
      if (field.startsWith('phones[') && !contactData.phones[0]) contactData.phones[0] = {};
      if (field.startsWith('emails[') && !contactData.emails[0]) contactData.emails[0] = {};
      if (field.startsWith('addresses[') && !contactData.addresses[0]) contactData.addresses[0] = {};
      if (field.startsWith('urls[') && !contactData.urls[0]) contactData.urls[0] = {};
      setDeep(contactData, field, value);
    });
    // derive formatted_name if missing
    if (!contactData.name.formatted_name) {
      const fn = contactData.name.first_name || '';
      const ln = contactData.name.last_name || '';
      const formatted = `${fn} ${ln}`.trim();
      if (formatted) contactData.name.formatted_name = formatted;
    }
    // default lead stage when not provided in CSV mapping
    if (!contactData.lead_stage) {
      contactData.lead_stage = 'New Lead';
    }
    // cleanup empty arrays
    if (contactData.phones.length === 0) delete contactData.phones;
    if (contactData.emails.length === 0) delete contactData.emails;
    if (contactData.addresses.length === 0) delete contactData.addresses;
    if (!contactData.org.company && !contactData.org.department && !contactData.org.title) delete contactData.org;
    if (contactData.urls.length === 0) delete contactData.urls;
    if (!contactData.birthday) delete contactData.birthday;
    return contactData;
  };

  const recomputePreview = () => {
    const preview = csvRows.slice(0, 5).map(buildContactDataFromRow);
    setImportPreview(preview);
  };

  const handleChangeMapping = (header, field) => {
    const next = { ...mapping, [header]: field };
    setMapping(next);
    // recompute preview lazily
    setTimeout(recomputePreview, 0);
  };

  // --- Export Helpers ---
  const escapeCsv = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const buildCsvFromContacts = (items) => {
    const headers = [
      'formatted_name','first_name','last_name',
      'phone','phone_type','email','email_type','birthday','lead_stage',
      'company','department','title',
      'street','city','state','zip','country','country_code','address_type',
      'url','url_type',
      'contact_id','created_at','updated_at'
    ];
    const lines = [headers.join(',')];
    for (const c of items) {
      const cd = c.contact_data || {};
      const name = cd.name || {};
      const phone = (cd.phones && cd.phones[0]) || {};
      const email = (cd.emails && cd.emails[0]) || {};
      const addr = (cd.addresses && cd.addresses[0]) || {};
      const org = cd.org || {};
      const url = (cd.urls && cd.urls[0]) || {};
      const row = [
        name.formatted_name || '',
        name.first_name || '',
        name.last_name || '',
        phone.phone || '',
        phone.type || '',
        email.email || '',
        email.type || '',
        cd.birthday || '',
        cd.lead_stage || '',
        org.company || '',
        org.department || '',
        org.title || '',
        addr.street || '',
        addr.city || '',
        addr.state || '',
        addr.zip || '',
        addr.country || '',
        addr.country_code || '',
        addr.type || '',
        url.url || '',
        url.type || '',
        c.contact_id || '',
        c.created_at || '',
        c.updated_at || ''
      ].map(escapeCsv);
      lines.push(row.join(','));
    }
    return lines.join('\n');
  };

  const handleExportCsv = () => {
    if (!contacts || contacts.length === 0) {
      alert('No contacts to export.');
      return;
    }
    const csv = buildCsvFromContacts(contacts);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
    link.download = `contacts-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleStartImport = async () => {
    if (!csvRows.length) return;
    const dbId = user?.db_id || userData?.db_id;
    if (!dbId) {
      setCsvParseError('Missing user db_id.');
      return;
    }
    setIsImporting(true);
    setImportProgress({ total: csvRows.length, success: 0, failed: 0 });
    setImportResults([]);
    let success = 0, failed = 0;
    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const contactData = buildContactDataFromRow(row);
      try {
        const url = apiConfig.endpoints.contacts.createContact();
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: dbId, contact_data: contactData })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || data.message || 'Create failed');
        success++;
        setImportResults(prev => [...prev, { index: i, status: 'success', id: data?.data?.contact_id }]);
      } catch (e) {
        failed++;
        setImportResults(prev => [...prev, { index: i, status: 'failed', error: e?.message }]);
      }
      setImportProgress({ total: csvRows.length, success, failed });
    }
    // refresh contacts
    fetchContacts();
    setIsImporting(false);
  };

  // --- Quick Update Lead Stage ---
  const handleQuickUpdateLeadStage = async (contactId, newStage) => {
    if (!contactId || !newStage) return;
    try {
      setUpdatingLeadStage(prev => ({ ...prev, [contactId]: true }));
      const url = apiConfig.endpoints.contacts.updateContact(contactId);
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_data: { lead_stage: newStage } })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to update lead stage');
      }
      // Update local contacts array to reflect new stage
      setContacts(prev => prev.map(c => (
        c.contact_id === contactId
          ? { ...c, contact_data: { ...(c.contact_data || {}), lead_stage: newStage } }
          : c
      )));
    } catch (e) {
      console.error('Quick update lead_stage failed:', e);
      alert(e?.message || 'Failed to update lead stage.');
    } finally {
      setUpdatingLeadStage(prev => ({ ...prev, [contactId]: false }));
    }
  };

  // Handle edit contact - populate form with existing data
  const handleEditContact = (contact) => {
    const contactData = contact.contact_data || {};
    const name = contactData.name || {};
    const phones = contactData.phones || [];
    const addresses = contactData.addresses || [];
    const emails = contactData.emails || [];
    const org = contactData.org || {};
    const urls = contactData.urls || [];

    // Set name fields
    setContactFirstName(name.first_name || '');
    setContactLastName(name.last_name || '');

    // Set phone fields
    if (phones.length > 0) {
      setContactPhones(phones.map(p => ({
        phone: p.phone || '',
        type: p.type || 'MOBILE'
      })));
    } else {
      setContactPhones([{ phone: '', type: 'MOBILE' }]);
    }

    // Set email fields
    if (emails.length > 0) {
      setContactEmail(emails[0].email || '');
      setContactEmailType(emails[0].type || 'WORK');
    } else {
      setContactEmail('');
      setContactEmailType('WORK');
    }

    // Set address fields
    if (addresses.length > 0) {
      setContactAddresses(addresses.map(addr => ({
        street: addr.street || '',
        city: addr.city || '',
        state: addr.state || '',
        zip: addr.zip || '',
        country: addr.country || '',
        country_code: addr.country_code || '',
        type: addr.type || 'HOME'
      })));
    } else {
      setContactAddresses([{
        street: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        country_code: '',
        type: 'HOME'
      }]);
    }

    // Set other fields
    setContactBirthday(contactData.birthday || '');
    setContactCompany(org.company || '');
    setContactDepartment(org.department || '');
    setContactTitle(org.title || '');

    // Set URL fields
    if (urls.length > 0) {
      setContactUrl(urls[0].url || '');
      setContactUrlType(urls[0].type || 'WORK');
    } else {
      setContactUrl('');
      setContactUrlType('WORK');
    }

    // Clear errors
    setContactError('');
    setContactSuccess('');

    // Set editing contact ID and open modal
    setEditingContactId(contact.contact_id);
    setIsEditContactModalOpen(true);
  };

  // Handle update contact
  const handleUpdateContact = async (e) => {
    e?.preventDefault?.();
    
    if (!editingContactId) {
      setContactError('No contact selected for editing.');
      return;
    }

    // Validate that at least one phone number is provided
    const validPhones = contactPhones.filter(p => p.phone?.trim());
    if ((!contactFirstName?.trim() && !contactLastName?.trim()) || validPhones.length === 0) {
      setContactError('Please provide at least first or last name and at least one phone number.');
      return;
    }

    try {
      setIsSubmittingContact(true);
      setContactError('');
      setContactSuccess('');

      // Build formatted name
      const formattedName = [contactFirstName.trim(), contactLastName.trim()].filter(Boolean).join(' ') || contactFirstName.trim() || contactLastName.trim();
      
      // Build phones array
      const phones = validPhones.map(phoneObj => {
        const phoneNumber = phoneObj.phone.trim().replace(/[\s\-\(\)]/g, '');
        const waId = phoneNumber.replace(/\D/g, '');
        return {
          phone: phoneNumber,
          type: phoneObj.type,
          wa_id: waId
        };
      });

      // Build contact_data object
      const contactData = {
        name: {
          formatted_name: formattedName,
          first_name: contactFirstName.trim() || '',
          last_name: contactLastName.trim() || ''
        },
        phones: phones
      };

      // Add email if provided
      if (contactEmail?.trim()) {
        contactData.emails = [{
          email: contactEmail.trim(),
          type: contactEmailType
        }];
      }

      // Add addresses
      const validAddresses = contactAddresses.filter(addr => 
        addr.street?.trim() || addr.city?.trim() || addr.state?.trim() || 
        addr.zip?.trim() || addr.country?.trim()
      );
      if (validAddresses.length > 0) {
        contactData.addresses = validAddresses.map(addr => ({
          street: addr.street?.trim() || '',
          city: addr.city?.trim() || '',
          state: addr.state?.trim() || '',
          zip: addr.zip?.trim() || '',
          country: addr.country?.trim() || '',
          country_code: addr.country_code?.trim() || '',
          type: addr.type
        }));
      }

      // Add birthday if provided
      if (contactBirthday?.trim()) {
        contactData.birthday = contactBirthday.trim();
      }

      // Add org if any org field is provided
      if (contactCompany?.trim() || contactDepartment?.trim() || contactTitle?.trim()) {
        contactData.org = {};
        if (contactCompany?.trim()) contactData.org.company = contactCompany.trim();
        if (contactDepartment?.trim()) contactData.org.department = contactDepartment.trim();
        if (contactTitle?.trim()) contactData.org.title = contactTitle.trim();
      }

      // Add URL if provided
      if (contactUrl?.trim()) {
        contactData.urls = [{
          url: contactUrl.trim(),
          type: contactUrlType
        }];
      }

      // Add lead stage
      if (contactLeadStage) {
        contactData.lead_stage = contactLeadStage;
      }

      const url = apiConfig.endpoints.contacts.updateContact(editingContactId);
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact_data: contactData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to update contact');
      }

      // Show success message
      setContactSuccess('Contact updated successfully!');
      setContactError('');
      
      // Refresh contacts list after successful update
      if (activeTab === 'contacts') {
        fetchContacts();
      }
      
      // Keep form disabled and show success message for 2.5 seconds
      setTimeout(() => {
        // Reset form
        resetContactForm();
        setEditingContactId(null);
        
        // Re-enable form only after success message is shown
        setIsSubmittingContact(false);
        
        // Close modal after a brief moment
        setTimeout(() => {
          setIsEditContactModalOpen(false);
          setContactSuccess('');
        }, 500);
      }, 2500);
    } catch (err) {
      console.error('Error updating contact:', err);
      setContactError(err?.message || 'Failed to update contact. Please try again.');
      setIsSubmittingContact(false);
    }
  };

  // Handle delete contact
  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      return;
    }

    try {
      const url = apiConfig.endpoints.contacts.deleteContact(contactId);
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to delete contact');
      }

      // Refresh contacts list after successful deletion
      if (activeTab === 'contacts') {
        fetchContacts();
      }
    } catch (err) {
      console.error('Error deleting contact:', err);
      alert(err?.message || 'Failed to delete contact. Please try again.');
    }
  };

  // Fetch contacts from API
  const fetchContacts = async () => {
    const dbId = user?.db_id || userData?.db_id;
    if (!dbId) {
      console.warn('No db_id available to fetch contacts');
      return;
    }

    try {
      setContactsLoading(true);
      setContactsError('');
      const url = apiConfig.endpoints.contacts.getUserContacts(dbId);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      let data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to fetch contacts');
      }

      // Handle the response format
      // Based on the API response, it can be:
      // 1. An array directly: [{contact_id: "...", ...}, ...]
      // 2. An object with data and pagination: {data: [...], pagination: {...}}
      // 3. An array with pagination property at root (though this is invalid JSON, handle gracefully)
      let contactsArray = [];
      let pagination = { total: 0, limit: 100, offset: 0, hasMore: false };
      
      if (Array.isArray(data)) {
        // Response is directly an array
        contactsArray = data;
        pagination = { total: data.length, limit: 100, offset: 0, hasMore: false };
      } else if (data && typeof data === 'object') {
        // Response is an object - check for data array and pagination
        if (Array.isArray(data.data)) {
          contactsArray = data.data;
          pagination = data.pagination || { total: data.data.length, limit: 100, offset: 0, hasMore: false };
        } else if (data.pagination) {
          // Pagination exists but data might be at root level
          pagination = data.pagination;
          // Try to find the array - might be in a 'data' property or directly accessible
          const possibleArrays = Object.values(data).filter(Array.isArray);
          contactsArray = possibleArrays.length > 0 ? possibleArrays[0] : [];
        } else {
          // No clear structure, try to extract any array
          const possibleArrays = Object.values(data).filter(Array.isArray);
          contactsArray = possibleArrays.length > 0 ? possibleArrays[0] : [];
          pagination = { total: contactsArray.length, limit: 100, offset: 0, hasMore: false };
        }
      }
      
      setContacts(contactsArray);
      setContactsPagination(pagination);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setContactsError(err?.message || 'Failed to fetch contacts. Please try again.');
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  };

  // Handle tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    
    // If dashboard tab is clicked, refresh modal status
    if (tabId === 'dashboard') {
      refreshDashboardStatus();
    }
    
    // If contacts tab is clicked, fetch contacts
    if (tabId === 'contacts') {
      fetchContacts();
    }
  };

  // Handle onboarding status click
  const handleOnboardingClick = () => {
    setOnboardingError('');
    setOnboardingMessage('');
    setCompanyInput(userData?.company || '');
    setSpecializationInput(userData?.specialization || '');
    setIsEditingOnboarding(false);
    setIsOnboardingModalOpen(true);
  };

  // Compute border colors for status cards
  const whatsappBorderClass = (() => {
    if (whatsappStatus?.success && whatsappStatus?.isIntegrated) return 'border-green-500';
    if (whatsappStatus === null) return 'border-gray-300';
    return 'border-yellow-400';
  })();

  const onboardingBorderClass = (() => {
    if (onboardingStatus?.status === 'completed') return 'border-green-500';
    //if (!onboardingStatus) return 'border-gray-300';
    return 'border-yellow-400';
  })();

  const trainingBorderClass = (() => {
    const s = trainingStatus?.status;
    if (s === 'completed') return 'border-green-500';
    //if (s === 'not_started' || !s) return 'border-gray-300';
    return 'border-yellow-400';
  })();

  const subscriptionBorderClass = (() => {
    if (isLoadingSubscription) return 'border-blue-500';
    const s = (pricingSubscriptionStatus?.status || '').toLowerCase();
    if (s === 'authenticated' || s === 'active') return 'border-green-500';
    if (s === 'inactive' || s === 'not_created' || !s) return 'border-gray-300';
    return 'border-yellow-400';
  })();

  const handleOnboardingSubmit = async (e) => {
    e?.preventDefault?.();
    if (!companyInput?.trim() || !specializationInput?.trim()) {
      setOnboardingError('Please provide both company and specialization.');
      return;
    }
    try {
      setIsSubmittingOnboarding(true);
      setOnboardingError('');
      setOnboardingMessage('');
      await onboardUser(companyInput.trim(), specializationInput.trim());
      setOnboardingMessage('Onboarding updated successfully.');
      // Refresh dashboard status
      const dashboard = await getUserDashboardStatus(user.uid);
      setOnboardingStatus(dashboard?.onboarding || null);
      setTrainingStatus(dashboard?.training || null);
      setSubscriptionDetails(dashboard?.subscription || null);
    } catch (err) {
      setOnboardingError(err?.message || 'Failed to update onboarding.');
    } finally {
      setIsSubmittingOnboarding(false);
    }
  };

  // Fetch subscription status from pricing lambda
  const fetchPricingSubscriptionStatus = async () => {
    if (!user?.uid) return;
    
    setIsLoadingSubscription(true);
    try {
      console.log('🔍 Fetching subscription status from pricing lambda for user:', user.uid);
      const response = await fetch(apiConfig.endpoints.pricing.fetchSubscriptionStatus(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.uid
        })
      });

      const data = await response.json();
      console.log('✅ Pricing subscription status response:', data);
      
      if (data.success) {
        setPricingSubscriptionStatus(data);
      } else {
        console.error('❌ Failed to fetch pricing subscription status:', data.error);
        setPricingSubscriptionStatus(null);
      }
    } catch (error) {
      console.error('❌ Error fetching pricing subscription status:', error);
      setPricingSubscriptionStatus(null);
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  // Refresh dashboard status
  const refreshDashboardStatus = async () => {
    if (!user?.uid) return;
    
    setIsLoadingOnboarding(true);
    setIsLoadingTraining(true);
    try {
      const dashboard = await getUserDashboardStatus(user.uid);
      setOnboardingStatus(dashboard?.onboarding || null);
      setTrainingStatus(dashboard?.training || null);
      setSubscriptionDetails(dashboard?.subscription || null);
    } catch (error) {
      console.error('Error refreshing dashboard status:', error);
    } finally {
      setIsLoadingOnboarding(false);
      setIsLoadingTraining(false);
    }
  };

  // Refresh all statuses including WhatsApp and pricing subscription
  const refreshAllStatuses = async () => {
    if (!user?.uid) return;
    
    setIsCheckingWhatsapp(true);
    setIsLoadingOnboarding(true);
    setIsLoadingTraining(true);
    try {
      const [wa, ob, tr, sub, pricingSub] = await Promise.all([
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
      console.error('Error refreshing all statuses:', error);
    } finally {
      setIsCheckingWhatsapp(false);
      setIsLoadingOnboarding(false);
      setIsLoadingTraining(false);
    }
  };

  // Check for first-time user and show welcome modal
  const checkWelcomeModal = useCallback(() => {
    // Get user data from localStorage if not available from props
    let localUserData = userData || user;
    if (!localUserData) {
      try {
        const stored = localStorage.getItem('userData');
        localUserData = stored ? JSON.parse(stored) : null;
      } catch {
        localUserData = null;
      }
    }
    
    // Prefill welcome modal fields
    if (localUserData) {
      const displayName = localUserData?.displayName || '';
      const email = localUserData?.email || '';
      setWelcomeName(displayName);
      setWelcomeEmail(email);
    }
    
    // First-time modal gating based on auth response or persisted flag
    // Check localStorage first (set during sign-in from /google API response)
    const storedFirstTime = localStorage.getItem('nimble_first_time');
    const isFirstTime = storedFirstTime === '1';
    const userUid = localUserData?.uid || userData?.uid || user?.uid || 'anon';
    const shownKey = `nimble_welcome_shown_${userUid}`;
    let alreadyShown = localStorage.getItem(shownKey) === '1';
    
    // If firstTime is true from API, clear the alreadyShown flag (might be stale from previous incomplete sign-in)
    if (isFirstTime && alreadyShown) {
      console.log('🔄 Clearing stale alreadyShown flag for first-time user');
      localStorage.removeItem(shownKey);
      alreadyShown = false;
    }
    
    console.log('🎯 Welcome modal check:', {
      hasUser: !!localUserData,
      storedFirstTime,
      isFirstTime,
      shownKey,
      alreadyShown,
      userUid,
      shouldShow: !!localUserData && isFirstTime && !alreadyShown,
      currentModalState: isWelcomeModalOpen
    });
    
    if (localUserData && isFirstTime && !alreadyShown) {
      // Show welcome form for first-time users
      console.log('✅ Showing welcome modal for first-time user');
      setIsWelcomeModalOpen(true);
    } else if (isWelcomeModalOpen && (!isFirstTime || alreadyShown)) {
      // Hide modal if conditions no longer met
      console.log('❌ Hiding welcome modal - conditions not met');
      setIsWelcomeModalOpen(false);
    }
  }, [user, userData, isWelcomeModalOpen]);

  useEffect(() => {
    checkWelcomeModal();
  }, [checkWelcomeModal]);

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
                                <div>WATI Test</div>
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
                        <td className="px-4 py-2 text-gray-900">User Wati</td>
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
                        <td className="px-4 py-2 text-gray-900">User Wati</td>
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
                        <td className="px-4 py-2 text-gray-900">User Wati</td>
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
                        <td className="px-4 py-2 text-gray-900">User Wati</td>
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
                    You are trialing Pro plan. Select the plan you want to purchase. To disconnect your WhatsApp business number from Wati visit <span className="text-blue-600 hover:underline cursor-pointer">Whatsapp Manager</span>
                    </p>
                  </div>

                {/* Zero subscription card */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex flex-col lg:flex-row gap-6 items-start">
                    <div className="flex-1 space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900">Zero subscription, pay-as-you-go plan</h3>
                      <p className="text-sm text-gray-600">Cheapest plan if you send up to ~2,100 messages in 3 months.</p>
                      <div className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-100 text-yellow-800">New <span className="text-gray-700">Sync your WhatsApp Business App with Wati to chat and send campaigns seamlessly, together.</span></div>
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
                        onChange={handleWelcomeCountryChange}
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
                      <div className="flex items-center px-3 bg-gray-50 border-r border-gray-300 text-gray-700 text-base">
                        {welcomeDialCode}
                      </div>
                      <input
                        type="tel"
                        className="flex-1 px-4 py-3 text-base focus:outline-none"
                        value={welcomePhone.replace(/^\+\d+\s*/, '') || ''}
                        onChange={(e) => {
                          const phoneWithoutDialCode = e.target.value;
                          setWelcomePhone(phoneWithoutDialCode ? `${welcomeDialCode} ${phoneWithoutDialCode}` : '');
                        }}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  By signing up, you agree to the Terms & Conditions and Privacy Policy, and consent to receive marketing communications from NimbleAI and our service partners. Your information will also be shared with NimbleAI's Service Partners to facilitate your NimbleAI signup, product inquiries and enable your use of the NimbleAI service.
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base font-medium"
                    onClick={() => {
                      // Placeholder action for trial start. Integrate with backend when available.
                      console.log('Start trial with:', { welcomeName, welcomeEmail, welcomeCountry, welcomeDialCode, welcomePhone });
                      const key = `nimble_welcome_shown_${userData?.uid || user?.uid || 'anon'}`;
                      localStorage.setItem(key, '1');
                      localStorage.removeItem('nimble_first_time');
                      setIsWelcomeModalOpen(false);
                    }}
                  >
                    Start my trial
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