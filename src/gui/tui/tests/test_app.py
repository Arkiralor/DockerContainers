"""Comprehensive tests for DockerTUIApp control flows.

Tests based on TUI_CONTROL_FLOW_ANALYSIS.md covering:
- Application lifecycle flow
- Status refresh flow
- Main screen navigation flow
- Auto-refresh background task
- Connection management
- Command execution
- Error handling
"""

import asyncio
from datetime import datetime
from unittest.mock import Mock, patch

import pytest

from src.services.command_executor import CommandResult
from src.services.docker_client import ContainerStatus
from src.tui.app import DockerTUIApp, HelpScreen


class TestDockerTUIAppInitialization:
    """Tests for DockerTUIApp initialization."""

    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_init_successful(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test successful app initialization."""
        mock_services = [Mock(), Mock()]
        mock_get_services.return_value = mock_services
        mock_executor_instance = Mock()
        mock_executor.return_value = mock_executor_instance

        app = DockerTUIApp()

        assert app.command_executor is not None
        assert app.docker_client is not None
        assert app.services == mock_services
        assert app.container_statuses == {}
        assert app._refresh_task is None

    @patch(
        "src.tui.app.CommandExecutor", side_effect=RuntimeError("Make not available")
    )
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_init_executor_failure(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test app initialization when CommandExecutor fails."""
        mock_get_services.return_value = []

        app = DockerTUIApp()

        assert app.command_executor is None
        assert hasattr(app, "_executor_error")
        assert "Make not available" in app._executor_error


class TestApplicationLifecycleFlow:
    """Tests for application lifecycle (Control Flow: on_mount, on_unmount)."""

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_on_mount_starts_auto_refresh(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that on_mount starts auto-refresh task."""
        mock_get_services.return_value = []
        app = DockerTUIApp()

        app._start_auto_refresh = Mock()
        app.refresh_status = Mock()

        app.on_mount()

        app._start_auto_refresh.assert_called_once()
        app.refresh_status.assert_called_once()

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_on_unmount_stops_auto_refresh(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that on_unmount stops auto-refresh and closes Docker client."""
        mock_get_services.return_value = []
        mock_docker_instance = Mock()
        mock_docker_client.return_value = mock_docker_instance

        app = DockerTUIApp()
        app._stop_auto_refresh = Mock()

        app.on_unmount()

        app._stop_auto_refresh.assert_called_once()
        mock_docker_instance.close.assert_called_once()


class TestAutoRefreshTask:
    """Tests for auto-refresh background task (Control Flow: _auto_refresh_loop)."""

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_start_auto_refresh_creates_task(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that starting auto-refresh creates asyncio task."""
        mock_get_services.return_value = []
        app = DockerTUIApp()

        with patch("asyncio.create_task") as mock_create_task:
            app._start_auto_refresh()

            mock_create_task.assert_called_once()

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_stop_auto_refresh_cancels_task(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that stopping auto-refresh cancels task."""
        mock_get_services.return_value = []
        app = DockerTUIApp()
        mock_task = Mock()
        app._refresh_task = mock_task

        app._stop_auto_refresh()

        # Check the task reference we saved, not app._refresh_task (which is now None)
        mock_task.cancel.assert_called_once()
        assert app._refresh_task is None

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_auto_refresh_loop_calls_refresh_status(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that auto-refresh loop periodically calls refresh_status."""
        mock_get_services.return_value = []
        app = DockerTUIApp()
        app.refresh_status = Mock()
        app.refresh_interval = 1

        # Run loop for short time
        task = asyncio.create_task(app._auto_refresh_loop())
        await asyncio.sleep(1.5)
        task.cancel()

        try:
            await task
        except asyncio.CancelledError:
            pass

        # Should have called refresh_status at least once
        assert app.refresh_status.call_count >= 1

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_auto_refresh_loop_handles_cancellation(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that auto-refresh loop handles CancelledError gracefully."""
        mock_get_services.return_value = []
        app = DockerTUIApp()
        app.refresh_status = Mock()

        task = asyncio.create_task(app._auto_refresh_loop())
        task.cancel()

        # Should not raise exception
        try:
            await task
        except asyncio.CancelledError:
            pass  # Expected

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_auto_refresh_loop_continues_on_error(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that auto-refresh loop continues despite errors."""
        mock_get_services.return_value = []
        app = DockerTUIApp()
        app.notify = Mock()

        call_count = [0]

        def refresh_with_error():
            call_count[0] += 1
            if call_count[0] == 1:
                raise Exception("Test error")

        app.refresh_status = refresh_with_error
        app.refresh_interval = 0.1

        task = asyncio.create_task(app._auto_refresh_loop())
        await asyncio.sleep(0.3)
        task.cancel()

        try:
            await task
        except asyncio.CancelledError:
            pass

        # Should have notified about error
        assert app.notify.call_count > 0
        # Should have continued past error
        assert call_count[0] > 1


class TestStatusRefreshFlow:
    """Tests for status refresh flow (Control Flow: refresh_status)."""

    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_refresh_status_when_connected(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test status refresh when Docker is connected."""
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

        app.refresh_status()

        mock_docker_instance.is_connected.assert_called()
        mock_docker_instance.get_multiple_container_status.assert_called_once_with(
            ["redis", "postgres"]
        )
        assert len(app.container_statuses) == 2
        assert isinstance(app.last_refresh, datetime)

    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_refresh_status_when_disconnected_attempts_reconnect(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test status refresh attempts reconnection when disconnected."""
        mock_get_services.return_value = []

        mock_docker_instance = Mock()
        mock_docker_instance.is_connected.return_value = False
        mock_docker_instance.reconnect.return_value = False
        mock_docker_client.return_value = mock_docker_instance

        app = DockerTUIApp()
        app._update_connection_status = Mock()

        app.refresh_status()

        mock_docker_instance.reconnect.assert_called_once()
        app._update_connection_status.assert_called_with("Disconnected")

    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_refresh_status_successful_reconnection(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test status refresh continues after successful reconnection."""
        mock_services = [Mock(container_name="redis")]
        mock_get_services.return_value = mock_services

        mock_docker_instance = Mock()
        mock_docker_instance.is_connected.return_value = False
        mock_docker_instance.reconnect.return_value = True
        mock_docker_instance.get_multiple_container_status.return_value = {
            "redis": ContainerStatus(name="redis", status="running")
        }
        mock_docker_client.return_value = mock_docker_instance

        app = DockerTUIApp()
        app._update_connection_status = Mock()
        app.query_one = Mock(return_value=Mock())

        app.refresh_status()

        mock_docker_instance.reconnect.assert_called_once()
        app._update_connection_status.assert_called_with("Connected")
        mock_docker_instance.get_multiple_container_status.assert_called_once()

    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_refresh_status_updates_status_text(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that refresh_status updates UI status text."""
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
        mock_status_widget = Mock()
        app.query_one = Mock(return_value=mock_status_widget)

        app.refresh_status()

        mock_status_widget.update.assert_called_once()
        call_args = mock_status_widget.update.call_args[0][0]
        assert "1/2 running" in call_args


class TestNavigationActions:
    """Tests for main screen navigation (Control Flow: action_* methods)."""

    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_action_refresh_calls_refresh_status(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that action_refresh calls refresh_status."""
        mock_get_services.return_value = []
        app = DockerTUIApp()
        app.refresh_status = Mock()
        app.notify = Mock()

        app.action_refresh()

        app.refresh_status.assert_called_once()
        app.notify.assert_called_once_with("Status refreshed")

    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_action_services_pushes_service_list_screen(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that action_services pushes ServiceListScreen."""
        mock_services = [Mock()]
        mock_get_services.return_value = mock_services

        app = DockerTUIApp()
        app.push_screen = Mock()
        app.container_statuses = {}

        app.action_services()

        app.push_screen.assert_called_once()

    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_action_operations_pushes_operations_screen(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that action_operations pushes OperationsScreen."""
        mock_get_services.return_value = []
        app = DockerTUIApp()
        app.push_screen = Mock()

        app.action_operations()

        app.push_screen.assert_called_once()

    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_action_help_pushes_help_screen(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that action_help pushes HelpScreen."""
        mock_get_services.return_value = []
        app = DockerTUIApp()
        app.push_screen = Mock()

        app.action_help()

        app.push_screen.assert_called_once()

    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_action_quit_exits_application(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that action_quit calls exit()."""
        mock_get_services.return_value = []
        app = DockerTUIApp()
        app.exit = Mock()

        app.action_quit()

        app.exit.assert_called_once()


class TestExecuteMakeCommand:
    """Tests for execute_make_command (Control Flow: async command execution)."""

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_execute_make_command_success(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test successful make command execution."""
        mock_get_services.return_value = []

        mock_executor_instance = Mock()
        mock_executor_instance.execute_make_command.return_value = CommandResult(
            success=True,
            return_code=0,
            stdout="Success",
            stderr="",
            command="start-redis",
        )
        mock_executor.return_value = mock_executor_instance

        app = DockerTUIApp()
        app.notify = Mock()
        app.refresh_status = Mock()

        result = await app.execute_make_command("start-redis", "Starting Redis")

        assert result.success is True
        assert app.notify.call_count == 2  # Start and completion
        app.refresh_status.assert_called_once()

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_execute_make_command_failure(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test failed make command execution."""
        mock_get_services.return_value = []

        mock_executor_instance = Mock()
        mock_executor_instance.execute_make_command.return_value = CommandResult(
            success=False,
            return_code=1,
            stdout="",
            stderr="Error occurred",
            command="start-redis",
        )
        mock_executor.return_value = mock_executor_instance

        app = DockerTUIApp()
        app.notify = Mock()
        app.refresh_status = Mock()

        result = await app.execute_make_command("start-redis", "Starting Redis")

        assert result.success is False
        # Should notify about error
        error_calls = [
            call for call in app.notify.call_args_list if "severity" in call.kwargs
        ]
        assert len(error_calls) > 0

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor", side_effect=RuntimeError("No executor"))
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_execute_make_command_no_executor(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test execute_make_command when executor is not available."""
        mock_get_services.return_value = []
        app = DockerTUIApp()

        result = await app.execute_make_command("start-redis")

        assert result.success is False
        assert "not available" in result.stderr
        assert result.return_code == -1


class TestHelpScreen:
    """Tests for HelpScreen modal."""

    def test_help_screen_compose(self):
        """Test HelpScreen creates layout."""
        screen = HelpScreen()
        # Just test that compose returns widgets
        widgets = list(screen.compose())
        assert len(widgets) > 0

    def test_help_screen_close_button(self):
        """Test HelpScreen close button dismisses screen."""
        screen = HelpScreen()
        screen.dismiss = Mock()

        button_event = Mock()
        button_event.button.id = "close-button"

        screen.on_button_pressed(button_event)

        screen.dismiss.assert_called_once()

    def test_help_screen_escape_key(self):
        """Test HelpScreen escape key dismisses screen."""
        screen = HelpScreen()
        screen.dismiss = Mock()

        key_event = Mock()
        key_event.key = "escape"

        screen.on_key(key_event)

        screen.dismiss.assert_called_once()
