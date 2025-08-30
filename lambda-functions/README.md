# NimbleAI Lambda Functions

This directory contains Lambda functions for the NimbleAI WebSocket API.

## Structure

```
lambda-functions/
├── websocket/                 # WebSocket Lambda functions
│   ├── handlers/             # Individual function handlers
│   │   ├── connect.js        # Handle WebSocket connections
│   │   ├── disconnect.js     # Handle WebSocket disconnections
│   │   ├── default.js        # Default route handler
│   │   ├── sendMessage.js    # Send message handler
│   │   ├── fetchMessages.js  # Fetch messages handler
│   │   ├── storeMessage.js   # Store message handler
│   │   └── ping.js           # Ping/pong handler
│   └── package.json          # Dependencies for WebSocket functions
├── infrastructure/           # Infrastructure configuration
│   ├── dynamodb-tables.yml   # DynamoDB tables CloudFormation
│   ├── api-gateway-config.json # API Gateway configuration
│   └── lambda-role-policy.json # IAM role policy
└── package.json              # Main package.json
```

## Manual Deployment Steps

### 1. Create DynamoDB Tables
1. Go to AWS CloudFormation console
2. Create a new stack
3. Upload `infrastructure/dynamodb-tables.yml`
4. Set Stage parameter to `prod`
5. Deploy the stack

### 2. Create Lambda Functions
1. Go to AWS Lambda console
2. Create 7 new functions:
   - `nimbleai-connect`
   - `nimbleai-disconnect`
   - `nimbleai-default`
   - `nimbleai-sendMessage`
   - `nimbleai-fetchMessages`
   - `nimbleai-storeMessage`
   - `nimbleai-ping`
3. Use Node.js 18.x runtime
4. Upload the corresponding handler files
5. Set environment variables:
   - `CONNECTIONS_TABLE`: `nimbleai-connections-prod`
   - `MESSAGES_TABLE`: `nimbleai-messages-prod`
6. Configure IAM roles with the policy from `infrastructure/lambda-role-policy.json`

### 3. Create API Gateway WebSocket API
1. Go to API Gateway console
2. Create a new WebSocket API
3. Use configuration from `infrastructure/api-gateway-config.json`
4. Create integrations for each Lambda function
5. Create routes for each handler
6. Deploy to `prod` and `dev` stages

### 4. Update Frontend Configuration
1. Get the WebSocket endpoint from API Gateway
2. Update `src/services/websocketService.js` with the new endpoint
3. Update `src/config/websocket.js` with the actual endpoint URLs

## Environment Variables

Each Lambda function expects these environment variables:
- `CONNECTIONS_TABLE`: DynamoDB table for storing WebSocket connections
- `MESSAGES_TABLE`: DynamoDB table for storing messages

## Testing

Test the WebSocket connection using:
```javascript
const ws = new WebSocket('wss://your-api-gateway-id.execute-api.ap-south-1.amazonaws.com/prod?userId=test-user');
```

## 6. Updated WebSocket Configuration

```javascript:src/config/websocket.js
// WebSocket configuration for different environments
const config = {
  development: {
    endpoint: 'wss://your-api-gateway-id.execute-api.ap-south-1.amazonaws.com/dev',
    region: 'ap-south-1'
  },
  production: {
    endpoint: 'wss://your-api-gateway-id.execute-api.ap-south-1.amazonaws.com/prod',
    region: 'ap-south-1'
  }
};

export const getWebSocketConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return config[env] || config.development;
};

export default config;
```

I've created a clean, organized folder structure for the Lambda functions with:

1. **`lambda-functions/`** - Main directory containing all Lambda-related code
2. **`lambda-functions/websocket/`** - WebSocket-specific Lambda functions
3. **`lambda-functions/infrastructure/`** - Infrastructure configuration files
4. **Proper documentation** - README with deployment instructions
5. **IAM policies** - Security configurations for the Lambda functions

The structure is now ready for manual deployment from the AWS console, with all the necessary configuration files and documentation included.

