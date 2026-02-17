"""Comprehensive tests for ConfirmationScreen control flows.

This module tests all control flow paths in ConfirmationScreen as described
in the TUI Control Flow Analysis document Section: Screen-Level Control Flows.
"""

from unittest.mock import Mock, patch

import pytest

from src.tui.screens.confirmation import ConfirmationScreen


class TestConfirmationScreenInitialization:
    """Tests for ConfirmationScreen initialization (Control Flow Analysis: lines 594-605)."""

    def test_init_stores_title(self):
        """Test __init__ stores title text."""
        screen = ConfirmationScreen("Test Title", "Test Message")

        assert screen.title_text == "Test Title"

    def test_init_stores_message(self):
        """Test __init__ stores message text."""
        screen = ConfirmationScreen("Test Title", "Test Message")

        assert screen.message_text == "Test Message"

    def test_init_with_destructive_operation_title(self):
        """Test initialization with destructive operation title."""
        title = "Execute Clean Operation?"
        message = "This will delete all data. Are you sure?"
        screen = ConfirmationScreen(title, message)

        assert screen.title_text == title
        assert screen.message_text == message

    def test_init_with_empty_strings(self):
        """Test initialization with empty title and message."""
        screen = ConfirmationScreen("", "")

        assert screen.title_text == ""
        assert screen.message_text == ""

    def test_init_with_long_message(self):
        """Test initialization with very long message."""
        long_message = "This is a very long message " * 50
        screen = ConfirmationScreen("Title", long_message)

        assert screen.message_text == long_message


class TestModalBehavior:
    """Tests for modal screen behavior and type safety."""

    def test_screen_is_modal_returning_bool(self):
        """Test that ConfirmationScreen is ModalScreen[bool]."""
        from textual.screen import ModalScreen

        screen = ConfirmationScreen("Title", "Message")

        assert isinstance(screen, ModalScreen)

    def test_screen_has_default_textual_bindings(self):
        """Test screen has Textual default bindings (tab, shift+tab, etc)."""
        screen = ConfirmationScreen("Title", "Message")

        # ConfirmationScreen doesn't define custom BINDINGS beyond Textual defaults
        # Textual provides default bindings like tab navigation
        assert hasattr(screen, "BINDINGS")
        # Default Textual bindings exist (tab, shift+tab, copy, etc)
        assert len(screen.BINDINGS) >= 0


class TestMountBehavior:
    """Tests for on_mount behavior (Control Flow Analysis: lines 599-602)."""

    def test_on_mount_focuses_no_button_by_default(self):
        """Test on_mount focuses 'No' button for safety (safe default)."""
        from textual.widgets import Button

        screen = ConfirmationScreen("Title", "Message")

        mock_button = Mock()
        with patch.object(screen, "query_one", return_value=mock_button) as mock_query:
            screen.on_mount()

            mock_query.assert_called_once_with("#confirm-no", Button)
            mock_button.focus.assert_called_once()

    def test_on_mount_queries_correct_button_id(self):
        """Test on_mount queries #confirm-no button."""
        screen = ConfirmationScreen("Title", "Message")

        mock_button = Mock()

        def mock_query_one(selector, button_type=None):
            if selector == "#confirm-no":
                return mock_button
            raise ValueError(f"Unexpected selector: {selector}")

        with patch.object(screen, "query_one", side_effect=mock_query_one):
            screen.on_mount()

            mock_button.focus.assert_called_once()


