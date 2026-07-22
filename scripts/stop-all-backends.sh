#!/bin/bash
#
# Stop All Backends Script
# Stops all running backend applications
#
# Usage: ./scripts/stop-all-backends.sh
#

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Stopping All Backend Applications                            ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

if [ ! -f ".backend-pids" ]; then
    echo "⚠️  No PID file found (.backend-pids)"
    echo "   Attempting to stop by port..."

    for port in 5001 5002 5003; do
        PID=$(lsof -ti:$port 2>/dev/null || echo "")
        if [ ! -z "$PID" ]; then
            echo -e "${RED}🛑 Stopping backend on port $port (PID: $PID)...${NC}"
            kill $PID 2>/dev/null || echo "   Failed to kill $PID"
        fi
    done
else
    source .backend-pids

    echo -e "${RED}🛑 Stopping GoodNews360 Backend (PID: $GOODNEWS_BACKEND_PID)...${NC}"
    kill $GOODNEWS_BACKEND_PID 2>/dev/null && echo "   ✓ Stopped" || echo "   Already stopped"

    echo -e "${RED}🛑 Stopping Cacophiney Backend (PID: $CACOPHINEY_BACKEND_PID)...${NC}"
    kill $CACOPHINEY_BACKEND_PID 2>/dev/null && echo "   ✓ Stopped" || echo "   Already stopped"

    echo -e "${RED}🛑 Stopping Eperkins Backend (PID: $EPERKINS_BACKEND_PID)...${NC}"
    kill $EPERKINS_BACKEND_PID 2>/dev/null && echo "   ✓ Stopped" || echo "   Already stopped"

    rm .backend-pids
    echo "   ✓ Removed PID file"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ALL BACKENDS STOPPED                                         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Verify ports are free
echo "🔍 Verifying ports are free..."
for port in 5001 5002 5003; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "   ⚠️  Port $port is still in use"
    else
        echo -e "${GREEN}   ✓ Port $port is free${NC}"
    fi
done

echo ""
