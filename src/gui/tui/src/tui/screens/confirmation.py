"""Confirmation dialog screen for confirming user actions."""

from textual.app import ComposeResult
from textual.containers import Container, Horizontal
from textual.screen import ModalScreen
from textual.widgets import Button, Static


class ConfirmationScreen(ModalScreen[bool]):
    """Modal confirmation dialog that returns True/False based on user choice."""

    DEFAULT_CSS = """
    ConfirmationScreen {
        align: center middle;
    }

    ConfirmationScreen > Container {
        width: 60;
        height: auto;
        border: thick $primary;
        background: $surface;
        padding: 1 2;
    }

    #confirmation-title {
        text-style: bold;
        color: $warning;
        text-align: center;
        padding-bottom: 1;
    }

    #confirmation-message {
        text-align: center;
        padding: 1 0;
    }

    #confirmation-buttons {
        align: center middle;
        height: 3;
        padding-top: 1;
    }

    #confirm-yes {
        margin: 0 1;
    }

    #confirm-no {
        margin: 0 1;
    }
    """

    def __init__(self, title: str, message: str):
        """Initialize confirmation dialog.

        Args:
            title: Dialog title
            message: Confirmation message to display
        """
        super().__init__()
        self.title_text = title
        self.message_text = message

    def compose(self) -> ComposeResult:
        """Create confirmation dialog layout."""
        with Container():
            yield Static(self.title_text, id="confirmation-title")
            yield Static(self.message_text, id="confirmation-message")
            with Horizontal(id="confirmation-buttons"):
                yield Button("Yes", variant="error", id="confirm-yes")
                yield Button("No", variant="primary", id="confirm-no")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        """Handle button press."""
        if event.button.id == "confirm-yes":
            self.dismiss(True)
        else:
            self.dismiss(False)

    def on_mount(self) -> None:
        """Focus No button by default for safety."""
        try:
            self.query_one("#confirm-no", Button).focus()
        except Exception:
            pass
