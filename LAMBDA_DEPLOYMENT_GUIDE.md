# AWS Lambda Deployment Guide

This guide will help you deploy the WhatsApp integration Lambda function to AWS.

## 📋 Prerequisites

1. **AWS Account** with Lambda access
2. **Facebook App Credentials**:
   - `FACEBOOK_APP_ID`
   - `FACEBOOK_APP_SECRET`
3. **Node.js** installed locally

## 🚀 Deployment Steps

### Step 1: Prepare the Lambda Package

```bash
# Navigate to the lambda directory
cd lambda

# Make the deployment script executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

This will:
- Install production dependencies
- Create a `lambda-deployment.zip` file
- Show package size analysis

### Step 2: Deploy to AWS Lambda

1. **Go to AWS Lambda Console**
   - Navigate to https://console.aws.amazon.com/lambda/
   - Click "Create function"

2. **Create Function**
   - Choose "Author from scratch"
   - Function name: `nimble-whatsapp-api`
   - Runtime: `Node.js 18.x`
   - Architecture: `x86_64`
   - Click "Create function"

3. **Upload Code**
   - In the "Code" tab, click "Upload from"
   - Select ".zip file"
   - Upload `lambda-deployment.zip`
   - Click "Save"

4. **Set Environment Variables**
   - In the "Configuration" tab, click "Environment variables"
   - Add the following variables:
     ```
     FACEBOOK_APP_ID=your_facebook_app_id_here
     FACEBOOK_APP_SECRET=your_facebook_app_secret_here
     NODE_ENV=production
     ```

5. **Configure Function URL**
   - In the "Configuration" tab, click "Function URL"
   - Click "Create function URL"
   - Auth type: `NONE`
   - Click "Save"

6. **Update Frontend Configuration**
   - Copy the Function URL
   - Update `src/config/api.js` with the new URL

## 🔧 Configuration

### Environment Variables

Set these in your Lambda function:

| Variable | Description | Example |
|----------|-------------|---------|
| `FACEBOOK_APP_ID` | Your Facebook App ID | `1110256151158809` |
| `FACEBOOK_APP_SECRET` | Your Facebook App Secret | `abc123...` |
| `NODE_ENV` | Environment | `production` |

### CORS Configuration

The Lambda function is configured to accept requests from:
- `https://nimbleai.in` (production)
- `http://localhost:3000` (development)
- `http://localhost:3001` (development)
- `http://127.0.0.1:3000` (development)
- `http://127.0.0.1:3001` (development)

## 🧪 Testing

### Test Health Endpoint

```bash
curl https://your-function-url.lambda-url.region.on.aws/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "service": "AWS Lambda",
  "version": "1.0.0"
}
```

### Test WhatsApp Endpoint

```bash
curl -X POST https://your-function-url.lambda-url.region.on.aws/api/whatsapp/exchange-code \
  -H "Content-Type: application/json" \
  -d '{"code":"test","waba_id":"test","phone_number_id":"test"}'
```

## 📊 Monitoring

### CloudWatch Logs

1. **View Logs**:
   - Go to Lambda function
   - Click "Monitor" tab
   - Click "View logs in CloudWatch"

2. **Log Groups**:
   - `/aws/lambda/nimble-whatsapp-api`

3. **Key Log Messages**:
   - `=== WHATSAPP CODE EXCHANGE REQUEST ===`
   - `🔄 Exchanging code for access token...`
   - `✅ Successfully exchanged code for access token`
   - `=== WHATSAPP CODE EXCHANGE COMPLETE ===`

### Metrics

Monitor these CloudWatch metrics:
- **Invocations**: Number of function calls
- **Duration**: Execution time
- **Errors**: Failed executions
- **Throttles**: Rate limit hits

## 🔒 Security

### IAM Permissions

The Lambda function needs these permissions:
- `logs:CreateLogGroup`
- `logs:CreateLogStream`
- `logs:PutLogEvents`

### Environment Variables

- Store sensitive data in environment variables
- Never commit secrets to version control
- Use AWS Secrets Manager for production

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check allowed origins in Lambda CORS config
   - Verify frontend URL matches allowed origins

2. **Environment Variables Missing**
   - Ensure `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` are set
   - Check Lambda environment variables

3. **Package Too Large**
   - Use `npm install --production`
   - Remove unnecessary dependencies
   - Check for `aws-sdk` (included by default)

4. **Timeout Issues**
   - Increase Lambda timeout (default: 3 seconds)
   - Check Facebook API response times

### Debug Steps

1. **Check CloudWatch Logs**
   - Look for error messages
   - Verify request/response data

2. **Test Endpoints**
   - Use curl to test endpoints directly
   - Check response status codes

3. **Verify Configuration**
   - Confirm environment variables
   - Check CORS settings

## 📞 Support

If you encounter issues:
1. Check CloudWatch logs first
2. Verify all environment variables are set
3. Test endpoints with curl
4. Check Facebook App configuration

## 🔄 Updates

To update the Lambda function:
1. Make changes to `lambda/index.js`
2. Run `./deploy.sh` to create new package
3. Upload new `lambda-deployment.zip` to AWS
4. Test the updated function 