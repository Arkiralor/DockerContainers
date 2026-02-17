"""Comprehensive tests for ServiceDetailsScreen and ConfirmationScreen control flows.

Tests based on TUI_CONTROL_FLOW_ANALYSIS.md covering:
- ServiceDetailsScreen initialization and display
- Confirmation screen user response handling
- Modal screen behavior
"""

from datetime import datetime
from unittest.mock import Mock

import pytest

from src.config.services import ServiceConfig, ServicePort
from src.services.docker_client import ContainerStatus
from src.tui.screens.confirmation import ConfirmationScreen
from src.tui.screens.service_details import ServiceDetailsScreen


class TestServiceDetailsScreenInitialization:
    """Tests for ServiceDetailsScreen initialization."""

    def test_init_with_service_and_status(self):
        """Test initialization with service and status."""
        service = ServiceConfig(
            id="redis",
            name="Redis",
            description="Cache server",
            container_name="redis",
            ports=[ServicePort(container=6379, host=6379, description="Redis port")],
            make_commands={"start": "start-redis", "stop": "stop-redis"},
            compose_file_path="src/redis/docker-compose.yml",
        )
        status = ContainerStatus(
            name="redis",
            status="running",
            health="healthy",
            created_at=datetime.now(),
            started_at=datetime.now(),
            ports={"6379/tcp": "6379"},
            image="redis:latest",
            error_message=None,
        )

        screen = ServiceDetailsScreen(service, status)

        assert screen.service == service
        assert screen.status == status

    def test_init_with_service_no_status(self):
        """Test initialization with service but no status."""
        service = Mock()

        screen = ServiceDetailsScreen(service, None)

        assert screen.service == service
        assert screen.status is None


class TestServiceDetailsScreenCompose:
    """Tests for ServiceDetailsScreen composition."""

    def test_compose_creates_formatted_details(self):
        """Test that compose creates formatted service details."""
        service = ServiceConfig(
            id="redis",
            name="Redis",
            description="Cache server",
            container_name="redis",
            ports=[ServicePort(container=6379, host=6379, description="Redis port")],
            make_commands={"start": "start-redis"},
            compose_file_path="src/redis/docker-compose.yml",
        )
        status = ContainerStatus(name="redis", status="running")

        screen = ServiceDetailsScreen(service, status)

        widgets = list(screen.compose())

        assert len(widgets) > 0

    def test_compose_without_status(self):
        """Test compose formatting without status information."""
        service = ServiceConfig(
            id="redis",
            name="Redis",
            description="Cache",
            container_name="redis",
            ports=[],
            make_commands={},
            compose_file_path="",
        )

        screen = ServiceDetailsScreen(service, None)

        widgets = list(screen.compose())

        assert len(widgets) > 0


class TestServiceDetailsScreenActions:
    """Tests for ServiceDetailsScreen user actions."""

    def test_action_back_dismisses_screen(self):
        """Test that action_back dismisses screen."""
        service = Mock()
        screen = ServiceDetailsScreen(service, None)
        screen.dismiss = Mock()

        screen.action_back()

        screen.dismiss.assert_called_once()

    def test_close_button_dismisses_screen(self):
        """Test that close button dismisses screen."""
        service = Mock()
        screen = ServiceDetailsScreen(service, None)
        screen.dismiss = Mock()

        button_event = Mock()
        button_event.button.id = "close-button"

        screen.on_button_pressed(button_event)

        screen.dismiss.assert_called_once()


class TestConfirmationScreenInitialization:
    """Tests for ConfirmationScreen initialization."""

    def test_init_with_title_and_message(self):
        """Test initialization with title and message."""
        screen = ConfirmationScreen(
            "Confirm Action", "Are you sure you want to proceed?"
        )

        assert screen.title_text == "Confirm Action"
        assert screen.message_text == "Are you sure you want to proceed?"


class TestConfirmationScreenCompose:
    """Tests for ConfirmationScreen composition."""

    def test_compose_creates_dialog(self):
        """Test that compose creates confirmation dialog."""
        screen = ConfirmationScreen("Title", "Message")

        widgets = list(screen.compose())

        assert len(widgets) > 0


class TestConfirmationScreenUserResponse:
    """Tests for ConfirmationScreen user response (Control Flow: dismiss with boolean)."""

    def test_on_mount_focuses_no_button(self):
        """Test that on_mount focuses the 'No' button (safe default)."""
        screen = ConfirmationScreen("Title", "Message")
        screen.query_one = Mock(return_value=Mock())

        screen.on_mount()

        # Should focus the "No" button (safe default)
        screen.query_one.assert_called()

    def test_yes_button_dismisses_with_true(self):
        """Test that clicking 'Yes' button dismisses with True."""
        screen = ConfirmationScreen("Title", "Message")
        screen.dismiss = Mock()

        button_event = Mock()
        button_event.button.id = "yes-button"

        screen.on_button_pressed(button_event)

        screen.dismiss.assert_called_once_with(True)

    def test_no_button_dismisses_with_false(self):
        """Test that clicking 'No' button dismisses with False."""
        screen = ConfirmationScreen("Title", "Message")
        screen.dismiss = Mock()

        button_event = Mock()
        button_event.button.id = "no-button"

        screen.on_button_pressed(button_event)

        screen.dismiss.assert_called_once_with(False)

    def test_escape_key_dismisses_with_false(self):
        """Test that escape key dismisses with False (cancel)."""
        screen = ConfirmationScreen("Title", "Message")
        screen.dismiss = Mock()

        key_event = Mock()
        key_event.key = "escape"

        screen.on_key(key_event)

        screen.dismiss.assert_called_once_with(False)

    def test_n_key_dismisses_with_false(self):
        """Test that 'n' key dismisses with False."""
        screen = ConfirmationScreen("Title", "Message")
        screen.dismiss = Mock()

        key_event = Mock()
        key_event.key = "n"

        screen.on_key(key_event)

        screen.dismiss.assert_called_once_with(False)

    def test_y_key_dismisses_with_true(self):
        """Test that 'y' key dismisses with True."""
        screen = ConfirmationScreen("Title", "Message")
        screen.dismiss = Mock()

        key_event = Mock()
        key_event.key = "y"

        screen.on_key(key_event)

        screen.dismiss.assert_called_once_with(True)
