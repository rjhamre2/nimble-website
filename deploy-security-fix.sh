#!/bin/bash

# Facebook Security Fix Deployment Script
# This script deploys the security fixes for Facebook authentication

echo "🔒 Deploying Facebook Security Fixes..."
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build completed successfully!"

# Deploy to AWS (you'll need to customize this based on your AWS setup)
echo "🚀 Deploying to AWS..."
echo "⚠️  Please deploy the 'build' folder to your AWS hosting platform"
echo "   (S3, CloudFront, Amplify, or your preferred AWS service)"

echo ""
echo "📋 Next Steps:"
echo "1. Upload the 'build' folder to your AWS hosting platform"
echo "2. Update Facebook App Console settings (see FACEBOOK_SECURITY_FIX.md)"
echo "3. Update Firebase Console settings"
echo "4. Test Facebook login on your production site"
echo ""
echo "🔗 Production URL: https://nimbleai.in"
echo ""
echo "📖 For detailed configuration steps, see: FACEBOOK_SECURITY_FIX.md"
echo ""
echo "✅ Build folder is ready for deployment!" 