"""Comprehensive tests for ServiceDetailsScreen control flows.

This module tests all control flow paths in ServiceDetailsScreen as described
in the TUI Control Flow Analysis document Section: Screen-Level Control Flows.
"""

from datetime import datetime
from unittest.mock import Mock, patch

import pytest

from src.config.services import ServiceConfig, ServicePort
from src.services.docker_client import ContainerStatus
from src.tui.screens.service_details import ServiceDetailsScreen


@pytest.fixture
def sample_service():
    """Create a sample service configuration with all fields."""
    return ServiceConfig(
        id="redis",
        name="Redis",
        description="Redis cache server for local development",
        container_name="redis-container",
        ports=[
            ServicePort(container=6379, host=6379, description="Redis port"),
            ServicePort(container=6380, host=6380, description="Redis replica port"),
        ],
        make_commands={
            "start": "start-redis",
            "stop": "stop-redis",
            "logs": "logs-redis",
        },
        compose_file_path="src/redis/docker-compose.yml",
        depends_on=["network"],
    )


@pytest.fixture
def sample_service_no_deps():
    """Create a sample service without dependencies."""
    return ServiceConfig(
        id="postgres",
        name="PostgreSQL",
        description="PostgreSQL database",
        container_name="postgres-container",
        ports=[ServicePort(container=5432, host=5432, description="PostgreSQL port")],
        make_commands={"start": "start-postgres", "stop": "stop-postgres"},
        compose_file_path="src/postgresql/docker-compose.yml",
    )


@pytest.fixture
def sample_status_running():
    """Create a sample running container status."""
    return ContainerStatus(
        name="redis-container",
        status="running",
        health="healthy",
        created_at=datetime(2024, 1, 1, 10, 0, 0),
        started_at=datetime(2024, 1, 1, 10, 0, 5),
        ports={"6379/tcp": "6379"},
        image="redis:latest",
        error_message=None,
    )


@pytest.fixture
def sample_status_stopped():
    """Create a sample stopped container status."""
    return ContainerStatus(
        name="redis-container",
        status="exited",
        health=None,
        created_at=datetime(2024, 1, 1, 10, 0, 0),
        started_at=None,
        ports={},
        image="redis:latest",
        error_message=None,
    )


@pytest.fixture
def sample_status_error():
    """Create a sample error container status."""
    return ContainerStatus(
        name="redis-container",
        status="error",
        health=None,
        created_at=None,
        started_at=None,
        ports={},
        image=None,
        error_message="Container failed to start: port already in use",
    )


class TestServiceDetailsScreenInitialization:
    """Tests for ServiceDetailsScreen initialization (Control Flow Analysis: lines 564-570)."""

    def test_init_stores_service_config(self, sample_service):
        """Test __init__ stores service configuration."""
        screen = ServiceDetailsScreen(sample_service, None)

        assert screen.service == sample_service

    def test_init_stores_status_when_provided(
        self, sample_service, sample_status_running
    ):
        """Test __init__ stores container status when provided."""
        screen = ServiceDetailsScreen(sample_service, sample_status_running)

        assert screen.status == sample_status_running

    def test_init_stores_none_status(self, sample_service):
        """Test __init__ stores None status when not provided."""
        screen = ServiceDetailsScreen(sample_service, None)

        assert screen.status is None


