#!/bin/bash

# Memory monitoring and cleanup script for multi-user development

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Memory Monitor for Multi-User Development${NC}"
echo "=================================================="

# Check current memory usage
MEMORY_INFO=$(free -h)
MEMORY_USED_PERCENT=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
SWAP_USED_PERCENT=$(free | grep Swap | awk '{if($2>0) printf("%.1f", $3/$2 * 100.0); else print "0"}')

echo -e "\n${BLUE}📊 Current Memory Status:${NC}"
echo "$MEMORY_INFO"
echo ""
echo -e "Memory Usage: ${MEMORY_USED_PERCENT}%"
echo -e "Swap Usage: ${SWAP_USED_PERCENT}%"

# Warning thresholds
if (( $(echo "$MEMORY_USED_PERCENT > 85" | bc -l) )); then
    echo -e "\n${RED}⚠️  HIGH MEMORY USAGE WARNING!${NC}"
    echo "Memory usage is above 85%. This may cause SSH disconnections."
fi

if (( $(echo "$SWAP_USED_PERCENT > 50" | bc -l) )); then
    echo -e "\n${RED}⚠️  HIGH SWAP USAGE WARNING!${NC}"
    echo "Swap usage is above 50%. System performance may be degraded."
fi

# Show top memory consumers
echo -e "\n${BLUE}🔝 Top Memory Consumers:${NC}"
ps aux --sort=-%mem | head -10 | awk 'NR==1{print $0} NR>1{printf "%-10s %5s %5s %s\n", $1, $3, $4, $11}'

# Show TypeScript servers specifically
echo -e "\n${BLUE}📝 TypeScript Servers:${NC}"
ps aux | grep tsserver | grep -v grep | awk '{printf "%-10s %5s %5s %s\n", $1, $3, $4, "tsserver"}'

# Show Next.js servers
echo -e "\n${BLUE}⚡ Next.js Servers:${NC}"
ps aux | grep "next-server\|next dev" | grep -v grep | awk '{printf "%-10s %5s %5s %s\n", $1, $3, $4, "next-server"}'

# Check for development processes by user
echo -e "\n${BLUE}👥 Development Processes by User:${NC}"
for user in ubuntu liangqi; do
    if id "$user" &>/dev/null; then
        echo -e "\n${YELLOW}User: $user${NC}"
        ps aux | grep "^$user" | grep -E "(tsserver|next|cursor|node)" | grep -v grep | wc -l | xargs echo "  Active dev processes:"
        ps aux | grep "^$user" | grep -E "(tsserver|next|cursor|node)" | grep -v grep | awk '{mem+=$6} END {printf "  Total memory: %.1f MB\n", mem/1024}'
    fi
done

# Cleanup suggestions
echo -e "\n${BLUE}🧹 Cleanup Suggestions:${NC}"

if (( $(echo "$MEMORY_USED_PERCENT > 80" | bc -l) )); then
    echo "1. Restart TypeScript servers: pkill -f tsserver"
    echo "2. Clean Next.js caches: npm run clean:user"
    echo "3. Close unused IDE windows"
    echo "4. Restart development servers"
fi

# Quick cleanup function
cleanup_dev() {
    echo -e "\n${YELLOW}🧹 Running development cleanup...${NC}"
    
    # Kill TypeScript servers (they will restart automatically)
    pkill -f tsserver && echo "✅ Killed TypeScript servers"
    
    # Clean build caches
    cd /home/ubuntu/impaktrweb
    npm run clean:user && echo "✅ Cleaned build caches"
    
    sleep 2
    echo -e "${GREEN}✅ Cleanup complete!${NC}"
}

# Check if cleanup is requested
if [[ "$1" == "--cleanup" ]]; then
    cleanup_dev
fi

echo -e "\n${GREEN}💡 Tips:${NC}"
echo "• Run './memory-monitor.sh --cleanup' for automatic cleanup"
echo "• Use 'npm run dev:user' instead of 'npm run dev' for isolated builds"
echo "• Close unused IDE tabs and extensions"
echo "• Consider upgrading EC2 instance if problems persist"
