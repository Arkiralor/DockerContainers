#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$WEB_DIR/../../.." && pwd)"

echo "Starting Docker GUI in development mode..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 18+ to run the GUI."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm to run the GUI."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "$WEB_DIR/server/node_modules" ]; then
    echo "Installing server dependencies..."
    cd "$WEB_DIR/server" && npm install
fi

if [ ! -d "$WEB_DIR/client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd "$WEB_DIR/client" && npm install
fi

echo ""
echo "Docker GUI Development Mode"
echo "  Frontend: http://localhost:3000 (Vite dev server with HMR)"
echo "  Backend:  http://localhost:5001 (Node.js with auto-restart)"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Function to kill child processes on exit
cleanup() {
    echo ""
    echo "Stopping development servers..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend in development mode (with auto-restart)
cd "$WEB_DIR/server"
PORT=5001 \
CLIENT_URL=http://localhost:3000 \
LOG_LEVEL=debug \
NODE_ENV=development \
REPO_ROOT="$REPO_ROOT" \
npm run dev &

# Start frontend in development mode (Vite)
cd "$WEB_DIR/client"
npm run dev &

# Wait for all background jobs
wait
