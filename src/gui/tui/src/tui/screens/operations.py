"""Operations screen for executing system-wide operations and scripts."""

import asyncio

from textual.app import ComposeResult
from textual.binding import Binding
from textual.containers import Container, Horizontal
from textual.screen import Screen
from textual.widgets import Button, DataTable, Footer, Header, Static

if TYPE_CHECKING:
    pass

from ...services.command_executor import CommandExecutor, CommandResult

if TYPE_CHECKING:
    pass


class OperationsScreen(Screen):
    """Screen for executing system operations and scripts."""

    BINDINGS = [
        Binding("escape", "back", "Back", priority=True),
        Binding("q", "back", "Back", priority=True),
        Binding("enter", "execute_operation", "Execute", priority=True),
        Binding("r", "refresh", "Refresh", priority=True),
    ]

    def __init__(
        self, operations: Dict[str, Dict], command_executor: CommandExecutor | None
    ):
        """Initialize operations screen.

        Args:
            operations: Dictionary of available operations
            command_executor: Command executor for running operations
        """
        super().__init__()
        self.operations = operations
        self.command_executor = command_executor
        self._selected_operation: str | None = None
        self._operation_list = list(operations.keys())

    def compose(self) -> ComposeResult:
        """Create operations screen layout."""
        yield Header(show_clock=True)

        if not self.command_executor:
            yield Container(
                Static(
                    "❌ Command executor not available\n"
                    "Cannot execute operations without proper setup.",
                    classes="error-message",
                ),
                classes="error-container",
            )
            return

        # Operations table
        yield Container(
            Static("System Operations", classes="screen-title"),
            DataTable(id="operations-table", cursor_type="row"),
            id="operations-container",
        )

        # Action buttons
        yield Container(
            Horizontal(
                Button("Execute", variant="primary", id="execute-button"),
                Button("Refresh", variant="default", id="refresh-button"),
                Button("Back", variant="default", id="back-button"),
                id="action-buttons",
            ),
            classes="button-container",
        )

        # Operation details
        yield Container(Static("", id="operation-details"), classes="details-container")

        # Output area
        yield Container(
            Static("Operation output will appear here", id="output-content"),
            classes="output-container",
        )

        yield Footer()

    def on_mount(self) -> None:
        """Handle screen mount."""
        self.title = "Operations"
        if self.command_executor:
            self._setup_table()
            self._update_operation_details()

    def _setup_table(self) -> None:
        """Set up the operations data table."""
        if not self.command_executor:
            return

        table = self.query_one("#operations-table", DataTable)

        # Add columns
        table.add_columns("Operation", "Command/Script", "Description")

        # Add operation rows
        for op_key, op_data in self.operations.items():
            # Determine command or script
            if "command" in op_data:
                cmd_text = f"make {op_data['command']}"
            elif "script" in op_data:
                cmd_text = op_data["script"]
            else:
                cmd_text = "Unknown"

            table.add_row(
                op_key.replace("_", " ").title(),
                cmd_text,
                op_data.get("description", "No description"),
                key=op_key,
            )

        # Select first row if available
        if self._operation_list:
            table.cursor_row = 0
            self._selected_operation = self._operation_list[0]

    def _update_operation_details(self) -> None:
        """Update operation details display."""
        if not self._selected_operation or not self.command_executor:
            return

        op_data = self.operations.get(self._selected_operation, {})
        details_widget = self.query_one("#operation-details", Static)

        details = [
            f"Operation: {self._selected_operation.replace('_', ' ').title()}",
            f"Description: {op_data.get('description', 'No description')}",
        ]

        if "command" in op_data:
            details.extend(
                [
                    "Type: Makefile Command",
                    f"Command: make {op_data['command']}",
                ]
            )
        elif "script" in op_data:
            details.extend(
                [
                    "Type: Shell Script",
                    f"Script: {op_data['script']}",
                ]
            )

        # Add warnings for destructive operations
        destructive_ops = ["clean", "restore"]
        if any(dest in self._selected_operation.lower() for dest in destructive_ops):
            details.append("")
            details.append("⚠️  WARNING: This is a potentially destructive operation!")
            details.append(
                "   Make sure you understand what it does before proceeding."
            )

        details_widget.update("\n".join(details))

    def _get_selected_operation(self) -> str | None:
        """Get currently selected operation."""
        table = self.query_one("#operations-table", DataTable)

        if table.cursor_row is not None and 0 <= table.cursor_row < len(
            self._operation_list
        ):
            return self._operation_list[table.cursor_row]

        return self._operation_list[0] if self._operation_list else None

    def on_data_table_row_highlighted(self, event: DataTable.RowHighlighted) -> None:
        """Handle row selection change."""
        if event.cursor_row is not None and 0 <= event.cursor_row < len(
            self._operation_list
        ):
            self._selected_operation = self._operation_list[event.cursor_row]
            self._update_operation_details()

    def action_back(self) -> None:
        """Go back to main screen."""
        self.dismiss()

    def action_refresh(self) -> None:
        """Refresh operations (mainly for checking command executor status)."""
        if not self.command_executor:
            self.notify("Command executor not available", severity="error")
            return

        # Check if Docker is available
        docker_available = self.command_executor.check_docker_available()
        compose_available = self.command_executor.check_docker_compose_available()

        status_msg = f"Docker: {'✅' if docker_available else '❌'}"
        status_msg += f" | Compose: {'✅' if compose_available else '❌'}"

        self.notify(f"Status refreshed - {status_msg}")

    async def action_execute_operation(self) -> None:
        """Execute the selected operation."""
        if not self.command_executor:
            self.notify("Command executor not available", severity="error")
            return

        operation_key = self._get_selected_operation()
        if not operation_key:
            self.notify("No operation selected", severity="warning")
            return

        op_data = self.operations.get(operation_key, {})
        if not op_data:
            self.notify("Invalid operation", severity="error")
            return

        # Show confirmation for destructive operations
        destructive_ops = ["clean", "restore"]
        if any(dest in operation_key.lower() for dest in destructive_ops):
            confirmed = await self._show_confirmation(
                f"Execute {operation_key.replace('_', ' ').title()}?",
                "This operation may modify or delete data. Are you sure?",
            )
            if not confirmed:
                return

        # Clear previous output
        output_widget = self.query_one("#output-content", Static)
        output_widget.update("Executing operation...")

        # Execute the operation
        if "command" in op_data:
            result = await self._execute_make_command(op_data["command"], operation_key)
        elif "script" in op_data:
            result = await self._execute_script(op_data["script"], operation_key)
        else:
            self.notify("Invalid operation configuration", severity="error")
            return

        # Display result
        self._display_result(result)

    async def _execute_make_command(
        self, command: str, operation_key: str
    ) -> CommandResult:
        """Execute a Make command."""
        description = f"Executing make {command}"
        self.notify(description)

        result = await asyncio.to_thread(
            self.command_executor.execute_make_command,
            command,
            timeout=120,  # Longer timeout for system operations
        )

        return result

    async def _execute_script(
        self, script_path: str, operation_key: str
    ) -> CommandResult:
        """Execute a shell script."""
        description = f"Executing {script_path}"
        self.notify(description)

        result = await asyncio.to_thread(
            self.command_executor.execute_script,
            script_path,
            timeout=300,  # Even longer timeout for scripts
        )

        return result

    def _display_result(self, result: CommandResult) -> None:
        """Display command execution result."""
        output_widget = self.query_one("#output-content", Static)

        output_lines = [
            f"Command: {result.command}",
            f"Exit Code: {result.return_code}",
            f"Success: {'✅' if result.success else '❌'}",
            "",
        ]

        if result.stdout:
            output_lines.extend(
                [
                    "STDOUT:",
                    "=" * 50,
                    result.stdout,
                    "",
                ]
            )

        if result.stderr:
            output_lines.extend(
                [
                    "STDERR:",
                    "=" * 50,
                    result.stderr,
                    "",
                ]
            )

        output_widget.update("\n".join(output_lines))

        # Show notification
        if result.success:
            self.notify("Operation completed successfully")
        else:
            self.notify("Operation failed", severity="error")

    async def _show_confirmation(self, title: str, message: str) -> bool:
        """Show confirmation dialog."""
        # For now, we'll just return True
        # In a real implementation, you'd create a modal dialog
        # This is a simplified version
        return True

    # Button event handlers
    def on_button_pressed(self, event: Button.Pressed) -> None:
        """Handle button press."""
        if event.button.id == "execute-button":
            self.run_worker(self.action_execute_operation())
        elif event.button.id == "refresh-button":
            self.action_refresh()
        elif event.button.id == "back-button":
            self.action_back()


# CSS for operations screen
OperationsScreen.CSS = """
.screen-title {
    text-style: bold;
    color: $accent;
    padding: 1 2;
    text-align: center;
}

.error-container {
    padding: 2;
    text-align: center;
}

.error-message {
    background: red 10%;
    color: red;
    padding: 2;
    border: solid red;
}

#operations-container {
    height: 35%;
    padding: 1 2;
}

#operations-table {
    height: 1fr;
}

.button-container {
    height: 3;
    padding: 1 2;
}

#action-buttons {
    height: 1;
    align: center middle;
}

.details-container {
    height: 25%;
    background: $panel;
    border: solid $primary;
    padding: 1 2;
}

#operation-details {
    height: 1fr;
    scrollbar-gutter: stable;
}

.output-container {
    height: 1fr;
    background: $surface;
    border: solid $accent;
    padding: 1 2;
}

#output-content {
    height: 1fr;
    overflow-y: auto;
    scrollbar-gutter: stable;
}
"""
