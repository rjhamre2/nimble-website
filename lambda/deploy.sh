#!/bin/bash

# Nimble WhatsApp Lambda Deployment Script
# This script creates a minimal deployment package for AWS Lambda

set -e

echo "🚀 Starting Lambda deployment package creation..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the lambda directory."
    exit 1
fi

# Clean up any existing packages
echo "🧹 Cleaning up existing packages..."
rm -rf node_modules package-lock.json lambda-deployment.zip

# Install only production dependencies
echo "📦 Installing production dependencies..."
npm install --production

# Check package size
echo "📊 Package size analysis:"
du -sh node_modules
echo "Top 5 largest dependencies:"
du -sh node_modules/* | sort -hr | head -5

# Create deployment package
echo "📦 Creating deployment package..."
zip -r lambda-deployment.zip . -x "*.git*" "node_modules/.cache/*" "*.DS_Store" "env.example" "deploy.sh" "README.md"

# Show final package size
echo "✅ Deployment package created!"
echo "📦 Package size: $(du -h lambda-deployment.zip | cut -f1)"
echo ""
echo "📋 Next steps:"
echo "1. Upload lambda-deployment.zip to AWS Lambda Console"
echo "2. Set environment variables:"
echo "   - FACEBOOK_APP_ID"
echo "   - FACEBOOK_APP_SECRET"
echo "3. Test the endpoints:"
echo "   - GET / (root)"
echo "   - GET /api/health"
echo "   - POST /api/whatsapp/exchange-code"
echo ""
echo "🔗 Your Lambda Function URL: https://ozpmzjnghswkf5fzen5rqle7p40wnxrk.lambda-url.ap-south-1.on.aws" 