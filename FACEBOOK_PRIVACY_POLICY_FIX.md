# Fix: Facebook Privacy Policy URL Issue

## Current Issue
When trying to switch to Live Mode, Facebook says "provide privacy policy URL" even though it's already there.

## Common Causes

1. **URL not accessible** - Facebook can't reach the privacy policy page
2. **Missing required URLs** - Facebook needs multiple URLs for Live Mode
3. **URL format issues** - Incorrect URL format or protocol
4. **Domain mismatch** - URL domain doesn't match app domain

## Step-by-Step Fix

### Step 1: Verify All Required URLs

Facebook requires these URLs for Live Mode:

1. **Privacy Policy URL**: `https://nimbleai.in/privacy-policy`
2. **Terms of Service URL**: `https://nimbleai.in/terms-of-service`
3. **Data Deletion URL**: `https://nimbleai.in/delete-user-data`

### Step 2: Add URLs in Facebook Console

1. **Go to**: https://developers.facebook.com/apps/1110256151158809/settings/basic/
2. **Scroll down** to find these fields:
   - Privacy Policy URL
   - Terms of Service URL
   - Data Deletion URL
3. **Add all three URLs** exactly as shown above
4. **Click "Save Changes"**

### Step 3: Verify URL Accessibility

The Privacy Policy Tester component will check if all URLs are accessible. Make sure:

- ✅ All URLs return HTTP 200 status
- ✅ URLs are publicly accessible
- ✅ No redirects or authentication required

### Step 4: Check Domain Configuration

1. **In Facebook Console** → **Settings** → **Basic**
2. **Verify App Domains** include:
   ```
   nimbleai.in
   localhost
   nimbleai-firebase.firebaseapp.com
   ```

### Step 5: Try Switching to Live Mode Again

1. **Go to**: **App Review** → **Make [App Name] public?**
2. **Click "Make [App Name] public"**
3. **If still failing**, check the specific error message

## Alternative Solutions

### Option 1: Use Development Mode with Test Users

If Live Mode continues to have issues:

1. **Stay in Development Mode**
2. **Add yourself as a test user**:
   - Go to **Roles** → **Test Users**
   - Add your Facebook account email
3. **Test with test user credentials**

### Option 2: Create New App

If the current app has persistent issues:

1. **Create new Facebook app**
2. **Configure with proper URLs from the start**
3. **Get new App ID and update code**

## URL Requirements

### Privacy Policy Must Include:
- How you collect user data
- How you use user data
- How users can contact you
- Data retention policies
- User rights (GDPR/CCPA compliance)

### Terms of Service Must Include:
- User responsibilities
- Service limitations
- Dispute resolution
- Contact information

### Data Deletion Must Include:
- How users can request data deletion
- Timeline for deletion
- Contact information for requests

## Testing Checklist

- [ ] All three URLs are added in Facebook Console
- [ ] All URLs are accessible (check with Privacy Policy Tester)
- [ ] App domains are properly configured
- [ ] URLs match the app's domain
- [ ] No authentication required to access URLs

## Common Error Messages

| Error | Solution |
|-------|----------|
| "Privacy Policy URL required" | Add all three required URLs |
| "URL not accessible" | Check if URLs are publicly accessible |
| "Domain mismatch" | Ensure URLs match app domain |
| "Invalid URL format" | Use HTTPS protocol |

## Next Steps

1. **Add all three URLs** in Facebook Console
2. **Test URL accessibility** with the Privacy Policy Tester
3. **Try switching to Live Mode** again
4. **If still failing**, use Development Mode with test users

## Support

If issues persist:
1. Check Facebook Developer Console for specific error messages
2. Verify all URLs are accessible from different locations
3. Ensure URLs contain proper privacy policy content
4. Consider using Development Mode temporarily 