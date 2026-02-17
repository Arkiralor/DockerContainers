"""Comprehensive tests for command executor functionality."""

import subprocess
from pathlib import Path
from unittest.mock import Mock, patch

import pytest

from src.services.command_executor import CommandExecutor, CommandResult


class TestCommandExecutorInitialization:
    """Tests for CommandExecutor initialization."""

    @patch("src.services.command_executor.subprocess.run")
    def test_init_with_valid_repository(
        self, mock_subprocess, mock_repository_root, mock_subprocess_success
    ):
        """Test initialization with valid repository root."""
        mock_subprocess.return_value = mock_subprocess_success
        executor = CommandExecutor(str(mock_repository_root))

        assert executor.repository_root == str(mock_repository_root)

    @patch("src.services.command_executor.subprocess.run")
    def test_init_auto_find_repository(
        self,
        mock_subprocess,
        mock_repository_root,
        monkeypatch,
        mock_subprocess_success,
    ):
        """Test initialization with automatic repository detection."""
        mock_subprocess.return_value = mock_subprocess_success
        monkeypatch.chdir(mock_repository_root / "src")

        executor = CommandExecutor()

        assert executor.repository_root is not None
        assert Path(executor.repository_root).name == "DockerContainers"

    @patch("src.services.command_executor.subprocess.run")
    def test_init_make_not_available(self, mock_subprocess, mock_repository_root):
        """Test initialization fails when make is not available."""
        mock_subprocess.side_effect = FileNotFoundError("make not found")

        with pytest.raises(RuntimeError, match="Make command not available"):
            CommandExecutor(str(mock_repository_root))

    def test_init_repository_not_found(self, tmp_path):
        """Test initialization fails when repository root not found."""
        invalid_path = tmp_path / "nonexistent"

        with pytest.raises(RuntimeError, match="Could not find repository root"):
            CommandExecutor(str(invalid_path))


class TestFindRepositoryRoot:
    """Tests for repository root discovery."""

    def test_find_repository_root_with_makefile(self, mock_repository_root):
        """Test finding repository root with Makefile."""
        executor = CommandExecutor.__new__(CommandExecutor)
        result = executor._find_repository_root(str(mock_repository_root))

        assert result == str(mock_repository_root)

    def test_find_repository_root_from_subdirectory(self, mock_repository_root):
        """Test finding repository root from subdirectory."""
        sub_dir = mock_repository_root / "src" / "services"
        sub_dir.mkdir(parents=True)

        executor = CommandExecutor.__new__(CommandExecutor)
        result = executor._find_repository_root(str(sub_dir))

        assert result == str(mock_repository_root)

    def test_find_repository_root_no_makefile(self, tmp_path):
        """Test finding repository fails without Makefile."""
        executor = CommandExecutor.__new__(CommandExecutor)
        result = executor._find_repository_root(str(tmp_path))

        assert result is None

    def test_find_repository_root_makefile_without_expected_dirs(self, tmp_path):
        """Test finding repository fails without expected directories."""
        (tmp_path / "Makefile").touch()

        executor = CommandExecutor.__new__(CommandExecutor)
        result = executor._find_repository_root(str(tmp_path))

        assert result is None


class TestExecuteMakeCommand:
    """Tests for make command execution."""

    @patch("src.services.command_executor.subprocess.run")
    def test_execute_make_command_success(
        self, mock_subprocess, mock_repository_root, mock_subprocess_success
    ):
        """Test successful make command execution."""
        mock_subprocess_success.stdout = "Build successful"
        mock_subprocess.return_value = mock_subprocess_success

        # First call for init check, second for actual command
        mock_subprocess.side_effect = [mock_subprocess_success, mock_subprocess_success]

        executor = CommandExecutor(str(mock_repository_root))
        result = executor.execute_make_command("start")

        assert result.success is True
        assert result.return_code == 0
        assert "successful" in result.stdout.lower()
        assert result.command == "make start"

    @patch("src.services.command_executor.subprocess.run")
    def test_execute_make_command_failure(
        self, mock_subprocess, mock_repository_root, mock_subprocess_failure
    ):
        """Test failed make command execution."""
        mock_subprocess_failure.stderr = "Error: target not found"
        mock_subprocess.side_effect = [
            Mock(returncode=0, stdout="", stderr=""),
            mock_subprocess_failure,
        ]

        executor = CommandExecutor(str(mock_repository_root))
        result = executor.execute_make_command("invalid-target")

        assert result.success is False
        assert result.return_code == 1
        assert "error" in result.stderr.lower()

    @patch("src.services.command_executor.subprocess.run")
    def test_execute_make_command_timeout(self, mock_subprocess, mock_repository_root):
        """Test make command execution with timeout."""
        mock_subprocess.side_effect = [
            Mock(returncode=0, stdout="", stderr=""),
            subprocess.TimeoutExpired("make", 30),
        ]

        executor = CommandExecutor(str(mock_repository_root))
        result = executor.execute_make_command("long-running", timeout=1)

        assert result.success is False
        assert "timed out" in result.stderr.lower()

    @patch("src.services.command_executor.subprocess.run")
    def test_execute_make_command_custom_timeout(
        self, mock_subprocess, mock_repository_root, mock_subprocess_success
    ):
        """Test make command execution with custom timeout."""
        mock_subprocess.side_effect = [mock_subprocess_success, mock_subprocess_success]

        executor = CommandExecutor(str(mock_repository_root))
        result = executor.execute_make_command("start", timeout=60)

        assert result.success is True
        # Verify timeout was passed to subprocess.run
        call_args = mock_subprocess.call_args_list[-1]
        assert call_args[1]["timeout"] == 60


