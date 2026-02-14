#!/bin/bash

# Check status of all Docker services
# This script displays the current status of all services

echo "📊 Docker Services Status"
echo "========================="

# Function to check if docker is running
check_docker() {
    if ! docker info &> /dev/null; then
        echo "❌ Docker is not running"
        exit 1
    fi
}

# Function to get service status
get_service_status() {
    local service=$1
    local compose_file="${service}/docker-compose.yml"
    
    if [ -d "$service" ] && [ -f "$compose_file" ]; then
        echo ""
        echo "🔍 ${service^^} Service:"
        echo "-------------------"
        
        cd "$service"
        
        # Get container status
        if command -v docker-compose &> /dev/null; then
            containers=$(docker-compose ps --services 2>/dev/null)
            docker-compose ps
        else
            containers=$(docker compose ps --services 2>/dev/null)
            docker compose ps
        fi
        
        # Check if containers are running
        if [ $? -eq 0 ] && [ -n "$containers" ]; then
            echo ""
            echo "📋 Container Details:"
            for container in $containers; do
                # Get container name from docker-compose
                if command -v docker-compose &> /dev/null; then
                    container_name=$(docker-compose ps -q "$container" 2>/dev/null)
                else
                    container_name=$(docker compose ps -q "$container" 2>/dev/null)
                fi
                
                if [ -n "$container_name" ]; then
                    # Get container info
                    container_info=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null)
                    port_info=$(docker port "$container_name" 2>/dev/null)
                    
                    echo "  • Container: $container"
                    echo "    Status: $container_info"
                    if [ -n "$port_info" ]; then
                        echo "    Ports: $port_info"
                    fi
                fi
            done
        else
            echo "⚠️  No containers running for ${service}"
        fi
        
        cd ..
    else
        echo ""
        echo "⚠️  Service directory ${service} not found or missing docker-compose.yml"
    fi
}

# Function to show resource usage
show_resource_usage() {
    echo ""
    echo "💾 Resource Usage:"
    echo "=================="
    
    # Show Docker system info
    echo ""
    echo "🖥️  System Summary:"
    docker system df
    
    echo ""
    echo "📈 Running Containers:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# Function to show helpful commands
show_commands() {
    echo ""
    echo "🔧 Helpful Commands:"
    echo "==================="
    echo "  • Start all services:     ./scripts/start-all.sh"
    echo "  • Stop all services:      ./scripts/stop-all.sh"
    echo "  • View logs (service):    cd <service> && docker-compose logs -f"
    echo "  • Restart service:        cd <service> && docker-compose restart"
    echo "  • Update service:         cd <service> && docker-compose pull && docker-compose up -d"
}

# Main function
main() {
    check_docker
    
    # Array of services
    services=("redis" "postgresql" "opensearch")
    
    # Check status of each service
    for service in "${services[@]}"; do
        get_service_status "$service"
    done
    
    show_resource_usage
    show_commands
}

# Run main function
main