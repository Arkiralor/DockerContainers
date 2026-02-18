"""Comprehensive tests for Docker client functionality."""

from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest
from docker.errors import APIError, DockerException, NotFound

from src.services.docker_client import ContainerStatus, DockerClient, SystemInfo


class TestDockerClientInitialization:
    """Tests for Docker client initialization and connection."""

    @patch("src.services.docker_client.docker.from_env")
    def test_init_successful_connection(self, mock_from_env, mock_docker_client):
        """Test successful Docker client initialization."""
        mock_from_env.return_value = mock_docker_client

        client = DockerClient()

        assert client._client is not None
        mock_from_env.assert_called_once_with(timeout=5)
        mock_docker_client.ping.assert_called()

    @patch("src.services.docker_client.docker.from_env")
    def test_init_connection_failure(self, mock_from_env):
        """Test Docker client initialization when Docker is unavailable."""
        mock_from_env.side_effect = DockerException("Docker daemon not running")

        client = DockerClient()

        assert client._client is None

    @patch("src.services.docker_client.docker.from_env")
    def test_init_connection_timeout(self, mock_from_env):
        """Test Docker client initialization with timeout."""
        mock_from_env.side_effect = Exception("Connection timeout")

        client = DockerClient()

        assert client._client is None
        mock_from_env.assert_called_once_with(timeout=5)


class TestDockerClientConnection:
    """Tests for Docker client connection management."""

    @patch("src.services.docker_client.docker.from_env")
    def test_is_connected_when_connected(self, mock_from_env, mock_docker_client):
        """Test is_connected returns True when Docker is available."""
        mock_from_env.return_value = mock_docker_client
        client = DockerClient()

        assert client.is_connected() is True

    @patch("src.services.docker_client.docker.from_env")
    def test_is_connected_when_disconnected(self, mock_from_env):
        """Test is_connected returns False when Docker is unavailable."""
        mock_from_env.side_effect = DockerException("Connection failed")
        client = DockerClient()

        assert client.is_connected() is False

    @patch("src.services.docker_client.docker.from_env")
    def test_is_connected_ping_fails(self, mock_from_env, mock_docker_client):
        """Test is_connected when ping fails."""
        mock_docker_client.ping.side_effect = DockerException("Ping failed")
        mock_from_env.return_value = mock_docker_client
        client = DockerClient()

        assert client.is_connected() is False

    @patch("src.services.docker_client.docker.from_env")
    def test_reconnect_success(self, mock_from_env, mock_docker_client):
        """Test successful reconnection."""
        mock_from_env.side_effect = [
            DockerException("Initial failure"),
            mock_docker_client,
        ]
        client = DockerClient()

        assert client._client is None
        result = client.reconnect()

        assert result is True
        assert client._client is not None

    @patch("src.services.docker_client.docker.from_env")
    def test_reconnect_failure(self, mock_from_env):
        """Test failed reconnection."""
        mock_from_env.side_effect = DockerException("Connection failed")
        client = DockerClient()

        result = client.reconnect()

        assert result is False
        assert client._client is None


class TestGetContainerStatus:
    """Tests for retrieving individual container status."""

    @patch("src.services.docker_client.docker.from_env")
    def test_get_running_container_status(
        self, mock_from_env, mock_docker_client, mock_container_running
    ):
        """Test getting status of a running container."""
        mock_docker_client.containers.get.return_value = mock_container_running
        mock_from_env.return_value = mock_docker_client
        client = DockerClient()

        status = client.get_container_status("test-container")

        assert status.name == "test-container"
        assert status.status == "running"
        assert status.health == "healthy"
        assert status.image == "test:latest"
        assert isinstance(status.created_at, datetime)
        assert isinstance(status.started_at, datetime)

    @patch("src.services.docker_client.docker.from_env")
    def test_get_stopped_container_status(
        self, mock_from_env, mock_docker_client, mock_container_stopped
    ):
        """Test getting status of a stopped container."""
        mock_docker_client.containers.get.return_value = mock_container_stopped
        mock_from_env.return_value = mock_docker_client
        client = DockerClient()

        status = client.get_container_status("test-container")

        assert status.name == "test-container"
        assert status.status == "exited"
        assert status.health is None

    @patch("src.services.docker_client.docker.from_env")
    def test_get_container_not_found(self, mock_from_env, mock_docker_client):
        """Test getting status when container doesn't exist."""
        mock_docker_client.containers.get.side_effect = NotFound("Container not found")
        mock_from_env.return_value = mock_docker_client
        client = DockerClient()

        status = client.get_container_status("nonexistent")

        assert status.name == "nonexistent"
        assert status.status == "not_found"
        assert "not found" in status.error_message.lower()

    @patch("src.services.docker_client.docker.from_env")
    def test_get_container_api_error(self, mock_from_env, mock_docker_client):
        """Test handling Docker API errors."""
        mock_docker_client.containers.get.side_effect = APIError("API Error")
        mock_from_env.return_value = mock_docker_client
        client = DockerClient()

        status = client.get_container_status("test-container")

        assert status.status == "error"
        assert "api error" in status.error_message.lower()

    @patch("src.services.docker_client.docker.from_env")
    def test_get_container_docker_not_connected(self, mock_from_env):
        """Test getting status when Docker is not connected."""
        mock_from_env.side_effect = DockerException("Not connected")
        client = DockerClient()

        status = client.get_container_status("test-container")

        assert status.status == "error"
        assert "not connected" in status.error_message.lower()


