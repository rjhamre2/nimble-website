import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PhotoIcon, DocumentIcon, XMarkIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline';
import { apiConfig } from '../config/api';
import { useRef } from 'react';

// --- SHARED UI HELPERS ---
const getSharedInputClass = (isDarkMode) => `w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
  isDarkMode 
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
    : 'bg-white border-gray-300 text-gray-900'
}`;

const getSharedLabelClass = (isDarkMode) => `block text-sm font-medium mb-1 ${
  isDarkMode ? 'text-gray-300' : 'text-gray-700'
}`;

// ------------------------------------------------------------------
// 1. REPLY BUTTONS BUILDER
// ------------------------------------------------------------------
export const ReplyButtonsBuilder = ({ isDarkMode, onSubmit, onClose }) => {
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [buttons, setButtons] = useState(['']); 

  const handleAddButton = () => {
    if (buttons.length < 3) setButtons([...buttons, '']);
  };

  const handleRemoveButton = (index) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const handleButtonChange = (index, value) => {
    const newButtons = [...buttons];
    newButtons[index] = value.substring(0, 20); // Meta limit: 20 chars
    setButtons(newButtons);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validButtons = buttons.filter(b => b.trim() !== '');
    
    if (!bodyText.trim() || validButtons.length === 0) {
      alert("Please provide a message body and at least one button.");
      return;
    }

    onSubmit({
      type: 'reply-buttons',
      payload: { body: bodyText, buttons: validButtons, footer: footerText || undefined }
    });
  };

  const inputClass = getSharedInputClass(isDarkMode);
  const labelClass = getSharedLabelClass(isDarkMode);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>Message Body <span className="text-red-500">*</span></label>
        <textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          placeholder="e.g., Are you satisfied with your resolution?"
          rows="3"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className={labelClass}>Buttons (Max 3) <span className="text-red-500">*</span></label>
        <div className="space-y-2">
          {buttons.map((btn, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={btn}
                onChange={(e) => handleButtonChange(idx, e.target.value)}
                placeholder={`Button ${idx + 1} (Max 20 chars)`}
                className={inputClass}
                required
              />
              {buttons.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => handleRemoveButton(idx)}
                  className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-red-400 hover:bg-gray-600' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
        
        {buttons.length < 3 && (
          <button
            type="button"
            onClick={handleAddButton}
            className={`mt-2 flex items-center gap-1 text-sm font-medium ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
          >
            <PlusIcon className="w-4 h-4" /> Add Button
          </button>
        )}
      </div>

      <div>
        <label className={labelClass}>Footer text (Optional)</label>
        <input
          type="text"
          value={footerText}
          onChange={(e) => setFooterText(e.target.value)}
          placeholder="e.g., Reply STOP to unsubscribe"
          className={inputClass}
        />
      </div>

      <div className={`pt-4 border-t flex justify-end gap-2 mt-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          type="button"
          onClick={onClose}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          Send Message
        </button>
      </div>
    </form>
  );
};

// ... (keep existing ReplyButtonsBuilder and shared helpers)

// ------------------------------------------------------------------
// 2. MEDIA BUILDER (Image, Video, Document, Audio)
// ------------------------------------------------------------------
export const MediaBuilder = ({ isDarkMode, onSubmit, onClose }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create a local preview URL for images/videos
      if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        setPreviewUrl(null); // No visual preview for docs/audio
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file to send.");
      return;
    }

    // Determine the WhatsApp media type
    let mediaType = 'document';
    if (file.type.startsWith('image/')) mediaType = 'image';
    if (file.type.startsWith('video/')) mediaType = 'video';
    if (file.type.startsWith('audio/')) mediaType = 'audio';

    onSubmit({
      type: 'media',
      payload: {
        file: file,
        mediaType: mediaType,
        caption: caption,
        localPreview: previewUrl // We pass this to show instantly in the UI before upload finishes
      }
    });
  };

  const inputClass = getSharedInputClass(isDarkMode);
  const labelClass = getSharedLabelClass(isDarkMode);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* File Selection Area */}
      <div>
        <label className={labelClass}>Attachment <span className="text-red-500">*</span></label>
        
        {!file ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`mt-1 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              isDarkMode ? 'border-gray-600 hover:border-blue-500 bg-gray-800' : 'border-gray-300 hover:border-blue-500 bg-gray-50'
            }`}
          >
            <PhotoIcon className="w-10 h-10 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-500">Click to browse files</p>
            <p className="text-xs text-gray-400 mt-1">Images, Videos, Audio, or Documents</p>
          </div>
        ) : (
          <div className={`mt-1 rounded-xl p-4 border relative ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
            <button 
              type="button" 
              onClick={() => { setFile(null); setPreviewUrl(null); }}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
            
            {previewUrl && file.type.startsWith('image/') ? (
              <img src={previewUrl} alt="Preview" className="w-full h-40 object-contain rounded-lg mb-2" />
            ) : previewUrl && file.type.startsWith('video/') ? (
              <video src={previewUrl} className="w-full h-40 object-contain rounded-lg mb-2" controls />
            ) : (
              <div className="w-full h-24 flex flex-col items-center justify-center">
                <DocumentIcon className="w-12 h-12 text-blue-500 mb-2" />
                <p className="text-sm font-medium truncate w-full text-center px-4">{file.name}</p>
              </div>
            )}
            
            <p className="text-xs text-center text-gray-400 mt-2">
              {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown type'}
            </p>
          </div>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />
      </div>

      {/* Caption Input */}
      <div>
        <label className={labelClass}>Caption (Optional)</label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption..."
          className={inputClass}
        />
      </div>

      <div className={`pt-4 border-t flex justify-end gap-2 mt-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Cancel
        </button>
        <button type="submit" disabled={!file} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          Upload & Send
        </button>
      </div>
    </form>
  );
};

// ------------------------------------------------------------------
// 3. LOCATION BUILDER
// ------------------------------------------------------------------
export const LocationBuilder = ({ isDarkMode, onSubmit, onClose }) => {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!latitude || !longitude) {
      alert("Latitude and Longitude are required.");
      return;
    }

    onSubmit({
      type: 'send-location',
      payload: { 
        latitude: parseFloat(latitude), 
        longitude: parseFloat(longitude), 
        name: name.trim(), 
        address: address.trim() 
      }
    });
  };

  const inputClass = getSharedInputClass(isDarkMode);
  const labelClass = getSharedLabelClass(isDarkMode);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-500">
          <MapPinIcon className="w-6 h-6" />
        </div>
        <div>
          <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Send Location</h4>
          <p className="text-xs text-gray-500">Share a pinned location with the customer.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Latitude <span className="text-red-500">*</span></label>
          <input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="e.g. 28.7041" className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Longitude <span className="text-red-500">*</span></label>
          <input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="e.g. 77.1025" className={inputClass} required />
        </div>
      </div>

      <div>
        <label className={labelClass}>Location Name (Optional)</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. NimbleAI HQ" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Address Details (Optional)</label>
        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 123 Tech Park, Block A" className={inputClass} />
      </div>

      <div className={`pt-4 border-t flex justify-end gap-2 mt-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
          Send Location
        </button>
      </div>
    </form>
  );
};

// ------------------------------------------------------------------
// 4. REQUEST LOCATION BUILDER
// ------------------------------------------------------------------
export const RequestLocationBuilder = ({ isDarkMode, onSubmit, onClose }) => {
  const [bodyText, setBodyText] = useState('Please share your location to proceed 📍');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bodyText.trim()) return;

    onSubmit({
      type: 'request-location',
      payload: { body: bodyText }
    });
  };

  const inputClass = getSharedInputClass(isDarkMode);
  const labelClass = getSharedLabelClass(isDarkMode);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-full border border-red-200 border-dashed text-red-400">
          <MapPinIcon className="w-6 h-6" />
        </div>
        <div>
          <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Request Location</h4>
          <p className="text-xs text-gray-500">Sends a native "Share Location" button to the user.</p>
        </div>
      </div>

      <div>
        <label className={labelClass}>Message Body <span className="text-red-500">*</span></label>
        <textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          rows="3"
          className={inputClass}
          required
        />
      </div>

      <div className={`pt-4 border-t flex justify-end gap-2 mt-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
          Send Request
        </button>
      </div>
    </form>
  );
};

