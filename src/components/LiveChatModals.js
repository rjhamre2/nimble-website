import React, { useState, useEffect, useRef } from 'react';
import { 
  PhotoIcon, 
  DocumentIcon, 
  XMarkIcon, 
  MapPinIcon, 
  UserIcon,
  ViewColumnsIcon, 
  PlusIcon, 
  TrashIcon, 
  ListBulletIcon, 
  LinkIcon, 
  ShoppingBagIcon,
  FilmIcon,
  MusicalNoteIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { apiConfig } from '../config/api';
import { mediaService, validateWhatsAppMedia, WHATSAPP_MEDIA_LIMITS } from '../services/mediaService';

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
// 2. ENHANCED MEDIA BUILDER & MEDIA LIBRARY
// ------------------------------------------------------------------
export const MediaBuilder = ({ isDarkMode, onSubmit, onClose }) => {
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'upload'
  const [libraryMedia, setLibraryMedia] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Upload Tab States
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const [validationError, setValidationError] = useState(null);
  const fileInputRef = useRef(null);

  // Load Library Media
  const loadMedia = async () => {
    setLoadingMedia(true);
    try {
      const res = await mediaService.fetchMedia({
        type: filterType === 'all' ? undefined : filterType,
        search: searchQuery || undefined
      });
      if (res && res.data) {
        setLibraryMedia(res.data);
      }
    } catch (err) {
      console.error("Failed to load media library:", err);
    } finally {
      setLoadingMedia(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'library') {
      loadMedia();
    }
  }, [activeTab, filterType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadMedia();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const check = validateWhatsAppMedia(selectedFile);
      if (!check.valid) {
        setValidationError(check.error);
        setFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setValidationError(null);
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleDeleteMedia = async (e, mediaId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this media asset? It will be removed from your S3 storage and library.")) {
      return;
    }
    setDeletingId(mediaId);
    try {
      await mediaService.deleteMedia(mediaId);
      setLibraryMedia(prev => prev.filter(m => (m.media_id !== mediaId && m.id !== mediaId)));
      if (selectedItem?.media_id === mediaId || selectedItem?.id === mediaId) {
        setSelectedItem(null);
      }
    } catch (err) {
      alert("Failed to delete media: " + (err.response?.data?.error || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSendFromLibrary = (e) => {
    e.preventDefault();
    if (!selectedItem) {
      alert("Please select a media file from the library.");
      return;
    }

    let mediaType = 'document';
    if (selectedItem.file_type?.startsWith('image/')) mediaType = 'image';
    else if (selectedItem.file_type?.startsWith('video/')) mediaType = 'video';
    else if (selectedItem.file_type?.startsWith('audio/')) mediaType = 'audio';

    const hasNumericMetaId = selectedItem.meta_upload_id && /^\d+$/.test(selectedItem.meta_upload_id);
    const mediaId = hasNumericMetaId ? selectedItem.meta_upload_id : undefined;
    const mediaUrl = selectedItem.s3_url || selectedItem.url;

    onSubmit({
      type: 'media',
      payload: {
        mediaId: mediaId || mediaUrl,
        mediaUrl: mediaUrl,
        mediaType: mediaType,
        caption: caption,
        localPreview: mediaUrl
      }
    });
  };

  const handleUploadAndSend = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    let mediaType = 'document';
    if (file.type.startsWith('image/')) mediaType = 'image';
    else if (file.type.startsWith('video/')) mediaType = 'video';
    else if (file.type.startsWith('audio/')) mediaType = 'audio';

    onSubmit({
      type: 'media',
      payload: {
        file: file,
        mediaType: mediaType,
        caption: caption,
        localPreview: previewUrl
      }
    });
  };

  const inputClass = getSharedInputClass(isDarkMode);
  const labelClass = getSharedLabelClass(isDarkMode);

  const getMediaIcon = (mime) => {
    if (mime?.startsWith('image/')) return <PhotoIcon className="w-6 h-6 text-pink-500" />;
    if (mime?.startsWith('video/')) return <FilmIcon className="w-6 h-6 text-purple-500" />;
    if (mime?.startsWith('audio/')) return <MusicalNoteIcon className="w-6 h-6 text-orange-500" />;
    return <DocumentIcon className="w-6 h-6 text-blue-500" />;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Tab Switcher */}
      <div className={`flex border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          type="button"
          onClick={() => { setActiveTab('library'); setSelectedItem(null); }}
          className={`px-4 py-2.5 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'library'
              ? 'border-[#25D366] text-[#25D366]'
              : isDarkMode ? 'border-transparent text-gray-400 hover:text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Media Library (Saved Assets)
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('upload'); setSelectedItem(null); }}
          className={`px-4 py-2.5 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'upload'
              ? 'border-[#25D366] text-[#25D366]'
              : isDarkMode ? 'border-transparent text-gray-400 hover:text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Upload New Media
        </button>
      </div>

      {/* ── TAB 1: MEDIA LIBRARY ── */}
      {activeTab === 'library' && (
        <div className="flex flex-col gap-3">
          {/* Filter Bar & Search */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All' },
                { id: 'image', label: 'Images' },
                { id: 'video', label: 'Videos' },
                { id: 'audio', label: 'Audio' },
                { id: 'application', label: 'Docs' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    filterType === tab.id
                      ? 'bg-[#25D366] text-white'
                      : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
              <div className={`relative flex items-center rounded-lg px-2.5 py-1 text-xs ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <MagnifyingGlassIcon className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                <input
                  type="text"
                  placeholder="Search file..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`bg-transparent focus:outline-none w-28 sm:w-36 text-xs ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                />
              </div>
              <button
                type="button"
                onClick={loadMedia}
                title="Refresh"
                className={`p-1 rounded-lg ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
              >
                <ArrowPathIcon className={`w-4 h-4 ${loadingMedia ? 'animate-spin' : ''}`} />
              </button>
            </form>
          </div>

          {/* Media Grid */}
          <div className={`border rounded-xl p-3 max-h-60 overflow-y-auto ${isDarkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            {loadingMedia ? (
              <div className="py-12 text-center text-sm text-gray-400 animate-pulse">Loading media assets from S3...</div>
            ) : libraryMedia.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center">
                <PhotoIcon className="w-10 h-10 text-gray-400 mb-2 opacity-60" />
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>No uploaded media found</p>
                <p className="text-xs text-gray-400 mt-1">Switch to "Upload New Media" to upload files to your library</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {libraryMedia.map((item) => {
                  const isSelected = selectedItem?.media_id === item.media_id || (item.id && selectedItem?.id === item.id);
                  const isImage = item.file_type?.startsWith('image/');
                  const isVideo = item.file_type?.startsWith('video/');
                  const mediaUrl = item.s3_url || item.url;

                  return (
                    <div
                      key={item.media_id || item.id || Math.random()}
                      onClick={() => setSelectedItem(item)}
                      className={`group relative rounded-xl border p-2 cursor-pointer transition-all flex flex-col items-center text-center ${
                        isSelected
                          ? 'border-[#25D366] bg-[#25D366]/10 ring-2 ring-[#25D366]/30'
                          : isDarkMode
                          ? 'border-gray-700 bg-gray-700/50 hover:border-gray-500'
                          : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
                      }`}
                    >
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteMedia(e, item.media_id || item.id)}
                        disabled={deletingId === (item.media_id || item.id)}
                        title="Delete from S3 and Library"
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow z-10"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>

                      {/* Selected Checkmark */}
                      {isSelected && (
                        <div className="absolute top-1.5 left-1.5 text-[#25D366] bg-white dark:bg-gray-800 rounded-full shadow">
                          <CheckCircleIcon className="w-5 h-5" />
                        </div>
                      )}

                      {/* Thumbnail */}
                      <div className="w-full h-20 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800 mb-1.5">
                        {isImage && mediaUrl ? (
                          <img src={mediaUrl} alt={item.file_name} className="w-full h-full object-cover" />
                        ) : isVideo && mediaUrl ? (
                          <video src={mediaUrl} className="w-full h-full object-cover" />
                        ) : (
                          getMediaIcon(item.file_type)
                        )}
                      </div>

                      {/* Name & Size */}
                      <p className={`text-xs font-semibold truncate w-full px-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {item.file_name}
                      </p>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        {item.file_length ? `${(item.file_length / 1024 / 1024).toFixed(1)} MB` : item.file_type?.split('/')[1] || 'Media'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Item Info & Caption */}
          {selectedItem && (
            <div className={`p-3 rounded-xl border flex flex-col gap-2 ${isDarkMode ? 'bg-gray-700/40 border-gray-600' : 'bg-blue-50/50 border-blue-100'}`}>
              <div className="flex items-center gap-2">
                {getMediaIcon(selectedItem.file_type)}
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedItem.file_name}</p>
                  <p className="text-[10px] text-gray-400">Selected for sending</p>
                </div>
              </div>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add an optional caption for this media..."
                className={inputClass}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className={`pt-3 border-t flex justify-end gap-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendFromLibrary}
              disabled={!selectedItem}
              className="px-4 py-2 bg-[#25D366] text-white rounded-lg text-sm font-semibold hover:bg-[#22C55E] disabled:opacity-50 transition-all shadow-sm shadow-green-600/30"
            >
              Send Selected Media
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 2: UPLOAD NEW MEDIA ── */}
      {activeTab === 'upload' && (
        <form onSubmit={handleUploadAndSend} className="flex flex-col gap-4">
          {/* Validation Error Alert */}
          {validationError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
              <span className="font-bold shrink-0">⚠️ Error:</span>
              <span>{validationError}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelClass}>Select File to Upload <span className="text-red-500">*</span></label>
            </div>

            {/* WhatsApp Limit Badges */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">Images ≤ 5 MB (JPG, PNG)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">Videos ≤ 16 MB (MP4)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium">Audio ≤ 16 MB</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">Docs ≤ 100 MB</span>
            </div>
            
            {!file ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  isDarkMode ? 'border-gray-600 hover:border-green-500 bg-gray-800' : 'border-gray-300 hover:border-green-500 bg-gray-50'
                }`}
              >
                <ArrowUpTrayIcon className="w-10 h-10 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-500">Click or drag file to upload</p>
                <p className="text-xs text-gray-400 mt-1">Saves to S3 and your Media Library</p>
              </div>
            ) : (
              <div className={`mt-1 rounded-xl p-4 border relative ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <button 
                  type="button" 
                  onClick={() => { setFile(null); setPreviewUrl(null); setValidationError(null); }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow"
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
            <button type="submit" disabled={!file} className="px-4 py-2 bg-[#25D366] text-white rounded-lg text-sm font-semibold hover:bg-[#22C55E] disabled:opacity-50 transition-all shadow-sm shadow-green-600/30">
              Upload & Send
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// ------------------------------------------------------------------
// 3. LOCATION BUILDER
// ------------------------------------------------------------------
// 3. LOCATION BUILDER (Interactive Map & Geolocation)
// ------------------------------------------------------------------
export const LocationBuilder = ({ isDarkMode, onSubmit, onClose }) => {
  const [latitude, setLatitude] = useState('28.6139');
  const [longitude, setLongitude] = useState('77.2090');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(!!window.L);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Dynamically load Leaflet library and styles
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    const cssId = 'leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const jsId = 'leaflet-js';
    if (!document.getElementById(jsId)) {
      const script = document.createElement('script');
      script.id = jsId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      document.body.appendChild(script);
    } else {
      const existing = document.getElementById(jsId);
      existing.addEventListener('load', () => setLeafletLoaded(true));
    }
  }, []);

  // Reverse geocode helper
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
        const place = data.name || data.address?.amenity || data.address?.building || data.address?.neighbourhood || data.address?.suburb || data.address?.city || '';
        if (place) setName(place);
      }
    } catch (_) {}
  };

  // Position update helper
  const updatePosition = (lat, lng, shouldPan = false) => {
    const latNum = parseFloat(Number(lat).toFixed(6));
    const lngNum = parseFloat(Number(lng).toFixed(6));
    setLatitude(String(latNum));
    setLongitude(String(lngNum));

    if (markerRef.current && window.L) {
      markerRef.current.setLatLng([latNum, lngNum]);
    }
    if (shouldPan && mapInstanceRef.current) {
      mapInstanceRef.current.setView([latNum, lngNum], 15);
    }
    reverseGeocode(latNum, lngNum);
  };

  // Initialize interactive Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const L = window.L;
    const initialLat = parseFloat(latitude) || 28.6139;
    const initialLng = parseFloat(longitude) || 77.2090;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
    marker.bindPopup("<b>Selected Location</b><br/>Drag pin or click on map to move").openPopup();

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      updatePosition(pos.lat, pos.lng, false);
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      updatePosition(e.latlng.lat, e.latlng.lng, false);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Trigger size invalidation so tiles render fully in modal
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [leafletLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle GPS Current Location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        updatePosition(lat, lng, true);
      },
      (err) => {
        setIsLocating(false);
        alert(`Could not retrieve location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle Address Search
  const handleSearchAddress = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        updatePosition(lat, lng, true);
        if (item.display_name) setAddress(item.display_name);
        if (item.name) setName(item.name);
      } else {
        alert("Location not found. Try searching a city, area, or landmark.");
      }
    } catch {
      alert("Error searching location. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualCoordChange = (latVal, lngVal) => {
    setLatitude(latVal);
    setLongitude(lngVal);
    const l1 = parseFloat(latVal);
    const l2 = parseFloat(lngVal);
    if (!isNaN(l1) && !isNaN(l2) && markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([l1, l2]);
      mapInstanceRef.current.panTo([l1, l2]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    if (isNaN(latNum) || isNaN(lngNum)) {
      alert("Valid Latitude and Longitude are required.");
      return;
    }

    onSubmit({
      type: 'send-location',
      payload: { 
        latitude: latNum, 
        longitude: lngNum, 
        name: name.trim() || undefined, 
        address: address.trim() || undefined
      }
    });
  };

  const inputClass = getSharedInputClass(isDarkMode);
  const labelClass = getSharedLabelClass(isDarkMode);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-full text-red-500">
            <MapPinIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Pin Location on Map</h4>
            <p className="text-xs text-gray-500">Click on the map, search, or use your current GPS location.</p>
          </div>
        </div>

        {/* Current Location Button */}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/30 transition-all shrink-0"
          title="Detect and use current device location"
        >
          {isLocating ? (
            <>
              <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
              <span>Locating...</span>
            </>
          ) : (
            <>
              <MapPinIcon className="w-3.5 h-3.5" />
              <span>My Location</span>
            </>
          )}
        </button>
      </div>

      {/* Address / Landmark Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchAddress(); } }}
            placeholder="Search city, area, or landmark (e.g. Connaught Place, Delhi)..."
            className={`${inputClass} pl-9 text-xs py-2`}
          />
        </div>
        <button
          type="button"
          onClick={handleSearchAddress}
          disabled={isSearching || !searchQuery.trim()}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shrink-0"
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Interactive Leaflet Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-gray-300 dark:border-gray-700 shadow-inner h-52 w-full z-0">
        {!leafletLoaded && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-500 animate-pulse z-10">
            Loading interactive map...
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Lat & Long Coords Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Latitude <span className="text-red-500">*</span></label>
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => handleManualCoordChange(e.target.value, longitude)}
            placeholder="e.g. 28.6139"
            className={`${inputClass} text-xs font-mono`}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Longitude <span className="text-red-500">*</span></label>
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => handleManualCoordChange(latitude, e.target.value)}
            placeholder="e.g. 77.2090"
            className={`${inputClass} text-xs font-mono`}
            required
          />
        </div>
      </div>

      {/* Location Name */}
      <div>
        <label className={labelClass}>Location / Place Name (Optional)</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Office HQ / Central Store"
          className={inputClass}
        />
      </div>

      {/* Address Details */}
      <div>
        <label className={labelClass}>Address Details (Optional)</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 123 Tech Park, Connaught Place"
          className={inputClass}
        />
      </div>

      {/* Action Buttons */}
      <div className={`pt-3 border-t flex justify-end gap-2 mt-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          type="button"
          onClick={onClose}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 shadow-md shadow-red-500/20"
        >
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
  const [activeTab, setActiveTab] = useState('saved'); // 'saved' | 'manual'
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);

  // Manual input state
  const [manualFirstName, setManualFirstName] = useState('');
  const [manualLastName, setManualLastName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualOrg, setManualOrg] = useState('');

  // Fetch contacts matching Contacts.js logic
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const userString = localStorage.getItem('user') || localStorage.getItem('userData');
        if (!userString) throw new Error("User not found");
        
        const user = JSON.parse(userString);
        const dbId = user.db_id || user.uid || user.id;
        if (!dbId) throw new Error("User DB ID not found");
        
        let apiUrl = apiConfig?.endpoints?.contacts?.getUserContacts?.(dbId);
        if (!apiUrl) {
          const DB_BASE_URL = process.env.REACT_APP_DB_SERVER_URL || 'http://localhost:3000';
          apiUrl = `${DB_BASE_URL}/api/contacts/user/${dbId}`;
        }
        const separator = apiUrl.includes('?') ? '&' : '?';
        apiUrl = `${apiUrl}${separator}limit=100`;

        const token = localStorage.getItem('authToken');
        const response = await fetch(apiUrl, {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '' 
          }
        });

        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setContacts(result.data);
        } else if (Array.isArray(result)) {
          setContacts(result);
        }
      } catch (error) {
        console.error("Failed to fetch contacts for modal:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const getContactInfo = (c) => {
    const rawData = c.contact_data || {};
    const firstName = c.first_name || rawData.name?.first_name || '';
    const lastName = c.last_name || rawData.name?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim() || c.name || rawData.name?.formatted_name || '';
    const phone = c.phone_number || c.phone || rawData.phones?.[0]?.phone || '';
    const email = c.email || rawData.emails?.[0]?.email || '';
    const displayName = fullName || phone || 'Unnamed Contact';
    
    // Initials
    const initials = firstName && lastName 
      ? `${firstName[0]}${lastName[0]}`.toUpperCase()
      : displayName.slice(0, 2).toUpperCase();

    return { firstName, lastName, fullName, phone, email, displayName, initials };
  };

  const filteredContacts = contacts.filter(c => {
    const { displayName, phone, email } = getContactInfo(c);
    const search = searchQuery.toLowerCase();
    return (
      displayName.toLowerCase().includes(search) ||
      phone.toLowerCase().includes(search) ||
      email.toLowerCase().includes(search)
    );
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    let formattedPayload = null;

    if (activeTab === 'saved') {
      if (!selectedContact) return;
      const { firstName, lastName, fullName, phone, email } = getContactInfo(selectedContact);

      formattedPayload = {
        name: {
          formatted_name: fullName || 'Unknown Contact',
          first_name: firstName || fullName || 'Unknown',
          ...(lastName ? { last_name: lastName } : {})
        },
        phones: [{
          phone: phone,
          type: "CELL"
        }],
        ...(email ? { emails: [{ email, type: "WORK" }] } : {})
      };
    } else {
      const cleanFirst = manualFirstName.trim();
      const cleanLast = manualLastName.trim();
      const cleanPhone = manualPhone.trim();
      const cleanEmail = manualEmail.trim();
      const cleanOrg = manualOrg.trim();

      if (!cleanFirst || !cleanPhone) return;

      const fullName = `${cleanFirst} ${cleanLast}`.trim();
      formattedPayload = {
        name: {
          formatted_name: fullName,
          first_name: cleanFirst,
          ...(cleanLast ? { last_name: cleanLast } : {})
        },
        phones: [{
          phone: cleanPhone,
          type: "CELL"
        }],
        ...(cleanEmail ? { emails: [{ email: cleanEmail, type: "WORK" }] } : {}),
        ...(cleanOrg ? { org: { company: cleanOrg } } : {})
      };
    }

    onSubmit({
      type: 'send-contact',
      payload: formattedPayload
    });
  };

  const inputClass = getSharedInputClass(isDarkMode);

  // Avatar color generator based on name
  const getAvatarBg = (str) => {
    const colors = [
      'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 
      'bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-cyan-500'
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 h-[65vh]">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Share Contact</h4>
            <p className="text-xs text-gray-500">Share contact details with the customer.</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className={`flex rounded-lg p-0.5 text-xs font-medium ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'}`}>
          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'saved'
                ? isDarkMode ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Saved Contacts ({contacts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'manual'
                ? isDarkMode ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Enter Manually
          </button>
        </div>
      </div>

      {activeTab === 'saved' ? (
        <>
          <div className="relative shrink-0">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputClass} pl-9 text-xs`}
            />
          </div>

          <div className={`flex-1 overflow-y-auto border rounded-xl ${isDarkMode ? 'border-gray-700/80 bg-gray-800/60' : 'border-gray-200 bg-gray-50/50'}`}>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center text-sm text-gray-400">
                <ArrowPathIcon className="w-6 h-6 animate-spin mb-2 text-blue-500" />
                <span>Loading contacts...</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <UserIcon className="w-10 h-10 text-gray-400 mb-2 opacity-40" />
                <p className="text-sm font-medium text-gray-500">No contacts found</p>
                <p className="text-xs text-gray-400 mt-1">Try another search or switch to manual entry.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {filteredContacts.map(c => {
                  const info = getContactInfo(c);
                  const isSelected = (selectedContact?.contact_id && selectedContact?.contact_id === c.contact_id) || selectedContact === c;
                  
                  return (
                    <div 
                      key={c.contact_id || c.phone_number || Math.random()}
                      onClick={() => setSelectedContact(c)}
                      className={`p-3 cursor-pointer flex items-center justify-between transition-all ${
                        isSelected 
                          ? (isDarkMode ? 'bg-blue-900/30 border-l-4 border-blue-500' : 'bg-blue-50/80 border-l-4 border-blue-500') 
                          : (isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-white')
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full ${getAvatarBg(info.displayName)} text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm`}>
                          {info.initials}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {info.displayName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {info.phone && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                                📞 {info.phone}
                              </span>
                            )}
                            {info.email && (
                              <span className="text-xs text-gray-400 truncate hidden sm:inline">
                                • ✉️ {info.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 ml-3">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : (isDarkMode ? 'border-gray-600' : 'border-gray-300')
                        }`}>
                          {isSelected && <CheckCircleIcon className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={getSharedLabelClass(isDarkMode)}>First Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. John"
                value={manualFirstName}
                onChange={(e) => setManualFirstName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={getSharedLabelClass(isDarkMode)}>Last Name</label>
              <input
                type="text"
                placeholder="e.g. Doe"
                value={manualLastName}
                onChange={(e) => setManualLastName(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={getSharedLabelClass(isDarkMode)}>Phone Number *</label>
            <input
              type="tel"
              required
              placeholder="e.g. +919876543210"
              value={manualPhone}
              onChange={(e) => setManualPhone(e.target.value)}
              className={inputClass}
            />
            <p className="text-[11px] text-gray-500 mt-1">Include country code (e.g. +91 for India).</p>
          </div>

          <div>
            <label className={getSharedLabelClass(isDarkMode)}>Email Address (Optional)</label>
            <input
              type="email"
              placeholder="e.g. contact@example.com"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={getSharedLabelClass(isDarkMode)}>Company / Organization (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Acme Corp"
              value={manualOrg}
              onChange={(e) => setManualOrg(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      )}

      <div className={`pt-3 border-t flex justify-end gap-2 shrink-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button 
          type="button" 
          onClick={onClose} 
          className={`px-4 py-2 rounded-lg text-xs font-semibold ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={activeTab === 'saved' ? !selectedContact : (!manualFirstName.trim() || !manualPhone.trim())} 
          className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
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
  const [bodyText, setBodyText] = useState("Thanks for your order! Tell us what address you'd like this order delivered to.");
  const [country, setCountry] = useState('IN'); // Meta default: 'IN' for India
  const [prefillName, setPrefillName] = useState('');
  const [prefillPhone, setPrefillPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bodyText.trim() || !country.trim()) return;

    const values = {};
    if (prefillName.trim()) values.name = prefillName.trim();
    if (prefillPhone.trim()) values.phone_number = prefillPhone.trim();

    onSubmit({
      type: 'request-address',
      payload: { 
        body: bodyText.trim(),
        country: country.trim().toUpperCase(),
        ...(Object.keys(values).length > 0 ? { values } : {})
      }
    });
  };

  const inputClass = getSharedInputClass(isDarkMode);
  const labelClass = getSharedLabelClass(isDarkMode);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-500">
          <DocumentIcon className="w-6 h-6" />
        </div>
        <div>
          <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Request Shipping Address</h4>
          <p className="text-xs text-gray-500">Sends Meta's native in-app Address Form to the customer.</p>
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Country Code <span className="text-red-500">*</span></label>
          <input
            type="text"
            maxLength={2}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. IN"
            className={`${inputClass} uppercase`}
            required
          />
          <p className="text-[10px] text-gray-400 mt-0.5">Meta requires ISO code (e.g. IN for India).</p>
        </div>
        <div>
          <label className={labelClass}>Prefill Phone (Optional)</label>
          <input
            type="text"
            value={prefillPhone}
            onChange={(e) => setPrefillPhone(e.target.value)}
            placeholder="e.g. +919876543210"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Prefill Customer Name (Optional)</label>
        <input
          type="text"
          value={prefillName}
          onChange={(e) => setPrefillName(e.target.value)}
          placeholder="e.g. Jane Doe"
          className={inputClass}
        />
      </div>

      <div className={`pt-3 border-t flex justify-end gap-2 mt-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-md shadow-indigo-500/20">
          Send Address Request
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
          <input type="text" value={header} maxLength={60} onChange={(e) => setHeader(e.target.value)} placeholder="e.g. Choose Shipping" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Menu Button Text <span className="text-red-500">*</span></label>
          <input type="text" value={buttonText} maxLength={20} onChange={(e) => setButtonText(e.target.value)} placeholder="e.g. Shipping Options" className={inputClass} required />
        </div>
      </div>

      <div>
        <label className={labelClass}>Main Message Body <span className="text-red-500">*</span></label>
        <textarea value={body} maxLength={1024} onChange={(e) => setBody(e.target.value)} rows="2" className={inputClass} required />
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
        <input type="text" value={footer} maxLength={60} onChange={(e) => setFooter(e.target.value)} placeholder="e.g. Tap below to select" className={inputClass} />
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
  
  // Start with 2 empty cards (Meta requirement is 2 to 10 cards)
  const [cards, setCards] = useState([
    { imageUrl: '', bodyText: '', buttonText: 'Buy Now', buttonUrl: '' },
    { imageUrl: '', bodyText: '', buttonText: 'Buy Now', buttonUrl: '' }
  ]);

  const handleAddCard = () => {
    if (cards.length >= 10) return alert("Meta allows a maximum of 10 cards per carousel.");
    setCards([...cards, { imageUrl: '', bodyText: '', buttonText: 'Buy Now', buttonUrl: '' }]);
  };

  const handleRemoveCard = (index) => {
    if (cards.length <= 2) return alert("Meta requires a minimum of 2 cards for carousels.");
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

    if (formattedCards.length < 2) {
      return alert("Meta requires at least 2 completely filled out cards for a carousel (Image URL, Body, Button Text, and Link).");
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
          <p className="text-xs text-gray-500">Send a swipeable carousel of products with links (minimum 2 cards).</p>
        </div>
      </div>

      <div>
        <label className={labelClass}>Main Message Body <span className="text-red-500">*</span></label>
        <textarea value={mainBody} onChange={(e) => setMainBody(e.target.value)} rows="2" className={inputClass} required />
      </div>

      <div className="border-t border-b py-4 my-2 dark:border-gray-700 max-h-[40vh] overflow-y-auto pr-2">
        <div className="flex justify-between items-center mb-3">
          <label className={labelClass}>Carousel Cards ({cards.length}/10 - Min 2)</label>
          {cards.length < 10 && (
            <button type="button" onClick={handleAddCard} className="text-xs text-blue-500 font-bold flex items-center gap-1 hover:underline">
              <PlusIcon className="w-3 h-3" /> Add Card
            </button>
          )}
        </div>
        
        <div className="flex flex-col gap-4">
          {cards.map((card, index) => (
            <div key={index} className={`p-3 border rounded-lg relative ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
              {cards.length > 2 && (
                <button type="button" onClick={() => handleRemoveCard(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600" title="Remove Card">
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
              <div className="text-xs font-bold text-gray-400 mb-2">Card {index + 1} {index < 2 && <span className="text-red-500">*</span>}</div>
              
              <div className="flex flex-col gap-2">
                <input type="url" value={card.imageUrl} onChange={(e) => handleCardChange(index, 'imageUrl', e.target.value)} placeholder="Image URL (e.g. https://.../img.png)" className={inputClass} required={index < 2} />
                <input type="text" value={card.bodyText} onChange={(e) => handleCardChange(index, 'bodyText', e.target.value)} placeholder="Card Description (Max 160 chars)" maxLength={160} className={inputClass} required={index < 2} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={card.buttonText} onChange={(e) => handleCardChange(index, 'buttonText', e.target.value)} placeholder="Button Text (Max 20 chars)" maxLength={20} className={inputClass} required={index < 2} />
                  <input type="url" value={card.buttonUrl} onChange={(e) => handleCardChange(index, 'buttonUrl', e.target.value)} placeholder="Button URL (e.g. https://...)" className={inputClass} required={index < 2} />
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