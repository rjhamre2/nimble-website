import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { apiConfig } from '../../../../config/api';
import AddContactModal from '../../modals/AddContactModal';
import EditContactModal from '../../modals/EditContactModal';
import ImportContactsModal from '../../modals/ImportContactsModal';

const LEAD_STAGES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST'
];

const Contacts = () => {
  const { user, userData } = useAuth();
  
  // Contact list state
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState(null);
  const [contactsPagination, setContactsPagination] = useState({ page: 1, limit: 20, total: 0, offset: 0 });
  const [contactsSort, setContactsSort] = useState('name');
  const [updatingLeadStage, setUpdatingLeadStage] = useState(null);
  
  // Modal states
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isEditContactModalOpen, setIsEditContactModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  
  // Utility functions
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
    if (phone && phone.length > 0) {
      return phone.substring(0, 2);
    }
    return '';
  };

  const getCountryFlag = (countryCode) => {
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
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  // Fetch contacts
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

  // Fetch contacts on mount
  useEffect(() => {
    fetchContacts();
  }, [userData, user]);

  // Handle quick lead stage update
  const handleQuickUpdateLeadStage = async (contactId, newStage) => {
    setUpdatingLeadStage({ [contactId]: true });
    try {
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

  // Handle delete contact
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

      await fetchContacts();
    } catch (error) {
      console.error('❌ [Delete Contact] Error:', error);
      alert(`Failed to delete contact: ${error.message}`);
    }
  };

  // Handle edit contact
  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setIsEditContactModalOpen(true);
  };

  // Handle export CSV
  const handleExportCsv = () => {
    try {
      if (contacts.length === 0) {
        alert('No contacts to export');
        return;
      }

      const headers = ['Name', 'First Name', 'Last Name', 'Phone', 'Email', 'Company', 'Title', 'Lead Stage', 'Source'];
      
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

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

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
            onClick={() => setIsAddContactModalOpen(true)}
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
                const formattedPhone = phoneNumber ? formatPhoneNumber(phoneNumber) : 'No phone';
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

      {/* Modals */}
      {isAddContactModalOpen && (
        <AddContactModal
          isOpen={isAddContactModalOpen}
          onClose={() => setIsAddContactModalOpen(false)}
          onSuccess={fetchContacts}
        />
      )}

      {isEditContactModalOpen && editingContact && (
        <EditContactModal
          isOpen={isEditContactModalOpen}
          contact={editingContact}
          onClose={() => {
            setIsEditContactModalOpen(false);
            setEditingContact(null);
          }}
          onSuccess={fetchContacts}
        />
      )}

      {isImportModalOpen && (
        <ImportContactsModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={fetchContacts}
        />
      )}
    </div>
  );
};

export default Contacts;