// ------------------------------------------------------------------
// 5. CONTACT BUILDER
// ------------------------------------------------------------------
export const ContactBuilder = ({ isDarkMode, onSubmit, onClose }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);

  // Reusing your exact fetch logic from Contacts.js
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        // Get user data from local storage
        const userString = localStorage.getItem('user') || localStorage.getItem('userData');
        if (!userString) throw new Error("User not found");
        
        const user = JSON.parse(userString);
        const dbId = user.db_id || user.uid;
        
        // IMPORTANT: Adjust this path to match how you import apiConfig in this file!
        // If apiConfig isn't imported, replace this with your direct backend URL string.
        // const apiUrl = apiConfig.endpoints.contacts.getUserContacts(dbId);
        const DB_BASE_URL = process.env.REACT_APP_DB_SERVER_URL || 'http://localhost:3000';
        const apiUrl = `${DB_BASE_URL}/api/contacts/user/${dbId}`; // Fallback URL

        const token = localStorage.getItem('authToken');
        const response = await fetch(apiUrl, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });

        const result = await response.json();
        if (result.success && result.data) {
          setContacts(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch contacts for modal:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const filteredContacts = contacts.filter(c => {
    const name = c.contact_data?.name?.formatted_name || c.contact_data?.name?.first_name || '';
    const phone = c.contact_data?.phones?.[0]?.phone || '';
    const search = searchQuery.toLowerCase();
    return name.toLowerCase().includes(search) || phone.includes(search);
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedContact) return;

    // Format for Meta's Contact API
    const contactData = selectedContact.contact_data || {};
    const formattedPayload = {
      name: {
        formatted_name: contactData.name?.formatted_name || `${contactData.name?.first_name || ''} ${contactData.name?.last_name || ''}`.trim() || 'Unknown',
        first_name: contactData.name?.first_name || 'Unknown'
      },
      phones: [{
        phone: contactData.phones?.[0]?.phone || '',
        type: "WORK"
      }]
    };

    onSubmit({
      type: 'send-contact',
      payload: formattedPayload
    });
  };

  const inputClass = getSharedInputClass(isDarkMode);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 h-[60vh]">
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-full text-teal-500">
          <UserIcon className="w-6 h-6" />
        </div>
        <div>
          <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Send Contact</h4>
          <p className="text-xs text-gray-500">Select a saved contact to share.</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search contacts..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={`${inputClass} shrink-0`}
      />

      <div className={`flex-1 overflow-y-auto border rounded-lg ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">Loading contacts...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">No contacts found.</div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredContacts.map(c => {
              const name = c.contact_data?.name?.formatted_name || `${c.contact_data?.name?.first_name || ''} ${c.contact_data?.name?.last_name || ''}`.trim() || 'No Name';
              const phone = c.contact_data?.phones?.[0]?.phone || 'No phone';
              const isSelected = selectedContact?.contact_id === c.contact_id;
              
              return (
                <div 
                  key={c.contact_id}
                  onClick={() => setSelectedContact(c)}
                  className={`p-3 cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected 
                      ? (isDarkMode ? 'bg-teal-900/40' : 'bg-teal-50') 
                      : (isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-white')
                  }`}
                >
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{name}</p>
                    <p className="text-xs text-gray-500">{phone}</p>
                  </div>
                  {isSelected && <div className="w-4 h-4 rounded-full bg-teal-500 border-2 border-white dark:border-gray-800"></div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={`pt-4 border-t flex justify-end gap-2 mt-2 shrink-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
          Cancel
        </button>
        <button type="submit" disabled={!selectedContact} className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 disabled:opacity-50">
          Send Contact
        </button>
      </div>
    </form>
  );
};

// ------------------------------------------------------------------
// 6. REQUEST ADDRESS BUILDER
// ------------------------------------------------------------------
export const RequestAddressBuilder = ({ isDarkMode, onSubmit, onClose }) => {
  const [bodyText, setBodyText] = useState('Hi there, please confirm your delivery address below 👇');
  const [country, setCountry] = useState('IN'); // Default to India based on your payload

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bodyText.trim() || !country.trim()) return;

    onSubmit({
      type: 'request-address',
      payload: { 
        body: bodyText,
        country: country.toUpperCase() 
      }
    });
  };

  const inputClass = getSharedInputClass(isDarkMode);
  const labelClass = getSharedLabelClass(isDarkMode);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
          <DocumentIcon className="w-6 h-6" />
        </div>
        <div>
          <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Request Address</h4>
          <p className="text-xs text-gray-500">Sends a native Meta address form to the user.</p>
        </div>
      </div>

      <div>
        <label className={labelClass}>Message Body <span className="text-red-500">*</span></label>
        <textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          rows="3"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className={labelClass}>Country Code (ISO 3166-1 alpha-2) <span className="text-red-500">*</span></label>
        <input
          type="text"
          maxLength={2}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="e.g. IN, US, GB"
          className={`${inputClass} uppercase`}
          required
        />
        <p className="text-[10px] text-gray-500 mt-1">Meta requires a valid 2-letter country code.</p>
      </div>

      <div className={`pt-4 border-t flex justify-end gap-2 mt-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900 rounded-lg text-sm font-medium hover:opacity-90">
          Send Request
        </button>
      </div>
    </form>
  );
};

// ------------------------------------------------------------------
// DUMMY BUILDER (Fallback for unimplemented modals)
// ------------------------------------------------------------------
export const DummyBuilder = ({ name, onClose }) => (
  <div className="text-center py-8">
    <div className="text-4xl mb-4">🚧</div>
    <h4 className="font-bold text-lg mb-2">{name}</h4>
    <p className="text-sm text-gray-500 mb-6">This builder component is under construction.</p>
    <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
      Close
    </button>
  </div>
);