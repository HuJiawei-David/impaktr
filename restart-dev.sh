#!/bin/bash

# Script to restart Next.js development server for current user
# Usage: ./restart-dev.sh [PORT]

PORT=${1:-3000}
USER_NAME=$(whoami)

echo "🔄 Restarting Next.js dev server for user: $USER_NAME on port: $PORT"

# Kill any existing Next.js processes for this user
echo "⏹️  Stopping existing Next.js processes..."
pkill -f "next dev -p $PORT" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true

# Clean user-specific build and cache
echo "🧹 Cleaning build cache..."
npm run clean:user

# Wait a moment for processes to fully terminate
sleep 2

# Start the development server
echo "🚀 Starting development server on port $PORT..."
PORT=$PORT npm run dev:user

echo "✅ Development server should be starting..."
echo "🌐 Open http://localhost:$PORT in your browser"
