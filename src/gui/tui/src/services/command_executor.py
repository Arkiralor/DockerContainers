"""Command executor for running Makefile commands and scripts.

This module handles execution of repository-specific Make commands and scripts
without reimplementing Docker operations. All container operations go through
existing Makefile targets and shell scripts.
"""

import os
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional


@dataclass
class CommandResult:
    """Result of a command execution."""

    success: bool
    return_code: int
    stdout: str
    stderr: str
    command: str


class CommandExecutor:
    """Executes Make commands and scripts in the repository root directory."""

    def __init__(self, repository_root: Optional[str] = None):
        """Initialize command executor.

        Args:
            repository_root: Path to repository root. If None, attempts to find it.
        """
        self.repository_root = self._find_repository_root(repository_root)
        if not self.repository_root:
            raise RuntimeError("Could not find repository root directory")

        # Verify make is available
        if not self._check_make_available():
            raise RuntimeError("Make command not available")

    def _find_repository_root(
        self, provided_path: Optional[str] = None
    ) -> Optional[str]:
        """Find the repository root directory.

        Args:
            provided_path: Explicitly provided path to use as root

        Returns:
            Path to repository root directory or None if not found
        """
        if provided_path:
            if os.path.exists(os.path.join(provided_path, "Makefile")):
                return os.path.abspath(provided_path)
            return None

        # Start from current file location and walk up
        current_dir = Path(__file__).resolve()

        # Walk up from src/gui/tui/src/services/ to find repository root
        max_levels = 10  # Safety limit
        for _ in range(max_levels):
            current_dir = current_dir.parent
            makefile_path = current_dir / "Makefile"

            if makefile_path.exists():
                return str(current_dir)

        # Fallback: check common relative paths
        possible_roots = [
            "../../../..",  # From src/gui/tui/src/services/
            "../../../../..",  # One more level up
        ]

        script_dir = Path(__file__).parent
        for rel_path in possible_roots:
            potential_root = (script_dir / rel_path).resolve()
            if (potential_root / "Makefile").exists():
                return str(potential_root)

        return None

    def _check_make_available(self) -> bool:
        """Check if make command is available."""
        try:
            result = subprocess.run(
                ["make", "--version"], capture_output=True, text=True, timeout=5
            )
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False

    def execute_make_command(
        self, target: str, timeout: int = 30, capture_output: bool = True
    ) -> CommandResult:
        """Execute a Make target.

        Args:
            target: Make target to execute (e.g., 'start-postgres', 'stop-redis')
            timeout: Command timeout in seconds
            capture_output: Whether to capture stdout/stderr

        Returns:
            CommandResult with execution details
        """
        command = ["make", target]
        return self._execute_command(command, timeout, capture_output)

    def execute_script(
        self,
        script_path: str,
        args: Optional[List[str]] = None,
        timeout: int = 60,
        capture_output: bool = True,
    ) -> CommandResult:
        """Execute a shell script.

        Args:
            script_path: Path to script relative to repository root
            args: Additional arguments to pass to script
            timeout: Command timeout in seconds
            capture_output: Whether to capture stdout/stderr

        Returns:
            CommandResult with execution details
        """
        full_script_path = os.path.join(self.repository_root, script_path)
        if not os.path.exists(full_script_path):
            return CommandResult(
                success=False,
                return_code=-1,
                stdout="",
                stderr=f"Script not found: {full_script_path}",
                command=script_path,
            )

        command = [full_script_path]
        if args:
            command.extend(args)

        return self._execute_command(command, timeout, capture_output)

    def _execute_command(
        self, command: List[str], timeout: int, capture_output: bool
    ) -> CommandResult:
        """Execute a command with error handling.

        Args:
            command: Command and arguments to execute
            timeout: Command timeout in seconds
            capture_output: Whether to capture stdout/stderr

        Returns:
            CommandResult with execution details
        """
        try:
            result = subprocess.run(
                command,
                cwd=self.repository_root,
                capture_output=capture_output,
                text=True,
                timeout=timeout,
                env=dict(os.environ),  # Pass through environment variables
            )

            return CommandResult(
                success=result.returncode == 0,
                return_code=result.returncode,
                stdout=result.stdout if capture_output else "",
                stderr=result.stderr if capture_output else "",
                command=" ".join(command),
            )

        except subprocess.TimeoutExpired:
            return CommandResult(
                success=False,
                return_code=-1,
                stdout="",
                stderr=f"Command timed out after {timeout} seconds",
                command=" ".join(command),
            )

        except FileNotFoundError as e:
            return CommandResult(
                success=False,
                return_code=-1,
                stdout="",
                stderr=f"Command not found: {e}",
                command=" ".join(command),
            )

        except Exception as e:
            return CommandResult(
                success=False,
                return_code=-1,
                stdout="",
                stderr=f"Unexpected error: {e}",
                command=" ".join(command),
            )

    def get_repository_root(self) -> str:
        """Get the repository root directory path."""
        return self.repository_root

    def check_docker_available(self) -> bool:
        """Check if Docker is available and running."""
        try:
            result = subprocess.run(
                ["docker", "version"],
                capture_output=True,
                text=True,
                timeout=10,
                cwd=self.repository_root,
            )
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False

    def check_docker_compose_available(self) -> bool:
        """Check if Docker Compose is available."""
        try:
            result = subprocess.run(
                ["docker", "compose", "version"],
                capture_output=True,
                text=True,
                timeout=10,
                cwd=self.repository_root,
            )
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False
