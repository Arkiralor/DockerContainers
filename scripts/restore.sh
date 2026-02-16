#!/bin/bash

# Restore script for Docker services
# This script restores backups created by backup.sh

set -e

# Configuration
BACKUP_DIR="./backups"

echo "🔄 Docker Services Restore Script"
echo "=================================="
echo ""

# Function to check if Docker is running
check_docker() {
    if ! docker info &> /dev/null; then
        echo "❌ Docker is not running"
        exit 1
    fi
}

# Function to list available backups
list_backups() {
    local service=$1
    local pattern=$2

    echo "Available ${service} backups:"
    echo ""

    if [ ! -d "$BACKUP_DIR" ]; then
        echo "❌ No backup directory found at $BACKUP_DIR"
        return 1
    fi

    local backups=$(ls -t ${BACKUP_DIR}/${pattern} 2>/dev/null)

    if [ -z "$backups" ]; then
        echo "⚠️  No backups found"
        return 1
    fi

    local index=1
    for backup in $backups; do
        local size=$(du -h "$backup" 2>/dev/null | cut -f1)
        local date=$(basename "$backup" | sed "s/${service}_//" | sed 's/\..*//')
        echo "  [$index] $(basename $backup) - $size (${date:0:8} ${date:9:2}:${date:11:2}:${date:13:2})"
        index=$((index + 1))
    done

    return 0
}

