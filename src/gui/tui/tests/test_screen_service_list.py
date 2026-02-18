"""Comprehensive tests for ServiceListScreen control flows.

Tests based on TUI_CONTROL_FLOW_ANALYSIS.md covering:
- Initialization and mount
- User interaction flow
- Service action execution (start/stop)
- View logs navigation
- Service details navigation
- Refresh functionality
- Row highlighting and selection
"""

from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.config.services import ServiceConfig
from src.services.command_executor import CommandResult
from src.services.docker_client import ContainerStatus
from src.tui.screens.service_list import ServiceListScreen


class TestServiceListScreenInitialization:
    """Tests for ServiceListScreen initialization."""

    def test_init_with_services(self):
        """Test initialization with service list."""
        services = [
            ServiceConfig(
                id="redis",
                name="Redis",
                description="Cache",
                container_name="redis",
                ports=[],
                make_commands={"start": "start-redis"},
                compose_file_path="",
            )
        ]
        statuses = {"redis": ContainerStatus(name="redis", status="running")}
        app_ref = Mock()

        screen = ServiceListScreen(services, statuses, app_ref)

        assert screen.services == services
        assert screen.container_statuses == statuses
        assert screen._selected_service == services[0]

    def test_init_with_empty_services(self):
        """Test initialization with empty service list."""
        screen = ServiceListScreen([], {}, Mock())

        assert screen._selected_service is None


class TestServiceListScreenCompose:
    """Tests for screen layout composition."""

    def test_compose_creates_widgets(self):
        """Test that compose creates all required widgets."""
        services = [
            ServiceConfig(
                id="redis",
                name="Redis",
                description="Cache",
                container_name="redis",
                ports=[],
                make_commands={},
                compose_file_path="",
            )
        ]
        screen = ServiceListScreen(services, {}, Mock())

        widgets = list(screen.compose())

        # Should have Header, containers, and Footer
        assert len(widgets) > 0


class TestServiceListScreenMount:
    """Tests for on_mount behavior."""

    @patch.object(ServiceListScreen, "_setup_table")
    @patch.object(ServiceListScreen, "_update_status_info")
    def test_on_mount_sets_up_table(self, mock_update_status, mock_setup_table):
        """Test that on_mount calls setup methods."""
        screen = ServiceListScreen([], {}, Mock())

        screen.on_mount()

        mock_setup_table.assert_called_once()
        mock_update_status.assert_called_once()
        assert screen.title == "Services"


class TestServiceActionExecution:
    """Tests for service start/stop action (Control Flow: action_service_action)."""

    @pytest.mark.asyncio
    async def test_action_service_action_start_stopped_service(self):
        """Test starting a stopped service."""
        service = ServiceConfig(
            id="redis",
            name="Redis",
            description="Cache",
            container_name="redis",
            ports=[],
            make_commands={"start": "start-redis"},
            compose_file_path="",
        )
        statuses = {"redis": ContainerStatus(name="redis", status="stopped")}
        app_ref = Mock()
        app_ref.execute_make_command = AsyncMock(
            return_value=CommandResult(
                success=True, return_code=0, stdout="", stderr="", command=""
            )
        )

        screen = ServiceListScreen([service], statuses, app_ref)
        screen._delayed_refresh = AsyncMock()

        # Mock the table to return cursor_row = 0
        mock_table = Mock()
        mock_table.cursor_row = 0
        screen.query_one = Mock(return_value=mock_table)

        await screen.action_service_action()

        app_ref.execute_make_command.assert_called_once_with(
            "start-redis", "Starting Redis"
        )

    @pytest.mark.asyncio
    async def test_action_service_action_stop_running_service(self):
        """Test stopping a running service."""
        service = ServiceConfig(
            id="redis",
            name="Redis",
            description="Cache",
            container_name="redis",
            ports=[],
            make_commands={"stop": "stop-redis"},
            compose_file_path="",
        )
        statuses = {"redis": ContainerStatus(name="redis", status="running")}
        app_ref = Mock()
        app_ref.execute_make_command = AsyncMock(
            return_value=CommandResult(
                success=True, return_code=0, stdout="", stderr="", command=""
            )
        )

        screen = ServiceListScreen([service], statuses, app_ref)
        screen._delayed_refresh = AsyncMock()

        # Mock the table to return cursor_row = 0
        mock_table = Mock()
        mock_table.cursor_row = 0
        screen.query_one = Mock(return_value=mock_table)

        await screen.action_service_action()

        app_ref.execute_make_command.assert_called_once_with(
            "stop-redis", "Stopping Redis"
        )

    @pytest.mark.asyncio
    async def test_action_service_action_no_service_selected(self):
        """Test that action with no selection shows notification."""
        app_ref = Mock()
        screen = ServiceListScreen([], {}, app_ref)
        screen.notify = Mock()

        # Mock the table to return cursor_row = None (no selection)
        mock_table = Mock()
        mock_table.cursor_row = None
        screen.query_one = Mock(return_value=mock_table)

        await screen.action_service_action()

        screen.notify.assert_called()

    @pytest.mark.asyncio
    async def test_action_service_action_command_not_available(self):
        """Test action when required command not in make_commands."""
        service = ServiceConfig(
            id="redis",
            name="Redis",
            description="Cache",
            container_name="redis",
            ports=[],
            make_commands={},  # No commands defined
            compose_file_path="",
        )
        statuses = {"redis": ContainerStatus(name="redis", status="running")}
        app_ref = Mock()
        screen = ServiceListScreen([service], statuses, app_ref)
        screen.notify = Mock()

        # Mock the table to return cursor_row = 0
        mock_table = Mock()
        mock_table.cursor_row = 0
        screen.query_one = Mock(return_value=mock_table)

        await screen.action_service_action()

        screen.notify.assert_called()
        assert "no command available" in screen.notify.call_args[0][0].lower()


