# Testing Guide

**Comprehensive automated test suite for Docker infrastructure**

## Overview

This directory contains an automated test suite that validates all services, configurations, and scripts in the repository. The test suite ensures everything works correctly and helps catch issues early.

## Quick Start

```bash
# Run all tests
make test

# Or run directly
cd test
./test.sh

# Or from repository root
./test/test.sh
```

## Test Suite

### What Gets Tested

The automated test suite includes **30+ tests** covering:

#### Docker Tests
- Docker daemon is running
- Docker Compose is available

#### PostgreSQL Tests
- Container is running
- Health check passes
- Accepts connections
- Read/write operations work
- Port 5432 is accessible
- Volume exists and persists data

#### Redis Tests
- Container is running
- Health check passes (`redis-cli ping`)
- Read/write operations work
- Port 6379 is accessible
- Volume exists and persists data

#### OpenSearch Tests
- Container is running
- Health endpoint responds
- Cluster status is healthy
- Port 9200 is accessible
- Dashboards container is running
- Dashboards port 5601 is accessible
- Volume exists and persists data

#### Script Tests
- All management scripts exist
- All scripts are executable
- Scripts have correct permissions

### Test Output Example

```
Docker Containers Test Suite
================================

Docker Tests
---------------
✓ Docker daemon is running

PostgreSQL Tests
-------------------
✓ PostgreSQL container is running
✓ PostgreSQL health check passes
✓ PostgreSQL accepts connections
✓ PostgreSQL port 5432 is accessible
✓ PostgreSQL volume exists

Redis Tests
--------------
✓ Redis container is running
✓ Redis health check passes
✓ Redis read/write operations work
✓ Redis port 6379 is accessible
✓ Redis volume exists

OpenSearch Tests
-------------------
✓ OpenSearch container is running
✓ OpenSearch health endpoint responds
✓ OpenSearch cluster status is healthy
✓ OpenSearch port 9200 is accessible
✓ OpenSearch Dashboards container is running
✓ OpenSearch Dashboards port 5601 is accessible
✓ OpenSearch volume exists

Script Tests
---------------
✓ Backup script exists and is executable
✓ Restore script exists and is executable
✓ Setup script exists and is executable
✓ Start-all script exists and is executable
✓ Stop-all script exists and is executable
✓ Status script exists and is executable

================================
Test Summary
================================
Total:  30
Passed: 30
Failed: 0

All tests passed!
```

## Prerequisites

### Services Must Be Running

Tests require all services to be running:

```bash
# Start all services first
make start

# Then run tests
make test
```

### Required Tools

The test suite needs these tools installed:
- `docker` - Docker daemon
- `docker-compose` or `docker compose` - Docker Compose
- `nc` (netcat) - Port checking
- `curl` - HTTP requests
- Standard Unix tools (`grep`, `awk`, etc.)

Most are pre-installed on macOS/Linux.

## Running Tests

### Run All Tests

```bash
# Using Make (recommended)
make test

# Or directly
cd test && ./test.sh

# Or from anywhere
./test/test.sh
```

### Run Specific Test Categories

The test script runs all tests automatically. To run specific categories, you can modify `test.sh` or comment out test sections.

### Continuous Testing

```bash
# Run tests in a loop (useful during development)
while true; do
    make test
    sleep 60
done

# Or watch for changes and test
watch -n 60 make test
```

## Test Structure

### Test File: `test.sh`

Main test script structure:

```bash
#!/bin/bash
# Automated test suite

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Print result function
print_result() {
    local test_name=$1
    local result=$2

    TESTS_TOTAL=$((TESTS_TOTAL + 1))

    if [ "$result" -eq 0 ]; then
        echo "✓ $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "✗ $test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Individual test functions
test_postgres_running() {
    # Test implementation
    print_result "PostgreSQL container is running" $?
}

# Main execution
main() {
    # Run all tests
    test_docker_running
    test_postgres_running
    test_redis_running
    # ... more tests

    # Show summary
    echo "Total: $TESTS_TOTAL"
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
}

main
```

### Exit Codes

- **0**: All tests passed
- **1**: One or more tests failed

Use in scripts:
```bash
if make test; then
    echo "All tests passed!"
else
    echo "Tests failed!"
    exit 1
fi
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Infrastructure

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup
        run: make setup

      - name: Start services
        run: make start

      - name: Wait for services
        run: sleep 10

      - name: Run tests
        run: make test

      - name: Show service status
        if: failure()
        run: make status

      - name: Cleanup
        run: make stop
```

### GitLab CI Example

```yaml
test:
  stage: test
  script:
    - make setup
    - make start
    - sleep 10
    - make test
  after_script:
    - make stop
```

