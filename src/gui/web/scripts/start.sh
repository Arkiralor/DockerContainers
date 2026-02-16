#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$WEB_DIR/../../.." && pwd)"

PID_DIR="$WEB_DIR/.pids"
mkdir -p "$PID_DIR"

echo "Starting Docker GUI..."

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

# Build server if needed
if [ ! -d "$WEB_DIR/server/dist" ]; then
    echo "Building server..."
    cd "$WEB_DIR/server" && npm run build
fi

# Build client if needed
if [ ! -d "$WEB_DIR/client/dist" ]; then
    echo "Building client..."
    cd "$WEB_DIR/client" && npm run build
fi

# Start backend server
echo "Starting backend server on port 5001..."
cd "$WEB_DIR/server"
PORT=5001 \
CLIENT_URL=http://localhost:3000 \
LOG_LEVEL=info \
NODE_ENV=production \
REPO_ROOT="$REPO_ROOT" \
nohup node dist/index.js > "$PID_DIR/server.log" 2>&1 &
echo $! > "$PID_DIR/server.pid"

# Wait for backend to start
sleep 2

# Check if backend started successfully
if ! kill -0 $(cat "$PID_DIR/server.pid") 2>/dev/null; then
    echo "Error: Backend server failed to start. Check logs at $PID_DIR/server.log"
    exit 1
fi

echo "Backend server started (PID: $(cat "$PID_DIR/server.pid"))"

# Start frontend server (serve built files)
echo "Starting frontend server on port 3000..."
cd "$WEB_DIR/client"

# Install serve if not available
if ! npm list -g serve &> /dev/null && ! npm list serve &> /dev/null; then
    echo "Installing serve package..."
    npm install --save-dev serve
fi

nohup npx serve -s dist -l 3000 > "$PID_DIR/client.log" 2>&1 &
echo $! > "$PID_DIR/client.pid"

# Wait for frontend to start
sleep 2

# Check if frontend started successfully
if ! kill -0 $(cat "$PID_DIR/client.pid") 2>/dev/null; then
    echo "Error: Frontend server failed to start. Check logs at $PID_DIR/client.log"
    # Stop backend if frontend failed
    kill $(cat "$PID_DIR/server.pid") 2>/dev/null || true
    exit 1
fi

echo "Frontend server started (PID: $(cat "$PID_DIR/client.pid"))"
echo ""
echo "Docker GUI is running!"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5001"
echo ""
echo "To stop: make stop or ./scripts/stop.sh"
echo "To view logs: tail -f $PID_DIR/server.log"
