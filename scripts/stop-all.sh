#!/bin/bash

# Stop all Docker services
# This script stops all services defined in the repository

set -e

echo "🛑 Stopping all Docker services..."

# Array of service directories
services=("opensearch" "postgresql" "redis")

# Function to stop a service
stop_service() {
    local service=$1
    echo "📦 Stopping ${service}..."
    
    if [ -d "$service" ] && [ -f "${service}/docker-compose.yml" ]; then
        cd "$service"
        
        # Stop the service
        if command -v docker-compose &> /dev/null; then
            docker-compose down
        else
            docker compose down
        fi
        
        if [ $? -eq 0 ]; then
            echo "✅ ${service} stopped successfully"
        else
            echo "❌ Failed to stop ${service}"
        fi
        
        cd ..
    else
        echo "⚠️  Service directory ${service} not found or missing docker-compose.yml"
    fi
}

# Function to clean up networks and volumes (optional)
cleanup() {
    echo ""
    read -p "🗑️  Do you want to remove unused networks and volumes? [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🧹 Cleaning up unused Docker resources..."
        docker network prune -f
        docker volume prune -f
        echo "✅ Cleanup completed"
    fi
}

# Main function
main() {
    # Ensure we're in the right directory
    if [ ! -f "CONTRIBUTING.md" ]; then
        echo "❌ Please run this script from the repository root directory"
        exit 1
    fi
    
    # Stop services
    for service in "${services[@]}"; do
        stop_service "$service"
        echo ""
    done
    
    cleanup
    
    echo ""
    echo "🎉 All services stopped!"
    echo "Use './scripts/start-all.sh' to start services again"
}

# Run main function
main