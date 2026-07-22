#!/bin/bash
#
# Local Development Startup Script
# This script starts all four applications for local development
#
# Usage: ./scripts/start-local.sh
#

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Eperkins Local Development - Starting All Services           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create logs directory if it doesn't exist
mkdir -p logs

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}Warning: Port $port is already in use${NC}"
        return 1
    fi
    return 0
}

# Check all ports before starting
echo "🔍 Checking ports..."
check_port 3000 || echo "   Port 3000 (Next.js) is in use"
check_port 5001 || echo "   Port 5001 (GoodNews360) is in use"
check_port 5002 || echo "   Port 5002 (Cacophiney) is in use"
check_port 5003 || echo "   Port 5003 (Eperkins-app) is in use"
echo ""

# 1. Start Next.js Eperkins App (Port 3000)
echo -e "${BLUE}📦 Starting Next.js Eperkins App (port 3000)...${NC}"
if [ ! -d "node_modules" ]; then
    echo "   Installing npm dependencies..."
    npm install
fi
npm run dev > logs/nextjs.log 2>&1 &
NEXTJS_PID=$!
echo "   ✓ Next.js started (PID: $NEXTJS_PID)"
echo "   📄 Logs: logs/nextjs.log"
echo ""

# Wait a moment for Next.js to start
sleep 3

# 2. Start GoodNews360 Python App (Port 5001)
echo -e "${BLUE}🎬 Starting GoodNews360 Video Automation (port 5001)...${NC}"
cd GoodNews360-app
if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "   Installing Python dependencies..."
    pip install -r requirements.txt
    echo "   Installing Playwright browsers..."
    playwright install chromium
else
    source venv/bin/activate
fi
python app.py > ../logs/goodnews360.log 2>&1 &
GOODNEWS_PID=$!
echo "   ✓ GoodNews360 started (PID: $GOODNEWS_PID)"
echo "   📄 Logs: logs/goodnews360.log"
deactivate
cd ..
echo ""

# 3. Start Cacophiney Python App (Port 5002)
echo -e "${BLUE}🎬 Starting Cacophiney Video Automation (port 5002)...${NC}"
cd Cacophiney-app
if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "   Installing Python dependencies..."
    pip install -r requirements.txt
    echo "   Installing Playwright browsers..."
    playwright install chromium
else
    source venv/bin/activate
fi
python app.py > ../logs/cacophiney.log 2>&1 &
CACOPHINEY_PID=$!
echo "   ✓ Cacophiney started (PID: $CACOPHINEY_PID)"
echo "   📄 Logs: logs/cacophiney.log"
deactivate
cd ..
echo ""

# 4. Start Eperkins-app Python App (Port 5003)
echo -e "${BLUE}🎬 Starting Eperkins/MyRPMCare Video Automation (port 5003)...${NC}"
cd Eperkins-app
if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "   Installing Python dependencies..."
    pip install -r requirements.txt
    echo "   Installing Playwright browsers..."
    playwright install chromium
else
    source venv/bin/activate
fi
python app.py > ../logs/eperkins-app.log 2>&1 &
EPERKINS_APP_PID=$!
echo "   ✓ Eperkins-app started (PID: $EPERKINS_APP_PID)"
echo "   📄 Logs: logs/eperkins-app.log"
deactivate
cd ..
echo ""

# Save PIDs to file for stop script
cat > .local-pids <<EOF
NEXTJS_PID=$NEXTJS_PID
GOODNEWS_PID=$GOODNEWS_PID
CACOPHINEY_PID=$CACOPHINEY_PID
EPERKINS_APP_PID=$EPERKINS_APP_PID
EOF

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ALL SERVICES STARTED SUCCESSFULLY                            ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Next.js Eperkins App:${NC}          http://localhost:3000"
echo -e "${GREEN}✅ GoodNews360 Automation:${NC}        http://localhost:5001"
echo -e "${GREEN}✅ Cacophiney Automation:${NC}         http://localhost:5002"
echo -e "${GREEN}✅ Eperkins/MyRPMCare Automation:${NC} http://localhost:5003"
echo ""
echo -e "${YELLOW}📝 View logs:${NC}"
echo "   tail -f logs/nextjs.log"
echo "   tail -f logs/goodnews360.log"
echo "   tail -f logs/cacophiney.log"
echo "   tail -f logs/eperkins-app.log"
echo ""
echo -e "${YELLOW}🛑 Stop all services:${NC}"
echo "   ./scripts/stop-local.sh"
echo ""
echo "═══════════════════════════════════════════════════════════════"
