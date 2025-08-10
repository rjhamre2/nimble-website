#!/bin/bash

# Vercel Deployment Script for NimbleAI Website
# This script deploys the website to Vercel

echo "🚀 Deploying NimbleAI Website to Vercel..."
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the project
echo "🔨 Building production version..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Production build completed successfully!"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Configure environment variables in Vercel dashboard"
    echo "2. Set up custom domain (if needed)"
    echo "3. Test your website"
    echo ""
    echo "🔗 Your website is now live!"
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi
