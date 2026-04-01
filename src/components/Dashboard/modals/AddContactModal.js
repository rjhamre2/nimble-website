import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { apiConfig } from '../../../config/api';

const AddContactModal = ({ isOpen, onClose, onSuccess }) => {
  const { user, userData } = useAuth();
  
  // Form state - Core & Compliance
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactPhones, setContactPhones] = useState([{ phone: '', type: 'MOBILE', countryCode: 'IN', dialCode: '+91' }]);
  const [contactEmail, setContactEmail] = useState('');
  const [contactLeadStage, setContactLeadStage] = useState('NEW');
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  
  // Form state - Custom Attributes (JSONB)
  const [contactEmailType, setContactEmailType] = useState('WORK');
  const [contactAddresses, setContactAddresses] = useState([]);
  const [contactCompany, setContactCompany] = useState('');
  const [contactDepartment, setContactDepartment] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [contactUrl, setContactUrl] = useState('');
  const [contactUrlType, setContactUrlType] = useState('WORK');
  const [contactBirthday, setContactBirthday] = useState('');
  const [contactTeamAssigned, setContactTeamAssigned] = useState('marketing');
  
  // UI State
  const [contactError, setContactError] = useState('');
  const [contactSuccess, setContactSuccess] = useState('');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

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
    setWhatsappOptIn(false);
    setContactError('');
    setContactSuccess('');
  };

  const addPhone = () => setContactPhones([...contactPhones, { phone: '', type: 'MOBILE', countryCode: 'IN', dialCode: '+91' }]);
  const removePhone = (index) => setContactPhones(contactPhones.filter((_, i) => i !== index));

  const updatePhone = (index, field, value) => {
    const newPhones = [...contactPhones];
    newPhones[index] = { ...newPhones[index], [field]: value };
    if (field === 'countryCode') {
      newPhones[index].dialCode = getDialCodeFromCountry(value);
    }
    setContactPhones(newPhones);
  };

  const addAddress = () => setContactAddresses([...contactAddresses, { street: '', city: '', state: '', zip: '', country: '', country_code: '', type: 'HOME' }]);
  const removeAddress = (index) => setContactAddresses(contactAddresses.filter((_, i) => i !== index));

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
        throw new Error('First name and primary phone number are required');
      }

      // Format primary phone number (strip spaces for clean database storage)
      const primaryPhoneObj = contactPhones[0];
      const primaryPhone = primaryPhoneObj.dialCode 
        ? `${primaryPhoneObj.dialCode}${primaryPhoneObj.phone}`.replace(/\s+/g, '') 
        : primaryPhoneObj.phone.replace(/\s+/g, '');

      // Pack secondary/optional fields into the JSONB custom_attributes
      const custom_attributes = {
        alternate_phones: contactPhones.slice(1).filter(p => p.phone),
        email_type: contactEmail ? contactEmailType : null,
        addresses: contactAddresses.filter(addr => addr.street || addr.city),
        company: contactCompany || null,
        department: contactDepartment || null,
        title: contactTitle || null,
        url: contactUrl || null,
        url_type: contactUrl ? contactUrlType : null,
        birthday: contactBirthday || null,
        team_assigned: contactTeamAssigned
      };

      // Construct the new flat payload
      const payload = {
        user_id: userData?.db_id || user?.db_id || user?.uid, // Fallbacks for safety
        phone_number: primaryPhone,
        first_name: contactFirstName,
        last_name: contactLastName || null,
        email: contactEmail || null,
        type: contactLeadStage, // Mapping lead stage to the new 'type' column
        source: 'manual_entry',
        whatsapp_mkt_opt_in: whatsappOptIn,
        mkt_opt_in_date: whatsappOptIn ? new Date().toISOString() : null,
        custom_attributes
      };

      const apiUrl = apiConfig.endpoints.contacts.createContact();
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle the specific 409 Conflict error we added in the backend for duplicates
        if (response.status === 409) {
            throw new Error('A contact with this phone number already exists.');
        }
        throw new Error(result.error || 'Failed to add contact');
      }

      setContactSuccess('Contact added successfully');
      
      setTimeout(() => {
        resetContactForm();
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
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
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
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
                  value={contactLastName}
                  onChange={(e) => setContactLastName(e.target.value)}
                  disabled={isSubmittingContact}
                />
              </div>
            </div>
          </div>

          {/* Phone & Compliance Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-semibold text-gray-900">Phone & Compliance</h3>
            </div>
            {contactPhones.map((phoneObj, index) => (
              <div key={index} className="space-y-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">
                    {index === 0 ? 'Primary Phone (WhatsApp)' : `Alternate Phone ${index}`}
                  </span>
                  {contactPhones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePhone(index)}
                      className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
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
                    <div className="flex border rounded overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 bg-white">
                      <select
                        className="border-r border-gray-300 px-2 py-2 text-sm focus:outline-none bg-transparent disabled:bg-gray-100"
                        value={phoneObj.countryCode || 'IN'}
                        onChange={(e) => updatePhone(index, 'countryCode', e.target.value)}
                        disabled={isSubmittingContact}
                      >
                        <option value="IN">🇮🇳 IN</option>
                        <option value="US">🇺🇸 US</option>
                        <option value="GB">🇬🇧 GB</option>
                        <option value="CA">🇨🇦 CA</option>
                        <option value="AU">🇦🇺 AU</option>
                        {/* Add other options as needed */}
                      </select>
                      <div className="flex items-center px-2 bg-gray-50 border-r border-gray-300 text-gray-700 text-sm font-medium min-w-[50px]">
                        {phoneObj.dialCode || '+91'}
                      </div>
                      <input
                        type="tel"
                        className="flex-1 px-3 py-2 focus:outline-none disabled:bg-gray-100"
                        value={phoneObj.phone}
                        onChange={(e) => updatePhone(index, 'phone', e.target.value)}
                        required={index === 0}
                        disabled={isSubmittingContact}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  {index !== 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
                        value={phoneObj.type}
                        onChange={(e) => updatePhone(index, 'type', e.target.value)}
                        disabled={isSubmittingContact}
                      >
                        <option value="MOBILE">Mobile</option>
                        <option value="HOME">Home</option>
                        <option value="WORK">Work</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* WhatsApp Opt-in Toggle (Only for Primary Phone) */}
                {index === 0 && (
                  <div className="mt-3 flex items-center space-x-2 bg-green-50 p-2 rounded border border-green-100">
                    <input 
                      type="checkbox" 
                      id="whatsappOptIn"
                      checked={whatsappOptIn}
                      onChange={(e) => setWhatsappOptIn(e.target.checked)}
                      className="w-4 h-4 text-green-600 rounded"
                      disabled={isSubmittingContact}
                    />
                    <label htmlFor="whatsappOptIn" className="text-sm font-medium text-green-900 cursor-pointer">
                      Customer has opted-in to receive WhatsApp marketing messages
                    </label>
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addPhone}
              className="w-full px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
              disabled={isSubmittingContact}
            >
              + Add Alternate Phone
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
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  disabled={isSubmittingContact}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
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

          {/* Organization & Lead Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Organization & Pipeline</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
                  value={contactCompany}
                  onChange={(e) => setContactCompany(e.target.value)}
                  disabled={isSubmittingContact}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
                  value={contactTitle}
                  onChange={(e) => setContactTitle(e.target.value)}
                  disabled={isSubmittingContact}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lead Stage</label>
                <select
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
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
          </div>

          {contactError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded flex items-start space-x-2">
              <span>⚠️</span>
              <span>{contactError}</span>
            </div>
          )}
          
          {contactSuccess && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded flex items-start space-x-2">
              <span>✅</span>
              <span>{contactSuccess}</span>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              onClick={() => { resetContactForm(); onClose(); }}
              disabled={isSubmittingContact}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-60 flex items-center space-x-2"
              disabled={isSubmittingContact}
            >
              {isSubmittingContact ? 'Saving...' : 'Save Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContactModal;