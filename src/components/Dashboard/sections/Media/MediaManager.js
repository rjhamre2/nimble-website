import React, { useState, useEffect, useRef } from 'react';
import {
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
  DocumentIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  EyeIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  FolderIcon,
  CircleStackIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { mediaService, validateWhatsAppMedia, WHATSAPP_MEDIA_LIMITS } from '../../../../services/mediaService';

const MediaManager = ({ isDarkMode = false }) => {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [previewModalItem, setPreviewModalItem] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [copySuccess, setCopySuccess] = useState(null);

  // Upload States
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const res = await mediaService.fetchMedia({
        type: filterType === 'all' ? undefined : filterType,
        search: searchQuery || undefined
      });
      if (res && res.data) {
        setMediaList(res.data);
      }
    } catch (err) {
      console.error("Error loading media library:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [filterType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadMedia();
  };

  const handleDelete = async (mediaId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName || 'this media'}"? It will be removed from your S3 bucket and database.`)) {
      return;
    }
    setDeletingId(mediaId);
    try {
      await mediaService.deleteMedia(mediaId);
      setMediaList(prev => prev.filter(m => (m.media_id !== mediaId && m.id !== mediaId)));
      if (previewModalItem?.media_id === mediaId) setPreviewModalItem(null);
      if (selectedItem?.media_id === mediaId) setSelectedItem(null);
    } catch (err) {
      alert("Failed to delete media: " + (err.response?.data?.error || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Validate each file against WhatsApp rules
    for (const f of files) {
      const check = validateWhatsAppMedia(f);
      if (!check.valid) {
        setUploadError(check.error);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    setUploadError(null);
    setUploadFiles(files);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFiles.length) return;

    for (const f of uploadFiles) {
      const check = validateWhatsAppMedia(f);
      if (!check.valid) {
        setUploadError(check.error);
        return;
      }
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        await mediaService.uploadMedia(uploadFiles[i], (percent) => {
          setUploadProgress(percent);
        });
      }
      setIsUploadModalOpen(false);
      setUploadFiles([]);
      loadMedia();
    } catch (err) {
      setUploadError(err.response?.data?.error || err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCopyUrl = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopySuccess(url);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  // Stats calculation
  const totalBytes = mediaList.reduce((acc, cur) => acc + (parseInt(cur.file_length, 10) || 0), 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const imageCount = mediaList.filter(m => m.file_type?.startsWith('image/')).length;
  const videoCount = mediaList.filter(m => m.file_type?.startsWith('video/')).length;
  const docCount = mediaList.filter(m => !m.file_type?.startsWith('image/') && !m.file_type?.startsWith('video/')).length;

  const getMediaIcon = (mime, sizeClass = "w-6 h-6") => {
    if (mime?.startsWith('image/')) return <PhotoIcon className={`${sizeClass} text-pink-500`} />;
    if (mime?.startsWith('video/')) return <FilmIcon className={`${sizeClass} text-purple-500`} />;
    if (mime?.startsWith('audio/')) return <MusicalNoteIcon className={`${sizeClass} text-orange-500`} />;
    return <DocumentIcon className={`${sizeClass} text-blue-500`} />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const num = parseInt(bytes, 10);
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={`p-6 max-w-7xl mx-auto flex flex-col gap-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse, manage, and upload media assets stored in AWS S3 and synced with WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadMedia}
            title="Refresh list"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#22C55E] text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-green-500/20 transition-all hover:scale-[1.02]"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            Upload Media
          </button>
        </div>
      </div>

      {/* ── METRICS / SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <FolderIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Files</p>
              <h3 className="text-xl font-bold mt-0.5">{mediaList.length}</h3>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <CircleStackIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Storage Used</p>
              <h3 className="text-xl font-bold mt-0.5">{totalMB} MB</h3>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
              <PhotoIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Images</p>
              <h3 className="text-xl font-bold mt-0.5">{imageCount}</h3>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <FilmIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Videos / Docs</p>
              <h3 className="text-xl font-bold mt-0.5">{videoCount + docCount}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Type Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Media' },
            { id: 'image', label: 'Images' },
            { id: 'video', label: 'Videos' },
            { id: 'audio', label: 'Audio' },
            { id: 'application', label: 'Documents' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-[#25D366] text-white shadow-sm'
                  : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search by filename..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full sm:w-64 pl-9 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
              isDarkMode
                ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
        </form>
      </div>

      {/* ── MEDIA GALLERY GRID ── */}
      {loading ? (
        <div className="py-24 text-center text-slate-400 animate-pulse text-sm">
          Loading your media assets from AWS S3...
        </div>
      ) : mediaList.length === 0 ? (
        <div className={`p-12 rounded-3xl border text-center flex flex-col items-center justify-center ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
            <PhotoIcon className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold">No media assets found</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1 mb-5">
            {searchQuery ? `No files matching "${searchQuery}".` : 'Upload images, videos, audio, or documents to store them in your S3 bucket and use them in chats or broadcasts.'}
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-[#25D366] hover:bg-[#22C55E] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            Upload your first file
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {mediaList.map((item) => {
            const isImage = item.file_type?.startsWith('image/');
            const isVideo = item.file_type?.startsWith('video/');
            const isAudio = item.file_type?.startsWith('audio/');
            const mediaUrl = item.s3_url || item.url;
            const id = item.media_id || item.id;

            return (
              <div
                key={id || Math.random()}
                className={`group rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 hover:shadow-lg ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-100 shadow-sm hover:border-slate-200'
                }`}
              >
                {/* Media Preview Thumbnail */}
                <div
                  onClick={() => setPreviewModalItem(item)}
                  className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer overflow-hidden group-hover:opacity-95"
                >
                  {isImage && mediaUrl ? (
                    <img src={mediaUrl} alt={item.file_name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : isVideo && mediaUrl ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-black/40">
                      <video src={mediaUrl} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <FilmIcon className="w-8 h-8 text-white/90" />
                      </div>
                    </div>
                  ) : isAudio ? (
                    <div className="flex flex-col items-center justify-center p-3">
                      <MusicalNoteIcon className="w-8 h-8 text-orange-500 mb-1" />
                      <span className="text-[10px] text-slate-400 font-mono">Audio Clip</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3">
                      <DocumentIcon className="w-8 h-8 text-blue-500 mb-1" />
                      <span className="text-[10px] text-slate-400 uppercase font-mono">{item.file_type?.split('/')[1] || 'Doc'}</span>
                    </div>
                  )}

                  {/* Overlay Quick Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewModalItem(item); }}
                      title="Preview"
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    {mediaUrl && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyUrl(mediaUrl); }}
                        title="Copy Presigned S3 URL"
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(id, item.file_name); }}
                      disabled={deletingId === id}
                      title="Delete file"
                      className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-600 text-white backdrop-blur-sm"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Meta Footer */}
                <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-xs truncate" title={item.file_name}>
                      {item.file_name}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{formatFileSize(item.file_length)}</span>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>

                  {item.meta_upload_id && (
                    <div className="flex items-center gap-1 text-[10px] text-[#25D366] font-medium">
                      <CheckCircleIcon className="w-3 h-3" />
                      <span className="truncate">Synced with Meta</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── FULLSCREEN PREVIEW MODAL ── */}
      {previewModalItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isDarkMode ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white text-slate-900'}`}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                {getMediaIcon(previewModalItem.file_type)}
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate">{previewModalItem.file_name}</h3>
                  <p className="text-[11px] text-slate-400">{formatFileSize(previewModalItem.file_length)} • {formatDate(previewModalItem.created_at)}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewModalItem(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 flex items-center justify-center bg-slate-950/20 overflow-auto min-h-[300px]">
              {previewModalItem.file_type?.startsWith('image/') && (previewModalItem.s3_url || previewModalItem.url) ? (
                <img src={previewModalItem.s3_url || previewModalItem.url} alt={previewModalItem.file_name} className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-md" />
              ) : previewModalItem.file_type?.startsWith('video/') && (previewModalItem.s3_url || previewModalItem.url) ? (
                <video src={previewModalItem.s3_url || previewModalItem.url} controls className="max-h-[60vh] max-w-full rounded-xl shadow-md" />
              ) : previewModalItem.file_type?.startsWith('audio/') && (previewModalItem.s3_url || previewModalItem.url) ? (
                <div className="flex flex-col items-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow">
                  <MusicalNoteIcon className="w-16 h-16 text-orange-500 mb-4" />
                  <audio src={previewModalItem.s3_url || previewModalItem.url} controls className="w-72" />
                </div>
              ) : (
                <div className="flex flex-col items-center p-8 text-center">
                  <DocumentIcon className="w-20 h-20 text-blue-500 mb-3" />
                  <p className="text-sm font-semibold">{previewModalItem.file_name}</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">{previewModalItem.file_type}</p>
                  {(previewModalItem.s3_url || previewModalItem.url) && (
                    <a
                      href={previewModalItem.s3_url || previewModalItem.url}
                      download={previewModalItem.file_name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 flex items-center gap-2"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Download File
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono truncate max-w-xs">
                S3 Key: {previewModalItem.s3_key || 'N/A'}
              </span>
              <div className="flex gap-2">
                {(previewModalItem.s3_url || previewModalItem.url) && (
                  <button
                    onClick={() => handleCopyUrl(previewModalItem.s3_url || previewModalItem.url)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
                  >
                    <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                    {copySuccess ? 'Copied!' : 'Copy S3 Link'}
                  </button>
                )}
                <button
                  onClick={() => handleDelete(previewModalItem.media_id || previewModalItem.id, previewModalItem.file_name)}
                  className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-xs font-semibold flex items-center gap-1.5"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── UPLOAD MODAL ── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col ${isDarkMode ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white text-slate-900'}`}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base">Upload Media to S3</h3>
                <p className="text-xs text-slate-400 mt-0.5">Files will be stored in your S3 bucket and indexed for WhatsApp messaging.</p>
              </div>
              <button
                onClick={() => { setIsUploadModalOpen(false); setUploadFiles([]); setUploadError(null); }}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFileUpload} className="p-6 flex flex-col gap-4">
              {/* WhatsApp limits indicator */}
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">Images ≤ 5 MB (JPG, PNG)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">Videos ≤ 16 MB (MP4)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium">Audio ≤ 16 MB</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">Docs ≤ 100 MB</span>
              </div>

              {/* Error Alert */}
              {uploadError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                  <span className="font-bold shrink-0">⚠️ Error:</span>
                  <span>{uploadError}</span>
                </div>
              )}

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  isDarkMode
                    ? 'border-slate-700 hover:border-green-500 bg-slate-800/50'
                    : 'border-slate-200 hover:border-green-500 bg-slate-50'
                }`}
              >
                <ArrowUpTrayIcon className="w-10 h-10 text-slate-400 mb-2" />
                <p className="text-sm font-semibold">Click or drag files here to upload</p>
                <p className="text-xs text-slate-400 mt-1">Files are validated for WhatsApp compatibility</p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {uploadFiles.length > 0 && (
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                  <p className="text-xs font-semibold text-slate-400">Selected Files ({uploadFiles.length}):</p>
                  {uploadFiles.map((f, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="truncate font-medium flex-1 pr-2">{f.name}</span>
                      <span className="text-slate-400 text-[10px] shrink-0">{(f.size / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                  ))}
                </div>
              )}

              {uploading && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Uploading to AWS S3 & Meta...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#25D366] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsUploadModalOpen(false); setUploadFiles([]); setUploadError(null); }}
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFiles.length || uploading}
                  className="px-5 py-2 bg-[#25D366] hover:bg-[#22C55E] text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center gap-2 shadow-md shadow-green-500/20"
                >
                  {uploading ? 'Uploading...' : `Upload ${uploadFiles.length} file${uploadFiles.length > 1 ? 's' : ''}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaManager;
