#!/bin/bash
#
# Stop Everything Script
# Stops all frontends and backends
#
# Usage: ./scripts/stop-everything.sh
#

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Stopping All Applications                                     ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

./scripts/stop-all-frontends.sh
echo ""
./scripts/stop-all-backends.sh

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ALL APPLICATIONS STOPPED                                     ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
