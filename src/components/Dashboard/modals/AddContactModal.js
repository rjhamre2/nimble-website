import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { apiConfig } from '../../../config/api';

const AddContactModal = ({ isOpen, onClose, onSuccess }) => {
  const { user, userData } = useAuth();
  
  // Form state
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
  const [contactBirthday, setContactBirthday] = useState('');
  const [contactLeadStage, setContactLeadStage] = useState('NEW');
  const [contactTeamAssigned, setContactTeamAssigned] = useState('marketing'); // 'marketing' | 'sales' | 'support'
  const [contactError, setContactError] = useState('');
  const [contactSuccess, setContactSuccess] = useState('');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // Helper function to get dial code from country code
  const getDialCodeFromCountry = (countryCode) => {
    const countryDialCodes = {
      'IN': '+91', 'US': '+1', 'GB': '+44', 'CA': '+1', 'AU': '+61',
      'DE': '+49', 'FR': '+33', 'IT': '+39', 'ES': '+34', 'BR': '+55',
      'MX': '+52', 'JP': '+81', 'CN': '+86', 'KR': '+82', 'SG': '+65',
      'MY': '+60', 'TH': '+66', 'ID': '+62', 'PH': '+63', 'VN': '+84',
      'HK': '+852', 'TW': '+886', 'NZ': '+64', 'AE': '+971', 'SA': '+966',
      'ZA': '+27', 'RU': '+7', 'PK': '+92', 'BD': '+880', 'LK': '+94',
      'NP': '+977', 'MM': '+95'
    };
    return countryDialCodes[countryCode] || '+1';
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
    setContactBirthday('');
    setContactLeadStage('NEW');
    setContactTeamAssigned('marketing');
    setContactError('');
    setContactSuccess('');
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
    
    if (field === 'countryCode') {
      newPhones[index].dialCode = getDialCodeFromCountry(value);
    }
    
    setContactPhones(newPhones);
  };

  const addAddress = () => {
    setContactAddresses([...contactAddresses, {
      street: '', city: '', state: '', zip: '', country: '', country_code: '', type: 'HOME'
    }]);
  };

  const removeAddress = (index) => {
    setContactAddresses(contactAddresses.filter((_, i) => i !== index));
  };

  const updateAddress = (index, field, value) => {
    const newAddresses = [...contactAddresses];
    newAddresses[index] = { ...newAddresses[index], [field]: value };
    setContactAddresses(newAddresses);
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    
    setIsSubmittingContact(true);
    setContactError('');
    setContactSuccess('');
    
    try {
      if (!contactFirstName || !contactPhones[0]?.phone) {
        throw new Error('First name and phone number are required');
      }

      const dbServerUrl = apiConfig.dbServerConfig.baseURL;
      if (!dbServerUrl) {
        throw new Error('Server configuration error.');
      }

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
        lead_stage: contactLeadStage || 'NEW',
        team_assigned: contactTeamAssigned || 'marketing'
      };

      const apiUrl = apiConfig.endpoints.contacts.createContact();
      
      console.log('🌐 [Add Contact] Calling API:', apiUrl);

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
      
      // Call onSuccess callback and close modal after a short delay
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('❌ [Add Contact] Error:', error);
      setContactError(error.message || 'Failed to add contact');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Add Contact</h2>
          <button
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              resetContactForm();
              onClose();
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
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Birthday (Optional)</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  disabled={isSubmittingContact}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={address.city}
                      onChange={(e) => updateAddress(index, 'city', e.target.value)}
                      disabled={isSubmittingContact}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={address.zip}
                      onChange={(e) => updateAddress(index, 'zip', e.target.value)}
                      disabled={isSubmittingContact}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={address.country}
                      onChange={(e) => updateAddress(index, 'country', e.target.value)}
                      disabled={isSubmittingContact}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country Code</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={contactCompany}
                  onChange={(e) => setContactCompany(e.target.value)}
                  disabled={isSubmittingContact}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={contactDepartment}
                  onChange={(e) => setContactDepartment(e.target.value)}
                  disabled={isSubmittingContact}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
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
                <option value="NEW">New Lead</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL">Proposal Sent</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="WON">Deal Won</option>
                <option value="LOST">Deal Lost</option>
              </select>
            </div>
          </div>

          {/* Team Assigned & URL Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team assigned <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={contactTeamAssigned}
                  onChange={(e) => setContactTeamAssigned(e.target.value)}
                  disabled={isSubmittingContact}
                >
                  <option value="marketing">Marketing</option>
                  <option value="sales">Sales</option>
                  <option value="support">Support</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Used to route this contact to the right team.
                </p>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">URL Information (Optional)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={contactUrl}
                  onChange={(e) => setContactUrl(e.target.value)}
                  disabled={isSubmittingContact}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
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
                <p className="text-xs text-green-600 mt-1">The contact has been saved to your contact list.</p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              onClick={() => {
                resetContactForm();
                onClose();
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
  );
};

export default AddContactModal;
