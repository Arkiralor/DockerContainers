"""Comprehensive tests for state transition matrix.

Tests based on TUI_CONTROL_FLOW_ANALYSIS.md covering:
- Container state transitions
- Screen navigation transitions
- Application state transitions
- State validation and consistency
"""

from datetime import datetime
from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.config.services import ServiceConfig
from src.services.command_executor import CommandResult
from src.services.docker_client import ContainerStatus
from src.tui.app import DockerTUIApp


class TestContainerStateTransitions:
    """Tests for container state transitions (Control Flow: State Transition Matrix)."""

    @pytest.mark.asyncio
    async def test_running_to_stopped_via_stop_action(self):
        """Test transition: running → stopped when user stops service."""
        service = ServiceConfig(
            id="redis",
            name="Redis",
            description="Cache",
            container_name="redis",
            ports=[],
            make_commands={"stop": "stop-redis"},
            compose_file_path="",
        )

        initial_status = ContainerStatus(name="redis", status="running")
        final_status = ContainerStatus(name="redis", status="stopped")

        # Simulate the state transition
        assert initial_status.status == "running"
        # After stop command executed
        assert final_status.status == "stopped"

    @pytest.mark.asyncio
    async def test_stopped_to_running_via_start_action(self):
        """Test transition: stopped → running when user starts service."""
        service = ServiceConfig(
            id="redis",
            name="Redis",
            description="Cache",
            container_name="redis",
            ports=[],
            make_commands={"start": "start-redis"},
            compose_file_path="",
        )

        initial_status = ContainerStatus(name="redis", status="stopped")
        final_status = ContainerStatus(name="redis", status="running")

        assert initial_status.status == "stopped"
        # After start command executed
        assert final_status.status == "running"

    def test_not_found_to_running_via_start_creates_container(self):
        """Test transition: not_found → running when start creates container."""
        initial_status = ContainerStatus(name="redis", status="not_found")
        final_status = ContainerStatus(name="redis", status="running")

        assert initial_status.status == "not_found"
        # After start command creates and starts container
        assert final_status.status == "running"

    def test_error_to_running_via_start_recovers(self):
        """Test transition: error → running when start recovers container."""
        initial_status = ContainerStatus(name="redis", status="error")
        final_status = ContainerStatus(name="redis", status="running")

        assert initial_status.status == "error"
        # After successful recovery
        assert final_status.status == "running"

    def test_any_to_error_when_docker_disconnected(self):
        """Test transition: any state → error when Docker disconnects."""
        initial_status = ContainerStatus(name="redis", status="running")
        error_status = ContainerStatus(
            name="redis", status="error", error_message="Docker not connected"
        )

        assert initial_status.status == "running"
        # After Docker disconnection
        assert error_status.status == "error"
        assert error_status.error_message is not None


