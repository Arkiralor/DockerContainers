"""Comprehensive tests for LogViewerScreen control flows.

Tests based on TUI_CONTROL_FLOW_ANALYSIS.md covering:
- Initialization and lifecycle
- Log refresh flow
- Real-time log following flow
- User actions (refresh, follow, clear, save, tail adjustment)
- Error handling
- Background task management
"""

import asyncio
from unittest.mock import Mock, patch

import pytest

from src.config.services import ServiceConfig
from src.tui.screens.log_viewer import LogViewerScreen


class TestLogViewerScreenInitialization:
    """Tests for LogViewerScreen initialization."""

    def test_init_sets_defaults(self):
        """Test initialization sets default values."""
        service = ServiceConfig(
            id="redis",
            name="Redis",
            description="Cache",
            container_name="redis",
            ports=[],
            make_commands={},
            compose_file_path="",
        )
        docker_client = Mock()

        screen = LogViewerScreen(service, docker_client)

        assert screen.service == service
        assert screen.docker_client == docker_client
        assert screen.tail_lines == 100
        assert screen.following is False
        assert screen.logs_content == []
        assert screen._follow_task is None
        assert screen._last_log_check is None


class TestLogViewerScreenLifecycle:
    """Tests for screen lifecycle (on_mount, on_unmount)."""

    def test_on_mount_starts_log_refresh(self):
        """Test that on_mount triggers log refresh."""
        service = Mock()
        service.name = "Redis"  # Set name attribute, not Mock's name parameter
        docker_client = Mock()

        screen = LogViewerScreen(service, docker_client)
        screen._update_status = Mock()
        screen.refresh_logs = Mock()

        screen.on_mount()

        assert screen.title == "Logs - Redis"
        screen._update_status.assert_called_once()
        screen.refresh_logs.assert_called_once()

    def test_on_unmount_stops_following(self):
        """Test that on_unmount stops log following."""
        service = Mock()
        docker_client = Mock()

        screen = LogViewerScreen(service, docker_client)
        screen._stop_following = Mock()

        screen.on_unmount()

        screen._stop_following.assert_called_once()


class TestLogRefreshFlow:
    """Tests for log refresh flow (Control Flow: refresh_logs)."""

    def test_refresh_logs_when_docker_disconnected(self):
        """Test refresh_logs handles Docker disconnection."""
        service = Mock(container_name="redis")
        docker_client = Mock()
        docker_client.is_connected.return_value = False

        screen = LogViewerScreen(service, docker_client)
        screen._display_error = Mock()

        screen.refresh_logs()

        screen._display_error.assert_called_once()
        assert "not connected" in screen._display_error.call_args[0][0].lower()

    def test_refresh_logs_success(self):
        """Test successful log retrieval."""
        service = Mock(container_name="redis")
        docker_client = Mock()
        docker_client.is_connected.return_value = True
        docker_client.get_container_logs.return_value = [
            "Log line 1",
            "Log line 2",
            "Log line 3",
        ]

        screen = LogViewerScreen(service, docker_client)
        screen._display_logs = Mock()
        screen._update_status = Mock()

        screen.refresh_logs()

        assert screen.logs_content == ["Log line 1", "Log line 2", "Log line 3"]
        screen._display_logs.assert_called_once()
        screen._update_status.assert_called_once()

    def test_refresh_logs_error_response(self):
        """Test refresh_logs handles error response from Docker."""
        service = Mock(container_name="redis")
        docker_client = Mock()
        docker_client.is_connected.return_value = True
        docker_client.get_container_logs.return_value = ["ERROR: Container not found"]

        screen = LogViewerScreen(service, docker_client)
        screen._display_error = Mock()

        screen.refresh_logs()

        screen._display_error.assert_called_once()

    def test_refresh_logs_no_logs_available(self):
        """Test refresh_logs when no logs available."""
        service = Mock(container_name="redis")
        docker_client = Mock()
        docker_client.is_connected.return_value = True
        docker_client.get_container_logs.return_value = []

        screen = LogViewerScreen(service, docker_client)
        screen._display_logs = Mock()
        screen._update_status = Mock()

        screen.refresh_logs()

        assert screen.logs_content == ["No logs available"]


