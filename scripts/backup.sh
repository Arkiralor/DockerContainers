#!/bin/bash

# Backup script for Docker services
# This script creates backups of service data and configurations

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "💾 Creating backups for Docker services..."

# Function to create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        echo "📁 Created backup directory: $BACKUP_DIR"
    fi
}

# Function to backup PostgreSQL
backup_postgresql() {
    echo "🐘 Backing up PostgreSQL..."

    local service_dir="src/postgresql"
    local backup_file="${BACKUP_DIR}/postgresql_${TIMESTAMP}.sql"

    if [ -d "$service_dir" ]; then
        cd "$service_dir"

        # Check if PostgreSQL container is running
        if command -v docker-compose &> /dev/null; then
            container_id=$(docker-compose ps -q postgres 2>/dev/null)
        else
            container_id=$(docker compose ps -q postgres 2>/dev/null)
        fi

        if [ -n "$container_id" ]; then
            # Get database credentials from .env file
            if [ -f ".env" ]; then
                source .env
            else
                echo "⚠️  No .env file found for PostgreSQL, using defaults"
                POSTGRES_DB=${POSTGRES_DB:-postgres}
                POSTGRES_USER=${POSTGRES_USER:-postgres}
            fi

            # Create database dump
            docker exec "$container_id" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "../../$backup_file"

            if [ $? -eq 0 ]; then
                echo "✅ PostgreSQL backup created: $backup_file"
            else
                echo "❌ Failed to create PostgreSQL backup"
            fi
        else
            echo "⚠️  PostgreSQL container not running, skipping database backup"
        fi

        cd ../..
    fi
}

# Function to backup Redis
backup_redis() {
    echo "🔴 Backing up Redis..."

    local service_dir="src/redis"
    local backup_file="${BACKUP_DIR}/redis_${TIMESTAMP}.rdb"

    if [ -d "$service_dir" ]; then
        cd "$service_dir"

        # Check if Redis container is running
        if command -v docker-compose &> /dev/null; then
            container_id=$(docker-compose ps -q redis 2>/dev/null)
        else
            container_id=$(docker compose ps -q redis 2>/dev/null)
        fi

        if [ -n "$container_id" ]; then
            # Create Redis snapshot
            docker exec "$container_id" redis-cli BGSAVE

            # Wait a moment for the backup to complete
            sleep 2

            # Copy the dump file
            docker cp "${container_id}:/data/dump.rdb" "../../$backup_file"

            if [ $? -eq 0 ]; then
                echo "✅ Redis backup created: $backup_file"
            else
                echo "❌ Failed to create Redis backup"
            fi
        else
            echo "⚠️  Redis container not running, skipping backup"
        fi

        cd ../..
    fi
}

# Function to backup OpenSearch data
backup_opensearch() {
    echo "🔍 Backing up OpenSearch..."

    local service_dir="src/opensearch"
    local backup_dir="${BACKUP_DIR}/opensearch_${TIMESTAMP}"

    if [ -d "$service_dir" ]; then
        cd "$service_dir"

        # Check if OpenSearch container is running
        if command -v docker-compose &> /dev/null; then
            container_id=$(docker-compose ps -q opensearch 2>/dev/null)
        else
            container_id=$(docker compose ps -q opensearch 2>/dev/null)
        fi

        if [ -n "$container_id" ]; then
            # Create backup directory for OpenSearch
            mkdir -p "../../$backup_dir"

            # Copy data directory if it exists
            if [ -d "data" ]; then
                cp -r data "../../$backup_dir/"
                echo "✅ OpenSearch data backup created: $backup_dir"
            else
                echo "⚠️  OpenSearch data directory not found"
            fi

            # Also backup configuration
            if [ -d "config" ]; then
                cp -r config "../../$backup_dir/"
                echo "✅ OpenSearch config backup created: $backup_dir"
            fi
        else
            echo "⚠️  OpenSearch container not running, creating data directory backup only"
            if [ -d "data" ]; then
                mkdir -p "../../$backup_dir"
                cp -r data "../../$backup_dir/"
                echo "✅ OpenSearch data directory backup created: $backup_dir"
            fi
        fi

        cd ../..
    fi
}