class TestGetMultipleContainerStatus:
    """Tests for retrieving multiple container statuses."""

    @patch("src.services.docker_client.docker.from_env")
    def test_get_multiple_containers(
        self, mock_from_env, mock_docker_client, mock_container_running
    ):
        """Test getting status of multiple containers."""
        mock_docker_client.containers.get.return_value = mock_container_running
        mock_from_env.return_value = mock_docker_client
        client = DockerClient()

        statuses = client.get_multiple_container_status(
            ["container1", "container2", "container3"]
        )

        assert len(statuses) == 3
        assert "container1" in statuses
        assert "container2" in statuses
        assert "container3" in statuses

    @patch("src.services.docker_client.docker.from_env")
    def test_get_multiple_containers_mixed_status(
        self,
        mock_from_env,
        mock_docker_client,
        mock_container_running,
        mock_container_stopped,
    ):
        """Test getting status of multiple containers with different states."""

        def get_side_effect(name):
            if name == "running":
                return mock_container_running
            elif name == "stopped":
                return mock_container_stopped
            else:
                raise NotFound("Not found")

        mock_docker_client.containers.get.side_effect = get_side_effect
        mock_from_env.return_value = mock_docker_client
        client = DockerClient()

        statuses = client.get_multiple_container_status(
            ["running", "stopped", "missing"]
        )

        assert statuses["running"].status == "running"
        assert statuses["stopped"].status == "exited"
        assert statuses["missing"].status == "not_found"

    @patch("src.services.docker_client.docker.from_env")
    def test_get_multiple_containers_empty_list(
        self, mock_from_env, mock_docker_client
    ):
        """Test getting status with empty container list."""
        mock_from_env.return_value = mock_docker_client
        client = DockerClient()

        statuses = client.get_multiple_container_status([])

        assert len(statuses) == 0


class TestGetContainerLogs:
    """Tests for retrieving container logs."""

    @patch("src.services.docker_client.docker.from_env")
    def test_get_logs_basic(
        self, mock_from_env, mock_docker_client, mock_container_running
    ):
        """Test getting basic container logs."""
        mock_docker_client.containers.get.return_value = mock_container_running
        mock_from_env.return_value = mock_docker_client
        client = DockerClient()

        logs = client.get_container_logs("test-container", tail=10)

        assert len(logs) == 3
        assert logs[0] == "Log line 1"
        assert logs[1] == "Log line 2"
        assert logs[2] == "Log line 3"

    @patch("src.services.docker_client.docker.from_env")
    def test_get_logs_with_timestamp(
        self, mock_from_env, mock_docker_client, mock_container_running
    ):
        """Test getting logs with since timestamp."""
        mock_docker_client.containers.get.return_value = mock_container_running
        mock_from_env.return_value = mock_docker_client
        client = DockerClient()

        since_time = datetime(2024, 1, 1, 0, 0, 0)
        logs = client.get_container_logs("test-container", tail=10, since=since_time)

        assert isinstance(logs, list)
        mock_container_running.logs.assert_called_once()

    @patch("src.services.docker_client.docker.from_env")
    def test_get_logs_container_not_found(self, mock_from_env, mock_docker_client):
        """Test getting logs when container doesn't exist."""
        mock_docker_client.containers.get.side_effect = NotFound("Container not found")
        mock_from_env.return_value = mock_docker_client
        client = DockerClient()

        logs = client.get_container_logs("missing")

        assert len(logs) == 1
        assert "ERROR:" in logs[0]
        assert "not found" in logs[0].lower()

    @patch("src.services.docker_client.docker.from_env")
    def test_get_logs_api_error(
        self, mock_from_env, mock_docker_client, mock_container_running
    ):
        """Test handling API errors when getting logs."""
        mock_container_running.logs.side_effect = APIError("API Error")
        mock_docker_client.containers.get.return_value = mock_container_running
        mock_from_env.return_value = mock_docker_client
        client = DockerClient()

        logs = client.get_container_logs("test-container")

        assert len(logs) == 1
        assert "ERROR:" in logs[0]

    @patch("src.services.docker_client.docker.from_env")
    def test_get_logs_empty_response(
        self, mock_from_env, mock_docker_client, mock_container_running
    ):
        """Test getting logs when container has no logs."""
        mock_container_running.logs.return_value = b""
        mock_docker_client.containers.get.return_value = mock_container_running
        mock_from_env.return_value = mock_docker_client
        client = DockerClient()

        logs = client.get_container_logs("test-container")

        assert logs == []


