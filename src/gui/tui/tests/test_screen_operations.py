"""Comprehensive tests for OperationsScreen control flows.

Tests based on TUI_CONTROL_FLOW_ANALYSIS.md covering:
- Initialization
- Operation execution flow
- Confirmation for destructive operations
- Make command execution
- Script execution
- Result display
- Error handling
"""

from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.services.command_executor import CommandResult
from src.tui.screens.operations import OperationsScreen


class TestOperationsScreenInitialization:
    """Tests for OperationsScreen initialization."""

    def test_init_with_executor(self):
        """Test initialization with command executor."""
        operations = {"start-all": {"description": "Start all services"}}
        executor = Mock()

        screen = OperationsScreen(operations, executor)

        assert screen.operations == operations
        assert screen.command_executor == executor
        assert screen._selected_operation is None
        assert screen._operation_list == ["start-all"]

    def test_init_without_executor(self):
        """Test initialization without command executor."""
        operations = {}

        screen = OperationsScreen(operations, None)

        assert screen.command_executor is None


class TestOperationsScreenCompose:
    """Tests for screen composition."""

    def test_compose_without_executor_shows_error(self):
        """Test that compose shows error when executor not available."""
        screen = OperationsScreen({}, None)

        widgets = list(screen.compose())

        # Should have error message
        assert any(widget for widget in widgets)

    def test_compose_with_executor_creates_widgets(self):
        """Test that compose creates all widgets with executor."""
        operations = {"test": {}}
        executor = Mock()

        screen = OperationsScreen(operations, executor)

        widgets = list(screen.compose())

        assert len(widgets) > 0


class TestOperationsScreenMount:
    """Tests for on_mount behavior."""

    def test_on_mount_sets_up_table_with_executor(self):
        """Test that on_mount sets up table when executor available."""
        operations = {"test": {}}
        executor = Mock()

        screen = OperationsScreen(operations, executor)
        screen._setup_table = Mock()
        screen._update_operation_details = Mock()

        screen.on_mount()

        assert screen.title == "Operations"
        screen._setup_table.assert_called_once()
        screen._update_operation_details.assert_called_once()

    def test_on_mount_without_executor(self):
        """Test that on_mount skips setup without executor."""
        screen = OperationsScreen({}, None)
        screen._setup_table = Mock()

        screen.on_mount()

        screen._setup_table.assert_not_called()


class TestOperationExecutionFlow:
    """Tests for operation execution (Control Flow: action_execute_operation)."""

    @pytest.mark.asyncio
    async def test_execute_operation_no_executor(self):
        """Test execute operation without executor."""
        screen = OperationsScreen({}, None)
        screen.notify = Mock()

        await screen.action_execute_operation()

        screen.notify.assert_called()
        assert "not available" in screen.notify.call_args[0][0].lower()

    @pytest.mark.asyncio
    async def test_execute_operation_no_selection(self):
        """Test execute operation with no selection."""
        executor = Mock()
        screen = OperationsScreen({}, executor)
        screen.notify = Mock()

        # Mock the table to return cursor_row = None (no selection)
        mock_table = Mock()
        mock_table.cursor_row = None
        screen.query_one = Mock(return_value=mock_table)

        await screen.action_execute_operation()

        screen.notify.assert_called()
        assert "select" in screen.notify.call_args[0][0].lower()

    @pytest.mark.asyncio
    async def test_execute_make_command_success(self):
        """Test executing make command successfully."""
        operations = {"start-all": {"command": "start", "description": "Start all"}}
        executor = Mock()
        executor.execute_make_command.return_value = CommandResult(
            success=True,
            return_code=0,
            stdout="Success",
            stderr="",
            command="make start",
        )

        screen = OperationsScreen(operations, executor)
        screen.notify = Mock()
        screen._display_result = Mock()

        # Mock the table to return cursor_row = 0
        mock_table = Mock()
        mock_table.cursor_row = 0
        screen.query_one = Mock(return_value=mock_table)

        with patch(
            "asyncio.to_thread", return_value=executor.execute_make_command("start")
        ):
            await screen.action_execute_operation()

            screen.notify.assert_called()

    @pytest.mark.asyncio
    async def test_execute_script_success(self):
        """Test executing script successfully."""
        operations = {
            "backup": {"script": "scripts/backup.sh", "description": "Backup"}
        }
        executor = Mock()
        executor.execute_script.return_value = CommandResult(
            success=True,
            return_code=0,
            stdout="Backup complete",
            stderr="",
            command="scripts/backup.sh",
        )

        screen = OperationsScreen(operations, executor)
        screen.notify = Mock()
        screen._display_result = Mock()

        # Mock the table to return cursor_row = 0
        mock_table = Mock()
        mock_table.cursor_row = 0
        screen.query_one = Mock(return_value=mock_table)

        with patch(
            "asyncio.to_thread",
            return_value=executor.execute_script("scripts/backup.sh"),
        ):
            await screen.action_execute_operation()

            screen.notify.assert_called()

    @pytest.mark.asyncio
    async def test_execute_operation_invalid_type(self):
        """Test execute operation with invalid operation data."""
        operations = {"invalid": {"description": "Invalid"}}  # No command or script
        executor = Mock()

        screen = OperationsScreen(operations, executor)
        screen.notify = Mock()

        # Mock the table to return cursor_row = 0
        mock_table = Mock()
        mock_table.cursor_row = 0
        screen.query_one = Mock(return_value=mock_table)

        await screen.action_execute_operation()

        screen.notify.assert_called()
        assert "invalid" in screen.notify.call_args[0][0].lower()