backup_mysql() {
    echo "🗄️  Backing up MySQL..."

    local service_dir="src/mysql"
    local backup_file="${BACKUP_DIR}/mysql_${TIMESTAMP}.sql"

    if [ -d "$service_dir" ]; then
        cd "$service_dir"

        # Check if MySQL container is running
        if command -v docker-compose &> /dev/null; then
            container_id=$(docker-compose ps -q mysql 2>/dev/null)
        else
            container_id=$(docker compose ps -q mysql 2>/dev/null)
        fi

        if [ -n "$container_id" ]; then
            # Get database credentials from .env file
            if [ -f ".env" ]; then
                source .env
            else
                echo "⚠️  No .env file found for MySQL, using defaults"
                MYSQL_DATABASE=${MYSQL_DATABASE:-mysql}
                MYSQL_USER=${MYSQL_USER:-root}
            fi

            # Create database dump
            docker exec "$container_id" mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" > "../../$backup_file"

            if [ $? -eq 0 ]; then
                echo "✅ MySQL backup created: $backup_file"
            else
                echo "❌ Failed to create MySQL backup"
            fi
        else
            echo "⚠️  MySQL container not running, skipping database backup"
        fi

        cd ../..
    fi
}

backup_mongodb() {
    echo "🍃 Backing up MongoDB..."

    local service_dir="src/mongodb"
    local backup_file="${BACKUP_DIR}/mongodb_${TIMESTAMP}.archive"

    if [ -d "$service_dir" ]; then
        cd "$service_dir"

        # Check if MongoDB container is running
        if command -v docker-compose &> /dev/null; then
            container_id=$(docker-compose ps -q mongodb 2>/dev/null)
        else
            container_id=$(docker compose ps -q mongodb 2>/dev/null)
        fi

        if [ -n "$container_id" ]; then
            # Get database credentials from .env file
            if [ -f ".env" ]; then
                source .env
            else
                echo "⚠️  No .env file found for MongoDB, using defaults"
                MONGO_INITDB_DATABASE=${MONGO_INITDB_DATABASE:-admin}
                MONGO_INITDB_ROOT_USERNAME=${MONGO_INITDB_ROOT_USERNAME:-root}
            fi

            # Create database dump
            docker exec "$container_id" mongodump --archive --db "$MONGO_INITDB_DATABASE" --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" > "../../$backup_file"

            if [ $? -eq 0 ]; then
                echo "✅ MongoDB backup created: $backup_file"
            else
                echo "❌ Failed to create MongoDB backup"
            fi
        else
            echo "⚠️  MongoDB container not running, skipping database backup"
        fi

        cd ../..
    fi
}

# Function to backup configurations
backup_configurations() {
    echo "⚙️  Backing up configurations..."

    local config_backup="${BACKUP_DIR}/configurations_${TIMESTAMP}.tar.gz"

    # Create tar archive of all configuration files
    tar -czf "$config_backup" \
        --exclude='*/data' \
        --exclude='*/backups' \
        --exclude='*/.env' \
        src/*/config/ \
        src/*/.env.example \
        src/*/docker-compose.yml \
        src/*/README.md \
        scripts/ \
        README.md \
        CONTRIBUTING.md \
        2>/dev/null

    if [ $? -eq 0 ]; then
        echo "✅ Configuration backup created: $config_backup"
    else
        echo "❌ Failed to create configuration backup"
    fi
}

# Function to clean old backups
cleanup_old_backups() {
    echo "🧹 Cleaning up old backups (keeping last 5)..."

    if [ -d "$BACKUP_DIR" ]; then
        # Remove old PostgreSQL backups (keep last 5)
        ls -t ${BACKUP_DIR}/postgresql_*.sql 2>/dev/null | tail -n +6 | xargs -r rm

        # Remove old Redis backups (keep last 5)
        ls -t ${BACKUP_DIR}/redis_*.rdb 2>/dev/null | tail -n +6 | xargs -r rm

        # Remove old OpenSearch backups (keep last 5)
        ls -td ${BACKUP_DIR}/opensearch_* 2>/dev/null | tail -n +6 | xargs -r rm -rf

        # Remove old configuration backups (keep last 5)
        ls -t ${BACKUP_DIR}/configurations_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm

        echo "✅ Cleanup completed"
    fi
}

# Function to display backup summary
show_backup_summary() {
    echo ""
    echo "📋 Backup Summary:"
    echo "=================="

    if [ -d "$BACKUP_DIR" ]; then
        echo "Backup directory: $BACKUP_DIR"
        echo "Total backup size: $(du -sh $BACKUP_DIR | cut -f1)"
        echo ""
        echo "Recent backups:"
        ls -la "$BACKUP_DIR" | grep "$TIMESTAMP" || echo "No backups created this session"
    fi
}

# Main function
main() {
    create_backup_dir

    echo "Starting backup process at $(date)"
    echo ""

    backup_postgresql
    backup_redis
    backup_opensearch
    backup_configurations

    cleanup_old_backups
    show_backup_summary

    echo ""
    echo "🎉 Backup process completed at $(date)"
}

# Run main function
main