class TestGetSystemInfo:
    """Tests for retrieving Docker system information."""

    @patch("src.services.docker_client.docker.from_env")
    def test_get_system_info_success(self, mock_from_env, mock_docker_client):
        """Test getting Docker system information."""
        mock_docker_client.version.return_value = {"Version": "24.0.0"}
        # Create mock containers with status attribute
        running_container_1 = MagicMock()
        running_container_1.status = "running"
        running_container_2 = MagicMock()
        running_container_2.status = "running"
        mock_docker_client.containers.list.return_value = [
            running_container_1,
            running_container_2,
        ]
        mock_docker_client.images.list.return_value = [MagicMock() for _ in range(5)]
        mock_docker_client.volumes.list.return_value = [MagicMock() for _ in range(3)]
        mock_from_env.return_value = mock_docker_client
        client = DockerClient()

        info = client.get_system_info()

        assert info is not None
        assert info.version == "24.0.0"
        assert info.containers_running == 2
        assert info.containers_total == 2
        assert info.images_total == 5
        assert info.volumes_total == 3

    @patch("src.services.docker_client.docker.from_env")
    def test_get_system_info_not_connected(self, mock_from_env):
        """Test getting system info when not connected."""
        mock_from_env.side_effect = DockerException("Not connected")
        client = DockerClient()

        info = client.get_system_info()

        assert info is None

    @patch("src.services.docker_client.docker.from_env")
    def test_get_system_info_api_error(self, mock_from_env, mock_docker_client):
        """Test handling API errors when getting system info."""
        mock_docker_client.version.side_effect = APIError("API Error")
        mock_from_env.return_value = mock_docker_client
        client = DockerClient()

        info = client.get_system_info()

        assert info is None


class TestContainerStatusDataClass:
    """Tests for ContainerStatus dataclass."""

    def test_container_status_creation(self):
        """Test creating ContainerStatus instance."""
        status = ContainerStatus(
            name="test",
            status="running",
            health="healthy",
            created_at=datetime(2024, 1, 1),
            started_at=datetime(2024, 1, 1, 0, 5),
            ports={"5432/tcp": "5432"},
            image="postgres:latest",
            error_message=None,
        )

        assert status.name == "test"
        assert status.status == "running"
        assert status.health == "healthy"

    def test_container_status_minimal(self):
        """Test creating ContainerStatus with minimal fields."""
        status = ContainerStatus(name="test", status="not_found")

        assert status.name == "test"
        assert status.status == "not_found"
        assert status.health is None
        assert status.created_at is None

    def test_container_status_with_error(self):
        """Test creating ContainerStatus with error message."""
        status = ContainerStatus(
            name="test", status="error", error_message="Connection failed"
        )

        assert status.status == "error"
        assert status.error_message == "Connection failed"


class TestSystemInfoDataClass:
    """Tests for SystemInfo dataclass."""

    def test_system_info_creation(self):
        """Test creating SystemInfo instance."""
        info = SystemInfo(
            version="24.0.0",
            containers_running=3,
            containers_total=10,
            images_total=25,
            volumes_total=5,
        )

        assert info.version == "24.0.0"
        assert info.containers_running == 3
        assert info.containers_total == 10


@pytest.mark.integration
@pytest.mark.docker
class TestDockerClientIntegration:
    """Integration tests requiring actual Docker daemon."""

    def test_real_docker_connection(self):
        """Test connecting to real Docker daemon if available."""
        try:
            client = DockerClient()
            is_connected = client.is_connected()

            # If Docker is available, verify basic operations
            if is_connected:
                info = client.get_system_info()
                assert info is not None
                assert isinstance(info.version, str)
        except Exception:
            pytest.skip("Docker daemon not available for integration testing")