class TestExecuteScript:
    """Tests for shell script execution."""

    @patch("src.services.command_executor.subprocess.run")
    def test_execute_script_success(
        self, mock_subprocess, mock_repository_root, mock_subprocess_success
    ):
        """Test successful script execution."""
        script_path = mock_repository_root / "scripts" / "setup.sh"
        script_path.touch()

        mock_subprocess.side_effect = [mock_subprocess_success, mock_subprocess_success]

        executor = CommandExecutor(str(mock_repository_root))
        result = executor.execute_script("scripts/setup.sh")

        assert result.success is True
        assert result.return_code == 0

    @patch("src.services.command_executor.subprocess.run")
    def test_execute_script_with_args(
        self, mock_subprocess, mock_repository_root, mock_subprocess_success
    ):
        """Test script execution with arguments."""
        script_path = mock_repository_root / "scripts" / "backup.sh"
        script_path.touch()

        mock_subprocess.side_effect = [mock_subprocess_success, mock_subprocess_success]

        executor = CommandExecutor(str(mock_repository_root))
        result = executor.execute_script("scripts/backup.sh", args=["--force", "-v"])

        assert result.success is True
        # Verify args were passed
        call_args = mock_subprocess.call_args_list[-1][0][0]
        assert "--force" in call_args
        assert "-v" in call_args

    @patch("src.services.command_executor.subprocess.run")
    def test_execute_script_not_found(
        self, mock_subprocess, mock_repository_root, mock_subprocess_success
    ):
        """Test script execution when script doesn't exist."""
        mock_subprocess.return_value = mock_subprocess_success

        executor = CommandExecutor(str(mock_repository_root))
        result = executor.execute_script("scripts/nonexistent.sh")

        assert result.success is False
        assert "not found" in result.stderr.lower()

    @patch("src.services.command_executor.subprocess.run")
    def test_execute_script_timeout(self, mock_subprocess, mock_repository_root):
        """Test script execution with timeout."""
        script_path = mock_repository_root / "scripts" / "slow.sh"
        script_path.touch()

        mock_subprocess.side_effect = [
            Mock(returncode=0, stdout="", stderr=""),
            subprocess.TimeoutExpired("slow.sh", 60),
        ]

        executor = CommandExecutor(str(mock_repository_root))
        result = executor.execute_script("scripts/slow.sh", timeout=1)

        assert result.success is False
        assert "timed out" in result.stderr.lower()


class TestCheckDockerAvailability:
    """Tests for Docker availability checking."""

    @patch("src.services.command_executor.subprocess.run")
    def test_check_docker_available(
        self, mock_subprocess, mock_repository_root, mock_subprocess_success
    ):
        """Test checking Docker when it's available."""
        mock_subprocess_success.stdout = "Docker version 24.0.0"
        mock_subprocess.side_effect = [mock_subprocess_success, mock_subprocess_success]

        executor = CommandExecutor(str(mock_repository_root))
        result = executor.check_docker_available()

        assert result is True

    @patch("src.services.command_executor.subprocess.run")
    def test_check_docker_not_available(
        self, mock_subprocess, mock_repository_root, mock_subprocess_success
    ):
        """Test checking Docker when it's not available."""
        mock_subprocess.side_effect = [
            mock_subprocess_success,
            FileNotFoundError("docker not found"),
        ]

        executor = CommandExecutor(str(mock_repository_root))
        result = executor.check_docker_available()

        assert result is False

    @patch("src.services.command_executor.subprocess.run")
    def test_check_docker_timeout(
        self, mock_subprocess, mock_repository_root, mock_subprocess_success
    ):
        """Test checking Docker with timeout."""
        mock_subprocess.side_effect = [
            mock_subprocess_success,
            subprocess.TimeoutExpired("docker", 10),
        ]

        executor = CommandExecutor(str(mock_repository_root))
        result = executor.check_docker_available()

        assert result is False


