#!/bin/bash

# Start all Docker services
# This script starts all services defined in the repository

set -e

echo "Starting all Docker services..."

# Array of service directories
services=("src/redis" "src/postgresql" "src/opensearch")

# Function to start a service
start_service() {
    local service=$1
    echo "Starting ${service}..."

    if [ -d "$service" ] && [ -f "${service}/docker-compose.yml" ]; then
        # Use subshell to avoid directory navigation issues
        (
            cd "$service" || exit 1

            # Check if .env file exists
            if [ ! -f ".env" ]; then
                echo "WARNING: No .env file found for ${service}. Creating from example.env..."
                if [ -f "example.env" ]; then
                    cp "example.env" ".env"
                else
                    echo "ERROR: No example.env found for ${service}. Please create .env file manually."
                    exit 1
                fi
            fi

            # Start the service
            if command -v docker-compose &> /dev/null; then
                docker-compose up -d
            else
                docker compose up -d
            fi

            if [ $? -eq 0 ]; then
                echo "SUCCESS: ${service} started successfully"
            else
                echo "ERROR: Failed to start ${service}"
                exit 1
            fi
        )
    else
        echo "WARNING: Service directory ${service} not found or missing docker-compose.yml"
    fi
}

# Function to wait for services to be healthy
wait_for_services() {
    echo "Waiting for services to be ready..."
    sleep 5

    echo "Service status:"
    ./scripts/status.sh
}

# Main function
main() {
    # Ensure we're in the right directory
    if [ ! -f "CONTRIBUTING.md" ]; then
        echo "ERROR: Please run this script from the repository root directory"
        exit 1
    fi

    # Start services in order (redis first, then postgresql, then opensearch)
    for service in "${services[@]}"; do
        start_service "$service"
        echo ""
    done

    wait_for_services

    echo ""
    echo "All services startup initiated"
    echo "Use './scripts/status.sh' to check service health"
    echo "Use './scripts/stop-all.sh' to stop all services"
}

# Run main function
main
