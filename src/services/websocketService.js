class WebSocketService {
  constructor() {
    this.ws = null;
    this.userId = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.messageHandlers = new Map();
    this.connectionHandlers = new Map();
    this.connectionHandlerId = 0;
    this.apiGatewayEndpoint = null;
  }

  async initialize() {
    // Use environment variable for API Gateway endpoint
    this.apiGatewayEndpoint = process.env.REACT_APP_WEBSOCKET_API_GATEWAY;
    
    if (!this.apiGatewayEndpoint) {
      console.warn('⚠️ REACT_APP_WEBSOCKET_API_GATEWAY not set, using fallback URL');
      // Fallback for development
      this.apiGatewayEndpoint = 'wss://your-api-gateway-id.execute-api.ap-south-1.amazonaws.com/dev';
    }
    
    console.log('🔌 WebSocket API Gateway endpoint:', this.apiGatewayEndpoint);
  }

  connect(userId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      // Even if already connected, request messages for the new user
      this.requestUserMessages(userId);
      return;
    }

    this.userId = userId;
    const wsUrl = this.buildWebSocketUrl(userId);
    console.log('🔌 Connecting to WebSocket:', wsUrl);

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.notifyConnectionHandlers('connected');
      
      // Request messages for this user from the database
      this.requestUserMessages(userId);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', data);
        this.handleMessage(data);
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket disconnected:', event.code, event.reason);
      this.isConnected = false;
      this.notifyConnectionHandlers('disconnected', event);
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.notifyConnectionHandlers('error', error);
    };
  }

  buildWebSocketUrl(userId) {
    // Use environment variable for API Gateway endpoint
    const baseUrl = process.env.REACT_APP_WEBSOCKET_API_GATEWAY || this.apiGatewayEndpoint || 'wss://your-api-gateway-id.execute-api.ap-south-1.amazonaws.com/dev';
    console.log(`🔌 Building WebSocket URL:`, baseUrl);
    
    // For development/localhost or EC2-like backends, append userId as path parameter
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || baseUrl.includes('ws://')) {
      return `${baseUrl}/${encodeURIComponent(userId)}`;
    }
    
    // For API Gateway, use query parameter
    return `${baseUrl}?userId=${encodeURIComponent(userId)}`;
  }

  // Request messages for a specific user from the database
  requestUserMessages(userId) {
    console.log('🔍 Requesting messages for user:', userId);
    return this.sendMessage('fetch_messages', {
      userId: userId
    });
  }

  // Send a new message to be stored in the database
  sendMessageToDatabase(message, senderName = 'User', senderNumber = '') {
    return this.sendMessage('store_message', {
      userId: this.userId,
      message: message,
      senderName: senderName,
      senderNumber: senderNumber,
      time_stamp: Math.floor(Date.now() / 1000) // Unix timestamp
    });
  }

  sendMessage(type, data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not connected');
      return false;
    }

    const message = {
      type: type, // Backend expects 'type' for message handling
      ...data
    };

    console.log('📤 Sending WebSocket message:', message);
    this.ws.send(JSON.stringify(message));
    return true;
  }

  // Legacy method - keeping for backward compatibility but now stores in DB
  sendQuestion(question, compName = 'NimbleAI', specialization = 'AI chatbots', senderName = 'User', senderNumber = '', timeStamp = null) {
    return this.sendMessageToDatabase(question, senderName, senderNumber);
  }

  sendPing() {
    return this.sendMessage('ping', { timestamp: Date.now() });
  }

  handleMessage(data) {
    const { type } = data;
    
    // Notify all handlers for this message type
    if (this.messageHandlers.has(type)) {
      this.messageHandlers.get(type).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in message handler for type ${type}:`, error);
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
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.userId) {
        console.log(`🔄 Attempting to reconnect...`);
        this.connect(this.userId);
      }
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.userId = null;
    this.messageHandlers.clear();
    this.connectionHandlers.clear();
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      userId: this.userId
    };
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();
export default websocketService; 
