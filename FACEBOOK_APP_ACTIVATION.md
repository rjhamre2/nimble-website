# Facebook App Activation Guide

Your Facebook app is currently inactive, which is causing the "App not active" error. This guide will help you activate it.

## Current Issue

**Error**: "App not active - This app is not currently accessible and the app developer is aware of the issue."

**App ID**: `1110256151158809`

## Quick Fix Options

### Option 1: Activate Current App (Recommended)

1. **Go to Facebook Developer Console**: https://developers.facebook.com/apps/1110256151158809
2. **Check App Status**:
   - Look for "App Review" or "App Status" section
   - If it shows "Development Mode", you need to activate it

3. **For Development/Testing**:
   - Go to **Roles** → **Test Users**
   - Add your Facebook account as a test user
   - This allows you to test the app immediately

4. **For Production Use**:
   - Go to **App Review** → **Submit for Review**
   - Follow Facebook's review process
   - This can take several days

### Option 2: Create New Test App

If the current app has issues:

1. **Create New App**:
   - Go to https://developers.facebook.com/
   - Click "Create App"
   - Choose "Consumer" or "Business" type
   - Name it "Nimble AI Test"

2. **Configure New App**:
   - Add Facebook Login product
   - Get new App ID and Secret
   - Update the code with new credentials

## Step-by-Step Activation

### Step 1: Access Your App

1. Visit: https://developers.facebook.com/apps/1110256151158809
2. Sign in with your Facebook account
3. You should see your app dashboard

### Step 2: Check App Status

Look for these indicators:
- **Development Mode**: App is active for test users only
- **Live Mode**: App is active for all users
- **Disabled**: App has been disabled by Facebook

### Step 3: Add Test Users (Quick Fix)

1. In the left sidebar, click **"Roles"**
2. Click **"Test Users"**
3. Click **"Add Test User"**
4. Add your Facebook account email
5. Save the changes

### Step 4: Configure App Settings

1. Go to **"Settings"** → **"Basic"**
2. Ensure these are set:
   - **App Domains**: `localhost`, `nimbleai-firebase.firebaseapp.com`
   - **Privacy Policy URL**: `https://nimbleai.in/privacy-policy`
   - **Terms of Service URL**: `https://nimbleai.in/terms-of-service`

### Step 5: Configure Facebook Login

1. Go to **"Facebook Login"** → **"Settings"**
2. Add these OAuth redirect URIs:
   ```
   https://nimbleai-firebase.firebaseapp.com/__/auth/handler
   http://localhost:3000/__/auth/handler
   ```

## Testing After Activation

1. **Refresh your website**: http://localhost:3000
2. **Check the Facebook Status component** - should show "✅ App is active"
3. **Try Facebook login** - should work without errors

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| App in Development Mode | Add test users or submit for review |
| App disabled | Check for policy violations |
| Missing permissions | Configure required permissions |
| Invalid redirect URIs | Add correct OAuth redirect URIs |

## Development vs Production

### Development Mode
- ✅ Works immediately with test users
- ✅ No review required
- ❌ Limited to test users only

### Production Mode
- ✅ Works for all users
- ✅ Full functionality
- ❌ Requires Facebook review (3-7 days)

## Quick Test

After making changes:

1. **Wait 5-10 minutes** for changes to propagate
2. **Clear browser cache** and refresh
3. **Try Facebook login** again
4. **Check browser console** for any errors

## Support

If you continue having issues:

1. **Check Facebook Developer Console** for specific error messages
2. **Verify app status** in the dashboard
3. **Ensure you're using the correct App ID**
4. **Test with different browsers**

## Next Steps

Once the app is active:
1. Remove the debug components from the code
2. Test the full authentication flow
3. Configure Firebase Console (if not done already)
4. Deploy to production with proper domain configuration 