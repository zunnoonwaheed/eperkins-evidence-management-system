#!/bin/bash
#
# Local Development Stop Script
# This script stops all running development services
#
# Usage: ./scripts/stop-local.sh
#

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Eperkins Local Development - Stopping All Services           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if PID file exists
if [ ! -f ".local-pids" ]; then
    echo -e "${YELLOW}⚠️  No PID file found (.local-pids)${NC}"
    echo "   Services may not have been started with start-local.sh"
    echo "   Attempting to find and stop services by port..."
    echo ""

    # Try to kill by port
    for port in 3000 5001 5002 5003; do
        PID=$(lsof -ti:$port 2>/dev/null || echo "")
        if [ ! -z "$PID" ]; then
            echo -e "${RED}🛑 Stopping service on port $port (PID: $PID)...${NC}"
            kill $PID 2>/dev/null || echo "   Failed to kill $PID"
        fi
    done
else
    # Load PIDs from file
    source .local-pids

    # Stop each service
    echo -e "${RED}🛑 Stopping Next.js Eperkins App (PID: $NEXTJS_PID)...${NC}"
    kill $NEXTJS_PID 2>/dev/null && echo "   ✓ Stopped" || echo "   Already stopped or not found"

    echo -e "${RED}🛑 Stopping GoodNews360 App (PID: $GOODNEWS_PID)...${NC}"
    kill $GOODNEWS_PID 2>/dev/null && echo "   ✓ Stopped" || echo "   Already stopped or not found"

    echo -e "${RED}🛑 Stopping Cacophiney App (PID: $CACOPHINEY_PID)...${NC}"
    kill $CACOPHINEY_PID 2>/dev/null && echo "   ✓ Stopped" || echo "   Already stopped or not found"

    echo -e "${RED}🛑 Stopping Eperkins-app (PID: $EPERKINS_APP_PID)...${NC}"
    kill $EPERKINS_APP_PID 2>/dev/null && echo "   ✓ Stopped" || echo "   Already stopped or not found"

    # Remove PID file
    rm .local-pids
    echo ""
    echo "   ✓ Removed PID file"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ALL SERVICES STOPPED                                         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Verify all ports are free
echo "🔍 Verifying ports are free..."
for port in 3000 5001 5002 5003; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}   ⚠️  Port $port is still in use${NC}"
        PID=$(lsof -ti:$port)
        echo "      You may need to manually kill: kill $PID"
    else
        echo -e "${GREEN}   ✓ Port $port is free${NC}"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