class TestFormatServiceDetails:
    """Tests for _format_service_details method (Control Flow Analysis: lines 572-588)."""

    def test_format_includes_service_id(self, sample_service):
        """Test formatted details include service ID."""
        screen = ServiceDetailsScreen(sample_service, None)
        details = screen._format_service_details()

        assert f"Service ID: {sample_service.id}" in details

    def test_format_includes_service_name(self, sample_service):
        """Test formatted details include service name."""
        screen = ServiceDetailsScreen(sample_service, None)
        details = screen._format_service_details()

        assert f"Name: {sample_service.name}" in details

    def test_format_includes_description(self, sample_service):
        """Test formatted details include description."""
        screen = ServiceDetailsScreen(sample_service, None)
        details = screen._format_service_details()

        assert f"Description: {sample_service.description}" in details

    def test_format_includes_container_name(self, sample_service):
        """Test formatted details include container name."""
        screen = ServiceDetailsScreen(sample_service, None)
        details = screen._format_service_details()

        assert f"Container Name: {sample_service.container_name}" in details

    def test_format_includes_all_ports(self, sample_service):
        """Test formatted details include all port mappings."""
        screen = ServiceDetailsScreen(sample_service, None)
        details = screen._format_service_details()

        assert "6379:6379 - Redis port" in details
        assert "6380:6380 - Redis replica port" in details

    def test_format_includes_all_make_commands(self, sample_service):
        """Test formatted details include all make commands."""
        screen = ServiceDetailsScreen(sample_service, None)
        details = screen._format_service_details()

        assert "start: make start-redis" in details
        assert "stop: make stop-redis" in details
        assert "logs: make logs-redis" in details

    def test_format_includes_compose_file_path(self, sample_service):
        """Test formatted details include compose file path."""
        screen = ServiceDetailsScreen(sample_service, None)
        details = screen._format_service_details()

        assert f"Compose File: {sample_service.compose_file_path}" in details

    def test_format_includes_dependencies_when_present(self, sample_service):
        """Test formatted details include dependencies when present."""
        screen = ServiceDetailsScreen(sample_service, None)
        details = screen._format_service_details()

        assert "Dependencies:" in details
        assert "- network" in details

    def test_format_omits_dependencies_when_none(self, sample_service_no_deps):
        """Test formatted details omit dependencies section when none."""
        screen = ServiceDetailsScreen(sample_service_no_deps, None)
        details = screen._format_service_details()

        assert "Dependencies:" not in details

    def test_format_includes_status_when_provided(
        self, sample_service, sample_status_running
    ):
        """Test formatted details include status information when provided."""
        screen = ServiceDetailsScreen(sample_service, sample_status_running)
        details = screen._format_service_details()

        assert "Current Status:" in details
        assert "Status: running" in details

    def test_format_includes_health_when_available(
        self, sample_service, sample_status_running
    ):
        """Test formatted details include health status when available."""
        screen = ServiceDetailsScreen(sample_service, sample_status_running)
        details = screen._format_service_details()

        assert "Health: healthy" in details

    def test_format_includes_image_when_available(
        self, sample_service, sample_status_running
    ):
        """Test formatted details include image name when available."""
        screen = ServiceDetailsScreen(sample_service, sample_status_running)
        details = screen._format_service_details()

        assert "Image: redis:latest" in details

    def test_format_includes_created_timestamp(
        self, sample_service, sample_status_running
    ):
        """Test formatted details include created timestamp."""
        screen = ServiceDetailsScreen(sample_service, sample_status_running)
        details = screen._format_service_details()

        assert "Created: 2024-01-01 10:00:00" in details

    def test_format_includes_started_timestamp(
        self, sample_service, sample_status_running
    ):
        """Test formatted details include started timestamp."""
        screen = ServiceDetailsScreen(sample_service, sample_status_running)
        details = screen._format_service_details()

        assert "Started: 2024-01-01 10:00:05" in details

    def test_format_includes_port_mappings_from_status(
        self, sample_service, sample_status_running
    ):
        """Test formatted details include port mappings from status."""
        screen = ServiceDetailsScreen(sample_service, sample_status_running)
        details = screen._format_service_details()

        assert "Port Mappings:" in details
        assert "6379 → 6379/tcp" in details

    def test_format_includes_error_message_when_present(
        self, sample_service, sample_status_error
    ):
        """Test formatted details include error message when present."""
        screen = ServiceDetailsScreen(sample_service, sample_status_error)
        details = screen._format_service_details()

        assert "ERROR: Container failed to start: port already in use" in details

    def test_format_without_status_no_status_section(self, sample_service):
        """Test formatted details omit status section when status is None."""
        screen = ServiceDetailsScreen(sample_service, None)
        details = screen._format_service_details()

        assert "Current Status:" not in details

    def test_format_omits_none_fields(self, sample_service, sample_status_stopped):
        """Test formatted details gracefully handle None fields in status."""
        screen = ServiceDetailsScreen(sample_service, sample_status_stopped)
        details = screen._format_service_details()

        # Should not include health or started timestamp for stopped container
        assert "Health:" not in details
        assert "Started:" not in details