## Writing New Tests

### Test Function Template

```bash
test_my_new_feature() {
    # Arrange - setup test data
    local test_value="test"

    # Act - perform the action
    result=$(my_command_to_test)

    # Assert - check the result
    if [ "$result" = "expected" ]; then
        return 0  # Success
    else
        return 1  # Failure
    fi
}

# Call it in main()
test_my_new_feature
print_result "My new feature works" $?
```

### Best Practices

1. **Keep tests independent**: Each test should work regardless of others
2. **Clean up after tests**: Remove test data/containers
3. **Use descriptive names**: `test_postgres_accepts_connections` not `test1`
4. **Test one thing**: Each test should validate one specific behavior
5. **Handle failures gracefully**: Don't let one test failure stop others

### Adding Tests to test.sh

1. **Write test function:**
```bash
test_new_service_health() {
    curl -f http://localhost:8080/health &> /dev/null
    print_result "New service health check passes" $?
}
```

1. **Add to main() function:**
```bash
main() {
    # ... existing tests ...

    # New service tests
    echo "New Service Tests"
    echo "-------------------"
    test_new_service_health
    echo ""

    # ... rest of main ...
}
```

1. **Test your test:**
```bash
./test/test.sh
```

## Troubleshooting Tests

### Tests Fail Immediately

**Cause**: Services not running

**Fix**:
```bash
make start
sleep 10  # Wait for services to be ready
make test
```

### Specific Service Tests Fail

**Check service status:**
```bash
make status
docker ps
```

**Check service logs:**
```bash
make logs-postgres
make logs-redis
make logs-opensearch
```

**Restart service:**
```bash
make restart-postgres
```

### Port Tests Fail

**Check if ports are accessible:**
```bash
nc -zv localhost 5432  # PostgreSQL
nc -zv localhost 6379  # Redis
nc -zv localhost 9200  # OpenSearch
```

**Check for port conflicts:**
```bash
lsof -i :5432
lsof -i :6379
lsof -i :9200
```

### Volume Tests Fail

**List volumes:**
```bash
docker volume ls
```

**Inspect volume:**
```bash
docker volume inspect postgresql_postgres_data
```

**Recreate volume:**
```bash
make stop
docker volume rm postgresql_postgres_data
make start
```

### Script Tests Fail

**Check script permissions:**
```bash
ls -la scripts/
```

**Fix permissions:**
```bash
chmod +x scripts/*.sh
```

## Advanced Testing

### Load Testing

Not included by default, but you can add:

```bash
# PostgreSQL load test
for i in {1..1000}; do
    psql -h localhost -U postgres -c "SELECT 1;" > /dev/null
done

# Redis load test
for i in {1..10000}; do
    redis-cli SET "key$i" "value$i" > /dev/null
done

# OpenSearch load test
for i in {1..1000}; do
    curl -X POST "localhost:9200/test-index/_doc" \
         -H 'Content-Type: application/json' \
         -d '{"test":"data"}' > /dev/null
done
```

### Performance Testing

```bash
# Measure response time
time redis-cli ping
time psql -h localhost -U postgres -c "SELECT 1;"
time curl http://localhost:9200/_cluster/health
```

### Stress Testing

```bash
# Run tests repeatedly to check stability
for i in {1..100}; do
    echo "Run $i:"
    make test || break
done
```

## Test Coverage

Current test coverage:

| Category | Tests | Coverage |
|----------|-------|----------|
| Docker Infrastructure | 1 | 100% |
| PostgreSQL | 5 | 100% |
| Redis | 5 | 100% |
| OpenSearch | 7 | 100% |
| Scripts | 6 | 100% |
| **Total** | **30** | **100%** |

## Makefile Integration

The test suite is integrated into the Makefile:

```bash
make test                    # Run all tests
make lint                    # Run all linters
make lint-shell              # Lint shell scripts
make lint-yaml               # Lint YAML files
make lint-markdown           # Lint Markdown files
make lint-compose            # Validate Docker Compose files
```

## Additional Resources

- [Main Repository README](../README.md)
- [Troubleshooting Guide](../docs/troubleshooting.md)
- [PostgreSQL Tests](../postgresql/README.md)
- [Redis Tests](../redis/README.md)
- [OpenSearch Tests](../opensearch/README.md)

## Support

- **Issues**: [GitHub Issues](https://github.com/Arkiralor/DockerContainers/issues)
- **Test Logs**: Check terminal output
- **Service Logs**: `make logs-<service>`
- **Status**: `make status`

---

**Keep your infrastructure tested and reliable!**

*Last Updated: February 2026*
