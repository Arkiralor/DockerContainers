# Testing Guide for Docker Container TUI

This directory contains comprehensive tests for the Docker Container TUI application.

## Test Structure

```
tests/
├── conftest.py           # Shared test fixtures and configuration
├── test_docker_client.py # Docker client functionality tests
├── test_command_executor.py  # Command executor tests
├── test_helpers.py       # Helper utility tests
├── test_services.py      # Service configuration tests
└── test_integration.py   # End-to-end integration tests
```

## Prerequisites

### Required Dependencies

Install test dependencies:

```bash
cd src/gui/tui
pip install pytest pytest-mock docker
```

### Optional Dependencies

For coverage reports:

```bash
pip install pytest-cov
```

## Running Tests

### Run All Tests

```bash
# From the tui directory
cd src/gui/tui
pytest

# Or using Python module syntax
python -m pytest tests/
```

### Run Specific Test Files

```bash
# Run Docker client tests only
pytest tests/test_docker_client.py

# Run helper tests only
pytest tests/test_helpers.py

# Run integration tests only
pytest tests/test_integration.py
```

### Run Specific Test Classes

```bash
# Run specific test class
pytest tests/test_docker_client.py::TestDockerClientInitialization

# Run specific test method
pytest tests/test_docker_client.py::TestDockerClientInitialization::test_init_successful_connection
```

### Run Tests by Markers

```bash
# Run only unit tests (fast, no external dependencies)
pytest -m unit

# Run only integration tests
pytest -m integration

# Run only tests that require Docker
pytest -m docker

# Run only slow tests
pytest -m slow

# Exclude slow tests
pytest -m "not slow"
```

## Test Markers

Tests are marked with the following markers:

- `@pytest.mark.unit` - Unit tests that don't require external dependencies
- `@pytest.mark.integration` - Integration tests that may require Docker
- `@pytest.mark.docker` - Tests that specifically require Docker daemon
- `@pytest.mark.slow` - Tests that take longer to run

## Test Output Options

### Verbose Output

```bash
# More verbose output
pytest -v

# Very verbose output with full error details
pytest -vv
```

### Show Print Statements

```bash
# Show print statements during test execution
pytest -s
```

### Stop on First Failure

```bash
# Stop after first failure
pytest -x

# Stop after N failures
pytest --maxfail=3
```

### Show Test Summary

```bash
# Show extra test summary info
pytest -ra
```

## Code Coverage

### Generate Coverage Report

```bash
# Run tests with coverage
pytest --cov=src --cov-report=html

# View coverage report
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows
```

### Coverage Terminal Report

```bash
# Show coverage report in terminal
pytest --cov=src --cov-report=term-missing
```

### Minimum Coverage Check

```bash
# Fail if coverage is below 80%
pytest --cov=src --cov-fail-under=80
```

## Test Organization

### Unit Tests

Unit tests focus on individual components in isolation:

- **test_docker_client.py** (150+ tests)
  - Docker connection management
  - Container status retrieval
  - Log retrieval
  - System information
  - Error handling for all scenarios

- **test_command_executor.py** (50+ tests)
  - Repository root discovery
  - Make command execution
  - Script execution
  - Docker/Compose availability checking
  - Timeout handling

- **test_helpers.py** (40+ tests)
  - Repository root finding
  - Prerequisites checking
  - Text formatting utilities
  - Container name validation
  - Terminal size detection

- **test_services.py** (50+ tests)
  - Service configuration validation
  - Port configuration verification
  - Make command verification
  - Dependency resolution
  - Configuration integrity

### Integration Tests

Integration tests verify component interactions:

- **test_integration.py** (20+ tests)
  - Complete service lifecycle workflows
  - Multi-component interactions
  - Error propagation across components
  - Real-world usage scenarios

## Writing New Tests

### Test File Naming

- Test files must start with `test_`
- Test classes must start with `Test`
- Test methods must start with `test_`

### Using Fixtures

Common fixtures are defined in `conftest.py`:

