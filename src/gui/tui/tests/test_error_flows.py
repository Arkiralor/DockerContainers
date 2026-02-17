"""Comprehensive tests for error and exception flows.

Tests based on TUI_CONTROL_FLOW_ANALYSIS.md covering:
- Initialization error paths
- Runtime error paths
- User input error paths
- Network/connection errors
- Command execution errors
- Recovery mechanisms
"""

from unittest.mock import Mock, patch

import pytest
from click.testing import CliRunner
from docker.errors import APIError, NotFound

from src.main import main
from src.services.command_executor import CommandResult
from src.services.docker_client import ContainerStatus


class TestInitializationErrorPaths:
    """Tests for initialization error paths (Control Flow: Application Startup Errors)."""

    def test_python_version_too_low_exits(self):
        """Test that Python version < 3.10 causes exit."""
        runner = CliRunner()

        with patch(
            "src.main.check_prerequisites",
            return_value=(False, ["Python 3.6 < required 3.10"]),
        ):
            result = runner.invoke(main)

            assert result.exit_code == 1
            assert "Prerequisites check failed" in result.output

    def test_repository_structure_invalid_exits(self):
        """Test that invalid repository structure causes exit."""
        runner = CliRunner()

        with patch(
            "src.main.check_prerequisites",
            return_value=(False, ["Missing src/ directory"]),
        ):
            result = runner.invoke(main)

            assert result.exit_code == 1

    def test_docker_not_available_can_continue(self):
        """Test that Docker unavailability allows continuation with user consent."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value="/repo"):
                with patch(
                    "src.services.command_executor.CommandExecutor"
                ) as mock_executor_class:
                    mock_executor = Mock()
                    mock_executor.check_docker_available.return_value = False
                    mock_executor_class.return_value = mock_executor

                    with patch("src.main.DockerTUIApp") as mock_app:
                        mock_app_instance = Mock()
                        mock_app.return_value = mock_app_instance

                        # User confirms to continue
                        result = runner.invoke(main, input="y\n")

                        mock_app.assert_called_once()

    def test_command_executor_init_failure_shows_error(self):
        """Test that CommandExecutor initialization failure shows error in UI."""
        with patch(
            "src.tui.app.CommandExecutor",
            side_effect=RuntimeError("Make not available"),
        ):
            with patch("src.tui.app.DockerClient"):
                with patch("src.tui.app.get_all_services", return_value=[]):
                    from src.tui.app import DockerTUIApp

                    app = DockerTUIApp()

                    assert app.command_executor is None
                    assert hasattr(app, "_executor_error")
                    assert "Make not available" in app._executor_error


class TestRuntimeErrorPaths:
    """Tests for runtime error paths (Control Flow: Runtime Errors)."""

    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_docker_connection_lost_attempts_reconnect(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that Docker connection loss triggers reconnection attempt."""
        mock_get_services.return_value = []

        mock_docker_instance = Mock()
        mock_docker_instance.is_connected.return_value = False
        mock_docker_instance.reconnect.return_value = False
        mock_docker_client.return_value = mock_docker_instance

        from src.tui.app import DockerTUIApp

        app = DockerTUIApp()
        app._update_connection_status = Mock()

        app.refresh_status()

        mock_docker_instance.reconnect.assert_called_once()
        app._update_connection_status.assert_called_with("Disconnected")

    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    def test_docker_connection_successful_reconnect(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test successful Docker reconnection."""
        mock_get_services.return_value = []

        mock_docker_instance = Mock()
        mock_docker_instance.is_connected.return_value = False
        mock_docker_instance.reconnect.return_value = True
        mock_docker_instance.get_multiple_container_status.return_value = {}
        mock_docker_client.return_value = mock_docker_instance

        from src.tui.app import DockerTUIApp

        app = DockerTUIApp()
        app._update_connection_status = Mock()
        app.query_one = Mock(return_value=Mock())

        app.refresh_status()

        mock_docker_instance.reconnect.assert_called_once()
        app._update_connection_status.assert_called_with("Connected")

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_make_command_execution_failure(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that make command execution failure is handled."""
        mock_get_services.return_value = []

        mock_executor_instance = Mock()
        mock_executor_instance.execute_make_command.return_value = CommandResult(
            success=False,
            return_code=1,
            stdout="",
            stderr="make: *** No rule to make target 'invalid'",
            command="make invalid",
        )
        mock_executor.return_value = mock_executor_instance

        from src.tui.app import DockerTUIApp

        app = DockerTUIApp()
        app.notify = Mock()
        app.refresh_status = Mock()

        result = await app.execute_make_command("invalid")

        assert result.success is False
        assert "failed" in app.notify.call_args_list[-1][0][0].lower()

    @patch("src.services.docker_client.docker.from_env")
    def test_container_status_query_failure_returns_error_status(self, mock_from_env):
        """Test that container status query failure returns error status."""
        mock_docker_client = Mock()
        mock_docker_client.containers.get.side_effect = APIError("API error")
        mock_from_env.return_value = mock_docker_client

        from src.services.docker_client import DockerClient

        client = DockerClient()
        status = client.get_container_status("test")

        assert status.status == "error"
        assert status.error_message is not None

    @patch("src.services.docker_client.docker.from_env")
    def test_container_not_found_returns_not_found_status(self, mock_from_env):
        """Test that container not found returns not_found status."""
        mock_docker_client = Mock()
        mock_docker_client.containers.get.side_effect = NotFound("Not found")
        mock_from_env.return_value = mock_docker_client

        from src.services.docker_client import DockerClient

        client = DockerClient()
        status = client.get_container_status("nonexistent")

        assert status.status == "not_found"
        assert "not found" in status.error_message.lower()

    @patch("src.services.docker_client.docker.from_env")
    def test_log_retrieval_failure_returns_error_message(self, mock_from_env):
        """Test that log retrieval failure returns error message."""
        mock_docker_client = Mock()
        mock_docker_client.containers.get.side_effect = APIError("Cannot connect")
        mock_from_env.return_value = mock_docker_client

        from src.services.docker_client import DockerClient

        client = DockerClient()
        logs = client.get_container_logs("test")

        assert len(logs) == 1
        assert logs[0].startswith("ERROR:")

    @patch("src.services.command_executor.subprocess.run")
    def test_script_execution_failure(
        self, mock_subprocess, mock_repository_root, mock_subprocess_success
    ):
        """Test that script execution failure is handled."""
        mock_subprocess.side_effect = [
            mock_subprocess_success,  # make check
            Mock(returncode=1, stdout="", stderr="permission denied"),
        ]

        from src.services.command_executor import CommandExecutor

        executor = CommandExecutor(str(mock_repository_root))
        result = executor.execute_script("scripts/test.sh")

        assert result.success is False
        assert "denied" in result.stderr or "not found" in result.stderr

    @patch("src.services.command_executor.subprocess.run")
    def test_command_timeout_handled(self, mock_subprocess, mock_repository_root):
        """Test that command timeout is handled gracefully."""
        import subprocess

        mock_subprocess.side_effect = [
            Mock(returncode=0, stdout="", stderr=""),  # make check
            subprocess.TimeoutExpired("make", 60),
        ]

        from src.services.command_executor import CommandExecutor

        executor = CommandExecutor(str(mock_repository_root))
        result = executor.execute_make_command("long-running", timeout=1)

        assert result.success is False
        assert "timed out" in result.stderr.lower()


class TestUserInputErrorPaths:
    """Tests for user input error paths (Control Flow: Invalid User Actions)."""

    def test_no_service_selected_shows_warning(self):
        """Test that action with no service selected shows warning."""
        from src.tui.screens.service_list import ServiceListScreen

        screen = ServiceListScreen([], {}, Mock())
        screen.notify = Mock()

        # Mock the table to return cursor_row = None (no selection)
        mock_table = Mock()
        mock_table.cursor_row = None
        screen.query_one = Mock(return_value=mock_table)

        screen.action_view_logs()

        screen.notify.assert_called()
        assert "select" in screen.notify.call_args[0][0].lower()

    def test_no_operation_selected_shows_warning(self):
        """Test that executing with no operation selected shows warning."""
        from src.tui.screens.operations import OperationsScreen

        screen = OperationsScreen({}, Mock())
        screen.notify = Mock()

        # Mock the table to return cursor_row = None (no selection)
        mock_table = Mock()
        mock_table.cursor_row = None
        screen.query_one = Mock(return_value=mock_table)

        import asyncio

        asyncio.run(screen.action_execute_operation())

        screen.notify.assert_called()

    def test_command_not_available_for_service_shows_error(self):
        """Test that missing command shows error."""
        from src.config.services import ServiceConfig
        from src.tui.screens.service_list import ServiceListScreen

        service = ServiceConfig(
            id="test",
            name="Test",
            description="",
            container_name="test",
            ports=[],
            make_commands={},  # No commands
            compose_file_path="",
        )

        screen = ServiceListScreen(
            [service], {"test": ContainerStatus(name="test", status="running")}, Mock()
        )
        screen.notify = Mock()

        # Mock the table to return cursor_row = 0 (service selected)
        mock_table = Mock()
        mock_table.cursor_row = 0
        screen.query_one = Mock(return_value=mock_table)

        import asyncio

        asyncio.run(screen.action_service_action())

        screen.notify.assert_called()
        assert "no command available" in screen.notify.call_args[0][0].lower()


class TestRecoveryMechanisms:
    """Tests for error recovery mechanisms."""

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_auto_refresh_continues_after_error(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that auto-refresh continues running after hitting an error."""
        import asyncio

        mock_get_services.return_value = []

        from src.tui.app import DockerTUIApp

        app = DockerTUIApp()
        app.notify = Mock()
        app.refresh_interval = 0.1

        call_count = [0]

        def refresh_with_error():
            call_count[0] += 1
            if call_count[0] == 1:
                raise Exception("Temporary error")

        app.refresh_status = refresh_with_error

        task = asyncio.create_task(app._auto_refresh_loop())
        await asyncio.sleep(0.25)
        task.cancel()

        try:
            await task
        except asyncio.CancelledError:
            pass

        # Should have recovered and continued
        assert call_count[0] > 1

    @patch("src.services.docker_client.docker.from_env")
    def test_docker_client_reconnect_after_failure(self, mock_from_env):
        """Test that Docker client can reconnect after initial failure."""
        from docker.errors import DockerException

        from src.services.docker_client import DockerClient

        # First attempt fails, second succeeds
        mock_working_client = Mock()
        mock_working_client.ping.return_value = True

        mock_from_env.side_effect = [
            DockerException("Connection failed"),
            mock_working_client,
        ]

        client = DockerClient()
        assert client._client is None

        # Reconnect
        result = client.reconnect()
        assert result is True
        assert client._client is not None


class TestErrorPropagation:
    """Tests for error propagation and visibility."""

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_command_error_displayed_to_user(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that command errors are displayed to user."""
        mock_get_services.return_value = []

        mock_executor_instance = Mock()
        mock_executor_instance.execute_make_command.return_value = CommandResult(
            success=False,
            return_code=1,
            stdout="",
            stderr="Error: target not found",
            command="make invalid",
        )
        mock_executor.return_value = mock_executor_instance

        from src.tui.app import DockerTUIApp

        app = DockerTUIApp()
        app.notify = Mock()
        app.refresh_status = Mock()

        await app.execute_make_command("invalid")

        # Should notify user of error
        error_calls = [
            call for call in app.notify.call_args_list if "severity" in call.kwargs
        ]
        assert len(error_calls) > 0

    def test_debug_mode_shows_full_error_details(self):
        """Test that debug mode shows full error details."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value="/repo"):
                with patch("src.main.DockerTUIApp") as mock_app:
                    with patch("src.services.command_executor.CommandExecutor"):
                        mock_app_instance = Mock()
                        mock_app_instance.run.side_effect = Exception("Test error")
                        mock_app.return_value = mock_app_instance

                        result = runner.invoke(main, ["--debug", "--no-docker-check"])

                        assert "DEBUG" in result.output
                        assert (
                            "traceback" in result.output.lower()
                            or "Traceback" in result.output
                        )
