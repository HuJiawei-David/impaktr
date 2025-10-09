#!/bin/bash

# Impaktr Web Deployment Script
echo "🚀 Starting Impaktr Web deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run type check
echo "🔍 Running type check..."
npm run type-check

# Build the application
echo "🏗️ Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Push to repository
    echo "📤 Pushing to repository..."
    git add .
    git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo "🎉 Deployment completed successfully!"
        echo "📋 Next steps:"
        echo "   1. Check your deployment platform (Vercel/Netlify/AWS)"
        echo "   2. Verify the application is running correctly"
        echo "   3. Test key functionality"
    else
        echo "❌ Failed to push to repository. Please check your Git credentials."
        echo "💡 You may need to:"
        echo "   - Set up a GitHub Personal Access Token"
        echo "   - Configure SSH keys"
        echo "   - Check repository permissions"
    fi
else
    echo "❌ Build failed. Please fix the errors before deploying."
    exit 1
fi
