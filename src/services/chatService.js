import axios from 'axios';

// 1. CONFIG: Split the URLs based on your microservices
const DB_BASE_URL = process.env.REACT_APP_DB_SERVER_URL || 'http://localhost:3000';
const WA_BASE_URL = process.env.REACT_APP_WA_SERVER_URL || 'http://localhost:4000'; 

// Helper to remove trailing slashes
const cleanUrl = (url) => url.replace(/\/$/, '');

const DB_API = `${cleanUrl(DB_BASE_URL)}/api`;
const WA_API = cleanUrl(WA_BASE_URL); 

// --- HELPER: Get current user ID (STRICT MODE) ---
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
  
  // No fallback allowed. Throw an error so the UI can catch it and handle the failed send.
  throw new Error("Authentication Error: User ID not found. Please log in again.");
};


// Attach Bearer token to requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = config.headers || {};
    if (!config.headers.Authorization && !config.headers.authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => Promise.reject(error));

export const fetchRecentChats = async (userId, limit = 100) => {
  try {
    const url = `${DB_API}/messages/user/${userId}`;
    console.log(`🌐 Fetching history from: ${url}`);
    
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await axios.get(url, {
      params: { limit, offset: 0 },
      headers
    });
    
    return response.data; 
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    return { data: [] };
  }
};

export const fetchInboxSummary = async (userId) => {
  try {
    const url = `${DB_API}/messages/inbox-summary/${userId}`;
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching inbox summary:', error);
    return { data: [], totalUnread: 0 };
  }
};

export const markConversationRead = async (userId, senderNumber) => {
  try {
    const url = `${DB_API}/messages/mark-read/${userId}/${encodeURIComponent(senderNumber)}`;
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    await axios.post(url, {}, { headers });
  } catch (error) {
    console.error('❌ Error marking conversation as read:', error);
  }
};

// --- SENDER METHODS (Point to WA Service) ---