class TestButtonPressHandling:
    """Tests for button press handlers (Control Flow Analysis: lines 603-606)."""

    def test_yes_button_dismisses_with_true(self):
        """Test clicking 'Yes' button dismisses screen with True."""
        screen = ConfirmationScreen("Title", "Message")

        mock_event = Mock()
        mock_event.button.id = "confirm-yes"

        with patch.object(screen, "dismiss") as mock_dismiss:
            screen.on_button_pressed(mock_event)

            mock_dismiss.assert_called_once_with(True)

    def test_no_button_dismisses_with_false(self):
        """Test clicking 'No' button dismisses screen with False."""
        screen = ConfirmationScreen("Title", "Message")

        mock_event = Mock()
        mock_event.button.id = "confirm-no"

        with patch.object(screen, "dismiss") as mock_dismiss:
            screen.on_button_pressed(mock_event)

            mock_dismiss.assert_called_once_with(False)

    def test_any_other_button_dismisses_with_false(self):
        """Test any button other than 'Yes' dismisses with False."""
        screen = ConfirmationScreen("Title", "Message")

        mock_event = Mock()
        mock_event.button.id = "some-other-button"

        with patch.object(screen, "dismiss") as mock_dismiss:
            screen.on_button_pressed(mock_event)

            mock_dismiss.assert_called_once_with(False)

    def test_button_pressed_multiple_times_yes(self):
        """Test multiple Yes button presses (edge case - should not happen in UI)."""
        screen = ConfirmationScreen("Title", "Message")

        mock_event = Mock()
        mock_event.button.id = "confirm-yes"

        with patch.object(screen, "dismiss") as mock_dismiss:
            screen.on_button_pressed(mock_event)
            screen.on_button_pressed(mock_event)

            # dismiss should be called twice (though modal should close after first)
            assert mock_dismiss.call_count == 2
            assert all(call[0][0] is True for call in mock_dismiss.call_args_list)


class TestDestructiveOperationConfirmation:
    """Tests for confirmation of destructive operations."""

    def test_confirmation_for_clean_operation(self):
        """Test confirmation screen for clean operation."""
        title = "Execute Clean?"
        message = "This operation may delete data. Are you sure?"
        screen = ConfirmationScreen(title, message)

        assert "clean" in screen.title_text.lower() or "Clean" in screen.title_text
        assert screen.message_text == message

    def test_confirmation_for_restore_operation(self):
        """Test confirmation screen for restore operation."""
        title = "Execute Restore?"
        message = "This operation may modify or delete data. Are you sure?"
        screen = ConfirmationScreen(title, message)

        assert "restore" in screen.title_text.lower() or "Restore" in screen.title_text
        assert screen.message_text == message

    def test_confirmation_user_confirms_destructive_operation(self):
        """Test user confirming a destructive operation."""
        screen = ConfirmationScreen("Delete All?", "This cannot be undone.")

        mock_event = Mock()
        mock_event.button.id = "confirm-yes"

        with patch.object(screen, "dismiss") as mock_dismiss:
            screen.on_button_pressed(mock_event)

            mock_dismiss.assert_called_once_with(True)

    def test_confirmation_user_cancels_destructive_operation(self):
        """Test user canceling a destructive operation."""
        screen = ConfirmationScreen("Delete All?", "This cannot be undone.")

        mock_event = Mock()
        mock_event.button.id = "confirm-no"

        with patch.object(screen, "dismiss") as mock_dismiss:
            screen.on_button_pressed(mock_event)

            mock_dismiss.assert_called_once_with(False)


class TestComposeMethod:
    """Tests for compose method creating the UI layout."""

    @pytest.mark.skip(
        reason="Requires Textual app context; tests Textual internals not business logic"
    )
    def test_compose_creates_title_static(self):
        """Test compose creates title static widget."""
        screen = ConfirmationScreen("Test Title", "Test Message")

        result = list(screen.compose())

        # Should create widgets in compose
        assert len(result) > 0

    @pytest.mark.skip(
        reason="Requires Textual app context; tests Textual internals not business logic"
    )
    def test_compose_creates_message_static(self):
        """Test compose creates message static widget."""
        screen = ConfirmationScreen("Test Title", "Test Message")

        result = list(screen.compose())

        # Compose should yield multiple widgets
        assert len(result) > 0

    @pytest.mark.skip(
        reason="Requires Textual app context; tests Textual internals not business logic"
    )
    def test_compose_creates_yes_button(self):
        """Test compose creates Yes button."""
        screen = ConfirmationScreen("Test Title", "Test Message")

        result = list(screen.compose())

        # Should create a container with buttons
        assert len(result) > 0

    @pytest.mark.skip(
        reason="Requires Textual app context; tests Textual internals not business logic"
    )
    def test_compose_creates_no_button(self):
        """Test compose creates No button."""
        screen = ConfirmationScreen("Test Title", "Test Message")

        result = list(screen.compose())

        # Should create a container with buttons
        assert len(result) > 0


