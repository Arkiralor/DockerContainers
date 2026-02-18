# Development Guide

This guide covers development workflows, testing, and contribution guidelines for the Docker Container TUI.

## Quick Start for Developers

### Installing for Development

```bash
cd src/gui/tui

# Install package in editable mode with all dev dependencies
pip install -e ".[dev]"

# Or install only test dependencies
pip install -e ".[test]"
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run only unit tests (fast)
pytest -m unit

# Run tests in parallel
pytest -n auto
```

## Development Workflow

### 1. Code Quality Tools

This project uses several tools to maintain code quality:

#### Black (Code Formatter)

```bash
# Format all code
black src/ tests/

# Check formatting without changing files
black --check src/ tests/
```

#### Ruff (Linter)

```bash
# Lint code
ruff check src/ tests/

# Auto-fix issues
ruff check --fix src/ tests/
```

#### MyPy (Type Checker)

```bash
# Type check
mypy src/
```

### 2. Pre-Commit Workflow

Before committing:

```bash
# 1. Format code
black src/ tests/

# 2. Lint and auto-fix
ruff check --fix src/ tests/

# 3. Type check
mypy src/

# 4. Run tests
pytest

# 5. Check coverage
pytest --cov=src --cov-fail-under=80
```

### 3. Making Changes

#### Adding New Features

1. Write tests first (TDD approach)
2. Implement the feature
3. Ensure all tests pass
4. Update documentation
5. Format and lint code
6. Commit with descriptive message

#### Fixing Bugs

1. Write a failing test that reproduces the bug
2. Fix the bug
3. Ensure the test now passes
4. Ensure all other tests still pass
5. Add regression test if needed

## Testing Guidelines

### Test Organization

- **Unit tests**: Test individual components in isolation
- **Integration tests**: Test component interactions
- **Mocked dependencies**: All external dependencies should be mocked

### Writing Tests

```python
import pytest
from unittest.mock import MagicMock, patch

class TestYourComponent:
    """Tests for YourComponent."""

    def test_basic_functionality(self):
        """Test basic functionality."""
        # Arrange
        component = YourComponent()

        # Act
        result = component.do_something()

        # Assert
        assert result == expected_value

    @patch('module.external_dependency')
    def test_with_mock(self, mock_dependency):
        """Test with mocked dependency."""
        mock_dependency.return_value = "mocked"
        result = function_using_dependency()
        assert result == "expected"
```

### Test Markers

Use markers to categorize tests:

```python
@pytest.mark.unit
def test_unit_test():
    """Fast test without external dependencies."""
    pass

@pytest.mark.integration
def test_integration():
    """Test with multiple components."""
    pass

@pytest.mark.slow
def test_expensive_operation():
    """Test that takes longer to run."""
    pass

@pytest.mark.docker
def test_requires_docker():
    """Test that needs Docker daemon."""
    pass
```

## Code Style Guidelines

### Python Version

- Minimum: Python 3.10
- Target: Python 3.10, 3.11, 3.12
- Use modern syntax (e.g., `str | None` instead of `Optional[str]`)

### Type Hints

Use type hints throughout:

```python
def process_data(data: dict[str, str]) -> list[str]:
    """Process data and return results."""
    return list(data.values())
```

### Docstrings

All public functions, classes, and methods should have docstrings:

```python
def calculate_total(items: list[int]) -> int:
    """Calculate the total of all items.

    Args:
        items: List of integers to sum

    Returns:
        Sum of all items in the list

    Raises:
        ValueError: If items list is empty
    """
    if not items:
        raise ValueError("Items list cannot be empty")
    return sum(items)
```

### Import Order

Follow this import order:

1. Standard library
2. Third-party packages
3. Local application imports

```python
import os
import sys
from pathlib import Path

import docker
from textual.app import App

from src.config.services import get_all_services
from src.services.docker_client import DockerClient
```

## Project Structure

```
src/gui/tui/
├── src/                    # Source code
│   ├── config/            # Configuration modules
│   ├── services/          # Service layer (Docker, commands)
│   ├── tui/              # UI components
│   └── utils/            # Utility functions
├── tests/                 # Test suite
│   ├── test_docker_client.py
│   ├── test_command_executor.py
│   ├── test_helpers.py
│   ├── test_services.py
│   └── test_integration.py
├── pyproject.toml        # Project configuration
└── README.md             # User documentation
```

