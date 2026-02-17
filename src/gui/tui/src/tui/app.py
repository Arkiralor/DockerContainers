"""Main Textual application for Docker Container TUI.

This is the core TUI application that provides a keyboard-driven interface
for managing repository-defined Docker containers using existing Makefile
commands and scripts.
"""

import asyncio
from datetime import datetime
from typing import TYPE_CHECKING

from textual import events
from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.containers import Container, Horizontal
from textual.reactive import reactive
from textual.screen import ModalScreen
from textual.widgets import Button, Footer, Header, Static

if TYPE_CHECKING:
    pass

from ..config.services import SYSTEM_OPERATIONS, get_all_services
from ..services.command_executor import CommandExecutor, CommandResult
from ..services.docker_client import ContainerStatus, DockerClient
from .screens.operations import OperationsScreen
from .screens.service_list import ServiceListScreen


class DockerTUIApp(App):
    """Main Docker TUI Application."""

    CSS_PATH = None  # We'll define CSS inline for simplicity

    TITLE = "Docker Container TUI"
    SUB_TITLE = "Repository-Specific Container Management"

    BINDINGS = [
        Binding("q", "quit", "Quit", priority=True),
        Binding("r", "refresh", "Refresh", priority=True),
        Binding("s", "services", "Services", priority=True),
        Binding("o", "operations", "Operations", priority=True),
        Binding("?", "help", "Help", priority=True),
        Binding("ctrl+c", "quit", "Quit", show=False, priority=True),
    ]

    # Reactive attributes
    refresh_interval: reactive[int] = reactive(5)  # seconds
    last_refresh: reactive[datetime | None] = reactive(None)

    def __init__(self):
        """Initialize the TUI application."""
        super().__init__()

        # Initialize service clients
        try:
            self.command_executor = CommandExecutor()
        except RuntimeError as e:
            self.command_executor = None
            self._executor_error = str(e)

        self.docker_client = DockerClient()

        # Application state
        self.services = get_all_services()
        self.container_statuses: dict[str, ContainerStatus] = {}
        self._refresh_task: asyncio.Task | None = None

    def compose(self) -> ComposeResult:
        """Create the application layout."""
        yield Header(show_clock=True)

        if not self.command_executor:
            yield Container(
                Static(
                    f"ERROR: Error initializing command executor:\n{getattr(self, '_executor_error', 'Unknown error')}",
                    id="error-message",
                ),
                classes="error-container",
            )
        elif not self.docker_client.is_connected():
            yield Container(
                Static(
                    "WARNING: Docker is not running or not accessible.\n"
                    "Some features may not work correctly.\n"
                    "Please start Docker Desktop or ensure Docker daemon is running.",
                    id="warning-message",
                ),
                classes="warning-container",
            )

        # Main content area
        yield Container(
            Static("Welcome to Docker Container TUI", id="welcome"),
            Static(
                "Press 's' for Services, 'o' for Operations, '?' for Help",
                id="instructions",
            ),
            id="main-content",
        )

        # Status bar
        yield Container(
            Horizontal(
                Static("Ready", id="status-text"),
                Static(f"Refresh: {self.refresh_interval}s", id="refresh-status"),
                Static("", id="connection-status"),
                id="status-bar",
            ),
            classes="status-container",
        )

        yield Footer()

    def on_mount(self) -> None:
        """Handle application mount."""
        self.title = self.TITLE
        self.sub_title = self.SUB_TITLE

        # Start auto-refresh
        self._start_auto_refresh()

        # Initial status check
        self.refresh_status()

    def on_unmount(self) -> None:
        """Handle application unmount."""
        self._stop_auto_refresh()
        if self.docker_client:
            self.docker_client.close()

    def _start_auto_refresh(self) -> None:
        """Start auto-refresh task."""
        if self._refresh_task:
            self._refresh_task.cancel()

        try:
            self._refresh_task = asyncio.create_task(self._auto_refresh_loop())
        except Exception as e:
            self.notify(f"Failed to start auto-refresh: {e}", severity="error")

    def _stop_auto_refresh(self) -> None:
        """Stop auto-refresh task."""
        if self._refresh_task:
            self._refresh_task.cancel()
            self._refresh_task = None

    async def _auto_refresh_loop(self) -> None:
        """Auto-refresh loop for container statuses."""
        while True:
            try:
                await asyncio.sleep(self.refresh_interval)
                self.refresh_status()
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.notify(f"Auto-refresh error: {e}", severity="error")

    def refresh_status(self) -> None:
        """Refresh container statuses."""
        if not self.docker_client.is_connected():
            # Try to reconnect
            if not self.docker_client.reconnect():
                self._update_connection_status("Disconnected")
                return

        # Update connection status
        self._update_connection_status("Connected")

        # Get container statuses
        container_names = [service.container_name for service in self.services]
        self.container_statuses = self.docker_client.get_multiple_container_status(
            container_names
        )

        # Update last refresh time
        self.last_refresh = datetime.now()

        # Update status text
        try:
            status_text = self.query_one("#status-text", Static)
            running_count = len(
                [s for s in self.container_statuses.values() if s.status == "running"]
            )
            total_count = len(self.container_statuses)
            status_text.update(f"Services: {running_count}/{total_count} running")
        except Exception:
            pass

    def _update_connection_status(self, status: str) -> None:
        """Update connection status display."""
        try:
            connection_status = self.query_one("#connection-status", Static)
            connection_status.update(status)
        except Exception:
            pass

    def action_refresh(self) -> None:
        """Refresh application state."""
        self.refresh_status()
        self.notify("Status refreshed")

    def action_services(self) -> None:
        """Show services screen."""
        self.push_screen(
            ServiceListScreen(self.services, self.container_statuses, self)
        )

    def action_operations(self) -> None:
        """Show operations screen."""
        self.push_screen(OperationsScreen(SYSTEM_OPERATIONS, self.command_executor))

    def action_help(self) -> None:
        """Show help screen."""
        self.push_screen(HelpScreen())

    def action_quit(self) -> None:
        """Quit application."""
        self.exit()

    async def execute_make_command(
        self, command: str, description: str = ""
    ) -> CommandResult:
        """Execute a make command with loading feedback.

        Args:
            command: Make target to execute
            description: Human-readable description of the command

        Returns:
            CommandResult with execution details
        """
        if not self.command_executor:
            return CommandResult(
                success=False,
                return_code=-1,
                stdout="",
                stderr="Command executor not available",
                command=command,
            )

        # Show loading notification
        if description:
            self.notify(f"Executing: {description}")
        else:
            self.notify(f"Executing: make {command}")

        # Execute command in thread to avoid blocking UI
        result = await asyncio.to_thread(
            self.command_executor.execute_make_command, command, timeout=60
        )

        # Show result notification
        if result.success:
            self.notify(f"{description or command} completed successfully")
        else:
            self.notify(f"{description or command} failed", severity="error")

        # Refresh status after command execution
        self.refresh_status()

        return result


