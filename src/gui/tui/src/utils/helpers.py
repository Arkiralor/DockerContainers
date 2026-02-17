"""Helper utilities for the Docker TUI application."""

import os
import sys
from pathlib import Path


def find_repository_root(start_path: str | None = None) -> Path | None:
    """Find the Docker containers repository root.

    Args:
        start_path: Directory to start searching from (defaults to current file location)

    Returns:
        Path to repository root or None if not found
    """
    if start_path:
        current_dir = Path(start_path).resolve()
    else:
        current_dir = Path(__file__).resolve()

    # Walk up the directory tree looking for Makefile
    max_levels = 15  # Safety limit to prevent infinite loops
    for _ in range(max_levels):
        makefile_path = current_dir / "Makefile"

        # Check if this looks like the DockerContainers repository
        if makefile_path.exists():
            # Additional verification - look for expected directories
            src_dir = current_dir / "src"
            scripts_dir = current_dir / "scripts"

            if src_dir.exists() and scripts_dir.exists():
                return current_dir

        parent = current_dir.parent
        if parent == current_dir:  # Reached filesystem root
            break
        current_dir = parent

    return None


def check_prerequisites() -> tuple[bool, list[str]]:
    """Check if all prerequisites are available.

    Returns:
        Tuple of (all_good, error_messages)
    """
    errors = []

    # Check Python version
    if sys.version_info < (3, 10):
        errors.append(
            f"Python 3.10+ required, found {sys.version_info.major}.{sys.version_info.minor}"
        )

    # Check if repository root can be found
    repo_root = find_repository_root()
    if not repo_root:
        errors.append(
            "Could not find DockerContainers repository root (looking for Makefile)"
        )

    # Check if required directories exist
    if repo_root:
        required_dirs = ["src", "scripts"]
        for dir_name in required_dirs:
            if not (repo_root / dir_name).exists():
                errors.append(f"Required directory not found: {dir_name}")

    return len(errors) == 0, errors


def format_duration(seconds: float) -> str:
    """Format duration in human-readable format.

    Args:
        seconds: Duration in seconds

    Returns:
        Formatted duration string
    """
    if seconds < 60:
        return f"{seconds:.1f}s"
    elif seconds < 3600:
        minutes = seconds / 60
        return f"{minutes:.1f}m"
    else:
        hours = seconds / 3600
        return f"{hours:.1f}h"


def truncate_text(text: str, max_length: int = 50) -> str:
    """Truncate text to specified length with ellipsis.

    Args:
        text: Text to truncate
        max_length: Maximum length including ellipsis

    Returns:
        Truncated text
    """
    if len(text) <= max_length:
        return text

    return text[: max_length - 3] + "..."


def validate_container_name(name: str) -> bool:
    """Validate Docker container name format.

    Args:
        name: Container name to validate

    Returns:
        True if valid container name format
    """
    if not name:
        return False

    # Docker container names must match: ^[a-zA-Z0-9][a-zA-Z0-9_.-]*$
    if not name[0].isalnum():
        return False

    allowed_chars = set(
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_.-"
    )
    return all(c in allowed_chars for c in name)


def safe_filename(text: str) -> str:
    """Convert text to safe filename.

    Args:
        text: Text to convert

    Returns:
        Safe filename string
    """
    # Replace unsafe characters with underscores
    unsafe_chars = '<>:"/\\|?*'
    safe_text = text

    for char in unsafe_chars:
        safe_text = safe_text.replace(char, "_")

    # Remove multiple consecutive underscores
    while "__" in safe_text:
        safe_text = safe_text.replace("__", "_")

    # Strip leading/trailing underscores and whitespace
    safe_text = safe_text.strip("_ ")

    return safe_text or "untitled"


def get_terminal_size() -> tuple[int, int]:
    """Get terminal size.

    Returns:
        Tuple of (columns, rows)
    """
    try:
        size = os.get_terminal_size()
        return size.columns, size.rows
    except OSError:
        # Fallback for environments where terminal size can't be determined
        return 80, 24
