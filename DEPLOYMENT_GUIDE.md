# NimbleAI Website Deployment Guide

This guide will help you deploy the NimbleAI website to production.

## 🚀 Quick Deployment Options

### Option 1: Vercel (Recommended - Easiest)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Option 2: Netlify
```bash
# Build the project
npm run build

# Deploy using Netlify CLI or drag & drop build/ folder
```

### Option 3: AWS S3 + CloudFront
```bash
# Use the provided deployment script
./deploy-production.sh
```

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
Create a `.env.local` file in the project root:
```bash
cp env.example .env.local
```

Fill in your actual values:
- Firebase configuration (already in `src/firebase.js`)
- AWS Lambda backend URL
- Facebook App ID
- Google Analytics ID (optional)

### 2. Firebase Configuration
Ensure your Firebase project is properly configured:
- Authentication enabled (Google, Facebook)
- Firestore database created
- Security rules configured
- Domain whitelisted for authentication

### 3. AWS Lambda Backend
Deploy your Lambda function first:
```bash
cd /path/to/your/lambda
./deploy.sh
```

### 4. Facebook App Configuration
Update your Facebook App settings:
- Add your production domain to "App Domains"
- Add your production URL to "Valid OAuth Redirect URIs"
- Set "App Mode" to "Live"

## 🔧 Build and Test

### Local Testing
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Test production build locally
npx serve -s build
```

### Build Verification
After building, check that:
- No console errors
- All routes work correctly
- Authentication flows work
- API calls succeed

## 🌐 Deployment Platforms

### Vercel (Recommended)
1. **Connect Repository**: Link your GitHub/GitLab repo to Vercel
2. **Configure Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`
3. **Environment Variables**: Add all variables from `.env.local`
4. **Deploy**: Vercel will auto-deploy on every push to main branch

### Netlify
1. **Connect Repository**: Link your Git repo
2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `build`
3. **Environment Variables**: Add in Netlify dashboard
4. **Custom Domain**: Configure in Netlify dashboard

### AWS S3 + CloudFront
1. **Create S3 Bucket**: Enable static website hosting
2. **Upload Files**: Use the deployment script or AWS CLI
3. **Create CloudFront Distribution**: Point to S3 bucket
4. **Configure Custom Domain**: Add SSL certificate

### AWS Amplify
1. **Connect Repository**: Link your Git repo
2. **Configure Build**: Amplify will auto-detect React settings
3. **Environment Variables**: Add in Amplify console
4. **Custom Domain**: Configure in Amplify console

## 🔒 Security Configuration

### Content Security Policy
The `vercel.json` file includes a comprehensive CSP. Update it for your needs:
- Add your analytics domains
- Configure Facebook/Google domains
- Set up reporting endpoints

### HTTPS
Ensure your hosting provider supports HTTPS:
- Vercel/Netlify: Automatic
- AWS: Use CloudFront with SSL certificate
- Custom hosting: Install SSL certificate

### Environment Variables
Never commit sensitive data:
- Use `.env.local` for local development
- Use hosting platform's environment variable system
- Keep API keys and secrets secure

## 📊 Post-Deployment

### 1. Testing Checklist
- [ ] Homepage loads correctly
- [ ] Navigation works
- [ ] Authentication flows work
- [ ] Dashboard loads for authenticated users
- [ ] Onboarding process works
- [ ] API calls succeed
- [ ] Mobile responsiveness
- [ ] Performance is acceptable

### 2. Monitoring Setup
- Set up error tracking (Sentry, LogRocket)
- Configure analytics (Google Analytics, Mixpanel)
- Monitor API performance
- Set up uptime monitoring

### 3. SEO and Performance
- Verify meta tags are correct
- Check page load speeds
- Test social media sharing
- Validate structured data

## 🛠️ Troubleshooting

### Common Issues

**Build Failures**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Environment Variables Not Working**
- Ensure variables start with `REACT_APP_`
- Restart development server after changes
- Check hosting platform's environment variable system

**Authentication Issues**
- Verify Firebase configuration
- Check domain whitelist in Firebase console
- Ensure Facebook app is in "Live" mode

**API Connection Issues**
- Verify Lambda function is deployed
- Check CORS configuration
- Ensure environment variables are set correctly

### Debug Commands
```bash
# Check build output
npm run build

# Test production build
npx serve -s build

# Check for unused dependencies
npx depcheck

# Audit dependencies
npm audit
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Firebase and AWS console logs
3. Check browser developer tools for errors
4. Verify all environment variables are set correctly

## 🔄 Continuous Deployment

### GitHub Actions (Optional)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run deploy
```

## 📈 Performance Optimization

### Build Optimization
- Code splitting is already configured
- Images are optimized
- CSS is minified
- JavaScript is bundled and minified

### Runtime Optimization
- Lazy loading for components
- Optimized bundle sizes
- Efficient state management
- Minimal re-renders

---

**Ready to deploy?** Choose your preferred platform and follow the steps above. The website is production-ready with proper security, performance, and deployment configurations.
