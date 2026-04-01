import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { apiConfig } from '../../../config/api';

const EditContactModal = ({ isOpen, contact, onClose, onSuccess }) => {
  const { user, userData } = useAuth();
  
  // Form state - Core
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactPhones, setContactPhones] = useState([{ phone: '', type: 'MOBILE', countryCode: 'IN', dialCode: '+91' }]);
  const [contactEmail, setContactEmail] = useState('');
  const [contactLeadStage, setContactLeadStage] = useState('NEW');
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  
  // Form state - Custom Attributes
  const [contactEmailType, setContactEmailType] = useState('WORK');
  const [contactAddresses, setContactAddresses] = useState([]);
  const [contactCompany, setContactCompany] = useState('');
  const [contactDepartment, setContactDepartment] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [contactUrl, setContactUrl] = useState('');
  const [contactUrlType, setContactUrlType] = useState('WORK');
  const [contactBirthday, setContactBirthday] = useState('');
  
  // UI state
  const [contactError, setContactError] = useState('');
  const [contactSuccess, setContactSuccess] = useState('');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  const getDialCodeFromCountry = (countryCode) => {
    const countryDialCodes = {
      'IN': '+91', 'US': '+1', 'GB': '+44', 'CA': '+1', 'AU': '+61',
      'DE': '+49', 'FR': '+33', 'IT': '+39', 'ES': '+34', 'BR': '+55',
      'MX': '+52', 'JP': '+81', 'CN': '+86', 'KR': '+82', 'SG': '+65',
      'MY': '+60', 'TH': '+66', 'ID': '+62', 'PH': '+63', 'VN': '+84'
    };
    return countryDialCodes[countryCode] || '+1';
  };

  const parsePhoneNumber = (phoneNumber) => {
    let phone = phoneNumber || '';
    let countryCode = 'IN';
    let dialCode = '+91';
    
    if (phone.startsWith('+')) {
      const dialCodes = {
        '+91': 'IN', '+1': 'US', '+44': 'GB', '+61': 'AU', '+49': 'DE',
        '+33': 'FR', '+39': 'IT', '+34': 'ES', '+55': 'BR', '+52': 'MX',
      };
      const sortedCodes = Object.keys(dialCodes).sort((a, b) => b.length - a.length);
      for (const code of sortedCodes) {
        if (phone.startsWith(code)) {
          dialCode = code;
          countryCode = dialCodes[code];
          phone = phone.substring(code.length).trim();
          break;
        }
      }
    }
    return { phone, countryCode, dialCode };
  };

  // Load contact data from structured schema
  useEffect(() => {
    if (isOpen && contact) {
      const customAttrs = contact.custom_attributes || {};
      
      // Parse primary phone
      const primaryParsed = parsePhoneNumber(contact.phone_number);
      const primaryPhoneObj = {
        phone: primaryParsed.phone,
        type: 'MOBILE',
        countryCode: primaryParsed.countryCode,
        dialCode: primaryParsed.dialCode
      };

      // Merge primary phone with alternate phones from custom_attributes
      const alternatePhones = customAttrs.alternate_phones || [];
      const allPhones = [primaryPhoneObj, ...alternatePhones.map(p => {
        const parsed = parsePhoneNumber(p.phone);
        return { ...parsed, type: p.type || 'MOBILE' };
      })];
      
      setContactFirstName(contact.first_name || '');
      setContactLastName(contact.last_name || '');
      setContactPhones(allPhones);
      setContactEmail(contact.email || '');
      setContactLeadStage(contact.type || 'NEW');
      setWhatsappOptIn(contact.whatsapp_mkt_opt_in || false);
      
      setContactEmailType(customAttrs.email_type || 'WORK');
      setContactAddresses(customAttrs.addresses || []);
      setContactCompany(customAttrs.company || '');
      setContactDepartment(customAttrs.department || '');
      setContactTitle(customAttrs.title || '');
      setContactUrl(customAttrs.url || '');
      setContactUrlType(customAttrs.url_type || 'WORK');
      setContactBirthday(customAttrs.birthday || '');
      
      setContactError('');
      setContactSuccess('');
    }
  }, [isOpen, contact]);

  const resetContactForm = () => { /* Logic matches AddContactModal */ onClose(); };
  const addPhone = () => setContactPhones([...contactPhones, { phone: '', type: 'MOBILE', countryCode: 'IN', dialCode: '+91' }]);
  const removePhone = (index) => setContactPhones(contactPhones.filter((_, i) => i !== index));
  const updatePhone = (index, field, value) => {
    const newPhones = [...contactPhones];
    newPhones[index] = { ...newPhones[index], [field]: value };
    if (field === 'countryCode') newPhones[index].dialCode = getDialCodeFromCountry(value);
    setContactPhones(newPhones);
  };
  const addAddress = () => setContactAddresses([...contactAddresses, { street: '', city: '', state: '', zip: '', country: '', country_code: '', type: 'HOME' }]);
  const removeAddress = (index) => setContactAddresses(contactAddresses.filter((_, i) => i !== index));
  const updateAddress = (index, field, value) => {
    const newAddresses = [...contactAddresses];
    newAddresses[index] = { ...newAddresses[index], [field]: value };
    setContactAddresses(newAddresses);
  };

  const handleUpdateContact = async (e) => {
    e.preventDefault();
    if (!contact?.contact_id) return;
    
    setIsSubmittingContact(true);
    setContactError('');
    setContactSuccess('');
    
    try {
      if (!contactFirstName || !contactPhones[0]?.phone) {
        throw new Error('First name and primary phone number are required');
      }

      const primaryPhoneObj = contactPhones[0];
      const primaryPhone = primaryPhoneObj.dialCode 
        ? `${primaryPhoneObj.dialCode}${primaryPhoneObj.phone}`.replace(/\s+/g, '') 
        : primaryPhoneObj.phone.replace(/\s+/g, '');

      // Repackage custom attributes
      const custom_attributes = {
        alternate_phones: contactPhones.slice(1).filter(p => p.phone),
        email_type: contactEmail ? contactEmailType : null,
        addresses: contactAddresses.filter(addr => addr.street || addr.city),
        company: contactCompany || null,
        department: contactDepartment || null,
        title: contactTitle || null,
        url: contactUrl || null,
        url_type: contactUrl ? contactUrlType : null,
        birthday: contactBirthday || null
      };

      // Construct flat payload for update
      const updatePayload = {
        phone_number: primaryPhone,
        first_name: contactFirstName,
        last_name: contactLastName || null,
        email: contactEmail || null,
        type: contactLeadStage,
        whatsapp_mkt_opt_in: whatsappOptIn,
        // Only update opt-in date if it transitioned to true and didn't have one
        ...(whatsappOptIn && !contact.mkt_opt_in_date ? { mkt_opt_in_date: new Date().toISOString() } : {}),
        custom_attributes
      };

      const apiUrl = apiConfig.endpoints.contacts.updateContact(contact.contact_id);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(updatePayload),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) throw new Error('Another contact already uses this phone number.');
        throw new Error(result.error || 'Failed to update contact');
      }

      setContactSuccess('Contact updated successfully');
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('❌ [Update Contact] Error:', error);
      setContactError(error.message || 'Failed to update contact');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  if (!isOpen || !contact) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Edit Contact</h2>
          <button className="text-gray-500 hover:text-gray-700 disabled:opacity-50" onClick={onClose} disabled={isSubmittingContact}>✕</button>
        </div>

        <form className={`space-y-6 ${isSubmittingContact ? 'opacity-60' : ''}`} onSubmit={handleUpdateContact}>
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
                <input type="text" className="w-full border rounded px-3 py-2" value={contactFirstName} onChange={(e) => setContactFirstName(e.target.value)} disabled={isSubmittingContact} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input type="text" className="w-full border rounded px-3 py-2" value={contactLastName} onChange={(e) => setContactLastName(e.target.value)} disabled={isSubmittingContact} />
              </div>
            </div>
          </div>

          {/* Phone Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Phone & Compliance</h3>
            {contactPhones.map((phoneObj, index) => (
              <div key={index} className="space-y-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">{index === 0 ? 'Primary Phone (WhatsApp)' : `Alternate Phone ${index}`}</span>
                  {contactPhones.length > 1 && (
                    <button type="button" onClick={() => removePhone(index)} className="text-xs text-red-600 hover:text-red-700" disabled={isSubmittingContact}>Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 flex border rounded overflow-hidden bg-white">
                    <select className="border-r px-2 py-2 text-sm bg-transparent" value={phoneObj.countryCode} onChange={(e) => updatePhone(index, 'countryCode', e.target.value)} disabled={isSubmittingContact}>
                      <option value="IN">🇮🇳 IN</option>
                      <option value="US">🇺🇸 US</option>
                      <option value="GB">🇬🇧 GB</option>
                      <option value="CA">🇨🇦 CA</option>
                      <option value="AU">🇦🇺 AU</option>
                    </select>
                    <div className="flex items-center px-2 bg-gray-50 border-r text-sm">{phoneObj.dialCode}</div>
                    <input type="tel" className="flex-1 px-3 py-2 focus:outline-none" value={phoneObj.phone} onChange={(e) => updatePhone(index, 'phone', e.target.value)} required={index === 0} disabled={isSubmittingContact} />
                  </div>
                  {index !== 0 && (
                    <select className="border rounded px-3 py-2" value={phoneObj.type} onChange={(e) => updatePhone(index, 'type', e.target.value)} disabled={isSubmittingContact}>
                      <option value="MOBILE">Mobile</option>
                      <option value="HOME">Home</option>
                      <option value="WORK">Work</option>
                    </select>
                  )}
                </div>
                {index === 0 && (
                  <div className="mt-3 flex items-center space-x-2 bg-green-50 p-2 rounded border border-green-100">
                    <input type="checkbox" id="whatsappOptInEdit" checked={whatsappOptIn} onChange={(e) => setWhatsappOptIn(e.target.checked)} className="w-4 h-4 text-green-600 rounded" disabled={isSubmittingContact} />
                    <label htmlFor="whatsappOptInEdit" className="text-sm font-medium text-green-900 cursor-pointer">WhatsApp Marketing Opt-In</label>
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={addPhone} className="w-full px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50" disabled={isSubmittingContact}>+ Add Alternate Phone</button>
          </div>

          {/* Email & Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full border rounded px-3 py-2" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} disabled={isSubmittingContact} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead Stage</label>
              <select className="w-full border rounded px-3 py-2" value={contactLeadStage} onChange={(e) => setContactLeadStage(e.target.value)} disabled={isSubmittingContact}>
                <option value="NEW">New Lead</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="WON">Deal Won</option>
                <option value="LOST">Deal Lost</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input type="text" className="w-full border rounded px-3 py-2" value={contactCompany} onChange={(e) => setContactCompany(e.target.value)} disabled={isSubmittingContact} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" className="w-full border rounded px-3 py-2" value={contactTitle} onChange={(e) => setContactTitle(e.target.value)} disabled={isSubmittingContact} />
            </div>
          </div>

          {contactError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">⚠️ {contactError}</div>}
          {contactSuccess && <div className="text-sm text-green-700 bg-green-50 p-3 rounded">✅ {contactSuccess}</div>}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded" onClick={onClose} disabled={isSubmittingContact}>Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded" disabled={isSubmittingContact}>{isSubmittingContact ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditContactModal;