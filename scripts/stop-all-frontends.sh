#!/bin/bash
#
# Stop All Frontends Script
# Stops all running frontend applications
#
# Usage: ./scripts/stop-all-frontends.sh
#

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Stopping All Frontend Applications                           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

if [ ! -f ".frontend-pids" ]; then
    echo "⚠️  No PID file found (.frontend-pids)"
    echo "   Attempting to stop by port..."

    for port in 3000 3001 3002; do
        PID=$(lsof -ti:$port 2>/dev/null || echo "")
        if [ ! -z "$PID" ]; then
            echo -e "${RED}🛑 Stopping frontend on port $port (PID: $PID)...${NC}"
            kill $PID 2>/dev/null || echo "   Failed to kill $PID"
        fi
    done
else
    source .frontend-pids

    echo -e "${RED}🛑 Stopping Eperkins Frontend (PID: $EPERKINS_FRONTEND_PID)...${NC}"
    kill $EPERKINS_FRONTEND_PID 2>/dev/null && echo "   ✓ Stopped" || echo "   Already stopped"

    echo -e "${RED}🛑 Stopping GoodNews360 Frontend (PID: $GOODNEWS_FRONTEND_PID)...${NC}"
    kill $GOODNEWS_FRONTEND_PID 2>/dev/null && echo "   ✓ Stopped" || echo "   Already stopped"

    echo -e "${RED}🛑 Stopping Cacophiney Frontend (PID: $CACOPHINEY_FRONTEND_PID)...${NC}"
    kill $CACOPHINEY_FRONTEND_PID 2>/dev/null && echo "   ✓ Stopped" || echo "   Already stopped"

    rm .frontend-pids
    echo "   ✓ Removed PID file"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ALL FRONTENDS STOPPED                                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Verify ports are free
echo "🔍 Verifying ports are free..."
for port in 3000 3001 3002; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "   ⚠️  Port $port is still in use"
    else
        echo -e "${GREEN}   ✓ Port $port is free${NC}"
    fi
done

echo ""
