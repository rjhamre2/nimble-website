import { apiConfig } from '../config/api';

// Fetch recent customer chats for a user
export const fetchRecentChats = async (userId, limit = 10) => {
  try {
    const url = apiConfig.endpoints.chats.recent();
    console.log('🌐 Calling recent chats URL:', url);
    console.log('📤 Request body:', { user_id: userId, limit });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        limit: limit
      }),
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error text:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Recent chats response data:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching recent chats:', error);
    throw error;
  }
};

// Fetch all chats for a user (for pagination)
export const fetchAllChats = async (userId, page = 1, limit = 20) => {
  try {
    const url = apiConfig.endpoints.chats.all();
    console.log('🌐 Calling all chats URL:', url);
    console.log('📤 Request body:', { user_id: userId, page, limit });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        page: page,
        limit: limit
      }),
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error text:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ All chats response data:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching all chats:', error);
    throw error;
  }
};

// Fetch individual chat messages
export const fetchChatMessages = async (chatId, userId) => {
  try {
    const url = apiConfig.endpoints.chats.messages();
    console.log('🌐 Calling chat messages URL:', url);
    console.log('📤 Request body:', { chat_id: chatId, user_id: userId });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        user_id: userId
      }),
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error text:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Chat messages response data:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching chat messages:', error);
    throw error;
  }
};

// Send agent message to customer
export const sendAgentMessage = async (chatId, message, userId) => {
  try {
    const url = apiConfig.endpoints.chats.sendMessage();
    console.log('🌐 Calling send message URL:', url);
    console.log('📤 Request body:', { chat_id: chatId, message, user_id: userId });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        message: message,
        user_id: userId,
        sender_type: 'agent'
      }),
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error text:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Send message response data:', data);
    return data;
  } catch (error) {
    console.error('❌ Error sending agent message:', error);
    throw error;
  }
};

// Update chat status (resolve, escalate, etc.)
export const updateChatStatus = async (chatId, status, userId) => {
  try {
    const url = apiConfig.endpoints.chats.updateStatus();
    console.log('🌐 Calling update status URL:', url);
    console.log('📤 Request body:', { chat_id: chatId, status, user_id: userId });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        status: status,
        user_id: userId
      }),
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error text:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Update status response data:', data);
    return data;
  } catch (error) {
    console.error('❌ Error updating chat status:', error);
    throw error;
  }
};

// Assign chat to agent
export const assignChatToAgent = async (chatId, agentId, userId) => {
  try {
    const url = apiConfig.endpoints.chats.assign();
    console.log('🌐 Calling assign chat URL:', url);
    console.log('📤 Request body:', { chat_id: chatId, agent_id: agentId, user_id: userId });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        agent_id: agentId,
        user_id: userId
      }),
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error text:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Assign chat response data:', data);
    return data;
  } catch (error) {
    console.error('❌ Error assigning chat:', error);
    throw error;
  }
};

// Format timestamp to relative time (e.g., "2 hours ago")
export const formatRelativeTime = (timestamp) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Format duration in seconds to readable format (e.g., "3 min")
export const formatDuration = (seconds) => {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
};
