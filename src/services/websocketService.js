import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.isConnected = false;
    this.isRegistered = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.messageHandlers = new Map();
    this.connectionHandlers = new Map();
    this.connectionHandlerId = 0;
    this.serverUrl = null;
  }

  async initialize() {
    // Use environment variable for Socket.IO server endpoint
    this.serverUrl = process.env.REACT_APP_WEBSOCKET_API_GATEWAY || 
                     process.env.REACT_APP_WEBSOCKET_SERVER_URL;
    
    if (!this.serverUrl) {
      console.warn('⚠️ REACT_APP_WEBSOCKET_API_GATEWAY or REACT_APP_WEBSOCKET_SERVER_URL not set, using fallback URL');
      // Fallback for development
      this.serverUrl = 'http://localhost:3001';
    }
    
    console.log('🔌 Socket.IO server endpoint:', this.serverUrl);
  }

  async connect(userId) {
    // Ensure serverUrl is initialized
    if (!this.serverUrl) {
      await this.initialize();
    }

    // Convert userId to integer (db_id only - must be a number)
    // Frontend should only send db_id (integer), not Firebase uid
    let uid = userId;
    if (typeof userId === 'string' && /^\d+$/.test(userId)) {
      uid = parseInt(userId);
    } else if (typeof userId !== 'number') {
      console.error('❌ Invalid userId: Expected db_id (integer), got:', userId, '(type:', typeof userId, ')');
      this.notifyConnectionHandlers('error', { message: 'Invalid userId. Expected db_id (integer) only.' });
      return;
    }
    
    // Validate userId is a valid number
    if (uid === null || uid === undefined || isNaN(uid)) {
      console.error('❌ Invalid userId:', userId);
      this.notifyConnectionHandlers('error', { message: 'Invalid userId. Expected db_id (integer).' });
      return;
    }

    console.log('🔌 Connecting with db_id:', uid, '(type:', typeof uid, ')');

    // If already connected and registered with the same user, just request messages
    if (this.socket && this.socket.connected && this.isRegistered && this.userId === uid) {
      console.log('✅ Socket.IO already connected and registered, requesting messages');
      // Request messages immediately if already registered
      setTimeout(() => {
        this.requestUserMessages(uid);
      }, 50);
      return;
    }

    // Disconnect existing socket if connecting to a different user
    if (this.socket && this.userId !== uid) {
      console.log('🔄 Different user detected, disconnecting previous connection');
      this.disconnect();
    }

    this.userId = uid;

    // If socket exists but not connected, reconnect
    if (this.socket && !this.socket.connected) {
      console.log('🔄 Reconnecting existing socket');
      this.socket.connect();
      return;
    }

    // Create new Socket.IO connection
    if (!this.socket) {
      const serverUrl = this.serverUrl || process.env.REACT_APP_WEBSOCKET_API_GATEWAY || 
                        process.env.REACT_APP_WEBSOCKET_SERVER_URL || 'http://localhost:3001';
      
      console.log('🔌 Creating new Socket.IO connection to:', serverUrl);

      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
      });

      this.setupSocketHandlers();
    }
  }

  setupSocketHandlers() {
    // Connection established
    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.notifyConnectionHandlers('connected');
      
      // Register user after connection
      this.registerUser();
    });

    // User registration successful
    this.socket.on('user_registered', (data) => {
      console.log('✅ User registered:', data);
      this.isRegistered = true;
      this.notifyConnectionHandlers('registered', data);
      
      // Request messages for this user from the database
      // Add a small delay to ensure registration is fully processed
      setTimeout(() => {
        console.log('📥 Requesting messages after registration for userId:', this.userId);
        this.requestUserMessages(this.userId);
      }, 100);
    });

    // Error from server
    this.socket.on('error', (error) => {
      console.error('❌ Socket.IO error:', error);
      if (error.message === 'User not found') {
        console.error('💡 User not found error. The server is checking "users WHERE uid = $1" but we sent db_id:', this.userId);
        console.error('💡 Server needs to check "users WHERE db_id = $1" instead of "users WHERE uid = $1"');
      }
      this.notifyConnectionHandlers('error', error);
    });

    // Disconnection
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason);
      this.isConnected = false;
      this.isRegistered = false;
      this.notifyConnectionHandlers('disconnected', { reason });
      
      // Attempt reconnection if not intentional
      if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      this.notifyConnectionHandlers('error', error);
    });

    // Reconnection attempt
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}`);
      this.reconnectAttempts = attemptNumber;
    });

    // Reconnection successful
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionHandlers('connected');
      this.registerUser();
    });

    // Reconnection failed
    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
      this.notifyConnectionHandlers('error', { message: 'Reconnection failed' });
    });

    // Handle new_message event from server
    this.socket.on('new_message', (data) => {
      console.log('📨 New message received:', data);
      this.handleMessage('new_message', data);
    });

    // Handle message_updated event from server
    this.socket.on('message_updated', (data) => {
      console.log('📝 Message updated:', data);
      this.handleMessage('message_updated', data);
    });

    // Handle message_deleted event from server
    this.socket.on('message_deleted', (data) => {
      console.log('🗑️ Message deleted:', data);
      this.handleMessage('message_deleted', data);
    });

    // Handle database_messages event (response to fetch_messages)
    // The server should emit this when responding to fetch_messages request
    this.socket.on('database_messages', (data) => {
      console.log('📦 Database messages received:', data);
      this.handleMessage('database_messages', data);
    });

    // Handle connection_status event if server emits it
    this.socket.on('connection_status', (data) => {
      console.log('📡 Connection status:', data);
      this.handleMessage('connection_status', data);
    });
  }

  registerUser() {
    if (!this.socket || !this.socket.connected || !this.userId) {
      console.warn('⚠️ Cannot register user: socket not connected or userId missing');
      return;
    }

    console.log('👤 Registering user with db_id:', this.userId, '(type:', typeof this.userId, ')');
    this.socket.emit('register_user', { userId: this.userId }); // userId is db_id (integer)
  }

  // Request messages for a specific user from the database
  // Note: This emits a 'fetch_messages' event. The server needs to handle this event
  // and respond with messages. If the server doesn't handle this, consider using REST API instead.
  requestUserMessages(userId) {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Socket not connected, cannot request messages');
      return false;
    }

    if (!this.isRegistered) {
      console.warn('⚠️ User not registered yet, cannot request messages. Will request after registration.');
      // If user is connected but not registered, wait for registration
      // The user_registered handler will call requestUserMessages automatically
      return false;
    }

    console.log('🔍 Requesting messages for user (db_id):', userId, '(type:', typeof userId, ')');
    console.log('📤 Emitting fetch_messages event with db_id:', userId);
    
    this.socket.emit('fetch_messages', {
      userId: userId  // db_id (integer) only
    });
    
    return true;
  }

  // Send a new message to be stored in the database
  // Note: This emits a 'store_message' event. The server needs to handle this event.
  // If the server doesn't handle this, consider using REST API instead.
  sendMessageToDatabase(message, senderName = 'User', senderNumber = '') {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Socket not connected, cannot send message');
      return false;
    }

    this.socket.emit('store_message', {
      userId: this.userId,
      message: message,
      senderName: senderName,
      senderNumber: senderNumber,
      time_stamp: Math.floor(Date.now() / 1000) // Unix timestamp
    });
    return true;
  }

  // Generic method to emit events to server
  sendMessage(eventName, data) {
    if (!this.socket || !this.socket.connected) {
      console.error('❌ Socket.IO not connected');
      return false;
    }

    const message = {
      ...data
    };

    console.log(`📤 Emitting ${eventName}:`, message);
    this.socket.emit(eventName, message);
    return true;
  }

  // Legacy method - keeping for backward compatibility but now stores in DB
  sendQuestion(question, compName = 'NimbleAI', specialization = 'AI chatbots', senderName = 'User', senderNumber = '', timeStamp = null) {
    return this.sendMessageToDatabase(question, senderName, senderNumber);
  }

  sendPing() {
    if (!this.socket || !this.socket.connected) {
      return false;
    }
    this.socket.emit('ping', { timestamp: Date.now() });
    return true;
  }

  handleMessage(eventType, data) {
    // Notify all handlers for this event type
    if (this.messageHandlers.has(eventType)) {
      this.messageHandlers.get(eventType).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in message handler for type ${eventType}:`, error);
        }
      });
    }
  }

  onMessage(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type).add(handler);
  }

  offMessage(type, handler) {
    if (this.messageHandlers.has(type)) {
      this.messageHandlers.get(type).delete(handler);
    }
  }

  onConnection(handler) {
    const handlerId = ++this.connectionHandlerId;
    this.connectionHandlers.set(handlerId, handler);
    return handlerId;
  }

  offConnection(handlerId) {
    this.connectionHandlers.delete(handlerId);
  }

  notifyConnectionHandlers(status, error = null) {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(status, error);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }

  scheduleReconnect() {
    // Socket.IO handles reconnection automatically, but we can still track attempts
    if (this.socket && !this.socket.connected) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
      
      console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
      
      setTimeout(() => {
        if (this.userId && this.socket && !this.socket.connected) {
          console.log(`🔄 Attempting to reconnect...`);
          this.socket.connect();
        }
      }, delay);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.isRegistered = false;
    this.userId = null;
    this.messageHandlers.clear();
    this.connectionHandlers.clear();
    this.reconnectAttempts = 0;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected && this.socket?.connected,
      isRegistered: this.isRegistered,
      reconnectAttempts: this.reconnectAttempts,
      userId: this.userId,
      socketId: this.socket?.id || null
    };
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();
export default websocketService; 