class TestDestructiveOperationConfirmation:
    """Tests for destructive operation confirmation (Control Flow: _show_confirmation)."""

    @pytest.mark.asyncio
    async def test_destructive_operation_clean_requires_confirmation(self):
        """Test that 'clean' operation requires confirmation."""
        operations = {"clean": {"command": "clean", "description": "Clean all data"}}
        executor = Mock()

        screen = OperationsScreen(operations, executor)
        screen._show_confirmation = AsyncMock(return_value=False)  # User says no
        screen.notify = Mock()

        # Mock the table to return cursor_row = 0
        mock_table = Mock()
        mock_table.cursor_row = 0
        screen.query_one = Mock(return_value=mock_table)

        await screen.action_execute_operation()

        # Should have asked for confirmation
        screen._show_confirmation.assert_called_once()

    @pytest.mark.asyncio
    async def test_destructive_operation_restore_requires_confirmation(self):
        """Test that 'restore' operation requires confirmation."""
        operations = {
            "restore-db": {"command": "restore", "description": "Restore database"}
        }
        executor = Mock()

        screen = OperationsScreen(operations, executor)
        screen._show_confirmation = AsyncMock(return_value=False)  # User says no
        screen.notify = Mock()

        # Mock the table to return cursor_row = 0
        mock_table = Mock()
        mock_table.cursor_row = 0
        screen.query_one = Mock(return_value=mock_table)

        await screen.action_execute_operation()

        # Should have asked for confirmation
        screen._show_confirmation.assert_called_once()

    @pytest.mark.asyncio
    async def test_destructive_operation_cancellation(self):
        """Test that cancelling confirmation prevents execution."""
        operations = {"clean": {"command": "clean", "description": "Clean"}}
        executor = Mock()

        screen = OperationsScreen(operations, executor)
        screen._show_confirmation = AsyncMock(return_value=False)  # User cancels

        # Mock the table to return cursor_row = 0
        mock_table = Mock()
        mock_table.cursor_row = 0
        screen.query_one = Mock(return_value=mock_table)

        await screen.action_execute_operation()

        # Should not execute command
        executor.execute_make_command.assert_not_called()

    @pytest.mark.asyncio
    async def test_non_destructive_operation_no_confirmation(self):
        """Test that non-destructive operations don't require confirmation."""
        operations = {"status": {"command": "status", "description": "Status"}}
        executor = Mock()
        executor.execute_make_command.return_value = CommandResult(
            success=True, return_code=0, stdout="", stderr="", command=""
        )

        screen = OperationsScreen(operations, executor)
        screen._show_confirmation = AsyncMock()
        screen.notify = Mock()
        screen._display_result = Mock()

        # Mock the table to return cursor_row = 0
        mock_table = Mock()
        mock_table.cursor_row = 0
        screen.query_one = Mock(return_value=mock_table)

        with patch(
            "asyncio.to_thread", return_value=executor.execute_make_command("status")
        ):
            await screen.action_execute_operation()

            # Should not ask for confirmation
            screen._show_confirmation.assert_not_called()


class TestResultDisplay:
    """Tests for result display (Control Flow: _display_result)."""

    def test_display_result_success(self):
        """Test displaying successful result."""
        result = CommandResult(
            success=True,
            return_code=0,
            stdout="Success output",
            stderr="",
            command="make start",
        )

        screen = OperationsScreen({}, Mock())
        mock_widget = Mock()
        screen.query_one = Mock(return_value=mock_widget)
        screen.notify = Mock()

        screen._display_result(result)

        mock_widget.update.assert_called_once()
        output_text = mock_widget.update.call_args[0][0]
        assert "Success output" in output_text
        screen.notify.assert_called_once()

    def test_display_result_failure(self):
        """Test displaying failed result."""
        result = CommandResult(
            success=False,
            return_code=1,
            stdout="",
            stderr="Error message",
            command="make fail",
        )

        screen = OperationsScreen({}, Mock())
        mock_widget = Mock()
        screen.query_one = Mock(return_value=mock_widget)
        screen.notify = Mock()

        screen._display_result(result)

        mock_widget.update.assert_called_once()
        output_text = mock_widget.update.call_args[0][0]
        assert "Error message" in output_text
        screen.notify.assert_called_once()
        assert "severity" in screen.notify.call_args[1]


class TestBackNavigation:
    """Tests for back navigation."""

    def test_action_back_dismisses_screen(self):
        """Test that action_back dismisses screen."""
        screen = OperationsScreen({}, Mock())
        screen.dismiss = Mock()

        screen.action_back()

        screen.dismiss.assert_called_once()
