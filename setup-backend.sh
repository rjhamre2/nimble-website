#!/bin/bash

echo "🚀 Setting up WhatsApp Backend Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Navigate to backend directory
cd backend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "⚠️  Please edit .env file and add your Facebook App Secret"
    echo "   You can find it at: https://developers.facebook.com/apps/1110256151158809/settings/basic/"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Backend setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and add your Facebook App Secret"
echo "2. Start the backend server: cd backend && npm run dev"
echo "3. Test the API: curl http://localhost:5001/api/health"
echo ""
echo "The backend will be available at: http://localhost:5001" 