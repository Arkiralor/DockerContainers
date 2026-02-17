#!/bin/bash

# Automated test suite for Docker Containers
# Tests connectivity, health checks, and basic functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

echo "Docker Containers Test Suite"
echo "================================"
echo ""

# Function to print test result
print_result() {
    local test_name=$1
    local result=$2

    TESTS_TOTAL=$((TESTS_TOTAL + 1))

    if [ "$result" -eq 0 ]; then
        echo -e "${GREEN}[PASS]${NC} $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}[FAIL]${NC} $test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Function to check if Docker is running
test_docker_running() {
    docker info &> /dev/null
    print_result "Docker daemon is running" $?
}

# Function to check if a service is running
check_service_running() {
    local service_dir=$1
    local service_name=$2

    cd "$service_dir"
    if command -v docker-compose &> /dev/null; then
        container_id=$(docker-compose ps -q "$service_name" 2>/dev/null)
    else
        container_id=$(docker compose ps -q "$service_name" 2>/dev/null)
    fi
    cd ../..

    [ -n "$container_id" ]
}

# PostgreSQL Tests
test_postgres_running() {
    check_service_running "src/postgresql" "postgres"
    print_result "PostgreSQL container is running" $?
}

test_postgres_health() {
    cd src/postgresql
    if command -v docker-compose &> /dev/null; then
        docker-compose exec -T postgres pg_isready &> /dev/null
    else
        docker compose exec -T postgres pg_isready &> /dev/null
    fi
    local result=$?
    cd ../..
    print_result "PostgreSQL health check passes" $result
}

test_postgres_connection() {
    cd src/postgresql
    if command -v docker-compose &> /dev/null; then
        docker-compose exec -T postgres psql -U postgres -d elay-local -c "SELECT 1;" &> /dev/null
    else
        docker compose exec -T postgres psql -U postgres -d elay-local -c "SELECT 1;" &> /dev/null
    fi
    local result=$?
    cd ../..
    print_result "PostgreSQL accepts connections" $result
}

test_postgres_port() {
    nc -z localhost 5432 &> /dev/null
    print_result "PostgreSQL port 5432 is accessible" $?
}

test_postgres_volume() {
    docker volume inspect postgresql_postgres_data &> /dev/null
    print_result "PostgreSQL volume exists" $?
}

# Redis Tests
test_redis_running() {
    check_service_running "src/redis" "redis"
    print_result "Redis container is running" $?
}

test_redis_health() {
    cd src/redis
    if command -v docker-compose &> /dev/null; then
        docker-compose exec -T redis redis-cli ping &> /dev/null
    else
        docker compose exec -T redis redis-cli ping &> /dev/null
    fi
    local result=$?
    cd ../..
    print_result "Redis health check passes" $result
}

test_redis_connection() {
    cd src/redis
    if command -v docker-compose &> /dev/null; then
        docker-compose exec -T redis redis-cli SET test_key "test_value" &> /dev/null
        docker-compose exec -T redis redis-cli GET test_key &> /dev/null
        docker-compose exec -T redis redis-cli DEL test_key &> /dev/null
    else
        docker compose exec -T redis redis-cli SET test_key "test_value" &> /dev/null
        docker compose exec -T redis redis-cli GET test_key &> /dev/null
        docker compose exec -T redis redis-cli DEL test_key &> /dev/null
    fi
    local result=$?
    cd ../..
    print_result "Redis read/write operations work" $result
}

test_redis_port() {
    nc -z localhost 6379 &> /dev/null
    print_result "Redis port 6379 is accessible" $?
}

test_redis_volume() {
    docker volume inspect redis_redis_data &> /dev/null
    print_result "Redis volume exists" $?
}

# OpenSearch Tests
test_opensearch_running() {
    check_service_running "src/opensearch" "opensearch"
    print_result "OpenSearch container is running" $?
}

test_opensearch_health() {
    curl -s -f http://localhost:9200/_cluster/health &> /dev/null
    print_result "OpenSearch health endpoint responds" $?
}

test_opensearch_cluster_status() {
    local status=$(curl -s http://localhost:9200/_cluster/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    [ "$status" = "green" ] || [ "$status" = "yellow" ]
    print_result "OpenSearch cluster status is healthy (green/yellow)" $?
}

test_opensearch_port() {
    nc -z localhost 9200 &> /dev/null
    print_result "OpenSearch port 9200 is accessible" $?
}

test_opensearch_dashboards_running() {
    check_service_running "src/opensearch" "opensearch-dashboards"
    print_result "OpenSearch Dashboards container is running" $?
}

test_opensearch_dashboards_port() {
    nc -z localhost 5601 &> /dev/null
    print_result "OpenSearch Dashboards port 5601 is accessible" $?
}

test_opensearch_volume() {
    docker volume inspect opensearch_opensearch_data &> /dev/null
    print_result "OpenSearch volume exists" $?
}

# Script Tests
test_backup_script_exists() {
    [ -x "scripts/backup.sh" ]
    print_result "Backup script exists and is executable" $?
}

test_restore_script_exists() {
    [ -x "scripts/restore.sh" ]
    print_result "Restore script exists and is executable" $?
}

test_setup_script_exists() {
    [ -x "scripts/setup.sh" ]
    print_result "Setup script exists and is executable" $?
}

test_start_script_exists() {
    [ -x "scripts/start-all.sh" ]
    print_result "Start-all script exists and is executable" $?
}

test_stop_script_exists() {
    [ -x "scripts/stop-all.sh" ]
    print_result "Stop-all script exists and is executable" $?
}

test_status_script_exists() {
    [ -x "scripts/status.sh" ]
    print_result "Status script exists and is executable" $?
}

# Main test execution
main() {
    # Ensure we're in the right directory
    if [ ! -f "../CONTRIBUTING.md" ]; then
        echo -e "${RED}ERROR: Please run this script from the test/ directory${NC}"
        exit 1
    fi

    cd ..

    echo "Running infrastructure tests..."
    echo ""

    # Docker Tests
    echo "Docker Tests"
    echo "---------------"
    test_docker_running
    echo ""

    # PostgreSQL Tests
    echo "PostgreSQL Tests"
    echo "-------------------"
    test_postgres_running
    test_postgres_health
    test_postgres_connection
    test_postgres_port
    test_postgres_volume
    echo ""

    # Redis Tests
    echo "Redis Tests"
    echo "--------------"
    test_redis_running
    test_redis_health
    test_redis_connection
    test_redis_port
    test_redis_volume
    echo ""

    # OpenSearch Tests
    echo "OpenSearch Tests"
    echo "-------------------"
    test_opensearch_running
    test_opensearch_health
    test_opensearch_cluster_status
    test_opensearch_port
    test_opensearch_dashboards_running
    test_opensearch_dashboards_port
    test_opensearch_volume
    echo ""

    # Script Tests
    echo "Script Tests"
    echo "---------------"
    test_backup_script_exists
    test_restore_script_exists
    test_setup_script_exists
    test_start_script_exists
    test_stop_script_exists
    test_status_script_exists
    echo ""

    # Summary
    echo "================================"
    echo "Test Summary"
    echo "================================"
    echo -e "Total:  $TESTS_TOTAL"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}[OK] All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}[FAIL] Some tests failed${NC}"
        exit 1
    fi
}

# Run main function
main