## Configuration Files

### pyproject.toml

All project configuration is centralized in `pyproject.toml`:

- **Project metadata**: Name, version, dependencies
- **Optional dependencies**: `[test]` and `[dev]` extras
- **Tool configuration**: pytest, coverage, black, ruff, mypy

### pytest.ini (deprecated)

Configuration now in `pyproject.toml` under `[tool.pytest.ini_options]`.

## Continuous Integration

### GitHub Actions Workflow

Example CI configuration:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.10", "3.11", "3.12"]

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: ${{ matrix.python-version }}

    - name: Install dependencies
      run: |
        pip install -e ".[dev]"

    - name: Lint with ruff
      run: ruff check src/ tests/

    - name: Type check with mypy
      run: mypy src/

    - name: Test with pytest
      run: pytest --cov=src --cov-report=xml

    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

## Debugging

### Running Tests with Debugger

```bash
# Drop into debugger on failure
pytest --pdb

# Drop into debugger on first failure
pytest -x --pdb

# Show local variables on failure
pytest -l
```

### Debugging the TUI

```python
# Add breakpoint in code
import pdb; pdb.set_trace()

# Or use built-in breakpoint()
breakpoint()
```

### Verbose Output

```bash
# Very verbose pytest output
pytest -vv

# Show print statements
pytest -s

# Show extra test summary
pytest -ra
```

## Performance

### Profiling Tests

```bash
# Install pytest-profiling
pip install pytest-profiling

# Profile tests
pytest --profile

# Profile and generate SVG
pytest --profile-svg
```

### Optimizing Test Suite

- Keep unit tests fast (<100ms each)
- Use mocks instead of real Docker/subprocess calls
- Run slow tests separately with `pytest -m slow`
- Use `pytest-xdist` for parallel execution

## Common Tasks

### Adding a New Dependency

1. Add to `dependencies` in `pyproject.toml`
2. Reinstall: `pip install -e ".[dev]"`
3. Update documentation if needed

### Updating Version

Update version in `pyproject.toml`:

```toml
[project]
version = "0.2.0"
```

### Building Distribution

```bash
# Install build tool
pip install build

# Build wheel and source distribution
python -m build

# Distributions will be in dist/
```

## Troubleshooting

### Import Errors

```bash
# Reinstall in editable mode
pip install -e ".[dev]"

# Or add to PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)/src"
```

### Test Failures

```bash
# Run specific test with verbose output
pytest -vv tests/test_docker_client.py::TestDockerClientInitialization::test_init_successful_connection

# Show full diff on assertion failures
pytest --tb=long
```

### Type Check Errors

```bash
# Ignore specific error
# type: ignore[error-code]

# Ignore entire file
# type: ignore
```

## Best Practices

1. **Test-Driven Development**: Write tests before code
2. **Small Commits**: Commit frequently with clear messages
3. **Code Review**: Review your own diffs before committing
4. **Documentation**: Update docs when changing behavior
5. **Type Safety**: Use type hints everywhere
6. **Error Handling**: Handle errors gracefully, never use bare `except:`
7. **Logging**: Use appropriate log levels
8. **Performance**: Profile before optimizing

## Release Checklist

Before releasing a new version:

- [ ] All tests pass
- [ ] Coverage >= 80%
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in pyproject.toml
- [ ] Code formatted with black
- [ ] Code linted with ruff
- [ ] Type checked with mypy
- [ ] Integration tests pass
- [ ] Manual testing completed

## Resources

- [pytest documentation](https://docs.pytest.org/)
- [Black documentation](https://black.readthedocs.io/)
- [Ruff documentation](https://beta.ruff.rs/docs/)
- [MyPy documentation](https://mypy.readthedocs.io/)
- [Textual documentation](https://textual.textualize.io/)
- [Docker SDK documentation](https://docker-py.readthedocs.io/)

## Getting Help

- Check existing issues in the repository
- Read the documentation thoroughly
- Ask questions in discussions
- Contribute improvements to this guide
