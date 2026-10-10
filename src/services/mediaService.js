import axios from 'axios';

const DB_BASE_URL = process.env.REACT_APP_DB_SERVER_URL || 'http://localhost:3000';
const WA_BASE_URL = process.env.REACT_APP_WA_SERVER_URL || 'http://localhost:4000';

const cleanUrl = (url) => (url ? url.replace(/\/$/, '') : '');
const DB_API = `${cleanUrl(DB_BASE_URL)}/api`;
const WA_API = cleanUrl(WA_BASE_URL);

const getUserId = () => {
  const userString = localStorage.getItem('user') || localStorage.getItem('userData');
  if (userString) {
    try {
      const user = JSON.parse(userString);
      const userId = user.db_id || user.uid;
      if (userId) return userId;
    } catch (e) {
      console.error("❌ Error parsing user data from localStorage", e);
    }
  }
  throw new Error("Authentication Error: User ID not found. Please log in again.");
};

export const WHATSAPP_MEDIA_LIMITS = {
  image: {
    maxBytes: 5 * 1024 * 1024, // 5 MB
    allowedTypes: ['image/jpeg', 'image/png'],
    label: '5 MB (JPEG, PNG)'
  },
  video: {
    maxBytes: 16 * 1024 * 1024, // 16 MB
    allowedTypes: ['video/mp4', 'video/3gpp'],
    label: '16 MB (MP4, 3GP)'
  },
  audio: {
    maxBytes: 16 * 1024 * 1024, // 16 MB
    allowedTypes: ['audio/aac', 'audio/mp4', 'audio/mpeg', 'audio/amr', 'audio/ogg', 'audio/opus'],
    label: '16 MB (MP3, AAC, OGG, AMR, M4A)'
  },
  document: {
    maxBytes: 100 * 1024 * 1024, // 100 MB
    label: '100 MB (PDF, DOCX, XLSX, etc.)'
  }
};

export const validateWhatsAppMedia = (file) => {
  if (!file) return { valid: false, error: "No file selected." };

  const mimeType = file.type || '';
  const size = file.size || 0;
  const fileName = file.name || 'File';
  const sizeMB = (size / (1024 * 1024)).toFixed(2);

  if (mimeType.startsWith('image/')) {
    if (size > WHATSAPP_MEDIA_LIMITS.image.maxBytes) {
      return {
        valid: false,
        error: `Image "${fileName}" is ${sizeMB} MB. WhatsApp allows images up to 5 MB only.`
      };
    }
    if (WHATSAPP_MEDIA_LIMITS.image.allowedTypes.length && !WHATSAPP_MEDIA_LIMITS.image.allowedTypes.includes(mimeType)) {
      return {
        valid: false,
        error: `Image format "${mimeType}" is not supported by WhatsApp. Allowed formats: JPEG, PNG.`
      };
    }
  } else if (mimeType.startsWith('video/')) {
    if (size > WHATSAPP_MEDIA_LIMITS.video.maxBytes) {
      return {
        valid: false,
        error: `Video "${fileName}" is ${sizeMB} MB. WhatsApp allows videos up to 16 MB only.`
      };
    }
    if (WHATSAPP_MEDIA_LIMITS.video.allowedTypes.length && !WHATSAPP_MEDIA_LIMITS.video.allowedTypes.includes(mimeType)) {
      return {
        valid: false,
        error: `Video format "${mimeType}" is not supported by WhatsApp. Allowed formats: MP4 (H.264/AAC), 3GP.`
      };
    }
  } else if (mimeType.startsWith('audio/')) {
    if (size > WHATSAPP_MEDIA_LIMITS.audio.maxBytes) {
      return {
        valid: false,
        error: `Audio file "${fileName}" is ${sizeMB} MB. WhatsApp allows audio up to 16 MB only.`
      };
    }
  } else {
    // Document
    if (size > WHATSAPP_MEDIA_LIMITS.document.maxBytes) {
      return {
        valid: false,
        error: `Document "${fileName}" is ${sizeMB} MB. WhatsApp allows documents up to 100 MB only.`
      };
    }
  }

  return { valid: true };
};

export const mediaService = {
  // 1. Fetch user's media library with presigned URLs
  fetchMedia: async ({ type = 'all', search = '', limit = 100, offset = 0 } = {}) => {
    const userId = getUserId();
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await axios.get(`${DB_API}/media`, {
      params: { user_id: userId, type, search, limit, offset },
      headers
    });
    return response.data;
  },

  // 2. Upload a new media file to S3 + Meta
  uploadMedia: async (file, onProgress) => {
    const userId = getUserId();
    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);

    const response = await axios.post(`${DB_API}/media/upload`, formData, {
      headers,
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      }
    });

    return response.data;
  },

  // 3. Delete media item by ID
  deleteMedia: async (mediaId) => {
    const userId = getUserId();
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await axios.delete(`${DB_API}/media/${mediaId}`, {
      params: { user_id: userId },
      data: { user_id: userId },
      headers
    });
    return response.data;
  },

  // 4. Send media to a contact from the library
  sendMedia: async (recipientPhone, mediaId, mediaType, caption = '') => {
    const userId = getUserId();
    const url = `${WA_API}/api/messages/send/media`;
    return axios.post(url, {
      user_id: userId,
      to: recipientPhone,
      type: mediaType,
      id: mediaId,
      caption: caption
    });
  }
};

export default mediaService;