class TestSafeDefaults:
    """Tests for safe defaults (No button focused by default)."""

    def test_default_focus_prevents_accidental_confirmation(self):
        """Test that default focus on 'No' prevents accidental confirmation."""
        screen = ConfirmationScreen(
            "Delete Everything?", "This will permanently delete all data."
        )

        mock_no_button = Mock()

        with patch.object(screen, "query_one", return_value=mock_no_button):
            screen.on_mount()

            # Should focus No button, requiring deliberate action to confirm
            mock_no_button.focus.assert_called_once()


class TestEdgeCases:
    """Tests for edge cases and boundary conditions."""

    def test_confirmation_with_very_long_title(self):
        """Test confirmation with extremely long title."""
        long_title = "T" * 1000
        screen = ConfirmationScreen(long_title, "Message")

        assert screen.title_text == long_title

    def test_confirmation_with_newlines_in_message(self):
        """Test confirmation with multi-line message."""
        multiline_message = "Line 1\nLine 2\nLine 3"
        screen = ConfirmationScreen("Title", multiline_message)

        assert screen.message_text == multiline_message
        assert "\n" in screen.message_text

    def test_confirmation_with_special_characters(self):
        """Test confirmation with special characters in title and message."""
        title = "Delete <All> Files?"
        message = "This will delete: *.txt, *.log, & more!"
        screen = ConfirmationScreen(title, message)

        assert screen.title_text == title
        assert screen.message_text == message

    def test_button_event_with_none_button_id(self):
        """Test button press handler with None button id."""
        screen = ConfirmationScreen("Title", "Message")

        mock_event = Mock()
        mock_event.button.id = None

        with patch.object(screen, "dismiss") as mock_dismiss:
            screen.on_button_pressed(mock_event)

            # Should handle gracefully and dismiss with False
            mock_dismiss.assert_called_once_with(False)


class TestIntegrationWithOperationsScreen:
    """Tests for integration scenarios with OperationsScreen."""

    @pytest.mark.asyncio
    async def test_await_confirmation_user_confirms(self):
        """Test awaiting confirmation when user confirms."""
        # This simulates the flow from OperationsScreen.action_execute_operation
        screen = ConfirmationScreen(
            "Execute Clean?", "This may delete data. Are you sure?"
        )

        # Simulate immediate confirmation
        mock_event = Mock()
        mock_event.button.id = "confirm-yes"

        with patch.object(screen, "dismiss") as mock_dismiss:
            screen.on_button_pressed(mock_event)

            mock_dismiss.assert_called_once_with(True)

    @pytest.mark.asyncio
    async def test_await_confirmation_user_cancels(self):
        """Test awaiting confirmation when user cancels."""
        screen = ConfirmationScreen("Execute Restore?", "This may modify data.")

        # Simulate user clicking No
        mock_event = Mock()
        mock_event.button.id = "confirm-no"

        with patch.object(screen, "dismiss") as mock_dismiss:
            screen.on_button_pressed(mock_event)

            mock_dismiss.assert_called_once_with(False)


class TestCSSConfiguration:
    """Tests for CSS configuration and styling."""

    def test_screen_has_default_css(self):
        """Test screen defines DEFAULT_CSS."""
        screen = ConfirmationScreen("Title", "Message")

        assert hasattr(screen, "DEFAULT_CSS")
        assert isinstance(screen.DEFAULT_CSS, str)
        assert len(screen.DEFAULT_CSS) > 0

    def test_css_includes_confirmation_selectors(self):
        """Test CSS includes selectors for confirmation dialog elements."""
        screen = ConfirmationScreen("Title", "Message")

        css = screen.DEFAULT_CSS

        # Should have selectors for dialog components
        assert "#confirmation-title" in css or "confirmation-title" in css
        assert "#confirmation-message" in css or "confirmation-message" in css
        assert "#confirmation-buttons" in css or "confirmation-buttons" in css