class TestViewLogsNavigation:
    """Tests for view logs navigation (Control Flow: action_view_logs)."""

    def test_action_view_logs_pushes_screen(self):
        """Test that view logs pushes LogViewerScreen."""
        service = ServiceConfig(
            id="redis",
            name="Redis",
            description="Cache",
            container_name="redis",
            ports=[],
            make_commands={},
            compose_file_path="",
        )
        app_ref = Mock()
        app_ref.docker_client = Mock()

        screen = ServiceListScreen([service], {}, app_ref)

        # Mock the table to return cursor_row = 0
        mock_table = Mock()
        mock_table.cursor_row = 0
        screen.query_one = Mock(return_value=mock_table)

        # Mock the app.push_screen method using patch.object
        with patch.object(type(screen), "app", Mock(push_screen=Mock())) as mock_app:
            screen.action_view_logs()
            screen.app.push_screen.assert_called_once()

    def test_action_view_logs_no_service_selected(self):
        """Test view logs with no selection shows notification."""
        screen = ServiceListScreen([], {}, Mock())
        screen.notify = Mock()
        screen.push_screen = Mock()

        # Mock the table to return cursor_row = None (no selection)
        mock_table = Mock()
        mock_table.cursor_row = None
        screen.query_one = Mock(return_value=mock_table)

        screen.action_view_logs()

        screen.notify.assert_called()
        screen.push_screen.assert_not_called()


class TestServiceDetailsNavigation:
    """Tests for service details navigation (Control Flow: action_service_details)."""

    def test_action_service_details_pushes_screen(self):
        """Test that service details pushes ServiceDetailsScreen."""
        service = ServiceConfig(
            id="redis",
            name="Redis",
            description="Cache",
            container_name="redis",
            ports=[],
            make_commands={},
            compose_file_path="",
        )
        statuses = {"redis": ContainerStatus(name="redis", status="running")}

        screen = ServiceListScreen([service], statuses, Mock())

        # Mock the table to return cursor_row = 0
        mock_table = Mock()
        mock_table.cursor_row = 0
        screen.query_one = Mock(return_value=mock_table)

        # Mock the app.push_screen method using patch.object
        with patch.object(type(screen), "app", Mock(push_screen=Mock())) as mock_app:
            screen.action_service_details()
            screen.app.push_screen.assert_called_once()

    def test_action_service_details_no_service_selected(self):
        """Test service details with no selection shows notification."""
        screen = ServiceListScreen([], {}, Mock())
        screen.notify = Mock()
        screen.push_screen = Mock()

        # Mock the table to return cursor_row = None (no selection)
        mock_table = Mock()
        mock_table.cursor_row = None
        screen.query_one = Mock(return_value=mock_table)

        screen.action_service_details()

        screen.notify.assert_called()
        screen.push_screen.assert_not_called()


class TestRefreshFunctionality:
    """Tests for refresh functionality (Control Flow: action_refresh)."""

    def test_action_refresh_updates_statuses(self):
        """Test that refresh updates container statuses."""
        services = [
            ServiceConfig(
                id="redis",
                name="Redis",
                description="Cache",
                container_name="redis",
                ports=[],
                make_commands={},
                compose_file_path="",
            )
        ]
        app_ref = Mock()
        app_ref.container_statuses = {
            "redis": ContainerStatus(name="redis", status="running")
        }
        app_ref.refresh_status = Mock()

        screen = ServiceListScreen(services, {}, app_ref)
        screen._setup_table = Mock()
        screen._update_status_info = Mock()
        screen.notify = Mock()
        screen.query_one = Mock(return_value=Mock(clear=Mock()))

        screen.action_refresh()

        app_ref.refresh_status.assert_called_once()
        screen.notify.assert_called_with("Status refreshed")


class TestRowHighlighting:
    """Tests for row navigation and highlighting."""

    def test_on_data_table_row_highlighted_updates_selection(self):
        """Test that highlighting a row updates selected service."""
        services = [
            ServiceConfig(
                id="redis",
                name="Redis",
                description="Cache",
                container_name="redis",
                ports=[],
                make_commands={},
                compose_file_path="",
            ),
            ServiceConfig(
                id="postgres",
                name="PostgreSQL",
                description="Database",
                container_name="postgres",
                ports=[],
                make_commands={},
                compose_file_path="",
            ),
        ]
        screen = ServiceListScreen(services, {}, Mock())
        screen._update_status_info = Mock()

        event = Mock()
        event.cursor_row = 1

        screen.on_data_table_row_highlighted(event)

        assert screen._selected_service == services[1]
        screen._update_status_info.assert_called_once()


class TestBackNavigation:
    """Tests for back navigation (Control Flow: action_back)."""

    def test_action_back_dismisses_screen(self):
        """Test that action_back dismisses the screen."""
        screen = ServiceListScreen([], {}, Mock())
        screen.dismiss = Mock()

        screen.action_back()

        screen.dismiss.assert_called_once()
