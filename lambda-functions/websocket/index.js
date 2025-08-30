const AWS = require('aws-sdk');
const http = require('http');
const https = require('https');

// Configure AWS SDK
const apigatewaymanagementapi = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.API_GATEWAY_ENDPOINT || 'https://s687z96fob.execute-api.ap-south-1.amazonaws.com/prod'
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || 'nimbleai-connections-prod';
const EC2_BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://localhost:8000';
const API_GATEWAY_ENDPOINT = process.env.API_GATEWAY_ENDPOINT || 'https://s687z96fob.execute-api.ap-south-1.amazonaws.com/prod';

// Function to get all active connections for a user
async function getActiveConnectionsForUser(userId) {
  try {
    const result = await dynamodb.scan({
      TableName: CONNECTIONS_TABLE,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise();
    
    return result.Items || [];
  } catch (error) {
    console.error('❌ Error getting active connections for user:', error);
    return [];
  }
}

// Function to broadcast new message to all connected clients of a user
async function broadcastNewMessageToUser(userId, messageData) {
  try {
    // Get all active connections for this user
    const connections = await getActiveConnectionsForUser(userId);
    console.log(`📡 Broadcasting to ${connections.length} connections for user ${userId}`);
    
    // Send message to each connection
    const promises = connections.map(async (connection) => {
      try {
        await sendToWebSocketClient(connection.connectionId, {
          type: 'new_message',
          ...messageData
        });
        console.log(`✅ Message sent to connection ${connection.connectionId}`);
      } catch (error) {
        console.error(`❌ Error sending to connection ${connection.connectionId}:`, error);
        // Remove stale connection
        await dynamodb.delete({
          TableName: CONNECTIONS_TABLE,
          Key: { connectionId: connection.connectionId }
        }).promise();
      }
    });
    
    await Promise.all(promises);
    console.log(`✅ Broadcast completed for user ${userId}`);
  } catch (error) {
    console.error('❌ Error broadcasting message:', error);
  }
}

// Connect handler
async function handleConnect(event) {
  const connectionId = event.requestContext.connectionId;
  const userId = event.queryStringParameters?.userId || 'anonymous';
  
  console.log(`🔌 New WebSocket connection: ${connectionId} for user: ${userId}`);
  
  try {
    // Store connection in DynamoDB for tracking
    await dynamodb.put({
      TableName: CONNECTIONS_TABLE,
      Item: {
        connectionId: connectionId,
        userId: userId,
        timestamp: Date.now(),
        ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours TTL
      }
    }).promise();
    
    console.log(`✅ Connection ${connectionId} stored for user ${userId}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Connected successfully',
        userId: userId
      })
    };
  } catch (error) {
    console.error('❌ Error storing connection:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to connect' })
    };
  }
}

// Disconnect handler
async function handleDisconnect(event) {
  const connectionId = event.requestContext.connectionId;
  
  console.log(`🔌 WebSocket disconnection: ${connectionId}`);
  
  try {
    // Remove connection from DynamoDB
    await dynamodb.delete({
      TableName: CONNECTIONS_TABLE,
      Key: {
        connectionId: connectionId
      }
    }).promise();
    
    console.log(`✅ Connection ${connectionId} removed`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Disconnected successfully' })
    };
  } catch (error) {
    console.error('❌ Error removing connection:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to disconnect' })
    };
  }
}

// Proxy message to EC2 backend
async function proxyToBackend(messageData, userId) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      ...messageData,
      user_id: userId
    });

    const url = new URL(EC2_BACKEND_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: '/api/websocket-proxy',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    // Use HTTP or HTTPS based on the protocol
    const requestModule = url.protocol === 'https:' ? https : http;
    
    const req = requestModule.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          resolve({ success: false, error: 'Invalid response from backend' });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error proxying to backend:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Send message to WebSocket client via API Gateway Management API
async function sendToWebSocketClient(connectionId, message) {
  try {
    const params = {
      ConnectionId: connectionId,
      Data: JSON.stringify(message)
    };
    
    await apigatewaymanagementapi.postToConnection(params).promise();
    console.log(`📤 Message sent to WebSocket client: ${connectionId}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Error sending message to client ${connectionId}:`, error);
    throw error;
  }
}

// Send message handler - proxy to EC2 backend
async function handleSendMessage(event) {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body);
  
  console.log(`📤 Send message from ${connectionId}:`, body);
  
  try {
    // Proxy the message to EC2 backend
    const response = await proxyToBackend({
      type: 'store_message',
      message: body.message,
      sender_name: body.senderName || 'User',
      sender_number: body.senderNumber || '',
      time_stamp: body.time_stamp || Math.floor(Date.now() / 1000)
    }, body.userId || 'anonymous');
    
    console.log(`✅ Message proxied to backend:`, response);
    
    // Send confirmation back to the WebSocket client
    const messageToSend = {
      type: 'message_sent',
      success: true,
      message: 'Message sent successfully',
      backend_response: response
    };
    
    await sendToWebSocketClient(connectionId, messageToSend);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Message sent successfully' })
    };
  } catch (error) {
    console.error('❌ Error sending message:', error);
    
    // Send error back to the WebSocket client
    try {
      await sendToWebSocketClient(connectionId, {
        type: 'error',
        message: 'Failed to send message',
        error: error.message
      });
    } catch (sendError) {
      console.error('❌ Error sending error message to client:', sendError);
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send message' })
    };
  }
}

// Fetch messages handler - proxy to EC2 backend
async function handleFetchMessages(event) {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body);
  const userId = body.userId || 'anonymous';
  
  console.log(`🔍 Fetching messages for user: ${userId}`);
  
  try {
    // Proxy the request to EC2 backend
    const response = await proxyToBackend({
      type: 'fetch_messages'
    }, userId);
    
    console.log(`✅ Messages fetched from backend:`, response);
    
    // Send messages back to the WebSocket client
    const messageToSend = {
      type: 'database_messages',
      messages: response.messages || [],
      userId: userId
    };
    
    await sendToWebSocketClient(connectionId, messageToSend);
    console.log(`📤 Messages sent to WebSocket client: ${connectionId}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Messages sent to client' })
    };
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch messages' })
    };
  }
}

// Ping handler
async function handlePing(event) {
  const connectionId = event.requestContext.connectionId;
  
  console.log(`🏓 Ping from connection: ${connectionId}`);
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      type: 'pong',
      timestamp: Date.now(),
      connectionId: connectionId
    })
  };
}

