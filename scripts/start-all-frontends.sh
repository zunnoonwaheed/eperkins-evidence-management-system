#!/bin/bash
#
# Start All Frontends Script
# Starts all three Next.js frontend applications
#
# Usage: ./scripts/start-all-frontends.sh
#

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Starting All Frontend Applications                           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create logs directory
mkdir -p logs

# 1. Start Eperkins/RPMCare Frontend (Port 3000)
echo -e "${BLUE}📦 Starting Eperkins/RPMCare Frontend (port 3000)...${NC}"
cd "$PROJECT_ROOT"
if [ ! -d "node_modules" ]; then
    echo "   Installing npm dependencies..."
    npm install
fi
npm run dev > logs/eperkins-frontend.log 2>&1 &
EPERKINS_FRONTEND_PID=$!
echo "   ✓ Eperkins Frontend started (PID: $EPERKINS_FRONTEND_PID)"
echo ""

# 2. Start GoodNews360 Frontend (Port 3001)
echo -e "${BLUE}📦 Starting GoodNews360 Frontend (port 3001)...${NC}"
cd "$PROJECT_ROOT/goodnews360-nextjs"
if [ ! -d "node_modules" ]; then
    echo "   Installing npm dependencies..."
    npm install
fi
npm run dev > ../logs/goodnews360-frontend.log 2>&1 &
GOODNEWS_FRONTEND_PID=$!
echo "   ✓ GoodNews360 Frontend started (PID: $GOODNEWS_FRONTEND_PID)"
echo ""

# 3. Start Cacophiney Frontend (Port 3002)
echo -e "${BLUE}📦 Starting Cacophiney Frontend (port 3002)...${NC}"
cd "$PROJECT_ROOT/cacophiney-nextjs"
if [ ! -d "node_modules" ]; then
    echo "   Installing npm dependencies..."
    npm install
fi
npm run dev > ../logs/cacophiney-frontend.log 2>&1 &
CACOPHINEY_FRONTEND_PID=$!
echo "   ✓ Cacophiney Frontend started (PID: $CACOPHINEY_FRONTEND_PID)"
echo ""

# Save PIDs
cd "$PROJECT_ROOT"
cat > .frontend-pids <<EOF
EPERKINS_FRONTEND_PID=$EPERKINS_FRONTEND_PID
GOODNEWS_FRONTEND_PID=$GOODNEWS_FRONTEND_PID
CACOPHINEY_FRONTEND_PID=$CACOPHINEY_FRONTEND_PID
EOF

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ALL FRONTENDS STARTED SUCCESSFULLY                           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Eperkins/RPMCare Frontend:${NC}  http://localhost:3000"
echo -e "${GREEN}✅ GoodNews360 Frontend:${NC}       http://localhost:3001"
echo -e "${GREEN}✅ Cacophiney Frontend:${NC}        http://localhost:3002"
echo ""
echo "📝 View logs:"
echo "   tail -f logs/eperkins-frontend.log"
echo "   tail -f logs/goodnews360-frontend.log"
echo "   tail -f logs/cacophiney-frontend.log"
echo ""
echo "🛑 Stop all frontends:"
echo "   ./scripts/stop-all-frontends.sh"
echo ""
