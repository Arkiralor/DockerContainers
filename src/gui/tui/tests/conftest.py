"""Pytest configuration and shared fixtures for TUI tests."""

import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, Mock

import pytest

# Add src directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))


@pytest.fixture
def mock_repository_root(tmp_path):
    """Create a mock repository root directory structure."""
    repo_root = tmp_path / "DockerContainers"
    repo_root.mkdir()

    # Create expected directories
    (repo_root / "src").mkdir()
    (repo_root / "scripts").mkdir()
    (repo_root / "Makefile").touch()

    # Create service directories
    for service in ["redis", "postgresql", "opensearch"]:
        service_dir = repo_root / "src" / service
        service_dir.mkdir(parents=True)
        (service_dir / "docker-compose.yml").touch()

    return repo_root


@pytest.fixture
def mock_docker_client():
    """Create a mock Docker client."""
    client = MagicMock()
    client.ping.return_value = True
    client.containers = MagicMock()
    client.info.return_value = {
        "ServerVersion": "24.0.0",
        "ContainersRunning": 2,
        "Containers": 5,
        "Images": 10,
    }
    return client


@pytest.fixture
def mock_container_running():
    """Create a mock running container."""
    container = MagicMock()
    container.name = "test-container"
    container.status = "running"
    container.short_id = "abc123"
    container.attrs = {
        "State": {
            "Status": "running",
            "Health": {"Status": "healthy"},
            "StartedAt": "2024-01-01T00:00:00.000000000Z",
        },
        "Created": "2024-01-01T00:00:00.000000000Z",
        "Config": {"Image": "test:latest"},
        "NetworkSettings": {"Ports": {"5432/tcp": [{"HostPort": "5432"}]}},
    }
    container.logs.return_value = b"Log line 1\nLog line 2\nLog line 3\n"
    return container


@pytest.fixture
def mock_container_stopped():
    """Create a mock stopped container."""
    container = MagicMock()
    container.name = "test-container"
    container.status = "exited"
    container.short_id = "def456"
    container.attrs = {
        "State": {
            "Status": "exited",
            "ExitCode": 0,
            "StartedAt": "2024-01-01T00:00:00.000000000Z",
        },
        "Created": "2024-01-01T00:00:00.000000000Z",
        "Config": {"Image": "test:latest"},
        "NetworkSettings": {"Ports": {}},
    }
    return container


@pytest.fixture
def sample_services():
    """Sample service configurations for testing."""
    from src.config.services import ServiceConfig, ServicePort

    return [
        ServiceConfig(
            id="redis",
            name="Redis",
            description="Redis cache server",
            container_name="redis",
            ports=[ServicePort(container=6379, host=6379, description="Redis port")],
            make_commands={"start": "start-redis", "stop": "stop-redis"},
            compose_file_path="src/redis/docker-compose.yml",
        ),
        ServiceConfig(
            id="postgres",
            name="PostgreSQL",
            description="PostgreSQL database",
            container_name="postgres",
            ports=[ServicePort(container=5432, host=5432, description="Postgres port")],
            make_commands={"start": "start-postgres", "stop": "stop-postgres"},
            compose_file_path="src/postgresql/docker-compose.yml",
        ),
    ]


@pytest.fixture
def mock_command_result_success():
    """Mock successful command result."""
    from src.services.command_executor import CommandResult

    return CommandResult(
        success=True,
        return_code=0,
        stdout="Command executed successfully",
        stderr="",
        command="make test",
    )


@pytest.fixture
def mock_command_result_failure():
    """Mock failed command result."""
    from src.services.command_executor import CommandResult

    return CommandResult(
        success=False,
        return_code=1,
        stdout="",
        stderr="Error: Command failed",
        command="make test",
    )


@pytest.fixture
def mock_subprocess_success():
    """Mock subprocess.run for successful execution."""
    mock_result = Mock()
    mock_result.returncode = 0
    mock_result.stdout = "Success output"
    mock_result.stderr = ""
    return mock_result


@pytest.fixture
def mock_subprocess_failure():
    """Mock subprocess.run for failed execution."""
    mock_result = Mock()
    mock_result.returncode = 1
    mock_result.stdout = ""
    mock_result.stderr = "Error output"
    return mock_result


@pytest.fixture(autouse=True)
def reset_environ():
    """Reset environment variables after each test."""
    old_environ = dict(os.environ)
    yield
    os.environ.clear()
    os.environ.update(old_environ)


@pytest.fixture
def mock_textual_app():
    """Mock Textual app for screen testing."""
    app = MagicMock()
    app.screen_stack = []
    app.push_screen = MagicMock()
    app.push_screen_wait = MagicMock()
    app.pop_screen = MagicMock()
    app.notify = MagicMock()
    return app
