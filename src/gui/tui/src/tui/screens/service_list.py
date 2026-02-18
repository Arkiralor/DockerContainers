"""Service list screen for displaying and managing Docker services."""

import asyncio
from typing import TYPE_CHECKING

from textual.app import ComposeResult
from textual.binding import Binding
from textual.containers import Container, Horizontal
from textual.screen import Screen
from textual.widgets import Button, DataTable, Footer, Header, Static

if TYPE_CHECKING:
    pass

from ...config.services import ServiceConfig
from ...services.docker_client import ContainerStatus

if TYPE_CHECKING:
    from ..app import DockerTUIApp


class ServiceListScreen(Screen):
    """Screen showing list of services with status and controls."""

    BINDINGS = [
        Binding("escape", "back", "Back", priority=True),
        Binding("q", "back", "Back", priority=True),
        Binding("enter", "service_action", "Start/Stop", priority=True),
        Binding("space", "service_action", "Start/Stop", priority=False),
        Binding("l", "view_logs", "View Logs", priority=True),
        Binding("d", "service_details", "Details", priority=True),
        Binding("r", "refresh", "Refresh", priority=True),
    ]

    def __init__(
        self,
        services: list[ServiceConfig],
        container_statuses: dict[str, ContainerStatus],
        app_ref: DockerTUIApp,
    ):
        """Initialize service list screen.

        Args:
            services: List of service configurations
            container_statuses: Current container status information
            app_ref: Reference to main application
        """
        super().__init__()
        self.services = services
        self.container_statuses = container_statuses
        self.app_ref = app_ref
        self._selected_service: ServiceConfig | None = services[0] if services else None

    def compose(self) -> ComposeResult:
        """Create screen layout."""
        yield Header(show_clock=True)

        # Service table
        yield Container(
            Static("Docker Services", classes="screen-title"),
            DataTable(id="services-table", cursor_type="row"),
            id="services-container",
        )

        # Action buttons
        yield Container(
            Horizontal(
                Button("Start/Stop", variant="primary", id="toggle-button"),
                Button("View Logs", variant="default", id="logs-button"),
                Button("Details", variant="default", id="details-button"),
                Button("Refresh", variant="default", id="refresh-button"),
                Button("Back", variant="default", id="back-button"),
                id="action-buttons",
            ),
            classes="button-container",
        )

        # Status info
        yield Container(Static("", id="status-info"), classes="info-container")

        yield Footer()

    def on_mount(self) -> None:
        """Handle screen mount."""
        self.title = "Services"
        self._setup_table()
        self._update_status_info()

    def _setup_table(self) -> None:
        """Set up the services data table."""
        try:
            table = self.query_one("#services-table", DataTable)
        except Exception:
            return

        # Add columns
        table.add_columns(
            "Service", "Container", "Status", "Health", "Ports", "Description"
        )

        # Add service rows
        for service in self.services:
            # Check if this is a grouped service (has containers)
            if service.containers:
                # Add parent service row
                table.add_row(
                    f"{service.name} (Group)",
                    f"{len(service.containers)} containers",
                    "-",
                    "-",
                    "-",
                    service.description[:50] + "..."
                    if len(service.description) > 50
                    else service.description,
                    key=f"{service.id}-group",
                )

                # Add child container rows
                for container in service.containers:
                    status = self.container_statuses.get(container.container_name)

                    # Format status
                    status_text = "Unknown"
                    if status:
                        if status.status == "running":
                            status_text = "Running"
                        elif status.status == "exited" or status.status == "stopped":
                            status_text = "Stopped"
                        elif status.status == "not_found":
                            status_text = "Not Created"
                        else:
                            status_text = f"{status.status.title()}"

                    # Format health
                    health_text = "N/A"
                    if status and status.health:
                        if status.health == "healthy":
                            health_text = "Healthy"
                        elif status.health == "unhealthy":
                            health_text = "Unhealthy"
                        elif status.health == "starting":
                            health_text = "Starting"

                    # Format ports
                    ports_text = ""
                    if container.ports:
                        ports_list = [
                            f"{p.host}:{p.container}" for p in container.ports
                        ]
                        ports_text = ", ".join(ports_list)

                    # Add row with indentation indicator
                    table.add_row(
                        f"  ├─ {container.name}",
                        container.container_name,
                        status_text,
                        health_text,
                        ports_text,
                        (
                            container.description[:50] + "..."
                            if len(container.description) > 50
                            else container.description
                        ),
                        key=f"{service.id}-{container.container_name}",
                    )
            else:
                # Single container service
                status = self.container_statuses.get(service.container_name)

                # Format status
                status_text = "Unknown"
                if status:
                    if status.status == "running":
                        status_text = "Running"
                    elif status.status == "exited" or status.status == "stopped":
                        status_text = "Stopped"
                    elif status.status == "not_found":
                        status_text = "Not Created"
                    else:
                        status_text = f"{status.status.title()}"

                # Format health
                health_text = "N/A"
                if status and status.health:
                    if status.health == "healthy":
                        health_text = "Healthy"
                    elif status.health == "unhealthy":
                        health_text = "Unhealthy"
                    elif status.health == "starting":
                        health_text = "Starting"

                # Format ports
                ports_text = ""
                if service.ports:
                    ports_list = [f"{p.host}:{p.container}" for p in service.ports]
                    ports_text = ", ".join(ports_list)

                # Add row
                table.add_row(
                    service.name,
                    service.container_name,
                    status_text,
                    health_text,
                    ports_text,
                    (
                        service.description[:50] + "..."
                        if len(service.description) > 50
                        else service.description
                    ),
                    key=service.id,
                )

        # Select first row if available
        if self.services:
            table.move_cursor(row=0)

    def _update_status_info(self) -> None:
        """Update status information display."""
        if not self._selected_service:
            return

        try:
            info_widget = self.query_one("#status-info", Static)
        except Exception:
            return

        info_lines = [
            f"Selected: {self._selected_service.name}",
        ]

        # Handle grouped services
        if self._selected_service.containers:
            info_lines.append(
                f"Type: Grouped Service ({len(self._selected_service.containers)} containers)"
            )

            # List all containers with their status
            for container in self._selected_service.containers:
                status = self.container_statuses.get(container.container_name)
                status_text = "Unknown"
                if status:
                    if status.status == "running":
                        status_text = "Running"
                    elif status.status == "exited" or status.status == "stopped":
                        status_text = "Stopped"
                    elif status.status == "not_found":
                        status_text = "Not Created"
                    else:
                        status_text = status.status.title()

                info_lines.append(f"  - {container.name}: {status_text}")
        else:
            # Single container service
            info_lines.append(f"Container: {self._selected_service.container_name}")
            status = self.container_statuses.get(self._selected_service.container_name)

            if status:
                info_lines.extend(
                    [
                        f"Status: {status.status}",
                        f"Image: {status.image or 'N/A'}",
                    ]
                )

                if status.created_at:
                    info_lines.append(
                        f"Created: {status.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
                    )

                if status.started_at:
                    info_lines.append(
                        f"Started: {status.started_at.strftime('%Y-%m-%d %H:%M:%S')}"
                    )

                if status.error_message:
                    info_lines.append(f"Error: {status.error_message}")

        # Available commands
        make_commands = []
        for action, cmd in self._selected_service.make_commands.items():
            make_commands.append(f"{action}: make {cmd}")

        if make_commands:
            info_lines.append("")
            info_lines.append("Available commands:")
            info_lines.extend(make_commands)

        info_widget.update("\n".join(info_lines))

    def _get_selected_service(self) -> ServiceConfig | None:
        """Get currently selected service."""
        try:
            table = self.query_one("#services-table", DataTable)
        except Exception:
            return self.services[0] if self.services else None

        if table.cursor_row is not None and 0 <= table.cursor_row < len(self.services):
            return self.services[table.cursor_row]

        return self.services[0] if self.services else None

    def on_data_table_row_highlighted(self, event: DataTable.RowHighlighted) -> None:
        """Handle row selection change."""
        if event.row_key and 0 <= event.cursor_row < len(self.services):
            self._selected_service = self.services[event.cursor_row]
            self._update_status_info()

    def action_back(self) -> None:
        """Go back to main screen."""
        self.dismiss()

    def action_refresh(self) -> None:
        """Refresh service statuses."""
        self.app_ref.refresh_status()
        self.container_statuses = self.app_ref.container_statuses

        # Refresh table
        try:
            table = self.query_one("#services-table", DataTable)
            table.clear()
            self._setup_table()
            self._update_status_info()
        except Exception:
            pass

        self.notify("Status refreshed")

    async def action_service_action(self) -> None:
        """Start or stop the selected service."""
        service = self._get_selected_service()
        if not service:
            self.notify("No service selected", severity="warning")
            return

        # Determine action based on current status
        # For grouped services, check if any container is running
        is_running = False
        if service.containers:
            # Check if any child container is running
            for container in service.containers:
                status = self.container_statuses.get(container.container_name)
                if status and status.status == "running":
                    is_running = True
                    break
        else:
            # Single container service
            status = self.container_statuses.get(service.container_name)
            is_running = status and status.status == "running" if status else False

        if is_running:
            # Stop service
            command = service.make_commands.get("stop")
            if service.containers:
                description = f"Stopping {service.name} (all containers)"
            else:
                description = f"Stopping {service.name}"
        else:
            # Start service
            command = service.make_commands.get("start")
            if service.containers:
                description = f"Starting {service.name} (all containers)"
            else:
                description = f"Starting {service.name}"

        if not command:
            self.notify(f"No command available for {service.name}", severity="error")
            return

        # Execute command
        result = await self.app_ref.execute_make_command(command, description)

        if not result.success:
            self.notify(
                f"Command failed: {result.stderr or result.stdout or 'Unknown error'}",
                severity="error",
            )

        # Refresh after command
        await self._delayed_refresh()

    def action_view_logs(self) -> None:
        """View logs for selected service."""
        service = self._get_selected_service()
        if not service:
            self.notify("No service selected", severity="warning")
            return

        # For grouped services, we cannot show combined logs easily
        if service.containers:
            self.notify(
                f"{service.name} is a grouped service. Use 'make logs-opensearch' or 'make logs-dashboards' from terminal.",
                severity="warning",
            )
            return

        # Import here to avoid circular imports
        from .log_viewer import LogViewerScreen

        self.app.push_screen(LogViewerScreen(service, self.app_ref.docker_client))

    def action_service_details(self) -> None:
        """Show detailed information for selected service."""
        service = self._get_selected_service()
        if not service:
            self.notify("No service selected", severity="warning")
            return

        # For grouped services, we show summary info already
        if service.containers:
            self.notify(
                f"{service.name} is a grouped service. See status info below for all containers.",
                severity="info",
            )
            return

        # Import here to avoid circular imports
        from .service_details import ServiceDetailsScreen

        status = self.container_statuses.get(service.container_name)
        self.app.push_screen(ServiceDetailsScreen(service, status))

    async def _delayed_refresh(self) -> None:
        """Refresh status after a short delay."""

        await asyncio.sleep(2)  # Wait for container to update status
        self.action_refresh()

    # Button event handlers
    def on_button_pressed(self, event: Button.Pressed) -> None:
        """Handle button press."""
        if event.button.id == "toggle-button":
            worker = self.run_worker(self.action_service_action(), exclusive=True)
            worker.name = "service_action"
        elif event.button.id == "logs-button":
            self.action_view_logs()
        elif event.button.id == "details-button":
            self.action_service_details()
        elif event.button.id == "refresh-button":
            self.action_refresh()
        elif event.button.id == "back-button":
            self.action_back()


# CSS for the service list screen
ServiceListScreen.CSS = """
.screen-title {
    text-style: bold;
    color: $accent;
    padding: 1 2;
    text-align: center;
}

#services-container {
    height: 1fr;
    padding: 1 2;
}

#services-table {
    height: 1fr;
}

.button-container {
    dock: bottom;
    height: 3;
    padding: 1 2;
}

#action-buttons {
    height: 1;
    align: center middle;
}

.info-container {
    dock: bottom;
    height: 8;
    background: $panel;
    border: solid $primary;
    padding: 1 2;
}

#status-info {
    height: 1fr;
    scrollbar-gutter: stable;
}
"""
