# Production Deployment Guide - NimbleAI Website

## 🎯 Overview
This guide will help you deploy your NimbleAI website to production at `https://nimbleai.in` with all Facebook and WhatsApp integrations working properly.

## 📋 Pre-Deployment Checklist

### ✅ Code Quality
- [x] Production build completed successfully
- [x] All security configurations in place
- [x] Facebook SDK configured for HTTPS
- [x] WhatsApp Business integration ready
- [x] Lambda backend configured

### 🔧 Facebook App Configuration

#### Step 1: Update Facebook App Settings
1. Go to [Facebook Developer Console](https://developers.facebook.com/apps/1110256151158809/settings/basic/)
2. **App Domains**: Add `nimbleai.in`
3. **Privacy Policy URL**: `https://nimbleai.in/privacy-policy`
4. **Terms of Service URL**: `https://nimbleai.in/terms-of-service`
5. **App Mode**: Ensure it's set to **Live**

#### Step 2: Configure Facebook Login
1. Go to **Facebook Login** → **Settings**
2. **OAuth Redirect URIs**: Add these URLs:
   ```
   https://nimbleai.in/__/auth/handler
   https://nimbleai.in/
   https://nimbleai-firebase.firebaseapp.com/__/auth/handler
   https://nimbleai-firebase.firebaseapp.com/
   ```

#### Step 3: Configure WhatsApp Business API
1. Go to **WhatsApp** → **Getting Started**
2. **Configuration ID**: Verify `1464707537999245` is active
3. **Webhook URL**: Set to your Lambda endpoint
4. **Verify Token**: Set a secure token

### 🔧 Firebase Configuration

#### Step 1: Update Authorized Domains
1. Go to [Firebase Console](https://console.firebase.google.com/project/nimbleai-firebase/authentication/settings)
2. **Authorized domains**: Add `nimbleai.in`
3. **Existing domains**: Keep `nimbleai-firebase.firebaseapp.com`

#### Step 2: Verify Facebook Authentication
1. Go to **Authentication** → **Sign-in method**
2. **Facebook**: Ensure it's enabled
3. **App ID**: `1110256151158809`
4. **App Secret**: Verify it's correct

### 🔧 AWS Lambda Configuration

#### Step 1: Update Environment Variables
Set these environment variables in your Lambda function:
```bash
FACEBOOK_APP_ID=1110256151158809
FACEBOOK_APP_SECRET=your_facebook_app_secret
FIREBASE_SECRET_NAME=your_firebase_secret_name
FRONTEND_URL=https://nimbleai.in
NODE_ENV=production
```

#### Step 2: Update CORS Settings
Your Lambda function already has the correct CORS configuration for `https://nimbleai.in`

## 🚀 Deployment Steps

### Step 1: Deploy Frontend
Choose your preferred hosting method:

#### Option A: AWS S3 + CloudFront
```bash
# Upload build folder to S3
aws s3 sync build/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

#### Option B: AWS Amplify
```bash
# Deploy using Amplify CLI
amplify publish
```

#### Option C: Other Hosting
Upload the `build/` folder contents to your hosting provider

### Step 2: Deploy Lambda Backend
```bash
cd lambda
npm install
zip -r lambda-deployment.zip .
aws lambda update-function-code --function-name your-lambda-function --zip-file fileb://lambda-deployment.zip
```

### Step 3: Update DNS
Ensure your domain `nimbleai.in` points to your hosting provider

## 🧪 Testing Checklist

### Frontend Testing
- [ ] Website loads at `https://nimbleai.in`
- [ ] All pages render correctly
- [ ] Navigation works properly
- [ ] Responsive design works on mobile

### Facebook Integration Testing
- [ ] Facebook login button appears
- [ ] Clicking login opens Facebook popup
- [ ] Login completes successfully
- [ ] User data saves to Firebase
- [ ] Dashboard loads after login

### WhatsApp Business Testing
- [ ] WhatsApp Business setup button appears
- [ ] Clicking opens Facebook WhatsApp flow
- [ ] Setup process completes
- [ ] Integration data saves to Lambda/Firebase

### Security Testing
- [ ] HTTPS works properly
- [ ] Security headers are present
- [ ] No mixed content warnings
- [ ] CSP headers working

## 🔍 Troubleshooting

### Common Issues

**Issue: Facebook login not working**
- Check Facebook App is in Live mode
- Verify OAuth redirect URIs include `https://nimbleai.in`
- Check browser console for errors

**Issue: WhatsApp Business setup fails**
- Verify Configuration ID is active
- Check Facebook App has WhatsApp Business API enabled
- Ensure webhook URL is accessible

**Issue: HTTPS errors**
- Verify SSL certificate is valid
- Check security headers configuration
- Ensure no HTTP resources are loaded

### Debug Steps
1. Check browser console for errors
2. Verify network requests in Developer Tools
3. Test with different browsers
4. Check Lambda function logs
5. Verify Firebase authentication logs

## 📊 Monitoring

### Set up monitoring for:
- Website uptime
- Facebook login success rate
- WhatsApp Business setup completion rate
- Lambda function performance
- Firebase authentication metrics

## 🔒 Security Best Practices

### Implemented:
- ✅ HTTPS enforced
- ✅ Security headers configured
- ✅ CSP policy set
- ✅ Facebook SDK secure mode enabled
- ✅ Environment variables for secrets

### Additional recommendations:
- Set up rate limiting
- Monitor for suspicious activity
- Regular security audits
- Keep dependencies updated

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Review browser console errors
3. Check Lambda function logs
4. Verify Facebook App settings
5. Contact support with specific error messages

---

**Last Updated:** $(date)
**Status:** Ready for production deployment
**Target Domain:** https://nimbleai.in 