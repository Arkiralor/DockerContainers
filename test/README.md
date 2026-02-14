# Testing Guide

This directory contains integration tests and smoke tests for the Docker containers.

## Test Structure

- `integration/` - Integration tests that verify service interactions
- `smoke/` - Basic smoke tests to verify services are running
- `performance/` - Performance and load tests
- `test-runner.sh` - Main test runner script

## Running Tests  

### Prerequisites

- All services must be running
- Test dependencies must be installed
- Network connectivity to services

### Quick Test

```bash
# Run all smoke tests
./test/test-runner.sh smoke

# Run specific service test
./test/test-runner.sh smoke postgresql

# Run integration tests
./test/test-runner.sh integration
```

### Test Categories

#### Smoke Tests

Basic connectivity and health checks for each service:

- Service responds on expected port
- Basic authentication works
- Health endpoints return success

#### Integration Tests  

Service interaction and data flow tests:

- Data persistence across restarts
- Cross-service communication
- Backup and restore functionality

#### Performance Tests

Load and performance validation:

- Response time benchmarks
- Concurrent connection handling
- Memory and CPU usage under load

## Writing Tests

### Test Naming Convention

- `test_<service>_<feature>.sh` for individual tests
- Use descriptive names that indicate what is being tested

### Test Structure

Each test should:

1. Start with a clear description
2. Set up any required test data
3. Execute the test
4. Verify results  
5. Clean up test data
6. Return appropriate exit code

### Example Test

```bash
#!/bin/bash
# Test PostgreSQL connection and basic operations

set -e

echo "Testing PostgreSQL connection..."

# Test connection
psql -h localhost -p 5432 -U postgres -c "SELECT version();"

# Test database creation
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE test_db;"
psql -h localhost -p 5432 -U postgres -c "DROP DATABASE test_db;"

echo "✅ PostgreSQL test passed"
```

## Test Configuration

Environment variables for testing:

```bash
# Test database credentials  
TEST_POSTGRES_HOST=localhost
TEST_POSTGRES_PORT=5432
TEST_POSTGRES_USER=postgres
TEST_POSTGRES_PASSWORD=password

# Test Redis configuration
TEST_REDIS_HOST=localhost
TEST_REDIS_PORT=6379

# Test OpenSearch configuration
TEST_OPENSEARCH_HOST=localhost
TEST_OPENSEARCH_PORT=9200
```

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

1. Start services with test configuration
2. Wait for services to be healthy
3. Run test suite
4. Collect results and artifacts
5. Clean up environment

## Test Data

Use the `test-data/` directory for:

- Sample datasets
- Test configuration files
- Expected output files
- Benchmark data

## Troubleshooting Tests

If tests fail:

1. Check service logs: `docker-compose logs`
2. Verify service health: `./scripts/status.sh`
3. Check network connectivity
4. Review test output for specific errors
5. Ensure test dependencies are installed