class TestLogFollowingFlow:
    """Tests for real-time log following (Control Flow: _start_following, _follow_logs, _stop_following)."""

    def test_start_following_sets_flag_and_starts_task(self):
        """Test that _start_following initiates following."""
        service = Mock()
        docker_client = Mock()

        screen = LogViewerScreen(service, docker_client)
        screen._update_follow_button = Mock()
        screen._update_status = Mock()

        with patch("asyncio.create_task") as mock_create_task:
            screen._start_following()

            assert screen.following is True
            screen._update_follow_button.assert_called_once()
            screen._update_status.assert_called_once()
            mock_create_task.assert_called_once()

    def test_start_following_when_already_following(self):
        """Test that _start_following does nothing if already following."""
        service = Mock()
        docker_client = Mock()

        screen = LogViewerScreen(service, docker_client)
        screen._follow_task = Mock()
        screen._update_follow_button = Mock()

        with patch("asyncio.create_task") as mock_create_task:
            screen._start_following()

            # Should not create new task
            mock_create_task.assert_not_called()

    def test_stop_following_cancels_task(self):
        """Test that _stop_following cancels task and updates state."""
        service = Mock()
        docker_client = Mock()

        screen = LogViewerScreen(service, docker_client)
        screen.following = True
        mock_task = Mock()
        screen._follow_task = mock_task
        screen._update_follow_button = Mock()
        screen._update_status = Mock()

        screen._stop_following()

        # Check the task reference we saved, not screen._follow_task (which is now None)
        mock_task.cancel.assert_called_once()
        assert screen._follow_task is None
        assert screen.following is False
        screen._update_follow_button.assert_called_once()
        screen._update_status.assert_called_once()

    @pytest.mark.asyncio
    async def test_follow_logs_loop_polls_periodically(self):
        """Test that _follow_logs polls for new logs."""
        service = Mock(container_name="redis")
        docker_client = Mock()
        docker_client.is_connected.return_value = True
        docker_client.get_container_logs.return_value = ["New log line"]

        screen = LogViewerScreen(service, docker_client)
        screen.following = True
        screen.tail_lines = 100
        screen._display_logs = Mock()
        screen._update_status = Mock()

        # Run for short time then cancel
        task = asyncio.create_task(screen._follow_logs())
        await asyncio.sleep(2.5)
        screen.following = False
        task.cancel()

        try:
            await task
        except asyncio.CancelledError:
            pass

        # Should have called get_container_logs at least once
        assert docker_client.get_container_logs.call_count >= 1

    @pytest.mark.asyncio
    async def test_follow_logs_handles_cancellation(self):
        """Test that _follow_logs handles CancelledError gracefully."""
        service = Mock()
        docker_client = Mock()
        docker_client.is_connected.return_value = True

        screen = LogViewerScreen(service, docker_client)
        screen.following = True

        task = asyncio.create_task(screen._follow_logs())
        task.cancel()

        # Should not raise exception
        try:
            await task
        except asyncio.CancelledError:
            pass  # Expected

    @pytest.mark.asyncio
    async def test_follow_logs_continues_when_docker_disconnected(self):
        """Test that _follow_logs continues loop when Docker disconnected."""
        service = Mock()
        docker_client = Mock()
        docker_client.is_connected.return_value = False

        screen = LogViewerScreen(service, docker_client)
        screen.following = True

        # Should continue to next iteration
        task = asyncio.create_task(screen._follow_logs())

        # Give the task time to execute (it sleeps for 2 seconds first)
        await asyncio.sleep(2.5)

        screen.following = False
        task.cancel()

        try:
            await task
        except asyncio.CancelledError:
            pass

        # Should have checked connection
        assert docker_client.is_connected.call_count > 0