// Default handler - handle messages that don't match specific routes
async function handleDefault(event) {
  console.log('📨 Default handler called:', event);
  
  try {
    // Parse the message body to determine the action
    const body = JSON.parse(event.body);
    const messageType = body.type;
    
    console.log(`🔍 Processing message type: ${messageType} in default handler`);
    
    // Route based on message type
    switch (messageType) {
      case 'fetch_messages':
        return await handleFetchMessages(event);
      case 'store_message':
        return await handleSendMessage(event);
      case 'ping':
        return await handlePing(event);
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ 
            error: 'Invalid message type',
            message: `Unknown message type: ${messageType}`
          })
        };
    }
  } catch (error) {
    console.error('❌ Error in default handler:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        error: 'Invalid JSON format',
        message: 'Message body must be valid JSON'
      })
    };
  }
}

// Main handler function
exports.handler = async (event) => {
  // Check if this is a direct Lambda invocation (for broadcasting)
  if (event.action === 'broadcast') {
    console.log('📡 Processing broadcast request');
    try {
      const { user_id, message_data } = event;
      await broadcastNewMessageToUser(user_id, message_data);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Broadcast completed' })
      };
    } catch (error) {
      console.error('❌ Error in broadcast:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Broadcast failed' })
      };
    }
  }
  
  // Regular WebSocket event
  const routeKey = event.requestContext.routeKey;
  
  console.log(`🚀 Processing route: ${routeKey}`);
  
  try {
    switch (routeKey) {
      case '$connect':
        return await handleConnect(event);
      case '$disconnect':
        return await handleDisconnect(event);
      case 'sendMessage':
        return await handleSendMessage(event);
      case 'fetchMessages':
        return await handleFetchMessages(event);
      case 'ping':
        return await handlePing(event);
      case '$default':
      default:
        return await handleDefault(event);
    }
  } catch (error) {
    console.error('❌ Unhandled error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Export the broadcast function for external use (e.g., from EC2 backend)
exports.broadcastNewMessageToUser = broadcastNewMessageToUser;
