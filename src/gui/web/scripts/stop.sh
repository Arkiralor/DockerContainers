#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_DIR="$WEB_DIR/.pids"

echo "Stopping Docker GUI..."

STOPPED=0

# Stop backend server
if [ -f "$PID_DIR/server.pid" ]; then
    SERVER_PID=$(cat "$PID_DIR/server.pid")
    if kill -0 "$SERVER_PID" 2>/dev/null; then
        echo "Stopping backend server (PID: $SERVER_PID)..."
        kill "$SERVER_PID"
        STOPPED=1
    fi
    rm -f "$PID_DIR/server.pid"
fi

# Stop frontend server
if [ -f "$PID_DIR/client.pid" ]; then
    CLIENT_PID=$(cat "$PID_DIR/client.pid")
    if kill -0 "$CLIENT_PID" 2>/dev/null; then
        echo "Stopping frontend server (PID: $CLIENT_PID)..."
        kill "$CLIENT_PID"
        STOPPED=1
    fi
    rm -f "$PID_DIR/client.pid"
fi

if [ $STOPPED -eq 1 ]; then
    echo "Docker GUI stopped successfully"
else
    echo "Docker GUI is not running"
fi
