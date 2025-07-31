# Facebook Authentication Firebase Setup Guide

This guide will help you configure Facebook authentication in Firebase to resolve the "Failed to sign in with Facebook" error.

## Step 1: Firebase Console Configuration

### 1.1 Enable Facebook Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `nimbleai-firebase`
3. Navigate to **Authentication** → **Sign-in method**
4. Find **Facebook** in the list and click on it
5. Click **Enable** to turn on Facebook authentication
6. You'll need to provide:
   - **App ID**: `1110256151158809`
   - **App Secret**: (Get this from Facebook Developer Console)

### 1.2 Get Facebook App Secret

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app: `1110256151158809`
3. Go to **Settings** → **Basic**
4. Copy the **App Secret** (you may need to click "Show" to reveal it)

### 1.3 Configure Firebase

Back in Firebase Console:
1. Paste the **App Secret** in the Firebase Facebook provider settings
2. Click **Save**

## Step 2: Facebook Developer Console Configuration

### 2.1 Configure OAuth Redirect URIs

1. In Facebook Developer Console, go to **Facebook Login** → **Settings**
2. Add these OAuth redirect URIs:
   ```
   https://nimbleai-firebase.firebaseapp.com/__/auth/handler
   http://localhost:3000/__/auth/handler
   ```

### 2.2 Configure App Domains

1. Go to **Settings** → **Basic**
2. Add these domains to **App Domains**:
   ```
   nimbleai-firebase.firebaseapp.com
   localhost
   ```

### 2.3 Configure Privacy Policy URL

1. In **Settings** → **Basic**
2. Add your privacy policy URL:
   ```
   https://nimbleai.in/privacy-policy
   ```

## Step 3: Test the Configuration

### 3.1 Check Debug Component

The debug component will show:
- ✅ Facebook SDK loaded
- ✅ Firebase Auth available
- ✅ SDK Ready: Yes

### 3.2 Common Error Codes and Solutions

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `auth/operation-not-allowed` | Facebook auth not enabled in Firebase | Enable Facebook provider in Firebase Console |
| `auth/unauthorized-domain` | Domain not authorized | Add domain to Facebook App settings |
| `auth/invalid-credential` | Wrong App ID/Secret | Check Firebase Facebook provider settings |
| `auth/popup-blocked` | Browser blocked popup | Allow popups for the site |
| `auth/network-request-failed` | Network issue | Check internet connection |

## Step 4: Production Deployment

### 4.1 Update OAuth Redirect URIs

When deploying to production, add your production domain:
```
https://yourdomain.com/__/auth/handler
```

### 4.2 Update App Domains

Add your production domain to Facebook App settings.

## Troubleshooting Checklist

- [ ] Facebook provider enabled in Firebase Console
- [ ] Correct App ID and Secret in Firebase
- [ ] OAuth redirect URIs configured in Facebook
- [ ] App domains configured in Facebook
- [ ] Privacy policy URL set in Facebook
- [ ] No popup blockers active
- [ ] Testing on authorized domain

## Debug Information

The debug component will show detailed information about:
- Facebook SDK loading status
- Firebase authentication availability
- Specific error codes and messages

Check the browser console for additional debugging information when testing Facebook login.

## Support

If you continue to have issues:
1. Check the debug component output
2. Review browser console for error details
3. Verify all configuration steps above
4. Test with different browsers
5. Ensure you're testing on an authorized domain 