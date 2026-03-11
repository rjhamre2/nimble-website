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
    // Note: Make sure this URL exactly matches your backend route path
    const url = `${WA_API}/api/messages/send/interactive-reply-buttons`; 
    
    return axios.post(url, {
      user_id: getUserId(),
      to: recipientPhone,
      body: payload.body,
      
      // 👇 Simply map the string array into the { id, title } format your backend expects
      buttons: payload.buttons.map((btnTitle, index) => ({
        id: `btn_${index}_${Date.now().toString().slice(-5)}`, 
        title: btnTitle 
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
  sendContact: async (recipientPhone, contactPayload) => {
    // Assuming you will create this route on your Node backend
    const url = `${WA_API}/api/messages/send/contacts`; 
    return axios.post(url, {
      user_id: getUserId(),
      to: recipientPhone,
      contacts: [contactPayload] // Meta requires contacts to be an array
    });
  },

// REQUEST ADDRESS (Native Meta Form)
  sendAddressRequest: async (recipientPhone, payload) => {
    // Adjust path if needed, matching your curl command
    const url = `${WA_API}/api/messages/send/address-message`; 
    return axios.post(url, {
      user_id: getUserId(),
      to: recipientPhone,
      country: payload.country,
      body: payload.body
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