class TestUserActions:
    """Tests for user action handlers (Control Flow Analysis: lines 587-588)."""

    def test_action_back_dismisses_screen(self, sample_service):
        """Test action_back dismisses the screen."""
        screen = ServiceDetailsScreen(sample_service, None)

        with patch.object(screen, "dismiss") as mock_dismiss:
            screen.action_back()

            mock_dismiss.assert_called_once()

    def test_on_button_pressed_close_button_calls_back(self, sample_service):
        """Test pressing close button calls action_back."""
        screen = ServiceDetailsScreen(sample_service, None)

        mock_event = Mock()
        mock_event.button.id = "close-button"

        with patch.object(screen, "action_back") as mock_action_back:
            screen.on_button_pressed(mock_event)

            mock_action_back.assert_called_once()

    def test_on_button_pressed_other_button_ignored(self, sample_service):
        """Test pressing other buttons does not call action_back."""
        screen = ServiceDetailsScreen(sample_service, None)

        mock_event = Mock()
        mock_event.button.id = "other-button"

        with patch.object(screen, "action_back") as mock_action_back:
            screen.on_button_pressed(mock_event)

            mock_action_back.assert_not_called()


class TestModalBehavior:
    """Tests for modal screen behavior."""

    def test_screen_is_modal(self, sample_service):
        """Test that ServiceDetailsScreen is a ModalScreen."""
        from textual.screen import ModalScreen

        screen = ServiceDetailsScreen(sample_service, None)

        assert isinstance(screen, ModalScreen)

    def test_screen_has_escape_binding(self, sample_service):
        """Test screen has escape key binding."""
        screen = ServiceDetailsScreen(sample_service, None)

        bindings = {binding.key: binding.action for binding in screen.BINDINGS}

        assert "escape" in bindings
        assert bindings["escape"] == "back"

    def test_screen_has_q_binding(self, sample_service):
        """Test screen has 'q' key binding."""
        screen = ServiceDetailsScreen(sample_service, None)

        bindings = {binding.key: binding.action for binding in screen.BINDINGS}

        assert "q" in bindings
        assert bindings["q"] == "back"


class TestEdgeCases:
    """Tests for edge cases and boundary conditions."""

    def test_service_with_empty_ports(self):
        """Test service with no ports defined."""
        service = ServiceConfig(
            id="test",
            name="Test",
            description="Test service",
            container_name="test-container",
            ports=[],
            make_commands={},
            compose_file_path="test.yml",
        )

        screen = ServiceDetailsScreen(service, None)
        details = screen._format_service_details()

        assert "Ports:" in details  # Section header should still be present

    def test_service_with_empty_make_commands(self):
        """Test service with no make commands defined."""
        service = ServiceConfig(
            id="test",
            name="Test",
            description="Test service",
            container_name="test-container",
            ports=[],
            make_commands={},
            compose_file_path="test.yml",
        )

        screen = ServiceDetailsScreen(service, None)
        details = screen._format_service_details()

        assert (
            "Available Commands:" in details
        )  # Section header should still be present

    def test_status_with_all_none_fields(self, sample_service):
        """Test status with all optional fields as None."""
        status = ContainerStatus(
            name="test",
            status="unknown",
            health=None,
            created_at=None,
            started_at=None,
            ports=None,
            image=None,
            error_message=None,
        )

        screen = ServiceDetailsScreen(sample_service, status)
        details = screen._format_service_details()

        # Should include status section but gracefully handle None values
        assert "Current Status:" in details
        assert "Status: unknown" in details
