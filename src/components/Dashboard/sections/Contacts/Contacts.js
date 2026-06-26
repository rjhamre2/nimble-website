import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { apiConfig } from '../../../../config/api';
import AddContactModal from '../../modals/AddContactModal';
import EditContactModal from '../../modals/EditContactModal';
import ImportContactsModal from '../../modals/ImportContactsModal';
import { Button } from "../../../ui/button";
import { 
  Users, 
  Download, 
  Upload, 
  Edit2, 
  Trash2,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

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
  const [contactsSort, setContactsSort] = useState('lastUpdated');
  const [updatingLeadStage, setUpdatingLeadStage] = useState(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Modal states
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isEditContactModalOpen, setIsEditContactModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  
  // ==========================================
  // DEBOUNCED LIVE SEARCH EFFECT
  // (Must be at the top level of the component)
  // ==========================================
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (activeSearch !== searchQuery) {
        setActiveSearch(searchQuery);
        fetchContacts(1, searchQuery); 
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]); 

  // Initial Fetch on Load
  useEffect(() => {
    fetchContacts();
  }, [userData, user]);

  // Utility functions mapped to the new structured schema
  const getContactDisplayName = (contact) => {
    const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    if (fullName) return fullName;
    return contact.phone_number || 'Unknown Contact';
  };

  const getCountryCodeFromPhone = (phone) => {
    if (phone && phone.includes('+')) {
      if (phone.startsWith('+1')) return 'US';
      if (phone.startsWith('+91')) return 'IN';
      if (phone.startsWith('+44')) return 'GB';
      if (phone.startsWith('+61')) return 'AU';
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
    return phone.length >= 10 ? phone.replace(/(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3') : phone;
  };

  // Fetch contacts (Standard Async Function)
  const fetchContacts = async (page = 1, search = '') => {
    const dbId = userData?.db_id || user?.db_id || user?.uid; 
    if (!dbId) {
      console.log('⚠️ No user ID found, cannot fetch contacts');
      return;
    }

    setContactsLoading(true);
    setContactsError(null);
    try {
      const limit = 20;
      const offset = (page - 1) * limit;
      
      let baseUrl = apiConfig.endpoints.contacts.getUserContacts(dbId);
      let separator = baseUrl.includes('?') ? '&' : '?';
      
      let apiUrl = `${baseUrl}${separator}page=${page}&offset=${offset}&limit=${limit}`;
      
      if (search) {
        apiUrl += `&search=${encodeURIComponent(search)}`;
      }
      
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
        throw new Error(errorData.error || `Failed to fetch contacts: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setContacts(result.data);
        const totalContacts = result.pagination?.total || result.data.length || 0;
        
        setContactsPagination({
          page: page,
          limit: limit,
          total: totalContacts,
          offset: offset,
        });
      } else {
        setContacts([]);
        setContactsPagination(prev => ({ ...prev, total: 0 }));
      }
    } catch (error) {
      console.error('❌ [Fetch Contacts] Error:', error);
      setContactsError(error.message || 'Failed to fetch contacts');
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  };

  // Handle Pagination 
  const handleNextPage = () => {
    if (contactsPagination.offset + contactsPagination.limit < contactsPagination.total) {
      if (contacts.length === contactsPagination.total && contacts.length > contactsPagination.limit) {
        setContactsPagination(prev => ({
          ...prev,
          page: prev.page + 1,
          offset: prev.offset + prev.limit
        }));
      } else {
        fetchContacts(contactsPagination.page + 1, activeSearch);
      }
    }
  };

  const handlePrevPage = () => {
    if (contactsPagination.page > 1) {
      if (contacts.length === contactsPagination.total && contacts.length > contactsPagination.limit) {
        setContactsPagination(prev => ({
          ...prev,
          page: prev.page - 1,
          offset: prev.offset - prev.limit
        }));
      } else {
        fetchContacts(contactsPagination.page - 1, activeSearch);
      }
    }
  };

  const [isSyncingShopify, setIsSyncingShopify] = useState(false);

  const handleShopifySync = async () => {
    const dbId = userData?.db_id || user?.db_id || user?.uid; 
    if (!dbId) {
      alert('User context missing. Cannot sync.');
      return;
    }

    setIsSyncingShopify(true);
    
    try {
      const apiUrl = `${apiConfig.baseUrl || 'http://localhost:3003'}/api/shopify/sync-customers`; 
      const token = localStorage.getItem('authToken');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ uid: dbId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to sync with Shopify');
      }

      await fetchContacts(contactsPagination.page, activeSearch);
      alert('Successfully synced contacts from Shopify!'); 
      
    } catch (error) {
      console.error('❌ [Shopify Sync] Error:', error);
      alert(error.message);
    } finally {
      setIsSyncingShopify(false);
    }
  };

  const handleQuickUpdateLeadStage = async (contactId, newStage) => {
    setUpdatingLeadStage({ [contactId]: true });
    try {
      const apiUrl = apiConfig.endpoints.contacts.updateContact(contactId);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ type: newStage }),
      });

      if (!response.ok) {
        throw new Error('Failed to update lead stage');
      }

      setContacts(prevContacts => 
        prevContacts.map(c => 
          c.contact_id === contactId 
            ? { ...c, type: newStage }
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

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      const apiUrl = apiConfig.endpoints.contacts.deleteContact(contactId);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) throw new Error('Failed to delete contact');
      
      fetchContacts(contactsPagination.page, activeSearch);
    } catch (error) {
      console.error('❌ [Delete Contact] Error:', error);
      alert(`Failed to delete contact: ${error.message}`);
    }
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setIsEditContactModalOpen(true);
  };

  const handleExportCsv = () => {
    try {
      if (contacts.length === 0) {
        alert('No contacts to export');
        return;
      }

      const headers = ['Name', 'First Name', 'Last Name', 'Phone', 'Email', 'Company', 'Title', 'Lead Stage', 'Source'];
      
      const rows = contacts.map(contact => {
        const displayName = getContactDisplayName(contact);
        const customAttrs = contact.custom_attributes || {};
        
        return [
          displayName,
          contact.first_name || '',
          contact.last_name || '',
          contact.phone_number || '',
          contact.email || '',
          customAttrs.company || '',
          customAttrs.title || '',
          contact.type || 'NEW',
          contact.source || 'Manual'
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
      
    } catch (error) {
      console.error('❌ [Export CSV] Error:', error);
      alert('Failed to export contacts. Please try again.');
    }
  };

  // If a search is active, trust the backend's Smart Relevance Ranking.
  // Otherwise, apply the user's selected dropdown sort (Alpha or Date).
  const isSearching = searchQuery.trim().length > 0;

  const sortedContacts = isSearching
    ? contacts // 🛑 TRUST THE BACKEND: No client-side sorting during search
    : contactsSort === 'alpha'
      ? [...contacts].sort((a, b) => {
          const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
          const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
          if (!nameA && !nameB) return 0;
          if (!nameA) return 1; 
          if (!nameB) return -1;
          return nameA.localeCompare(nameB);
        })
      : [...contacts].sort((a, b) => (new Date(b.updated_at || 0)) - (new Date(a.updated_at || 0)));

  const displayContacts = contacts.length > contactsPagination.limit
    ? sortedContacts.slice(contactsPagination.offset, contactsPagination.offset + contactsPagination.limit)
    : sortedContacts;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0A0A0A] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#25D366]" />
            Contacts
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your audience, lead segments, and broadcast recipients.
          </p>
        </div>
      </div>

      {/* Main Content Box */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-[#F9FAFB] flex flex-col xl:flex-row items-center justify-between gap-4">
          
          {/* Action Buttons Group & Live Search */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto flex-wrap">
            
            {/* CORRECTED SEARCH BAR: Removed Form, Removed onSubmit={handleSearch} */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search global contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366] transition-all"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <Button 
              variant="hero"
              onClick={() => setIsAddContactModalOpen(true)}
              // We keep the green overrides and hover animations, but drop the layout classes
              className="w-full sm:w-auto  hover:bg-[#22c55e] text-white hover:scale-[1.02] shadow-[0_0_20px_rgba(37,211,102,0.2)] transition-all rounded-lg"
            >
              <span>Add Contact</span>
              <span className="text-xs bg-black/10 px-2 py-0.5 rounded-full font-bold">
                {contactsPagination.total || contacts.length}
              </span>
            </Button>
            
            <Button 
              variant="hero"
              onClick={handleShopifySync}
              disabled={isSyncingShopify}
              className="w-full sm:w-auto hover:-translate-y-0.5 transition-all shadow-sm rounded-lg"
            >
              {isSyncingShopify ? (
                <Loader2 className="w-4 h-4 text-[#95BF47] animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-4 h-4 fill-[#95BF47]">
                   {/* ... path data ... */}
                </svg>
              )}
              <span>{isSyncingShopify ? 'Syncing...' : 'Sync from Shopify'}</span>
            </Button>
          </div>

          {/* Filtering and Import/Export Tools */}
          <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-[#25D366]/50 transition-all">
              <span className="text-xs text-gray-500 font-medium">Sort:</span>
              <select
  className="text-sm text-[#0A0A0A] bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
  value={searchQuery.trim().length > 0 ? "relevance" : contactsSort}
  onChange={(e) => setContactsSort(e.target.value)}
  disabled={searchQuery.trim().length > 0} 
>
  {searchQuery.trim().length > 0 && (
    <option value="relevance">Search Relevance</option>
  )}
  <option value="lastUpdated">Last Updated</option>
  <option value="alpha">Alphabetical (A–Z)</option>
</select>
            </div>
            
            <Button
              variant="hero"
              size="sm"
              onClick={handleExportCsv}
              title="Export CSV"
            >
              <Download className="w-4 h-4 text-gray-500" />
              <span className="hidden sm:inline">Export</span>
            </Button>

            <Button
              variant="hero"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              title="Import CSV"
            >
              <Upload className="w-4 h-4 text-gray-500" />
              <span className="hidden sm:inline">Import</span>
            </Button>
          </div>
        </div>

        {/* Table View */}
        <div className="w-full overflow-x-auto">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-white border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[800px]">
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Phone Number</div>
            <div className="col-span-2">Source</div>
            <div className="col-span-2">Lead Stage</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="divide-y divide-gray-50 min-w-[800px]">
            {contactsLoading && displayContacts.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-gray-500">
                <Loader2 className="w-8 h-8 text-[#25D366] animate-spin mb-4" />
                <p className="text-sm font-medium">Loading contacts...</p>
              </div>
            ) : contactsError ? (
              <div className="p-8 text-center text-red-600 text-sm bg-red-50/50">
                {contactsError}
              </div>
            ) : displayContacts.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-[#0A0A0A] mb-1">No contacts found</h3>
                <p className="text-sm text-gray-500 mb-4">No contacts matched your criteria or you haven't added any yet.</p>
              </div>
            ) : (
              displayContacts.map((contact) => {
                const displayName = getContactDisplayName(contact);
                const phoneNumber = contact.phone_number || '';
                const countryCode = phoneNumber ? getCountryCodeFromPhone(phoneNumber) : '';
                const countryFlag = countryCode ? getCountryFlag(countryCode) : '';
                const formattedPhone = phoneNumber ? formatPhoneNumber(phoneNumber) : 'No phone';
                
                const leadStage = contact.type || 'NEW';
                
                return (
                  <div key={contact.contact_id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-[#F9FAFB] transition-colors group">
                    <div className="col-span-3">
                      <div className="text-sm font-semibold text-[#0A0A0A] truncate pr-2" title={displayName}>
                        {displayName}
                      </div>
                    </div>
                    
                    <div className="col-span-3 flex items-center gap-2 text-sm text-gray-600">
                      {countryFlag && <span title={countryCode} className="text-base">{countryFlag}</span>}
                      <span className="truncate">{formattedPhone}</span>
                    </div>
                    
                    <div className="col-span-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                        {contact.source ? contact.source.replace('_', ' ') : 'Manual'}
                      </span>
                    </div>
                    
                    <div className="col-span-2">
                      <select
                        className="w-full bg-white border border-gray-200 rounded-md px-2 py-1.5 text-xs text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366] disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                        value={leadStage}
                        onChange={(e) => handleQuickUpdateLeadStage(contact.contact_id, e.target.value)}
                        disabled={updatingLeadStage && !!updatingLeadStage[contact.contact_id]}
                      >
                        {LEAD_STAGES.map(stage => (
                          <option key={stage} value={stage}>{stage}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-span-2 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEditContact(contact)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit Contact"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteContact(contact.contact_id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete Contact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Pagination Details & Controls */}
          <div className="px-6 py-4 border-t border-gray-100 bg-[#F9FAFB] min-w-[800px] flex items-center justify-between">
            <div className="text-xs text-gray-500 font-medium">
              Showing {contacts.length > 0 ? contactsPagination.offset + 1 : 0} to {Math.min(contactsPagination.offset + contactsPagination.limit, contactsPagination.total)} of {contactsPagination.total} results
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrevPage}
                disabled={contactsPagination.page === 1}
                className="flex items-center justify-center p-1.5 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="sr-only">Previous</span>
              </button>
              
              <div className="text-xs font-medium text-gray-700">
                Page {contactsPagination.page}
              </div>
              
              <button 
                onClick={handleNextPage}
                disabled={contactsPagination.offset + contactsPagination.limit >= contactsPagination.total}
                className="flex items-center justify-center p-1.5 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
                <span className="sr-only">Next</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isAddContactModalOpen && (
        <AddContactModal
          isOpen={isAddContactModalOpen}
          onClose={() => setIsAddContactModalOpen(false)}
          onSuccess={() => {
            setIsAddContactModalOpen(false);
            fetchContacts(contactsPagination.page, activeSearch);
          }}
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
          onSuccess={() => {
            setIsEditContactModalOpen(false);
            fetchContacts(contactsPagination.page, activeSearch);
          }}
        />
      )}

      {isImportModalOpen && (
        <ImportContactsModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            setIsImportModalOpen(false);
            fetchContacts(contactsPagination.page, activeSearch);
          }}
        />
      )}
    </div>
  );
};

export default Contacts;