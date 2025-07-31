# Fix: "App not active" Facebook Authentication Error

## Current Error
```
Facebook login failed: Firebase: Invalid IdP response/credential: 
https://nimbleai-firebase.firebaseapp.com/__/auth/handler?error_code=1349126&error_message=App+not+active
```

## Root Cause
The Facebook app `1110256151158809` is not currently active or accessible, even though it may appear approved in the console.

## Quick Fix Options

### Option 1: Activate Current App (Recommended)

1. **Go to Facebook Developer Console**: https://developers.facebook.com/apps/1110256151158809
2. **Check App Status**:
   - Look for "Development Mode" vs "Live Mode"
   - If in Development Mode, add yourself as a test user

3. **Add Test Users**:
   - Go to **Roles** → **Test Users**
   - Click **"Add Test User"**
   - Add your Facebook account email
   - Save changes

4. **Switch to Live Mode** (if ready):
   - Go to **App Review** → **Make [App Name] public?**
   - Click **"Make [App Name] public"**

### Option 2: Create New Test App (Quick Fix)

If the current app has persistent issues:

1. **Create New App**:
   - Go to https://developers.facebook.com/
   - Click "Create App"
   - Choose "Consumer" type
   - Name: "Nimble AI Test"

2. **Configure New App**:
   - Add Facebook Login product
   - Get new App ID and Secret
   - Update the code with new credentials

## Step-by-Step Resolution

### Step 1: Verify App Status

1. Visit: https://developers.facebook.com/apps/1110256151158809
2. Check the app dashboard for:
   - **Development Mode**: Limited to test users
   - **Live Mode**: Available to all users
   - **Disabled**: App has been disabled

### Step 2: Development Mode Fix

If app is in Development Mode:

1. **Add Test Users**:
   - Go to **Roles** → **Test Users**
   - Add your Facebook account
   - Use test user credentials for login

2. **Or Switch to Live Mode**:
   - Go to **App Review**
   - Submit app for review
   - Wait for approval (3-7 days)

### Step 3: Update Configuration

After fixing app status:

1. **Update Firebase Console**:
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable Facebook provider
   - Add correct App Secret

2. **Update Facebook App Settings**:
   - Add domains: `localhost`, `nimbleai-firebase.firebaseapp.com`
   - Add OAuth redirect URIs
   - Set privacy policy URL

## Testing After Fix

1. **Wait 5-10 minutes** for changes to propagate
2. **Clear browser cache** and refresh
3. **Try Facebook login** again
4. **Check diagnostic components** for status

## Common Issues

| Issue | Solution |
|-------|----------|
| App in Development Mode | Add test users or switch to Live Mode |
| App disabled | Check for policy violations |
| Wrong App Secret | Update Firebase Console settings |
| Missing domains | Add domains to Facebook app settings |

## Alternative: Use Google Login Only

If Facebook continues to have issues, you can:

1. **Remove Facebook login** temporarily
2. **Keep Google login** (which is working)
3. **Focus on core functionality** first
4. **Add Facebook back** once app issues are resolved

## Next Steps

1. **Try Option 1** (activate current app)
2. **If that fails**, try Option 2 (create new app)
3. **Test thoroughly** after any changes
4. **Remove debug components** once working

## Support

If issues persist:
1. Check Facebook Developer Console for specific error messages
2. Verify app status and permissions
3. Test with different browsers
4. Consider creating a fresh test app 