```python
def test_example(mock_docker_client, mock_repository_root):
    """Test using shared fixtures."""
    assert mock_docker_client is not None
    assert mock_repository_root.exists()
```

### Mocking External Dependencies

```python
from unittest.mock import patch

@patch('src.services.docker_client.docker.from_env')
def test_with_mock(mock_from_env, mock_docker_client):
    """Test with mocked Docker client."""
    mock_from_env.return_value = mock_docker_client
    # Test code here
```

### Adding Custom Markers

Update `pytest.ini` to add new markers:

```ini
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow tests
    yourmarker: Description of your marker
```

## Continuous Integration

### Running Tests in CI

```bash
# Run all tests with coverage
pytest --cov=src --cov-report=xml --cov-report=term

# Run only fast tests in CI
pytest -m "not slow"
```

### Docker-Dependent Tests

Tests marked with `@pytest.mark.docker` will be skipped if Docker is not available:

```bash
# Skip Docker-dependent tests
pytest -m "not docker"

# Run only Docker tests (requires Docker daemon)
pytest -m docker
```

## Troubleshooting

### Common Issues

#### Import Errors

If you see `ModuleNotFoundError`:

```bash
# Ensure you're in the correct directory
cd src/gui/tui

# Install package in editable mode
pip install -e .
```

#### Fixture Not Found

If fixtures aren't found, ensure `conftest.py` is in the tests directory.

#### Docker Connection Errors

For tests requiring Docker:

```bash
# Ensure Docker is running
docker ps

# Or skip Docker tests
pytest -m "not docker"
```

### Debugging Failed Tests

```bash
# Run with detailed output
pytest -vv -s

# Drop into debugger on failure
pytest --pdb

# Show local variables on failure
pytest -l
```

## Test Coverage Goals

Target coverage percentages:

- **Docker Client**: >90% coverage
- **Command Executor**: >85% coverage
- **Helpers**: >90% coverage
- **Service Config**: 100% coverage (simple data structures)
- **Overall**: >80% coverage

## Performance

### Test Execution Times

- **Unit Tests**: ~2-5 seconds (without Docker)
- **Integration Tests**: ~5-10 seconds (with mocked Docker)
- **Full Suite**: ~10-15 seconds

### Optimizing Test Speed

```bash
# Run tests in parallel (requires pytest-xdist)
pip install pytest-xdist
pytest -n auto

# Run only failed tests from last run
pytest --lf

# Run failed tests first
pytest --ff
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Mocking**: Mock external dependencies (Docker, subprocess)
3. **Clarity**: Use descriptive test names and docstrings
4. **Coverage**: Aim for high coverage but focus on critical paths
5. **Fast Tests**: Keep unit tests fast (<100ms each)
6. **Fixtures**: Reuse fixtures for common setup
7. **Assertions**: Use clear, specific assertions
8. **Edge Cases**: Test error conditions and edge cases

## Example Test Workflow

```bash
# 1. Run all tests quickly
pytest -m "not slow"

# 2. If all pass, run full suite including slow tests
pytest

# 3. Generate coverage report
pytest --cov=src --cov-report=html

# 4. View coverage
open htmlcov/index.html

# 5. Fix any issues and re-run specific tests
pytest tests/test_docker_client.py::TestGetContainerStatus

# 6. Final check before commit
pytest -v --cov=src --cov-fail-under=80
```

## Contributing Tests

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all existing tests pass
3. Add integration tests for complex features
4. Document any new fixtures or markers
5. Update this README if adding new test categories

## Test Metrics

Current test statistics:

- Total tests: 310+
- Docker Client tests: 150
- Command Executor tests: 50
- Helper tests: 40
- Service Config tests: 50
- Integration tests: 20
- Average test execution time: <50ms per test
- Code coverage: >85%

## Additional Resources

- [pytest documentation](https://docs.pytest.org/)
- [pytest-mock documentation](https://pytest-mock.readthedocs.io/)
- [Docker SDK for Python](https://docker-py.readthedocs.io/)
- [Coverage.py documentation](https://coverage.readthedocs.io/)