class HelpScreen(ModalScreen):
    """Help screen showing keyboard shortcuts and usage."""

    def compose(self) -> ComposeResult:
        """Create help screen layout."""
        help_text = """
Docker Container TUI - Help

KEYBOARD SHORTCUTS:
  s              Show Services screen
  o              Show Operations screen
  r              Refresh status
  ?              Show this help
  q, Ctrl+C      Quit application

SERVICES SCREEN:
  Enter          View service details
  Space          Start/Stop service
  l              View logs
  ↑/↓           Navigate services

OPERATIONS SCREEN:
  Enter          Execute operation
  ↑/↓           Navigate operations

ABOUT:
This TUI manages Docker containers defined in this repository using
existing Makefile commands and scripts. It provides a keyboard-driven
interface for starting, stopping, and monitoring services.

Press Escape to close this help.
        """

        yield Container(
            Static(help_text.strip(), id="help-text"),
            Button("Close", variant="primary", id="close-button"),
            id="help-dialog",
        )

    def on_button_pressed(self, event: Button.Pressed) -> None:
        """Handle button press."""
        if event.button.id == "close-button":
            self.dismiss()

    def on_key(self, event: events.Key) -> None:
        """Handle key press."""
        if event.key == "escape":
            self.dismiss()


# CSS for the application
DockerTUIApp.CSS = """
.error-container {
    background: red 10%;
    color: red;
    padding: 1;
    margin: 1;
    border: solid red;
}

.warning-container {
    background: yellow 10%;
    color: orange;
    padding: 1;
    margin: 1;
    border: solid orange;
}

.status-container {
    dock: bottom;
    height: 3;
    background: $panel;
}

#status-bar {
    height: 1;
    background: $panel;
    padding: 1 2;
}

#main-content {
    padding: 2;
    text-align: center;
}

#welcome {
    text-style: bold;
    color: $accent;
    padding: 1;
}

#instructions {
    color: $text-muted;
    padding: 1;
}

#help-dialog {
    width: 80%;
    height: 80%;
    background: $surface;
    border: solid $primary;
    padding: 2;
}

#help-text {
    height: 1fr;
    scrollbar-gutter: stable;
}

#close-button {
    dock: bottom;
    width: 20;
    margin: 1;
}
"""