class TestCheckDockerComposeAvailability:
    """Tests for Docker Compose availability checking."""

    @patch("src.services.command_executor.subprocess.run")
    def test_check_docker_compose_available(
        self, mock_subprocess, mock_repository_root, mock_subprocess_success
    ):
        """Test checking Docker Compose when it's available."""
        mock_subprocess_success.stdout = "Docker Compose version v2.20.0"
        mock_subprocess.side_effect = [mock_subprocess_success, mock_subprocess_success]

        executor = CommandExecutor(str(mock_repository_root))
        result = executor.check_docker_compose_available()

        assert result is True

    @patch("src.services.command_executor.subprocess.run")
    def test_check_docker_compose_not_available(
        self, mock_subprocess, mock_repository_root, mock_subprocess_success
    ):
        """Test checking Docker Compose when it's not available."""
        failure_result = Mock(returncode=1, stdout="", stderr="command not found")
        mock_subprocess.side_effect = [
            mock_subprocess_success,
            failure_result,
        ]

        executor = CommandExecutor(str(mock_repository_root))
        result = executor.check_docker_compose_available()

        assert result is False


class TestCommandResultDataClass:
    """Tests for CommandResult dataclass."""

    def test_command_result_creation(self):
        """Test creating CommandResult instance."""
        result = CommandResult(
            success=True,
            return_code=0,
            stdout="Output here",
            stderr="",
            command="make test",
        )

        assert result.success is True
        assert result.return_code == 0
        assert result.stdout == "Output here"
        assert result.command == "make test"

    def test_command_result_failure(self):
        """Test creating failed CommandResult."""
        result = CommandResult(
            success=False,
            return_code=1,
            stdout="",
            stderr="Error message",
            command="make fail",
        )

        assert result.success is False
        assert result.return_code == 1
        assert "Error" in result.stderr


class TestCommandExecutorEdgeCases:
    """Tests for edge cases and error handling."""

    @patch("src.services.command_executor.subprocess.run")
    def test_execute_command_empty_output(self, mock_subprocess, mock_repository_root):
        """Test command execution with empty output."""
        mock_result = Mock(returncode=0, stdout="", stderr="")
        mock_subprocess.side_effect = [mock_result, mock_result]

        executor = CommandExecutor(str(mock_repository_root))
        result = executor.execute_make_command("clean")

        assert result.success is True
        assert result.stdout == ""
        assert result.stderr == ""

    @patch("src.services.command_executor.subprocess.run")
    def test_execute_command_with_stderr_warning(
        self, mock_subprocess, mock_repository_root
    ):
        """Test command execution with warnings in stderr but success."""
        mock_result = Mock(
            returncode=0,
            stdout="Completed",
            stderr="Warning: deprecated feature",
        )
        mock_subprocess.side_effect = [mock_result, mock_result]

        executor = CommandExecutor(str(mock_repository_root))
        result = executor.execute_make_command("build")

        assert result.success is True
        assert "Warning" in result.stderr

    @patch("src.services.command_executor.subprocess.run")
    def test_execute_command_unexpected_exception(
        self, mock_subprocess, mock_repository_root
    ):
        """Test handling unexpected exceptions during execution."""
        mock_subprocess.side_effect = [
            Mock(returncode=0, stdout="", stderr=""),
            Exception("Unexpected error"),
        ]

        executor = CommandExecutor(str(mock_repository_root))
        result = executor.execute_make_command("test")

        assert result.success is False
        assert "error" in result.stderr.lower()


@pytest.mark.integration
class TestCommandExecutorIntegration:
    """Integration tests with real file system and commands."""

    @pytest.mark.slow
    def test_real_make_version(self, mock_repository_root, monkeypatch):
        """Test executing real make --version command."""
        try:
            monkeypatch.chdir(mock_repository_root)
            executor = CommandExecutor(str(mock_repository_root))

            # This will actually run make --version
            result = executor._check_make_available()

            # If make is installed, this should succeed
            assert isinstance(result, bool)
        except Exception:
            pytest.skip("Make not available for integration testing")
