#!/bin/bash

# Production Deployment Script for NimbleAI Website
# This script deploys the website to production at https://nimbleai.in

echo "🚀 Deploying NimbleAI Website to Production..."
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Build the project
echo "🔨 Building production version..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Production build completed successfully!"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI not found. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if user is logged into AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo "⚠️  Not logged into AWS. Please run 'aws configure' first."
    exit 1
fi

echo ""
echo "📋 Production Deployment Options:"
echo "1. AWS S3 + CloudFront (Static hosting)"
echo "2. AWS Amplify (Managed hosting)"
echo "3. Manual upload (Other hosting provider)"
echo ""

read -p "Choose deployment option (1-3): " choice

case $choice in
    1)
        echo "🚀 Deploying to AWS S3 + CloudFront..."
        read -p "Enter your S3 bucket name: " bucket_name
        read -p "Enter your CloudFront distribution ID: " distribution_id
        
        echo "📤 Uploading to S3..."
        aws s3 sync build/ s3://$bucket_name --delete
        
        if [ $? -eq 0 ]; then
            echo "✅ S3 upload successful!"
            
            echo "🔄 Invalidating CloudFront cache..."
            aws cloudfront create-invalidation --distribution-id $distribution_id --paths "/*"
            
            if [ $? -eq 0 ]; then
                echo "✅ CloudFront invalidation successful!"
            else
                echo "⚠️  CloudFront invalidation failed, but files are uploaded"
            fi
        else
            echo "❌ S3 upload failed"
            exit 1
        fi
        ;;
    2)
        echo "🚀 Deploying to AWS Amplify..."
        if ! command -v amplify &> /dev/null; then
            echo "⚠️  Amplify CLI not found. Installing..."
            npm install -g @aws-amplify/cli
        fi
        
        amplify publish
        ;;
    3)
        echo "📁 Manual deployment"
        echo "Your production build is ready in the 'build/' folder"
        echo "Upload the contents of the 'build/' folder to your hosting provider"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Update Facebook App Console settings (see PRODUCTION_DEPLOYMENT_GUIDE.md)"
echo "2. Update Firebase Console settings"
echo "3. Deploy Lambda backend (see lambda/deploy.sh)"
echo "4. Test your website at https://nimbleai.in"
echo ""
echo "📖 For detailed configuration steps, see: PRODUCTION_DEPLOYMENT_GUIDE.md"
echo ""
echo "🔗 Production URL: https://nimbleai.in" 