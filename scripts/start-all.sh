#!/bin/bash

# Start all Docker services
# This script starts all services defined in the repository

set -e

echo "🚀 Starting all Docker services..."

# Array of service directories
services=("redis" "postgresql" "opensearch")

# Function to start a service
start_service() {
    local service=$1
    echo "📦 Starting ${service}..."

    if [ -d "$service" ] && [ -f "${service}/docker-compose.yml" ]; then
        cd "$service"

        # Check if .env file exists
        if [ ! -f ".env" ]; then
            echo "⚠️  No .env file found for ${service}. Creating from .env.example..."
            if [ -f ".env.example" ]; then
                cp ".env.example" ".env"
            else
                echo "❌ No .env.example found for ${service}. Please create .env file manually."
                cd ..
                return 1
            fi
        fi

        # Start the service
        if command -v docker-compose &> /dev/null; then
            docker-compose up -d
        else
            docker compose up -d
        fi

        if [ $? -eq 0 ]; then
            echo "✅ ${service} started successfully"
        else
            echo "❌ Failed to start ${service}"
        fi

        cd ..
    else
        echo "⚠️  Service directory ${service} not found or missing docker-compose.yml"
    fi
}

# Function to wait for services to be healthy
wait_for_services() {
    echo "⏳ Waiting for services to be ready..."
    sleep 5

    echo "📋 Service status:"
    ./scripts/status.sh
}

# Main function
main() {
    # Ensure we're in the right directory
    if [ ! -f "CONTRIBUTING.md" ]; then
        echo "❌ Please run this script from the repository root directory"
        exit 1
    fi

    # Start services in order (redis first, then postgresql, then opensearch)
    for service in "${services[@]}"; do
        start_service "$service"
        echo ""
    done

    wait_for_services

    echo ""
    echo "🎉 All services startup initiated!"
    echo "Use './scripts/status.sh' to check service health"
    echo "Use './scripts/stop-all.sh' to stop all services"
}

# Run main function
main
