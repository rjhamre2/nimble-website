# User Onboarding Integration Guide

This document explains how the user onboarding integration works with your EC2 machine via AWS Lambda proxy.

## Overview

When a user signs in to your application, the system automatically calls your EC2 machine's `/onboard_user` endpoint through the Lambda proxy. This ensures that every new user is properly onboarded in your backend system.

## How It Works

### 1. Authentication Flow

1. User clicks "Sign In" button
2. Firebase authentication completes
3. User data is saved to Firestore
4. **NEW**: Onboarding API call is automatically triggered
5. User is redirected to dashboard

### 2. Lambda Proxy Integration

The onboarding call goes through your existing Lambda proxy:

```
Frontend → Lambda Proxy → EC2 Machine (/onboard_user)
```

**Request Flow:**
- Frontend gets user's Firebase ID token
- Sends POST request to `{LAMBDA_URL}/api/proxy/onboard_user`
- Lambda authenticates the token with Firebase Admin
- Lambda forwards request to user's EC2 instance
- EC2 processes the onboarding and returns response

### 3. API Endpoint Details

**Endpoint:** `POST /api/proxy/onboard_user`

**Headers:**
```
Authorization: Bearer {firebase_id_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": "firebase_uid",
  "email": "user@example.com",
  "display_name": "User Name"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User onboarded successfully",
  "user_id": "firebase_uid"
}
```

## Implementation Details

### Files Modified/Created

1. **`src/services/onboardingService.js`** (NEW)
   - `onboardUser()` - Calls the onboarding API
   - `checkOnboardingStatus()` - Checks onboarding status

2. **`src/hooks/useAuth.js`** (MODIFIED)
   - Automatically calls `onboardUser()` after successful authentication
   - Non-blocking: auth flow continues even if onboarding fails

3. **`src/config/api.js`** (MODIFIED)
   - Added onboarding endpoint configuration

4. **`src/components/OnboardingTest.js`** (NEW)
   - Test component for manual onboarding testing

5. **`src/components/Dashboard/Dashboard.js`** (MODIFIED)
   - Added OnboardingTest component to dashboard

### Error Handling

The integration includes comprehensive error handling:

- **Authentication Errors**: Invalid/expired tokens return 401/403
- **Network Errors**: EC2 unreachable returns 502
- **Non-blocking**: Onboarding failures don't prevent user access
- **Logging**: All errors are logged to console for debugging

## Testing

### Automatic Testing

1. Sign in with any Google account
2. Check browser console for onboarding logs
3. Verify the API call was made successfully

### Manual Testing

1. Go to the dashboard after signing in
2. Use the "Onboarding API Test" component
3. Click "Trigger Onboarding" to manually test
4. Click "Check Status" to verify onboarding status

### Debug Information

Check browser console for these log messages:

```
✅ User onboarding completed successfully
❌ Failed to onboard user: [error details]
```

## Configuration

### Environment Variables

Your Lambda function needs these environment variables:

```bash
FIREBASE_SECRET_NAME=your_firebase_secret_name
```

### CORS Configuration

The Lambda proxy is already configured to accept requests from:
- `https://nimbleai.in` (production)
- `http://localhost:3000` (development)

### EC2 Requirements

Your EC2 machine must:

1. **Expose the endpoint**: `POST /onboard_user`
2. **Accept user_id parameter**: Process the Firebase UID
3. **Return JSON response**: Success/error status
4. **Handle authentication**: Verify the request is legitimate

## Example EC2 Endpoint Implementation

Here's what your EC2 `/onboard_user` endpoint should look like:

```python
@app.post("/onboard_user")
def onboard_user():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        email = data.get('email')
        display_name = data.get('display_name')
        
        # Your onboarding logic here
        # - Create user account in your system
        # - Set up initial configuration
        # - Send welcome email, etc.
        
        return jsonify({
            "success": True,
            "message": "User onboarded successfully",
            "user_id": user_id
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
```

## Troubleshooting

### Common Issues

1. **"Unauthorized" Error**
   - Check Firebase token validity
   - Verify Lambda has correct Firebase credentials

2. **"Backend machine IP not configured"**
   - Ensure user has `machine_ip` field in Firestore
   - Check Firestore security rules

3. **"Bad Gateway" Error**
   - EC2 instance is unreachable
   - Check EC2 security groups and network configuration

4. **Onboarding not triggered**
   - Check browser console for errors
   - Verify `useAuth` hook is working correctly

### Debug Steps

1. **Check Lambda Logs**
   - Go to CloudWatch → Log Groups
   - Look for `/aws/lambda/your-function-name`

2. **Test Lambda Directly**
   ```bash
   curl -X POST https://your-lambda-url/api/proxy/onboard_user \
     -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"user_id":"test","email":"test@example.com"}'
   ```

3. **Verify Firestore Data**
   - Check if user document exists
   - Verify `machine_ip` field is set

## Security Considerations

1. **Token Validation**: Lambda validates Firebase tokens before proxying
2. **User Isolation**: Each user can only access their own EC2 instance
3. **Error Handling**: Sensitive information is not exposed in error messages
4. **Logging**: All requests are logged for audit purposes

## Future Enhancements

1. **Retry Logic**: Add automatic retry for failed onboarding calls
2. **Status Tracking**: Store onboarding status in Firestore
3. **Batch Processing**: Handle multiple users simultaneously
4. **Webhooks**: Add webhook support for real-time notifications 