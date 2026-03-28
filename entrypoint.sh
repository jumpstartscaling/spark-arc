#!/bin/sh

# Entrypoint script for Ion Arc Online hybrid container
# Manages both nginx (port 80) and Node.js admin API (port 3000)

set -e

# Function to handle graceful shutdown
cleanup() {
    echo "Received shutdown signal, stopping services..."
    
    # Stop nginx
    if [ -n "$NGINX_PID" ]; then
        echo "Stopping nginx (PID: $NGINX_PID)"
        kill -TERM "$NGINX_PID" 2>/dev/null || true
    fi
    
    # Stop Node.js server
    if [ -n "$NODE_PID" ]; then
        echo "Stopping Node.js server (PID: $NODE_PID)"
        kill -TERM "$NODE_PID" 2>/dev/null || true
    fi
    
    # Wait for processes to exit
    wait "$NGINX_PID" 2>/dev/null || true
    wait "$NODE_PID" 2>/dev/null || true
    
    echo "All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

echo "Starting Ion Arc Online hybrid container..."

# Start Node.js admin API server in background
echo "Starting Node.js admin API on port 3000..."
node server.js &
NODE_PID=$!

# Give Node.js a moment to start
sleep 2

# Start nginx in foreground
echo "Starting nginx on port 80..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Monitor both processes
echo "Both services started. Monitoring..."
echo "Node.js PID: $NODE_PID"
echo "Nginx PID: $NGINX_PID"

# Wait for either process to exit
wait $NODE_PID $NGINX_PID
