#!/bin/bash
#
# Start All Backends Script
# Starts all three Python backend applications
#
# Usage: ./scripts/start-all-backends.sh
#

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Starting All Backend Applications                            ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create logs directory
mkdir -p logs

# 1. Start GoodNews360 Backend (Port 5001)
echo -e "${BLUE}🎬 Starting GoodNews360 Backend (port 5001)...${NC}"
cd "$PROJECT_ROOT/GoodNews360-app"
if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    playwright install chromium
else
    source venv/bin/activate
fi
python app.py > ../logs/goodnews360-backend.log 2>&1 &
GOODNEWS_BACKEND_PID=$!
echo "   ✓ GoodNews360 Backend started (PID: $GOODNEWS_BACKEND_PID)"
deactivate
echo ""

# 2. Start Cacophiney Backend (Port 5002)
echo -e "${BLUE}🎬 Starting Cacophiney Backend (port 5002)...${NC}"
cd "$PROJECT_ROOT/Cacophiney-app"
if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    playwright install chromium
else
    source venv/bin/activate
fi
python app.py > ../logs/cacophiney-backend.log 2>&1 &
CACOPHINEY_BACKEND_PID=$!
echo "   ✓ Cacophiney Backend started (PID: $CACOPHINEY_BACKEND_PID)"
deactivate
echo ""

# 3. Start Eperkins/RPMCare Backend (Port 5003)
echo -e "${BLUE}🎬 Starting Eperkins/RPMCare Backend (port 5003)...${NC}"
cd "$PROJECT_ROOT/Eperkins-app"
if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    playwright install chromium
else
    source venv/bin/activate
fi
python app.py > ../logs/eperkins-backend.log 2>&1 &
EPERKINS_BACKEND_PID=$!
echo "   ✓ Eperkins Backend started (PID: $EPERKINS_BACKEND_PID)"
deactivate
echo ""

# Save PIDs
cd "$PROJECT_ROOT"
cat > .backend-pids <<EOF
GOODNEWS_BACKEND_PID=$GOODNEWS_BACKEND_PID
CACOPHINEY_BACKEND_PID=$CACOPHINEY_BACKEND_PID
EPERKINS_BACKEND_PID=$EPERKINS_BACKEND_PID
EOF

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ALL BACKENDS STARTED SUCCESSFULLY                            ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ GoodNews360 Backend:${NC}         http://localhost:5001"
echo -e "${GREEN}✅ Cacophiney Backend:${NC}          http://localhost:5002"
echo -e "${GREEN}✅ Eperkins/RPMCare Backend:${NC}    http://localhost:5003"
echo ""
echo "📝 View logs:"
echo "   tail -f logs/goodnews360-backend.log"
echo "   tail -f logs/cacophiney-backend.log"
echo "   tail -f logs/eperkins-backend.log"
echo ""
echo "🛑 Stop all backends:"
echo "   ./scripts/stop-all-backends.sh"
echo ""
