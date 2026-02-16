"""Log viewer screen for displaying container logs in real-time."""

import asyncio
from datetime import datetime
from typing import TYPE_CHECKING

from textual.app import ComposeResult
from textual.binding import Binding
from textual.containers import Container, Horizontal
from textual.screen import Screen
from textual.widgets import Button, Footer, Header, Static

from ...config.services import ServiceConfig

if TYPE_CHECKING:
    from ...services.docker_client import DockerClient


class LogViewerScreen(Screen):
    """Screen for viewing container logs with real-time updates."""

    BINDINGS = [
        Binding("escape", "back", "Back", priority=True),
        Binding("q", "back", "Back", priority=True),
        Binding("r", "refresh", "Refresh", priority=True),
        Binding("f", "toggle_follow", "Toggle Follow", priority=True),
        Binding("c", "clear", "Clear", priority=True),
        Binding("s", "save_logs", "Save", priority=True),
        Binding("plus", "increase_tail", "More Lines", priority=False),
        Binding("minus", "decrease_tail", "Fewer Lines", priority=False),
    ]

    def __init__(self, service: ServiceConfig, docker_client: DockerClient):
        """Initialize log viewer screen.

        Args:
            service: Service configuration
            docker_client: Docker client for log retrieval
        """
        super().__init__()
        self.service = service
        self.docker_client = docker_client
        self.tail_lines = 100
        self.following = False
        self.logs_content: list[str] = []
        self._follow_task: asyncio.Task | None = None

    def compose(self) -> ComposeResult:
        """Create log viewer layout."""
        yield Header(show_clock=True)

        # Log display area
        yield Container(
            Static(
                f"Logs: {self.service.name} ({self.service.container_name})",
                classes="log-title",
            ),
            Static("Loading logs...", id="log-content", classes="log-display"),
            id="log-container",
        )

        # Control buttons
        yield Container(
            Horizontal(
                Button("Refresh", variant="primary", id="refresh-button"),
                Button("Follow", variant="default", id="follow-button"),
                Button("Clear", variant="default", id="clear-button"),
                Button("Save", variant="default", id="save-button"),
                Button("Back", variant="default", id="back-button"),
                id="control-buttons",
            ),
            classes="button-container",
        )

        # Status bar
        yield Container(Static("", id="log-status"), classes="status-container")

        yield Footer()

    def on_mount(self) -> None:
        """Handle screen mount."""
        self.title = f"Logs - {self.service.name}"
        self._update_status()
        self.refresh_logs()

    def on_unmount(self) -> None:
        """Handle screen unmount."""
        self._stop_following()

    def _update_status(self) -> None:
        """Update status display."""
        status_text = (
            f"Lines: {self.tail_lines} | Following: {'ON' if self.following else 'OFF'}"
        )

        if self.logs_content:
            status_text += f" | Total: {len(self.logs_content)} lines"

        status_widget = self.query_one("#log-status", Static)
        status_widget.update(status_text)

    def refresh_logs(self) -> None:
        """Refresh logs from container."""
        if not self.docker_client.is_connected():
            self._display_error("Docker not connected")
            return

        # Get logs from Docker API
        logs = self.docker_client.get_container_logs(
            self.service.container_name, tail=self.tail_lines
        )

        if not logs:
            logs = ["No logs available"]
        elif isinstance(logs, list) and logs[0].startswith("ERROR:"):
            self._display_error(logs[0])
            return

        self.logs_content = logs
        self._display_logs()
        self._update_status()

    def _display_logs(self) -> None:
        """Display logs in the content area."""
        log_widget = self.query_one("#log-content", Static)

        if not self.logs_content:
            log_widget.update("No logs available")
            return

        # Format logs with line numbers if many lines
        if len(self.logs_content) > 20:
            formatted_logs = []
            for i, line in enumerate(self.logs_content, 1):
                formatted_logs.append(f"{i:4d}: {line}")
            log_text = "\n".join(formatted_logs)
        else:
            log_text = "\n".join(self.logs_content)

        log_widget.update(log_text)

        # Scroll to bottom
        log_widget.scroll_end()

    def _display_error(self, error_message: str) -> None:
        """Display error message."""
        log_widget = self.query_one("#log-content", Static)
        log_widget.update(f"❌ {error_message}")
        self.notify(error_message, severity="error")

    def action_back(self) -> None:
        """Go back to previous screen."""
        self._stop_following()
        self.dismiss()

    def action_refresh(self) -> None:
        """Refresh logs."""
        self.refresh_logs()
        self.notify("Logs refreshed")

    def action_toggle_follow(self) -> None:
        """Toggle real-time log following."""
        if self.following:
            self._stop_following()
        else:
            self._start_following()

    def action_clear(self) -> None:
        """Clear displayed logs."""
        self.logs_content = []
        log_widget = self.query_one("#log-content", Static)
        log_widget.update("Logs cleared")
        self._update_status()

    def action_save_logs(self) -> None:
        """Save logs to file."""
        if not self.logs_content:
            self.notify("No logs to save", severity="warning")
            return

        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{self.service.container_name}_{timestamp}.log"

        try:
            with open(filename, "w") as f:
                f.write(
                    f"# Logs for {self.service.name} ({self.service.container_name})\n"
                )
                f.write(
                    f"# Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
                )
                f.write("\n".join(self.logs_content))

            self.notify(f"Logs saved to {filename}")

        except Exception as e:
            self.notify(f"Failed to save logs: {e}", severity="error")

    def action_increase_tail(self) -> None:
        """Increase number of log lines to display."""
        if self.tail_lines < 1000:
            self.tail_lines = min(1000, self.tail_lines + 50)
            self._update_status()
            self.refresh_logs()

    def action_decrease_tail(self) -> None:
        """Decrease number of log lines to display."""
        if self.tail_lines > 10:
            self.tail_lines = max(10, self.tail_lines - 50)
            self._update_status()
            self.refresh_logs()

    def _start_following(self) -> None:
        """Start following logs in real-time."""
        if self._follow_task:
            return

        self.following = True
        self._update_follow_button()
        self._update_status()

        # Start background task for log following
        self._follow_task = asyncio.create_task(self._follow_logs())

    def _stop_following(self) -> None:
        """Stop following logs."""
        if self._follow_task:
            self._follow_task.cancel()
            self._follow_task = None

        self.following = False
        self._update_follow_button()
        self._update_status()

    def _update_follow_button(self) -> None:
        """Update follow button appearance."""
        follow_button = self.query_one("#follow-button", Button)
        if self.following:
            follow_button.label = "Stop Follow"
            follow_button.variant = "success"
        else:
            follow_button.label = "Follow"
            follow_button.variant = "default"

    async def _follow_logs(self) -> None:
        """Background task for following logs."""
        while self.following:
            try:
                await asyncio.sleep(2)  # Update every 2 seconds

                if not self.docker_client.is_connected():
                    continue

                # Get recent logs
                new_logs = self.docker_client.get_container_logs(
                    self.service.container_name,
                    tail=20,  # Get last 20 lines
                    since=datetime.now().replace(second=datetime.now().second - 10)
                    if self.logs_content
                    else None,
                )

                if new_logs and not new_logs[0].startswith("ERROR:"):
                    # Append new logs if they're different
                    if new_logs != self.logs_content[-len(new_logs) :]:
                        self.logs_content.extend(new_logs)

                        # Keep only recent lines to avoid memory issues
                        if len(self.logs_content) > self.tail_lines * 2:
                            self.logs_content = self.logs_content[-self.tail_lines :]

                        self._display_logs()
                        self._update_status()

            except asyncio.CancelledError:
                break
            except Exception as e:
                self.notify(f"Error following logs: {e}", severity="error")
                break

    # Button event handlers
    def on_button_pressed(self, event: Button.Pressed) -> None:
        """Handle button press."""
        if event.button.id == "refresh-button":
            self.action_refresh()
        elif event.button.id == "follow-button":
            self.action_toggle_follow()
        elif event.button.id == "clear-button":
            self.action_clear()
        elif event.button.id == "save-button":
            self.action_save_logs()
        elif event.button.id == "back-button":
            self.action_back()


# CSS for log viewer screen
LogViewerScreen.CSS = """
.log-title {
    text-style: bold;
    color: $accent;
    padding: 1 2;
    text-align: center;
}

#log-container {
    height: 1fr;
    padding: 1 2;
}

.log-display {
    height: 1fr;
    overflow-y: auto;
    background: $surface;
    border: solid $primary;
    padding: 1;
    scrollbar-gutter: stable;
}

.button-container {
    dock: bottom;
    height: 3;
    padding: 1 2;
}

#control-buttons {
    height: 1;
    align: center middle;
}

.status-container {
    dock: bottom;
    height: 2;
    background: $panel;
    padding: 1 2;
}

#log-status {
    text-align: center;
    color: $text-muted;
}
"""