# Function to select backup
select_backup() {
    local pattern=$1

    local backups=($(ls -t ${BACKUP_DIR}/${pattern} 2>/dev/null))

    if [ ${#backups[@]} -eq 0 ]; then
        return 1
    fi

    echo ""
    read -p "Select backup number (or 'q' to quit): " selection

    if [ "$selection" = "q" ]; then
        echo "Cancelled."
        exit 0
    fi

    if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt ${#backups[@]} ]; then
        echo "❌ Invalid selection"
        return 1
    fi

    echo "${backups[$((selection - 1))]}"
    return 0
}

# Function to confirm action
confirm_action() {
    local message=$1

    echo ""
    echo "⚠️  WARNING: $message"
    read -p "Are you sure you want to continue? (yes/no): " confirmation

    if [ "$confirmation" != "yes" ]; then
        echo "Cancelled."
        exit 0
    fi
}

# Function to restore PostgreSQL
restore_postgresql() {
    echo ""
    echo "🐘 PostgreSQL Restore"
    echo "===================="

    list_backups "PostgreSQL" "postgresql_*.sql" || return 1

    local backup_file=$(select_backup "postgresql_*.sql")

    if [ -z "$backup_file" ]; then
        return 1
    fi

    confirm_action "This will restore PostgreSQL database. Existing data may be overwritten!"

    echo ""
    echo "📦 Restoring PostgreSQL from: $(basename $backup_file)"

    local service_dir="src/postgresql"

    if [ ! -d "$service_dir" ]; then
        echo "❌ PostgreSQL service directory not found"
        return 1
    fi

    cd "$service_dir"

    # Check if PostgreSQL container is running
    if command -v docker-compose &> /dev/null; then
        container_id=$(docker-compose ps -q postgres 2>/dev/null)
    else
        container_id=$(docker compose ps -q postgres 2>/dev/null)
    fi

    if [ -z "$container_id" ]; then
        echo "⚠️  PostgreSQL container not running. Starting it..."
        if command -v docker-compose &> /dev/null; then
            docker-compose up -d
        else
            docker compose up -d
        fi
        echo "⏳ Waiting for PostgreSQL to be ready..."
        sleep 5

        if command -v docker-compose &> /dev/null; then
            container_id=$(docker-compose ps -q postgres 2>/dev/null)
        else
            container_id=$(docker compose ps -q postgres 2>/dev/null)
        fi
    fi

    if [ -z "$container_id" ]; then
        echo "❌ Failed to start PostgreSQL container"
        cd ../..
        return 1
    fi

    # Get database credentials
    if [ -f ".env" ]; then
        source .env
    else
        POSTGRES_DB=${POSTGRES_DB:-postgres}
        POSTGRES_USER=${POSTGRES_USER:-postgres}
    fi

    # Restore database
    cat "../$backup_file" | docker exec -i "$container_id" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

    if [ $? -eq 0 ]; then
        echo "✅ PostgreSQL restore completed successfully"
    else
        echo "❌ Failed to restore PostgreSQL"
        cd ../..
        return 1
    fi

    cd ../..
    return 0
}

# Function to restore Redis
restore_redis() {
    echo ""
    echo "🔴 Redis Restore"
    echo "==============="

    list_backups "Redis" "redis_*.rdb" || return 1

    local backup_file=$(select_backup "redis_*.rdb")

    if [ -z "$backup_file" ]; then
        return 1
    fi

    confirm_action "This will restore Redis data. Existing data will be overwritten!"

    echo ""
    echo "📦 Restoring Redis from: $(basename $backup_file)"

    local service_dir="src/redis"

    if [ ! -d "$service_dir" ]; then
        echo "❌ Redis service directory not found"
        return 1
    fi

    cd "$service_dir"

    # Check if Redis container is running
    if command -v docker-compose &> /dev/null; then
        container_id=$(docker-compose ps -q redis 2>/dev/null)
    else
        container_id=$(docker compose ps -q redis 2>/dev/null)
    fi

    if [ -z "$container_id" ]; then
        echo "⚠️  Redis container not running. Please start it first."
        cd ../..
        return 1
    fi

    # Stop Redis temporarily
    echo "⏸️  Stopping Redis..."
    if command -v docker-compose &> /dev/null; then
        docker-compose stop redis
    else
        docker compose stop redis
    fi

    # Copy backup file to container
    echo "📋 Copying backup file..."
    docker cp "../$backup_file" "${container_id}:/data/dump.rdb"

    # Start Redis
    echo "▶️  Starting Redis..."
    if command -v docker-compose &> /dev/null; then
        docker-compose start redis
    else
        docker compose start redis
    fi

    # Wait for Redis to be ready
    echo "⏳ Waiting for Redis to be ready..."
    sleep 3

    # Verify Redis is responding
    if command -v docker-compose &> /dev/null; then
        docker-compose exec redis redis-cli ping > /dev/null 2>&1
    else
        docker compose exec redis redis-cli ping > /dev/null 2>&1
    fi

    if [ $? -eq 0 ]; then
        echo "✅ Redis restore completed successfully"
    else
        echo "❌ Failed to restore Redis"
        cd ../..
        return 1
    fi

    cd ../..
    return 0
}

# Function to restore OpenSearch
restore_opensearch() {
    echo ""
    echo "🔍 OpenSearch Restore"
    echo "===================="

    list_backups "OpenSearch" "opensearch_*" || return 1

    local backup_dir=$(select_backup "opensearch_*")

    if [ -z "$backup_dir" ]; then
        return 1
    fi

    confirm_action "This will restore OpenSearch data. Existing data will be overwritten!"

    echo ""
    echo "📦 Restoring OpenSearch from: $(basename $backup_dir)"

    local service_dir="src/opensearch"

    if [ ! -d "$service_dir" ]; then
        echo "❌ OpenSearch service directory not found"
        return 1
    fi

    cd "$service_dir"

    # Stop OpenSearch if running
    echo "⏸️  Stopping OpenSearch..."
    if command -v docker-compose &> /dev/null; then
        docker-compose stop opensearch opensearch-dashboards 2>/dev/null
    else
        docker compose stop opensearch opensearch-dashboards 2>/dev/null
    fi

    # Backup current data directory
    if [ -d "data" ]; then
        echo "📋 Backing up current data directory..."
        mv data "data.backup.$(date +%Y%m%d_%H%M%S)"
    fi

    # Restore data from backup
    echo "📥 Restoring data..."
    if [ -d "../$backup_dir/data" ]; then
        cp -r "../$backup_dir/data" ./
        echo "✅ Data restored"
    else
        echo "⚠️  No data directory found in backup"
    fi

    # Restore config if present
    if [ -d "../$backup_dir/config" ]; then
        echo "📥 Restoring configuration..."
        cp -r "../$backup_dir/config"/* ./config/ 2>/dev/null || true
        echo "✅ Configuration restored"
    fi

    # Start OpenSearch
    echo "▶️  Starting OpenSearch..."
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d
    else
        docker compose up -d
    fi

    echo "⏳ Waiting for OpenSearch to be ready (this may take a minute)..."
    sleep 10

    # Check OpenSearch health
    for i in {1..30}; do
        if curl -s http://localhost:9200/_cluster/health > /dev/null 2>&1; then
            echo "✅ OpenSearch restore completed successfully"
            cd ../..
            return 0
        fi
        sleep 2
    done

    echo "⚠️  OpenSearch started but health check timed out. Check logs with: cd src/opensearch && docker-compose logs"
    cd ../..
    return 0
}

# Function to restore configurations
restore_configurations() {
    echo ""
    echo "⚙️  Configuration Restore"
    echo "========================"

    list_backups "Configurations" "configurations_*.tar.gz" || return 1

    local backup_file=$(select_backup "configurations_*.tar.gz")

    if [ -z "$backup_file" ]; then
        return 1
    fi

    confirm_action "This will restore configuration files. Existing configurations may be overwritten!"

    echo ""
    echo "📦 Restoring configurations from: $(basename $backup_file)"

    # Extract configurations
    tar -xzf "$backup_file" -C ./ 2>/dev/null

    if [ $? -eq 0 ]; then
        echo "✅ Configuration restore completed successfully"
    else
        echo "❌ Failed to restore configurations"
        return 1
    fi

    return 0
}

# Main menu
show_menu() {
    echo ""
    echo "Select service to restore:"
    echo "  [1] PostgreSQL"
    echo "  [2] Redis"
    echo "  [3] OpenSearch"
    echo "  [4] Configurations (docker-compose files, configs, scripts)"
    echo "  [5] All services"
    echo "  [q] Quit"
    echo ""
}

# Main function
main() {
    check_docker

    # Ensure we're in the right directory
    if [ ! -f "CONTRIBUTING.md" ]; then
        echo "❌ Please run this script from the repository root directory"
        exit 1
    fi

    if [ ! -d "$BACKUP_DIR" ]; then
        echo "❌ No backup directory found at $BACKUP_DIR"
        echo "Please create backups first using ./scripts/backup.sh"
        exit 1
    fi

    while true; do
        show_menu
        read -p "Select option: " choice

        case $choice in
            1)
                restore_postgresql
                ;;
            2)
                restore_redis
                ;;
            3)
                restore_opensearch
                ;;
            4)
                restore_configurations
                ;;
            5)
                echo ""
                confirm_action "This will restore ALL services. All existing data will be overwritten!"
                restore_postgresql
                restore_redis
                restore_opensearch
                restore_configurations
                echo ""
                echo "🎉 All services restored!"
                ;;
            q|Q)
                echo "Exiting..."
                exit 0
                ;;
            *)
                echo "❌ Invalid option. Please try again."
                ;;
        esac

        echo ""
        read -p "Press Enter to continue or 'q' to quit: " continue
        if [ "$continue" = "q" ]; then
            echo "Exiting..."
            exit 0
        fi
    done
}

# Run main function
main
