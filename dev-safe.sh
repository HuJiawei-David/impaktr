#!/bin/bash

# Safe development script for multi-user environments
# Monitors memory and manages development processes

USER_NAME=$(whoami)
PORT=${PORT:-${1:-3000}}
MEMORY_THRESHOLD=85

echo "🚀 Starting safe development environment for $USER_NAME on port $PORT"

# Function to check memory usage
check_memory() {
    MEMORY_USED=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
    echo $MEMORY_USED
}

# Function to cleanup memory
cleanup_memory() {
    echo "🧹 Memory usage high (${1}%), cleaning up..."
    
    # Kill only current user's TypeScript servers
    pkill -u $USER_NAME -f tsserver 2>/dev/null && echo "  ✅ Killed TypeScript servers"
    
    # Clean user's build cache
    npm run clean:user 2>/dev/null && echo "  ✅ Cleaned build cache"
    
    # Give system time to recover
    sleep 3
}

# Check initial memory
INITIAL_MEMORY=$(check_memory)
echo "📊 Initial memory usage: ${INITIAL_MEMORY}%"

if [ $INITIAL_MEMORY -gt $MEMORY_THRESHOLD ]; then
    cleanup_memory $INITIAL_MEMORY
fi

# Start development server with memory monitoring
echo "⚡ Starting Next.js development server..."

# Set memory-optimized environment variables
export NODE_OPTIONS="--max-old-space-size=1024"
export NEXT_TELEMETRY_DISABLED=1

# Start the development server
PORT=$PORT npm run dev:user &
DEV_PID=$!

echo "🎯 Development server started (PID: $DEV_PID)"
echo "🌐 Access your app at http://localhost:$PORT"
echo "📊 Monitoring memory usage... (Ctrl+C to stop)"

# Monitor memory in background
while kill -0 $DEV_PID 2>/dev/null; do
    sleep 30
    CURRENT_MEMORY=$(check_memory)
    
    if [ $CURRENT_MEMORY -gt $MEMORY_THRESHOLD ]; then
        echo "⚠️  Memory usage high: ${CURRENT_MEMORY}%"
        echo "💡 Consider closing unused IDE tabs or running './memory-monitor.sh --cleanup'"
    fi
done

echo "🛑 Development server stopped"
