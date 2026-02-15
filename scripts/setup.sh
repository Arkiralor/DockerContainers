#!/bin/bash

# Setup script for Docker Containers repository
# This script helps set up the environment and services

set -e

echo "🚀 Setting up Docker Containers environment..."

# Function to check if Docker is installed and running
check_docker() {
    echo "📋 Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! docker info &> /dev/null; then
        echo "❌ Docker is not running. Please start Docker."
        exit 1
    fi

    echo "✅ Docker is installed and running"
}

# Function to check if Docker Compose is available
check_docker_compose() {
    echo "📋 Checking Docker Compose..."
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo "❌ Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    echo "✅ Docker Compose is available"
}

# Function to create .env files from examples
setup_env_files() {
    echo "📄 Setting up environment files..."

    services=("opensearch" "postgresql" "redis")

    for service in "${services[@]}"; do
        if [ -f "${service}/.env.example" ] && [ ! -f "${service}/.env" ]; then
            echo "Creating .env file for ${service}..."
            cp "${service}/.env.example" "${service}/.env"
            echo "✅ Created ${service}/.env (please review and modify as needed)"
        elif [ -f "${service}/.env" ]; then
            echo "⚠️  ${service}/.env already exists, skipping..."
        fi
    done
}

# Function to create data directories
create_data_dirs() {
    echo "📁 Creating data directories..."

    services=("opensearch" "postgresql" "redis")

    for service in "${services[@]}"; do
        data_dir="${service}/data"
        if [ ! -d "$data_dir" ]; then
            mkdir -p "$data_dir"
            echo "✅ Created ${data_dir}"
        else
            echo "⚠️  ${data_dir} already exists, skipping..."
        fi
    done
}

# Function to display next steps
show_next_steps() {
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Review and modify the .env files in each service directory"
    echo "2. Run './scripts/start-all.sh' to start all services"
    echo "3. Or start individual services with 'docker-compose up -d' in each service directory"
    echo "4. Use './scripts/status.sh' to check the status of all services"
    echo ""
}

# Main setup process
main() {
    check_docker
    check_docker_compose
    setup_env_files
    create_data_dirs
    show_next_steps
}

# Run main function
main
