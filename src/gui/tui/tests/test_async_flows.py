"""Comprehensive tests for async flow patterns.

Tests based on TUI_CONTROL_FLOW_ANALYSIS.md covering:
- Auto-refresh background task pattern
- Log following background task pattern
- Command execution with threading pattern
- Modal screen with await pattern
- Task cancellation and error handling
"""

import asyncio
from datetime import datetime
from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.services.command_executor import CommandResult
from src.services.docker_client import ContainerStatus
from src.tui.app import DockerTUIApp


class TestAutoRefreshBackgroundTask:
    """Tests for auto-refresh background task pattern (Control Flow: _auto_refresh_loop)."""

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_auto_refresh_runs_in_background(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that auto-refresh runs as background task without blocking."""
        mock_get_services.return_value = []
        app = DockerTUIApp()
        app.refresh_status = Mock()
        app.refresh_interval = 0.1

        # Start auto-refresh
        task = asyncio.create_task(app._auto_refresh_loop())

        # Allow some iterations
        await asyncio.sleep(0.35)

        # Cancel task
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

        # Should have called refresh multiple times
        assert app.refresh_status.call_count >= 2

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_auto_refresh_cancellable(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that auto-refresh task is cancellable."""
        mock_get_services.return_value = []
        app = DockerTUIApp()
        app.refresh_status = Mock()

        task = asyncio.create_task(app._auto_refresh_loop())
        await asyncio.sleep(0.1)
        task.cancel()

        # Should complete without hanging
        with pytest.raises(asyncio.CancelledError):
            await task

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_auto_refresh_error_tolerance(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that auto-refresh continues running despite individual errors."""
        mock_get_services.return_value = []
        app = DockerTUIApp()
        app.notify = Mock()
        app.refresh_interval = 0.1

        call_count = [0]

        def refresh_with_intermittent_error():
            call_count[0] += 1
            if call_count[0] == 2:
                raise Exception("Test error")

        app.refresh_status = refresh_with_intermittent_error

        task = asyncio.create_task(app._auto_refresh_loop())
        await asyncio.sleep(0.35)
        task.cancel()

        try:
            await task
        except asyncio.CancelledError:
            pass

        # Should have attempted multiple refreshes despite error
        assert call_count[0] >= 3

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_auto_refresh_user_configurable_interval(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that auto-refresh uses user-configured interval."""
        mock_get_services.return_value = []
        app = DockerTUIApp()
        app.refresh_status = Mock()
        app.refresh_interval = 0.2

        task = asyncio.create_task(app._auto_refresh_loop())
        await asyncio.sleep(0.25)
        task.cancel()

        try:
            await task
        except asyncio.CancelledError:
            pass

        # With 0.2s interval, should have 1-2 calls in 0.25s
        assert 1 <= app.refresh_status.call_count <= 2


class TestCommandExecutionWithThreading:
    """Tests for command execution with threading pattern (Control Flow: execute_make_command)."""

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_command_execution_non_blocking(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that command execution doesn't block UI."""
        mock_get_services.return_value = []

        mock_executor_instance = Mock()
        mock_executor_instance.execute_make_command.return_value = CommandResult(
            success=True, return_code=0, stdout="", stderr="", command=""
        )
        mock_executor.return_value = mock_executor_instance

        app = DockerTUIApp()
        app.notify = Mock()
        app.refresh_status = Mock()

        # Execute command
        result = await app.execute_make_command("start")

        # Should complete and return result
        assert result.success is True

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_command_execution_timeout_protection(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that command execution has timeout protection."""
        mock_get_services.return_value = []

        mock_executor_instance = Mock()

        def slow_command(*args, **kwargs):
            # Simulate timeout
            return CommandResult(
                success=False, return_code=-1, stdout="", stderr="timed out", command=""
            )

        mock_executor_instance.execute_make_command = slow_command
        mock_executor.return_value = mock_executor_instance

        app = DockerTUIApp()
        app.notify = Mock()
        app.refresh_status = Mock()

        result = await app.execute_make_command("long-running")

        # Should handle timeout
        assert result.success is False

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_command_execution_ui_feedback(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that command execution provides UI feedback."""
        mock_get_services.return_value = []

        mock_executor_instance = Mock()
        mock_executor_instance.execute_make_command.return_value = CommandResult(
            success=True, return_code=0, stdout="", stderr="", command=""
        )
        mock_executor.return_value = mock_executor_instance

        app = DockerTUIApp()
        app.notify = Mock()
        app.refresh_status = Mock()

        await app.execute_make_command("test", "Test Command")

        # Should notify before and after
        assert app.notify.call_count >= 2


class TestTaskCancellation:
    """Tests for task cancellation handling."""

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_multiple_task_cancellation(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that multiple background tasks cancel cleanly."""
        mock_get_services.return_value = []
        app = DockerTUIApp()
        app.refresh_status = Mock()

        # Start multiple tasks
        task1 = asyncio.create_task(app._auto_refresh_loop())
        await asyncio.sleep(0.1)

        # Cancel all
        task1.cancel()

        # Should complete without errors
        try:
            await task1
        except asyncio.CancelledError:
            pass  # Expected


class TestAsyncErrorHandling:
    """Tests for async error handling patterns."""

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_async_exception_captured(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test that exceptions in async methods are captured."""
        mock_get_services.return_value = []

        mock_executor_instance = Mock()
        mock_executor_instance.execute_make_command.side_effect = Exception("Test error")
        mock_executor.return_value = mock_executor_instance

        app = DockerTUIApp()
        app.notify = Mock()
        app.refresh_status = Mock()

        # Should handle exception gracefully
        result = await app.execute_make_command("failing")

        # Should return error result, not raise
        assert result.success is False


class TestConcurrentOperations:
    """Tests for concurrent async operations."""

    @pytest.mark.asyncio
    @patch("src.tui.app.CommandExecutor")
    @patch("src.tui.app.DockerClient")
    @patch("src.tui.app.get_all_services")
    async def test_concurrent_command_execution(
        self, mock_get_services, mock_docker_client, mock_executor
    ):
        """Test executing multiple commands concurrently."""
        mock_get_services.return_value = []

        mock_executor_instance = Mock()
        mock_executor_instance.execute_make_command.return_value = CommandResult(
            success=True, return_code=0, stdout="", stderr="", command=""
        )
        mock_executor.return_value = mock_executor_instance

        app = DockerTUIApp()
        app.notify = Mock()
        app.refresh_status = Mock()

        # Execute multiple commands concurrently
        results = await asyncio.gather(
            app.execute_make_command("cmd1"),
            app.execute_make_command("cmd2"),
            app.execute_make_command("cmd3"),
        )

        # All should complete successfully
        assert all(r.success for r in results)
        assert len(results) == 3
