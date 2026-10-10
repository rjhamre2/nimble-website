import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiConfig } from '../../../../../config/api';
import { 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  ArrowUpTrayIcon, 
  PhotoIcon, 
  FilmIcon, 
  DocumentIcon, 
  TrashIcon, 
  PlayIcon, 
  ArrowPathIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { validateFileExtension } from './templateUtils';

// Helper to format file size in human-readable format
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const MediaLibraryModal = ({
  isOpen,
  onClose,
  onSelectMedia,
  user,
  userData,
  allowedType = 'all', // 'all', 'image', 'video', 'document'
  title = 'Media Library'
}) => {
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'upload'
  const [mediaList, setMediaList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState(allowedType === 'all' ? 'all' : allowedType);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const userId = userData?.db_id || user?.db_id || user?.uid;
  const dbServerUrl = apiConfig.dbServerConfig.baseURL;

  // Sync typeFilter if allowedType changes
  useEffect(() => {
    if (allowedType !== 'all') {
      setTypeFilter(allowedType);
    }
  }, [allowedType]);

  // Fetch Media from Backend
  const fetchMedia = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const url = `${dbServerUrl}/api/media?user_id=${userId}`;
      const response = await fetch(url, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!response.ok) throw new Error('Failed to fetch media library');
      const result = await response.json();
      const items = result.data || result.media || [];
      setMediaList(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Error fetching media library:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, dbServerUrl]);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
      setSelectedItem(null);
      setUploadError('');
      setActiveTab('browse');
    }
  }, [isOpen, fetchMedia]);

  // Filter media based on search and type
  const filteredMedia = useMemo(() => {
    let list = mediaList;

    // Filter by type
    if (typeFilter !== 'all') {
      list = list.filter(item => {
        const mime = (item.file_type || '').toLowerCase();
        if (typeFilter === 'image') return mime.startsWith('image/');
        if (typeFilter === 'video') return mime.startsWith('video/');
        if (typeFilter === 'document') return mime.includes('pdf') || mime.includes('document') || mime.includes('msword') || mime.includes('text') || (!mime.startsWith('image/') && !mime.startsWith('video/'));
        return true;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => (item.file_name || '').toLowerCase().includes(q));
    }

    return list;
  }, [mediaList, typeFilter, searchQuery]);

  // Handle single file upload
  const handleUploadFile = async (file) => {
    if (!file) return;
    setUploadError('');

    if (!validateFileExtension(file)) {
      setUploadError('Invalid file type. Please upload a JPEG, PNG, MP4, or PDF file.');
      return;
    }

    // Validate type against allowedType constraint
    if (allowedType === 'image' && !file.type.startsWith('image/')) {
      setUploadError('Only image files (JPEG, PNG) are allowed here.');
      return;
    }
    if (allowedType === 'video' && !file.type.startsWith('video/')) {
      setUploadError('Only video files (MP4) are allowed here.');
      return;
    }
    if (allowedType === 'document' && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      setUploadError('Only document files (PDF) are allowed here.');
      return;
    }

    setIsUploading(true);
    try {
      const uploadUrl = `${dbServerUrl}/api/templates/${userId}/templates/upload_media`;
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('authToken');
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      const uploadHandle = result.data?.uploaded_file_handle || result.uploaded_file_handle || result.data?.handle || null;
      const s3Key = result.data?.s3_key || result.s3_key || null;
      const mediaId = result.data?.media_id || result.media_id || null;

      const fullUrl = s3Key ? `${process.env.REACT_APP_S3_MEDIA_BUCKET_URL || ''}${s3Key}` : null;

      const newMediaObj = {
        media_id: mediaId,
        file_name: file.name,
        file_type: file.type,
        file_length: file.size,
        s3_key: s3Key,
        s3_url: fullUrl,
        url: fullUrl,
        meta_file_handle: uploadHandle,
        created_at: new Date().toISOString()
      };

      // Add to list and select it
      setMediaList(prev => [newMediaObj, ...prev]);
      setSelectedItem(newMediaObj);
      setActiveTab('browse');
    } catch (err) {
      console.error('❌ Upload error in modal:', err);
      setUploadError(err.message || 'Failed to upload media. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete media item
  const handleDeleteMedia = async (e, mediaId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this asset from your media library?')) {
      return;
    }

    setDeletingId(mediaId);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${dbServerUrl}/api/media/${mediaId}?user_id=${userId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        setMediaList(prev => prev.filter(item => (item.media_id || item.id) !== mediaId));
        if ((selectedItem?.media_id || selectedItem?.id) === mediaId) {
          setSelectedItem(null);
        }
      } else {
        alert('Failed to delete media asset');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting media asset');
    } finally {
      setDeletingId(null);
    }
  };

  const handleConfirmSelection = () => {
    if (!selectedItem) return;

    let handle = selectedItem.meta_file_handle || selectedItem.handle || '';
    if (typeof handle === 'object') handle = handle.handle || handle.uploaded_file_handle || '';

    const payload = {
      mediaId: selectedItem.media_id || selectedItem.id,
      s3_key: selectedItem.s3_key || '',
      s3_url: selectedItem.s3_url || selectedItem.url || '',
      url: selectedItem.s3_url || selectedItem.url || '',
      handle: handle,
      fileName: selectedItem.file_name,
      fileType: selectedItem.file_type,
      fileLength: selectedItem.file_length
    };

    onSelectMedia(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>🖼️</span>
              <span>{title}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an asset from your library or upload a new one for your template.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center justify-between px-6 border-b border-slate-200 bg-white shrink-0">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'browse'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Browse Library</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
                {mediaList.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'upload'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              <span>Upload New</span>
            </button>
          </div>

          {/* Quick Refresh Button in Browse */}
          {activeTab === 'browse' && (
            <button 
              onClick={fetchMedia}
              disabled={isLoading}
              className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1.5 py-1 px-2.5 rounded-md hover:bg-slate-50 transition-colors"
              title="Refresh media library"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          
          {/* TAB 1: BROWSE MEDIA LIBRARY */}
          {activeTab === 'browse' && (
            <div className="space-y-4">
              
              {/* Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search media by filename..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Type Filter Pills (only show all options if allowedType is 'all') */}
                {allowedType === 'all' && (
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
                    {[
                      { key: 'all', label: 'All', icon: null },
                      { key: 'image', label: 'Images', icon: PhotoIcon },
                      { key: 'video', label: 'Videos', icon: FilmIcon },
                      { key: 'document', label: 'Docs', icon: DocumentIcon }
                    ].map(f => {
                      const Icon = f.icon;
                      const isActive = typeFilter === f.key;
                      return (
                        <button
                          key={f.key}
                          onClick={() => setTypeFilter(f.key)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-white text-blue-600 shadow-2xs font-semibold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {Icon && <Icon className="w-3.5 h-3.5" />}
                          <span>{f.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Media Grid */}
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-8">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <div key={n} className="bg-slate-100 rounded-xl h-44 animate-pulse"></div>
                  ))}
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="card p-12 text-center flex flex-col items-center justify-center space-y-3 border-2 border-dashed border-slate-200">
                  <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-2xl">
                    📁
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">No media assets found</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      {searchQuery
                        ? 'No files matching your search. Try a different query.'
                        : 'You haven’t uploaded any media yet. Upload a new file to get started.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="btn-primary text-xs py-2 px-4 gap-2 mt-2"
                  >
                    <ArrowUpTrayIcon className="w-4 h-4" />
                    <span>Upload File</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 pt-1">
                  {filteredMedia.map((item) => {
                    const isSelected = selectedItem?.media_id === item.media_id || (selectedItem?.s3_key && selectedItem?.s3_key === item.s3_key);
                    const mime = (item.file_type || '').toLowerCase();
                    const isImg = mime.startsWith('image/');
                    const isVid = mime.startsWith('video/');
                    const mediaUrl = item.s3_url || item.url || (item.s3_key ? `${process.env.REACT_APP_S3_MEDIA_BUCKET_URL || ''}${item.s3_key}` : null);

                    return (
                      <div
                        key={item.media_id || item.s3_key}
                        onClick={() => setSelectedItem(item)}
                        className={`group relative rounded-xl border-2 overflow-hidden flex flex-col cursor-pointer transition-all duration-150 bg-white ${
                          isSelected
                            ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                            : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
                        }`}
                      >
                        {/* Thumbnail Container */}
                        <div className="h-32 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                          {isImg && mediaUrl ? (
                            <img 
                              src={mediaUrl} 
                              alt={item.file_name} 
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" 
                            />
                          ) : isVid && mediaUrl ? (
                            <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
                              <video src={mediaUrl} className="w-full h-full object-cover opacity-80" />
                              <div className="absolute w-8 h-8 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white">
                                <PlayIcon className="w-4 h-4 ml-0.5" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-3 text-center">
                              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs mb-1">
                                PDF
                              </div>
                              <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                                {item.file_name}
                              </span>
                            </div>
                          )}

                          {/* Selected Checkmark Badge */}
                          {isSelected && (
                            <div className="absolute top-2 left-2 z-10">
                              <CheckCircleSolidIcon className="w-5 h-5 text-blue-600 drop-shadow-xs bg-white rounded-full" />
                            </div>
                          )}

                          {/* Delete Action Button */}
                          <button
                            onClick={(e) => handleDeleteMedia(e, item.media_id)}
                            disabled={deletingId === item.media_id}
                            className="absolute top-2 right-2 p-1 bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-xs"
                            title="Delete from library"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Card Info Footer */}
                        <div className="p-2.5 border-t border-slate-100 bg-white flex flex-col justify-between flex-1">
                          <p className="text-xs font-semibold text-slate-800 truncate" title={item.file_name}>
                            {item.file_name || 'Untitled asset'}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                            <span>{formatFileSize(item.file_length)}</span>
                            <span className="uppercase font-mono text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold">
                              {isImg ? 'IMAGE' : isVid ? 'VIDEO' : 'DOC'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD NEW FILE */}
          {activeTab === 'upload' && (
            <div className="max-w-xl mx-auto py-6 space-y-4">
              
              {/* Error Message */}
              {uploadError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center justify-between">
                  <span>{uploadError}</span>
                  <button onClick={() => setUploadError('')} className="text-red-500 font-bold ml-2">✕</button>
                </div>
              )}

              {/* Drag & Drop Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleUploadFile(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl mb-3 shadow-xs">
                  <ArrowUpTrayIcon className="w-7 h-7" />
                </div>

                <h4 className="text-base font-bold text-slate-900 mb-1">
                  Drag and drop your file here
                </h4>
                <p className="text-xs text-slate-500 mb-4 max-w-sm">
                  Support for WhatsApp marketing assets: Images (JPEG, PNG up to 5MB), Videos (MP4 up to 16MB), and Documents (PDF up to 100MB).
                </p>

                {isUploading ? (
                  <div className="flex items-center gap-2.5 text-xs text-blue-600 font-semibold py-2 px-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    <span>Uploading & syncing asset with WhatsApp...</span>
                  </div>
                ) : (
                  <label className="btn-primary text-xs py-2.5 px-5 cursor-pointer shadow-sm gap-2">
                    <ArrowUpTrayIcon className="w-4 h-4" />
                    <span>Browse from Computer</span>
                    <input
                      type="file"
                      className="hidden"
                      accept={
                        allowedType === 'image' 
                          ? 'image/jpeg,image/png' 
                          : allowedType === 'video' 
                          ? 'video/mp4' 
                          : allowedType === 'document' 
                          ? '.pdf' 
                          : 'image/jpeg,image/png,video/mp4,.pdf'
                      }
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleUploadFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Guidelines Info */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <p className="font-semibold text-slate-800">WhatsApp Media Rules & Specifications:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-500 text-[11px]">
                  <li><strong>Images:</strong> JPG, PNG (Max 5 MB)</li>
                  <li><strong>Videos:</strong> MP4 with H.264 video and AAC audio (Max 16 MB)</li>
                  <li><strong>Documents:</strong> PDF (Max 100 MB)</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 shrink-0">
          <div className="text-xs text-slate-600 flex items-center gap-2 truncate max-w-md">
            {selectedItem ? (
              <span className="flex items-center gap-1.5 truncate">
                <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium text-slate-900 truncate">Selected: {selectedItem.file_name}</span>
                <span className="text-slate-400 text-[11px]">({formatFileSize(selectedItem.file_length)})</span>
              </span>
            ) : (
              <span className="text-slate-400 italic">No asset selected</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onClose}
              className="btn-outline text-xs py-2 px-3.5"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSelection}
              disabled={!selectedItem}
              className="btn-primary text-xs py-2 px-4 gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckIcon className="w-3.5 h-3.5" />
              <span>Use Selected Media</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
