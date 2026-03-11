import React, { useState, useEffect } from 'react';
import { PhotoIcon, DocumentIcon, XMarkIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline';
import { ViewColumnsIcon, PlusIcon, TrashIcon, ListBulletIcon, LinkIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
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
// 7. INTERACTIVE LIST BUILDER
// ------------------------------------------------------------------
export const InteractiveListBuilder = ({ isDarkMode, onSubmit, onClose }) => {
  const [header, setHeader] = useState('');
  const [body, setBody] = useState('Please select an option from the menu below:');
  const [footer, setFooter] = useState('');
  const [buttonText, setButtonText] = useState('View Options');
  
  // We will default to 1 section with 2 empty rows
  const [rows, setRows] = useState([
    { title: '', description: '' },
    { title: '', description: '' }
  ]);

  const handleAddRow = () => {
    if (rows.length >= 10) return alert("Meta limits lists to 10 options maximum.");
    setRows([...rows, { title: '', description: '' }]);
  };

  const handleRemoveRow = (index) => {
    if (rows.length <= 1) return; // Must have at least 1
    const newRows = [...rows];
    newRows.splice(index, 1);
    setRows(newRows);
  };

  const handleRowChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!body.trim() || !buttonText.trim()) return;
    
    // Filter out completely empty rows and format for Meta
    const validRows = rows.filter(r => r.title.trim() !== '').map((r, i) => ({
      id: `row_${i}_${Date.now().toString().slice(-5)}`, // Auto-generate ID
      title: r.title.substring(0, 24), // Meta limit is 24 chars
      description: r.description.substring(0, 72) // Meta limit is 72 chars
    }));

    if (validRows.length === 0) return alert("You must provide at least one valid list option.");

    onSubmit({
      type: 'interactive-list',
      payload: {
        header: header.trim(),
        body: body.trim(),
        footer: footer.trim(),
        button_text: buttonText.trim(),
        // Wrapping rows in a single default section to match your cURL structure
        sections: [{
          title: "Available Options",
          rows: validRows
        }]
      }
    });
  };

  const inputClass = getSharedInputClass(isDarkMode);
  const labelClass = getSharedLabelClass(isDarkMode);

  return (

    

    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Header (Optional)</label>
          <input type="text" value={header} maxLength={60} onChange={(e) => setHeader(e.target.value)} placeholder="Max 60 chars" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Menu Button Text <span className="text-red-500">*</span></label>
          <input type="text" value={buttonText} maxLength={20} onChange={(e) => setButtonText(e.target.value)} placeholder="Max 20 chars" className={inputClass} required />
        </div>
      </div>

      <div>
        <label className={labelClass}>Main Message Body <span className="text-red-500">*</span></label>
        <textarea value={body} maxLength={1024} onChange={(e) => setBody(e.target.value)} rows="2" className={inputClass} required />
      </div>
      
      {/* ... the rows section remains the same since we already added maxLength={24} and {72} to them ... */}

      <div>
        <label className={labelClass}>Footer Text (Optional)</label>
        <input type="text" value={footer} maxLength={60} onChange={(e) => setFooter(e.target.value)} placeholder="Max 60 chars" className={inputClass} />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-500">
          <ListBulletIcon className="w-6 h-6" />
        </div>
        <div>
          <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>List Menu</h4>
          <p className="text-xs text-gray-500">Send a menu with up to 10 selectable options.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Header (Optional)</label>
          <input type="text" value={header} onChange={(e) => setHeader(e.target.value)} placeholder="e.g. Choose Shipping" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Menu Button Text <span className="text-red-500">*</span></label>
          <input type="text" value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="e.g. Shipping Options" className={inputClass} required />
        </div>
      </div>

      <div>
        <label className={labelClass}>Main Message Body <span className="text-red-500">*</span></label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows="2" className={inputClass} required />
      </div>

      <div className="border-t border-b py-4 my-2 dark:border-gray-700">
        <div className="flex justify-between items-center mb-3">
          <label className={labelClass}>List Options ({rows.length}/10)</label>
          {rows.length < 10 && (
            <button type="button" onClick={handleAddRow} className="text-xs text-purple-500 font-bold flex items-center gap-1 hover:underline">
              <PlusIcon className="w-3 h-3" /> Add Option
            </button>
          )}
        </div>
        
        <div className="flex flex-col gap-3">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <input type="text" value={row.title} onChange={(e) => handleRowChange(index, 'title', e.target.value)} placeholder="Title (Max 24 chars)" maxLength={24} className={`${inputClass} col-span-1`} required={index === 0} />
                <input type="text" value={row.description} onChange={(e) => handleRowChange(index, 'description', e.target.value)} placeholder="Description (Optional)" maxLength={72} className={`${inputClass} col-span-2`} />
              </div>
              {rows.length > 1 && (
                <button type="button" onClick={() => handleRemoveRow(index)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md">
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Footer Text (Optional)</label>
        <input type="text" value={footer} onChange={(e) => setFooter(e.target.value)} placeholder="e.g. Tap below to select" className={inputClass} />
      </div>

      <div className={`pt-2 flex justify-end gap-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
        <button type="submit" className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600">Send Menu</button>
      </div>
    </form>
  );
};

// ------------------------------------------------------------------
// 8. INTERACTIVE CAROUSEL BUILDER
// ------------------------------------------------------------------
export const InteractiveCarouselBuilder = ({ isDarkMode, onSubmit, onClose }) => {
  const [mainBody, setMainBody] = useState('Check out our latest products! 👇');
  
  // Start with one empty card
  const [cards, setCards] = useState([
    { imageUrl: '', bodyText: '', buttonText: 'Buy Now', buttonUrl: '' }
  ]);

  const handleAddCard = () => {
    if (cards.length >= 10) return alert("Meta allows a maximum of 10 cards per carousel.");
    setCards([...cards, { imageUrl: '', bodyText: '', buttonText: 'Buy Now', buttonUrl: '' }]);
  };

  const handleRemoveCard = (index) => {
    if (cards.length <= 1) return;
    const newCards = [...cards];
    newCards.splice(index, 1);
    setCards(newCards);
  };

  const handleCardChange = (index, field, value) => {
    const newCards = [...cards];
    newCards[index][field] = value;
    setCards(newCards);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!mainBody.trim()) return;

    // Filter valid cards and format them exactly how the backend expects
    const formattedCards = cards
      .filter(c => c.imageUrl.trim() && c.bodyText.trim() && c.buttonText.trim() && c.buttonUrl.trim())
      .map((c, index) => ({
        card_index: index,
        type: "cta_url",
        header: { type: "image", image: { link: c.imageUrl.trim() } },
        body: { text: c.bodyText.trim().substring(0, 160) }, // Meta limit is 160 chars
        action: { 
          name: "cta_url", 
          parameters: { 
            display_text: c.buttonText.trim().substring(0, 20), // Meta limit is 20 chars
            url: c.buttonUrl.trim() 
          } 
        }
      }));

    if (formattedCards.length === 0) {
      return alert("Please completely fill out at least one card (Image URL, Body, Button Text, and Link).");
    }

    onSubmit({
      type: 'interactive-carousel',
      payload: {
        body: mainBody.trim(),
        cards: formattedCards
      }
    });
  };

  const inputClass = getSharedInputClass(isDarkMode);
  const labelClass = getSharedLabelClass(isDarkMode);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-500">
          <ViewColumnsIcon className="w-6 h-6" />
        </div>
        <div>
          <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Media Carousel</h4>
          <p className="text-xs text-gray-500">Send a swipeable carousel of products with links.</p>
        </div>
      </div>

      <div>
        <label className={labelClass}>Main Message Body <span className="text-red-500">*</span></label>
        <textarea value={mainBody} onChange={(e) => setMainBody(e.target.value)} rows="2" className={inputClass} required />
      </div>

      <div className="border-t border-b py-4 my-2 dark:border-gray-700 max-h-[40vh] overflow-y-auto pr-2">
        <div className="flex justify-between items-center mb-3">
          <label className={labelClass}>Carousel Cards ({cards.length}/10)</label>
          {cards.length < 10 && (
            <button type="button" onClick={handleAddCard} className="text-xs text-blue-500 font-bold flex items-center gap-1 hover:underline">
              <PlusIcon className="w-3 h-3" /> Add Card
            </button>
          )}
        </div>
        
        <div className="flex flex-col gap-4">
          {cards.map((card, index) => (
            <div key={index} className={`p-3 border rounded-lg relative ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
              {cards.length > 1 && (
                <button type="button" onClick={() => handleRemoveCard(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
              <div className="text-xs font-bold text-gray-400 mb-2">Card {index + 1}</div>
              
              <div className="flex flex-col gap-2">
                <input type="url" value={card.imageUrl} onChange={(e) => handleCardChange(index, 'imageUrl', e.target.value)} placeholder="Image URL (e.g. https://.../img.png)" className={inputClass} required={index === 0} />
                <input type="text" value={card.bodyText} onChange={(e) => handleCardChange(index, 'bodyText', e.target.value)} placeholder="Card Description (Max 160 chars)" maxLength={160} className={inputClass} required={index === 0} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={card.buttonText} onChange={(e) => handleCardChange(index, 'buttonText', e.target.value)} placeholder="Button Text (Max 20 chars)" maxLength={20} className={inputClass} required={index === 0} />
                  <input type="url" value={card.buttonUrl} onChange={(e) => handleCardChange(index, 'buttonUrl', e.target.value)} placeholder="Button URL (e.g. https://...)" className={inputClass} required={index === 0} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`pt-2 flex justify-end gap-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">Send Carousel</button>
      </div>
    </form>
  );
};

// ------------------------------------------------------------------
// 9. CTA URL BUILDER
// ------------------------------------------------------------------
export const CtaUrlBuilder = ({ isDarkMode, onSubmit, onClose }) => {
  const [body, setBody] = useState('Tap the button below to view our latest collection.');
  const [displayText, setDisplayText] = useState('Shop Now');
  const [url, setUrl] = useState('');
  const [footer, setFooter] = useState('');
  
  const [headerType, setHeaderType] = useState('none');
  const [headerContent, setHeaderContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!body.trim() || !displayText.trim() || !url.trim()) return;

    // Validate Meta URL requirement (must have http/https)
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }

    const payload = {
      body: body.trim(),
      display_text: displayText.trim().substring(0, 20), // Strict 20 char limit
      url: finalUrl,
      footer: footer.trim() || undefined,
    };

    if (headerType !== 'none' && headerContent.trim()) {
      payload.header_type = headerType;
      if (headerType === 'text') {
        payload.header_text = headerContent.trim().substring(0, 60); // Strict 60 char limit
      } else {
        payload.header_link = headerContent.trim();
      }
    }

    onSubmit({
      type: 'cta-url',
      payload: payload
    });
  };

  const inputClass = getSharedInputClass(isDarkMode);
  const labelClass = getSharedLabelClass(isDarkMode);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-500">
          <LinkIcon className="w-6 h-6" />
        </div>
        <div>
          <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>CTA Link Button</h4>
          <p className="text-xs text-gray-500">Send a prominent button that opens a web link.</p>
        </div>
      </div>

      <div className="border p-3 rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <label className={labelClass}>Header (Optional)</label>
        <div className="flex gap-2 mb-2">
          <select value={headerType} onChange={(e) => { setHeaderType(e.target.value); setHeaderContent(''); }} className={inputClass}>
            <option value="none">None</option>
            <option value="text">Text</option>
            <option value="image">Image (URL)</option>
            <option value="video">Video (URL)</option>
            <option value="document">Document (URL)</option>
          </select>
        </div>
        {headerType !== 'none' && (
          <input 
            type="text" 
            value={headerContent} 
            onChange={(e) => setHeaderContent(e.target.value)} 
            placeholder={headerType === 'text' ? "Header Text (Max 60 chars)" : "Media URL (https://...)"}
            maxLength={headerType === 'text' ? 60 : undefined}
            className={inputClass} 
            required
          />
        )}
      </div>

      <div>
        <label className={labelClass}>Main Message Body <span className="text-red-500">*</span></label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows="2" maxLength={1024} className={inputClass} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Button Text <span className="text-red-500">*</span></label>
          <input type="text" value={displayText} onChange={(e) => setDisplayText(e.target.value)} placeholder="Max 20 chars" maxLength={20} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Destination URL <span className="text-red-500">*</span></label>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="e.g. caratandchrome.com/shop" className={inputClass} required />
        </div>
      </div>

      <div>
        <label className={labelClass}>Footer Text (Optional)</label>
        <input type="text" value={footer} onChange={(e) => setFooter(e.target.value)} placeholder="Max 60 chars" maxLength={60} className={inputClass} />
      </div>

      <div className={`pt-2 flex justify-end gap-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
        <button type="submit" className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600">Send Link</button>
      </div>
    </form>
  );
};

// ------------------------------------------------------------------
// 10. PRODUCT CAROUSEL BUILDER
// ------------------------------------------------------------------
export const ProductCarouselBuilder = ({ isDarkMode, onSubmit, onClose }) => {
  const [body, setBody] = useState('Check out our featured products! 👇');
  const [catalogId, setCatalogId] = useState('');
  
  // Meta strictly requires a minimum of 2 products for a carousel
  const [productIds, setProductIds] = useState(['', '']);

  const handleAddProduct = () => {
    if (productIds.length >= 10) return alert("Meta allows a maximum of 10 products per carousel.");
    setProductIds([...productIds, '']);
  };

  const handleRemoveProduct = (index) => {
    if (productIds.length <= 2) return alert("Meta requires at least 2 products for a product carousel.");
    const newIds = [...productIds];
    newIds.splice(index, 1);
    setProductIds(newIds);
  };

  const handleProductChange = (index, value) => {
    const newIds = [...productIds];
    newIds[index] = value;
    setProductIds(newIds);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!body.trim() || !catalogId.trim()) return;

    const validProductIds = productIds.filter(id => id.trim() !== '');
    
    // Final enforcement check
    if (validProductIds.length < 2) {
      return alert("Meta strictly requires at least 2 valid Product IDs.");
    }

    onSubmit({
      type: 'product-carousel',
      payload: {
        body: body.trim(),
        catalog_id: catalogId.trim(),
        product_ids: validProductIds.map(id => id.trim())
      }
    });
  };

  const inputClass = getSharedInputClass(isDarkMode);
  const labelClass = getSharedLabelClass(isDarkMode);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-full text-pink-500">
          <ShoppingBagIcon className="w-6 h-6" />
        </div>
        <div>
          <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Product Carousel</h4>
          <p className="text-xs text-gray-500">Send a swipeable list of products straight from your Meta Catalog.</p>
        </div>
      </div>

      <div>
        <label className={labelClass}>Main Message Body <span className="text-red-500">*</span></label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows="2" maxLength={1024} className={inputClass} required />
      </div>

      <div>
        <label className={labelClass}>Meta Catalog ID <span className="text-red-500">*</span></label>
        <input type="text" value={catalogId} onChange={(e) => setCatalogId(e.target.value)} placeholder="e.g. 123456789" className={inputClass} required />
        <p className="text-[10px] text-gray-500 mt-1">Found in your Meta Commerce Manager.</p>
      </div>

      <div className="border-t border-b py-4 my-2 dark:border-gray-700 max-h-[40vh] overflow-y-auto pr-2">
        <div className="flex justify-between items-center mb-3">
          <label className={labelClass}>Product Retailer IDs ({productIds.length}/10)</label>
          {productIds.length < 10 && (
            <button type="button" onClick={handleAddProduct} className="text-xs text-pink-500 font-bold flex items-center gap-1 hover:underline">
              <PlusIcon className="w-3 h-3" /> Add Product
            </button>
          )}
        </div>
        
        <div className="flex flex-col gap-3">
          {productIds.map((id, index) => (
            <div key={index} className="flex items-center gap-2">
              <input 
                type="text" 
                value={id} 
                onChange={(e) => handleProductChange(index, e.target.value)} 
                placeholder={`Product ID ${index + 1} (e.g. SKU-123)`} 
                className={`${inputClass} flex-1`} 
                required 
              />
              {productIds.length > 2 && (
                <button type="button" onClick={() => handleRemoveProduct(index)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md">
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={`pt-2 flex justify-end gap-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
        <button type="submit" className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600">Send Catalog</button>
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