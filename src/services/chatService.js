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


export const fetchRecentChats = async (userId, limit = 100) => {
  try {
    const url = `${DB_API}/messages/user/${userId}`;
    console.log(`🌐 Fetching history from: ${url}`);
    
    const response = await axios.get(url, {
      params: { limit, offset: 0 }
    });
    
    return response.data; 
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    return { data: [] };
  }
};

// --- SENDER METHODS (Point to WA Service) ---

export const chatService = {
  fetchRecentChats,
  
  // 1. SEND TEXT
  sendText: async (recipientPhone, text) => {
    const url = `${WA_API}/api/messages/send/text`; 
    return axios.post(url, {
      user_id: getUserId(), // Will throw error if no user is found
      to: recipientPhone,
      body: text, 
      preview_url: true
    });
  },

  // 2. SEND REPLY BUTTONS (From our new Modal)
  sendReplyButtons: async (recipientPhone, payload) => {
    const url = `${WA_API}/send/interactive-reply-buttons`;
    return axios.post(url, {
      user_id: getUserId(), // Will throw error if no user is found
      to: recipientPhone,
      body: payload.body,
      buttons: payload.buttons.map((btn, index) => ({
        type: "reply",
        reply: { 
          id: `btn_${index}_${Date.now().toString().slice(-5)}`, 
          title: btn 
        }
      })),
      footer: payload.footer
    });
  },

  // UPLOAD MEDIA
  uploadMedia: async (file) => {
    const url = `${WA_API}/api/media/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', file.type.split('/')[0]); 
    formData.append('user_id', getUserId()); // Will throw error if no user is found

    const response = await axios.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data; 
  },

  // SEND MEDIA
  sendMedia: async (recipientPhone, mediaId, mediaType, caption = '') => {
    const url = `${WA_API}/api/messages/send/media`;
    return axios.post(url, {
      user_id: getUserId(),
      to: recipientPhone,
      type: mediaType, 
      id: mediaId,
      caption: caption
    });
  },

  // SEND LOCATION
  sendLocation: async (recipientPhone, latitude, longitude, name = '', address = '') => {
    const url = `${WA_API}/send/location`;
    return axios.post(url, {
      user_id: getUserId(),
      to: recipientPhone,
      latitude,
      longitude,
      name,
      address
    });
  }
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