export const chatService = {
  fetchRecentChats,
  
  // 1. SEND TEXT
  sendText: async (recipientPhone, text, contextMessageId) => {
    const url = `${WA_API}/api/messages/send/text`; 
    return axios.post(url, {
      user_id: getUserId(), // Will throw error if no user is found
      to: recipientPhone,
      body: text, 
      preview_url: true,
      context_message_id: contextMessageId
    });
  },

  // 2. SEND REPLY BUTTONS (From our new Modal)
  sendReplyButtons: async (recipientPhone, payload, contextMessageId) => {
    const url = `${WA_API}/api/messages/send/interactive-reply-buttons`; 
    
    return axios.post(url, {
      user_id: getUserId(),
      to: recipientPhone,
      body: payload.body,
      
      buttons: payload.buttons.map((btnTitle, index) => ({
        id: `btn_${index}_${Date.now().toString().slice(-5)}`, 
        title: btnTitle 
      })),
      
      footer: payload.footer,
      context_message_id: contextMessageId || payload.context_message_id
    });
  },

  // UPLOAD MEDIA (Uploads to S3 + Meta + PostgreSQL)
  uploadMedia: async (file) => {
    const userId = getUserId();
    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);

    try {
      // First try unified DB service (uploads to S3 + Meta + saves to DB)
      const response = await axios.post(`${DB_API}/media/upload`, formData, { headers });
      const data = response.data?.data || response.data;
      return {
        id: data.meta_id || data.meta_upload_id || data.meta_file_handle || data.media_id || data.id,
        media_id: data.media_id,
        s3_url: data.s3_url,
        url: data.s3_url,
        ...data
      };
    } catch (dbErr) {
      console.warn("⚠️ DB Media upload endpoint failed, falling back to WA server direct upload:", dbErr.message);
      // Fallback to WA server direct upload
      const fallbackUrl = `${WA_API}/api/media/upload`;
      const fallbackForm = new FormData();
      fallbackForm.append('file', file);
      fallbackForm.append('type', file.type.split('/')[0]);
      fallbackForm.append('user_id', userId);
      const fallbackRes = await axios.post(fallbackUrl, fallbackForm, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return fallbackRes.data;
    }
  },

  // SEND MEDIA (Supports Meta ID or S3 URL link)
  sendMedia: async (recipientPhone, mediaIdOrUrl, mediaType, caption = '', contextMessageId) => {
    const url = `${WA_API}/api/messages/send/media`;
    const isUrl = typeof mediaIdOrUrl === 'string' && (mediaIdOrUrl.startsWith('http://') || mediaIdOrUrl.startsWith('https://'));
    const isNumeric = typeof mediaIdOrUrl === 'string' && /^\d+$/.test(mediaIdOrUrl);
    
    return axios.post(url, {
      user_id: getUserId(),
      to: recipientPhone,
      type: mediaType, 
      id: isNumeric ? mediaIdOrUrl : (!isUrl ? mediaIdOrUrl : undefined),
      link: isUrl ? mediaIdOrUrl : undefined,
      caption: caption,
      context_message_id: contextMessageId
    });
  },

  // SEND LOCATION
  sendLocation: async (recipientPhone, latitude, longitude, name = '', address = '') => {
    const url = `${WA_API}/api/messages/send/location`;
    return axios.post(url, {
      user_id: getUserId(),
      to: recipientPhone,
      latitude,
      longitude,
      name,
      address
    });
  },

  // REQUEST LOCATION (Interactive Meta Button)
  sendLocationRequest: async (recipientPhone, bodyText) => {
    // Note: Adjust the path if your WA_API base URL already includes /api/messages
    const url = `${WA_API}/api/messages/send/interactive-location-request`; 
    
    return axios.post(url, {
      user_id: getUserId(),
      to: recipientPhone,
      body: bodyText
    });
  },
  
  //Send Contact(s)
  sendContact: async (recipientPhone, contactPayload, contextMessageId = null) => {
    // Assuming you will create this route on your Node backend
    const url = `${WA_API}/api/messages/send/contacts`; 
    return axios.post(url, {
      user_id: getUserId(),
      to: recipientPhone,
      contacts: Array.isArray(contactPayload) ? contactPayload : [contactPayload],
      ...(contextMessageId ? { context_message_id: contextMessageId } : {})
    });
  },

// REQUEST ADDRESS (Native Meta Form)
  sendAddressRequest: async (recipientPhone, payload, contextMessageId = null) => {
    const url = `${WA_API}/api/messages/send/address-message`; 
    return axios.post(url, {
      user_id: getUserId(),
      to: recipientPhone,
      country: (payload.country || 'IN').toUpperCase(),
      body: payload.body,
      saved_addresses: payload.saved_addresses,
      values: payload.values,
      validation_errors: payload.validation_errors,
      ...(contextMessageId ? { context_message_id: contextMessageId } : {})
    });
  },

  // SEND INTERACTIVE LIST (Menu)
  sendInteractiveList: async (recipientPhone, payload) => {
    // Note: Make sure this URL path matches your Express router (we set it to /interactive-list earlier)
    const url = `${WA_API}/api/messages/send/interactive-list`; 
    return axios.post(url, {
      user_id: getUserId(),
      to: recipientPhone,
      header: payload.header,
      body: payload.body,
      footer: payload.footer,
      button_text: payload.button_text,
      sections: payload.sections
    });
  },

  // SEND INTERACTIVE CAROUSEL
  sendInteractiveCarousel: async (recipientPhone, payload) => {
    // Note: Verify this path matches your Express router (should be /interactive-carousel)
    const url = `${WA_API}/api/messages/send/interactive-carousel`; 
    return axios.post(url, {
      user_id: getUserId(),
      to: recipientPhone,
      body: payload.body,
      cards: payload.cards
    });
  },

  // SEND CTA URL (Link Button)
  sendCtaUrl: async (recipientPhone, payload) => {
    // Note: Verify this path matches your Express router
    const url = `${WA_API}/api/messages/send/cta-url`; 
    return axios.post(url, {
      user_id: getUserId(),
      to: recipientPhone,
      body: payload.body,
      display_text: payload.display_text,
      url: payload.url,
      footer: payload.footer,
      header_type: payload.header_type,
      header_link: payload.header_link,
      header_text: payload.header_text
    });
  },

  // SEND PRODUCT CAROUSEL (Catalog integration)
  sendProductCarousel: async (recipientPhone, payload) => {
    const url = `${WA_API}/api/messages/send/product-carousel`; 
    return axios.post(url, {
      user_id: getUserId(),
      to: recipientPhone,
      body: payload.body,
      catalog_id: payload.catalog_id,
      product_ids: payload.product_ids
    });
  },

};


// --- HELPERS ---
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp.toString().length === 10 ? timestamp * 1000 : timestamp);
  
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return date.toLocaleDateString();
};

// Format time as HH:MM AM/PM for message bubbles (WhatsApp style)
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp.toString().length === 10 ? timestamp * 1000 : timestamp);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Format date for conversation list (Today, Yesterday, or date)
export const formatConversationTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp.toString().length === 10 ? timestamp * 1000 : timestamp);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (msgDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  if (msgDate.getTime() === yesterday.getTime()) return 'Yesterday';
  const diffDays = Math.floor((today - msgDate) / 86400000);
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
};

// Format date separator label for chat (Today, Yesterday, or formatted date)
export const formatDateSeparator = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp.toString().length === 10 ? timestamp * 1000 : timestamp);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (msgDate.getTime() === today.getTime()) return 'Today';
  if (msgDate.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};