class TestUserActions:
    """Tests for user actions (Control Flow: action_* methods)."""

    def test_action_refresh_calls_refresh_logs(self):
        """Test that action_refresh calls refresh_logs."""
        service = Mock()
        docker_client = Mock()

        screen = LogViewerScreen(service, docker_client)
        screen.refresh_logs = Mock()
        screen.notify = Mock()

        screen.action_refresh()

        screen.refresh_logs.assert_called_once()
        screen.notify.assert_called_with("Logs refreshed")

    def test_action_toggle_follow_starts_following(self):
        """Test that toggle_follow starts following when not following."""
        service = Mock()
        docker_client = Mock()

        screen = LogViewerScreen(service, docker_client)
        screen.following = False
        screen._start_following = Mock()
        screen._stop_following = Mock()

        screen.action_toggle_follow()

        screen._start_following.assert_called_once()
        screen._stop_following.assert_not_called()

    def test_action_toggle_follow_stops_following(self):
        """Test that toggle_follow stops following when following."""
        service = Mock()
        docker_client = Mock()

        screen = LogViewerScreen(service, docker_client)
        screen.following = True
        screen._start_following = Mock()
        screen._stop_following = Mock()

        screen.action_toggle_follow()

        screen._stop_following.assert_called_once()
        screen._start_following.assert_not_called()

    def test_action_clear_clears_logs(self):
        """Test that action_clear clears log content."""
        service = Mock()
        docker_client = Mock()

        screen = LogViewerScreen(service, docker_client)
        screen.logs_content = ["Line 1", "Line 2"]
        screen.query_one = Mock(return_value=Mock())
        screen._update_status = Mock()

        screen.action_clear()

        assert screen.logs_content == []

    def test_action_save_logs_writes_file(self):
        """Test that action_save_logs saves logs to file."""
        service = Mock(container_name="redis")
        docker_client = Mock()

        screen = LogViewerScreen(service, docker_client)
        screen.logs_content = ["Log line 1", "Log line 2"]
        screen.notify = Mock()

        with patch("builtins.open", create=True) as mock_open:
            with patch("pathlib.Path.write_text") as mock_write:
                screen.action_save_logs()

                screen.notify.assert_called()
                assert "saved" in screen.notify.call_args[0][0].lower()

    def test_action_save_logs_no_logs(self):
        """Test that action_save_logs warns when no logs available."""
        service = Mock()
        docker_client = Mock()

        screen = LogViewerScreen(service, docker_client)
        screen.logs_content = []
        screen.notify = Mock()

        screen.action_save_logs()

        screen.notify.assert_called()
        assert "no logs" in screen.notify.call_args[0][0].lower()

    def test_action_increase_tail_increases_limit(self):
        """Test that action_increase_tail increases tail_lines."""
        service = Mock()
        docker_client = Mock()

        screen = LogViewerScreen(service, docker_client)
        screen.tail_lines = 100
        screen._update_status = Mock()
        screen.refresh_logs = Mock()

        screen.action_increase_tail()

        assert screen.tail_lines == 150
        screen._update_status.assert_called_once()
        screen.refresh_logs.assert_called_once()

    def test_action_increase_tail_maximum_limit(self):
        """Test that action_increase_tail respects maximum of 1000."""
        service = Mock()
        docker_client = Mock()

        screen = LogViewerScreen(service, docker_client)
        screen.tail_lines = 1000
        screen._update_status = Mock()
        screen.refresh_logs = Mock()

        screen.action_increase_tail()

        assert screen.tail_lines == 1000  # Should not increase
        screen._update_status.assert_not_called()

    def test_action_decrease_tail_decreases_limit(self):
        """Test that action_decrease_tail decreases tail_lines."""
        service = Mock()
        docker_client = Mock()

        screen = LogViewerScreen(service, docker_client)
        screen.tail_lines = 100
        screen._update_status = Mock()
        screen.refresh_logs = Mock()

        screen.action_decrease_tail()

        assert screen.tail_lines == 50
        screen._update_status.assert_called_once()
        screen.refresh_logs.assert_called_once()

    def test_action_decrease_tail_minimum_limit(self):
        """Test that action_decrease_tail respects minimum of 10."""
        service = Mock()
        docker_client = Mock()

        screen = LogViewerScreen(service, docker_client)
        screen.tail_lines = 10
        screen._update_status = Mock()
        screen.refresh_logs = Mock()

        screen.action_decrease_tail()

        assert screen.tail_lines == 10  # Should not decrease
        screen._update_status.assert_not_called()

    def test_action_back_stops_following_and_dismisses(self):
        """Test that action_back stops following and dismisses screen."""
        service = Mock()
        docker_client = Mock()

        screen = LogViewerScreen(service, docker_client)
        screen._stop_following = Mock()
        screen.dismiss = Mock()

        screen.action_back()

        screen._stop_following.assert_called_once()
        screen.dismiss.assert_called_once()