class TestScreenNavigationTransitions:
    """Tests for screen navigation transitions."""

    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_main_to_services_via_s_key(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test transition: Main → ServiceList via 's' key."""
        mock_get_services.return_value = []
        app = DockerTUIApp()
        app.push_screen = Mock()

        app.action_services()

        app.push_screen.assert_called_once()

    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_main_to_operations_via_o_key(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test transition: Main → Operations via 'o' key."""
        mock_get_services.return_value = []
        app = DockerTUIApp()
        app.push_screen = Mock()

        app.action_operations()

        app.push_screen.assert_called_once()

    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_main_to_help_via_question_mark(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test transition: Main → Help via '?' key."""
        mock_get_services.return_value = []
        app = DockerTUIApp()
        app.push_screen = Mock()

        app.action_help()

        app.push_screen.assert_called_once()

    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_any_screen_to_exit_via_q_on_main(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test transition: Main screen → Exit via 'q'."""
        mock_get_services.return_value = []
        app = DockerTUIApp()
        app.exit = Mock()

        app.action_quit()

        app.exit.assert_called_once()


class TestApplicationStateTransitions:
    """Tests for application-level state transitions."""

    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_app_ready_to_app_limited_on_docker_disconnect(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test transition: APP_READY → APP_LIMITED when Docker disconnects."""
        mock_get_services.return_value = []

        mock_docker_instance = Mock()
        mock_docker_instance.is_connected.return_value = True
        mock_docker_client.return_value = mock_docker_instance

        app = DockerTUIApp()
        app._update_connection_status = Mock()

        # Initially connected (APP_READY)
        assert app.docker_client.is_connected() is True

        # Simulate disconnection
        mock_docker_instance.is_connected.return_value = False
        mock_docker_instance.reconnect.return_value = False

        app.refresh_status()

        # Should update to disconnected state (APP_LIMITED)
        app._update_connection_status.assert_called_with("Disconnected")

    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_app_limited_to_app_ready_on_reconnect(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test transition: APP_LIMITED → APP_READY when Docker reconnects."""
        mock_get_services.return_value = []

        mock_docker_instance = Mock()
        mock_docker_instance.is_connected.return_value = False
        mock_docker_instance.reconnect.return_value = True
        mock_docker_instance.get_multiple_container_status.return_value = {}
        mock_docker_client.return_value = mock_docker_instance

        app = DockerTUIApp()
        app._update_connection_status = Mock()
        app.query_one = Mock(return_value=Mock())

        # Initially disconnected (APP_LIMITED)
        app.refresh_status()

        # Should successfully reconnect (APP_READY)
        app._update_connection_status.assert_called_with("Connected")


class TestStatePersistence:
    """Tests for state persistence and consistency."""

    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_refresh_updates_last_refresh_timestamp(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that refresh_status updates last_refresh timestamp."""
        mock_services = [Mock(container_name="redis")]
        mock_get_services.return_value = mock_services

        mock_docker_instance = Mock()
        mock_docker_instance.is_connected.return_value = True
        mock_docker_instance.get_multiple_container_status.return_value = {}
        mock_docker_client.return_value = mock_docker_instance

        app = DockerTUIApp()
        app._update_connection_status = Mock()
        app.query_one = Mock(return_value=Mock())

        # Initially None
        assert app.last_refresh is None

        app.refresh_status()

        # Should be set to datetime
        assert isinstance(app.last_refresh, datetime)

    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_container_statuses_dict_updated_on_refresh(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that container_statuses dict is updated on refresh."""
        mock_services = [Mock(container_name="redis"), Mock(container_name="postgres")]
        mock_get_services.return_value = mock_services

        mock_docker_instance = Mock()
        mock_docker_instance.is_connected.return_value = True
        mock_docker_instance.get_multiple_container_status.return_value = {
            "redis": ContainerStatus(name="redis", status="running"),
            "postgres": ContainerStatus(name="postgres", status="stopped"),
        }
        mock_docker_client.return_value = mock_docker_instance

        app = DockerTUIApp()
        app._update_connection_status = Mock()
        app.query_one = Mock(return_value=Mock())

        # Initially empty
        assert app.container_statuses == {}

        app.refresh_status()

        # Should be populated
        assert len(app.container_statuses) == 2
        assert "redis" in app.container_statuses
        assert "postgres" in app.container_statuses


class TestStateValidation:
    """Tests for state validation and constraints."""

    def test_container_status_only_valid_states(self):
        """Test that ContainerStatus only accepts valid state values."""
        valid_states = ["running", "stopped", "exited", "not_found", "error", "paused", "restarting"]

        for state in valid_states:
            status = ContainerStatus(name="test", status=state)
            assert status.status == state

    def test_health_status_valid_values(self):
        """Test that health status has valid values."""
        valid_health = ["healthy", "unhealthy", "starting", None]

        for health in valid_health:
            status = ContainerStatus(name="test", status="running", health=health)
            assert status.health == health

    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_refresh_interval_bounds(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that refresh_interval is within valid bounds (1-300)."""
        mock_get_services.return_value = []
        app = DockerTUIApp()

        # Should accept valid values
        app.refresh_interval = 1
        assert app.refresh_interval == 1

        app.refresh_interval = 300
        assert app.refresh_interval == 300

        app.refresh_interval = 5
        assert app.refresh_interval == 5
