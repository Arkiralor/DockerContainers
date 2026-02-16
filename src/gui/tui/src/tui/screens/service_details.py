"""Service details screen for displaying comprehensive service information."""

from textual.app import ComposeResult
from textual.containers import Container
from textual.screen import ModalScreen
from textual.widgets import Button, Static
from textual.binding import Binding
from typing import Optional

from ...config.services import ServiceConfig
from ...services.docker_client import ContainerStatus


class ServiceDetailsScreen(ModalScreen):
    """Modal screen showing detailed service information."""

    BINDINGS = [
        Binding("escape", "back", "Back", priority=True),
        Binding("q", "back", "Back", priority=True),
    ]

    def __init__(self, service: ServiceConfig, status: Optional[ContainerStatus]):
        """Initialize service details screen.

        Args:
            service: Service configuration
            status: Current container status (optional)
        """
        super().__init__()
        self.service = service
        self.status = status

    def compose(self) -> ComposeResult:
        """Create service details layout."""
        yield Container(
            Static(f"Service Details: {self.service.name}", classes="details-title"),
            Static(self._format_service_details(), id="details-content"),
            Button("Close", variant="primary", id="close-button"),
            id="details-dialog",
        )

    def _format_service_details(self) -> str:
        """Format service details for display."""
        lines = [
            f"Service ID: {self.service.id}",
            f"Name: {self.service.name}",
            f"Description: {self.service.description}",
            f"Container Name: {self.service.container_name}",
            "",
            "Ports:",
        ]

        for port in self.service.ports:
            lines.append(f"  {port.host}:{port.container} - {port.description}")

        lines.extend(
            [
                "",
                "Available Commands:",
            ]
        )

        for action, cmd in self.service.make_commands.items():
            lines.append(f"  {action}: make {cmd}")

        lines.extend(
            [
                "",
                f"Compose File: {self.service.compose_file_path}",
            ]
        )

        if self.service.depends_on:
            lines.extend(
                [
                    "",
                    "Dependencies:",
                ]
            )
            for dep in self.service.depends_on:
                lines.append(f"  - {dep}")

        if self.status:
            lines.extend(
                [
                    "",
                    "Current Status:",
                    f"  Status: {self.status.status}",
                ]
            )

            if self.status.health:
                lines.append(f"  Health: {self.status.health}")

            if self.status.image:
                lines.append(f"  Image: {self.status.image}")

            if self.status.created_at:
                lines.append(
                    f"  Created: {self.status.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
                )

            if self.status.started_at:
                lines.append(
                    f"  Started: {self.status.started_at.strftime('%Y-%m-%d %H:%M:%S')}"
                )

            if self.status.ports:
                lines.append("  Port Mappings:")
                for container_port, host_port in self.status.ports.items():
                    lines.append(f"    {host_port} → {container_port}")

            if self.status.error_message:
                lines.extend(["", f"❌ Error: {self.status.error_message}"])

        return "\n".join(lines)

    def action_back(self) -> None:
        """Close the details screen."""
        self.dismiss()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        """Handle button press."""
        if event.button.id == "close-button":
            self.action_back()


# CSS for service details screen
ServiceDetailsScreen.CSS = """
#details-dialog {
    width: 80%;
    height: 80%;
    background: $surface;
    border: solid $primary;
    padding: 2;
}

.details-title {
    text-style: bold;
    color: $accent;
    text-align: center;
    padding-bottom: 1;
}

#details-content {
    height: 1fr;
    overflow-y: auto;
    background: $panel;
    border: solid $muted;
    padding: 1;
    scrollbar-gutter: stable;
}

#close-button {
    dock: bottom;
    width: 20;
    margin-top: 1;
}
"""
