#!/bin/bash
#
# Start Everything Script
# Starts all frontends and backends
#
# Usage: ./scripts/start-everything.sh
#

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Starting All Applications                                     ║"
echo "║  (3 Frontends + 3 Backends)                                   ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Start backends first
./scripts/start-all-backends.sh

# Wait for backends to initialize
echo "⏳ Waiting 5 seconds for backends to initialize..."
sleep 5
echo ""

# Start frontends
./scripts/start-all-frontends.sh

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ALL APPLICATIONS RUNNING                                     ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "Frontend URLs:"
echo "  Eperkins/RPMCare:  http://localhost:3000"
echo "  GoodNews360:       http://localhost:3001"
echo "  Cacophiney:        http://localhost:3002"
echo ""
echo "Backend URLs:"
echo "  GoodNews360:       http://localhost:5001"
echo "  Cacophiney:        http://localhost:5002"
echo "  Eperkins/RPMCare:  http://localhost:5003"
echo ""
echo "Certificate API:"
echo "  http://localhost:3000/api/certificates/create"
echo ""
echo "🛑 To stop everything:"
echo "   ./scripts/stop-everything.sh"
echo ""
