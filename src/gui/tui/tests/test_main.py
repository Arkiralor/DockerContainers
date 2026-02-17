"""Comprehensive tests for main.py entry point control flows.

Tests based on TUI_CONTROL_FLOW_ANALYSIS.md covering:
- CLI entry flow
- main() function control flow
- Refresh interval validation
- Prerequisites checking
- Repository root finding
- Docker availability checking
- Application initialization
- Error handling paths
"""

from pathlib import Path
from unittest.mock import Mock, patch

from click.testing import CliRunner

from src.main import check, cli, main, version


class TestCLIEntryFlow:
    """Tests for CLI entry flow paths."""

    def test_no_arguments_runs_main(self):
        """Test that running with no arguments invokes main()."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=Path("/tmp/repo")):
                with patch("src.main.DockerTUIApp") as mock_app:
                    with patch("src.services.command_executor.CommandExecutor"):
                        mock_app_instance = Mock()
                        mock_app.return_value = mock_app_instance

                        result = runner.invoke(main, ["--no-docker-check"])

                        mock_app.assert_called_once()

    def test_run_subcommand_invokes_main(self):
        """Test that 'run' subcommand invokes main."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=Path("/tmp/repo")):
                with patch("src.main.DockerTUIApp") as mock_app:
                    with patch("src.services.command_executor.CommandExecutor"):
                        mock_app_instance = Mock()
                        mock_app.return_value = mock_app_instance

                        result = runner.invoke(cli, ["run", "--no-docker-check"])

                        mock_app.assert_called_once()

    def test_check_subcommand_runs_check(self):
        """Test that 'check' subcommand executes check function."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=Path("/tmp/repo")):
                with patch("src.services.command_executor.CommandExecutor"):
                    result = runner.invoke(cli, ["check"])

                    assert result.exit_code == 0
                    assert "Prerequisites" in result.output

    def test_version_subcommand_shows_version(self):
        """Test that 'version' subcommand shows version information."""
        runner = CliRunner()
        result = runner.invoke(cli, ["version"])

        assert result.exit_code == 0
        assert "0.1.0" in result.output
        assert "Docker Container TUI" in result.output


class TestRefreshIntervalValidation:
    """Tests for refresh interval validation (Control Flow: lines 66-70)."""

    def test_refresh_interval_too_low_exits(self):
        """Test that refresh interval < 1 causes exit(1)."""
        runner = CliRunner()
        result = runner.invoke(main, ["--refresh-interval", "0"])

        assert result.exit_code == 1
        assert "ERROR" in result.output
        assert "between 1 and 300" in result.output

    def test_refresh_interval_too_high_exits(self):
        """Test that refresh interval > 300 causes exit(1)."""
        runner = CliRunner()
        result = runner.invoke(main, ["--refresh-interval", "301"])

        assert result.exit_code == 1
        assert "ERROR" in result.output
        assert "between 1 and 300" in result.output

    def test_refresh_interval_minimum_valid(self):
        """Test that refresh interval = 1 is valid."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=Path("/tmp/repo")):
                with patch("src.main.DockerTUIApp") as mock_app:
                    with patch("src.services.command_executor.CommandExecutor"):
                        mock_app_instance = Mock()
                        mock_app.return_value = mock_app_instance

                        result = runner.invoke(
                            main, ["--refresh-interval", "1", "--no-docker-check"]
                        )

                        assert mock_app_instance.refresh_interval == 1

    def test_refresh_interval_maximum_valid(self):
        """Test that refresh interval = 300 is valid."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=Path("/tmp/repo")):
                with patch("src.main.DockerTUIApp") as mock_app:
                    with patch("src.services.command_executor.CommandExecutor"):
                        mock_app_instance = Mock()
                        mock_app.return_value = mock_app_instance

                        result = runner.invoke(
                            main, ["--refresh-interval", "300", "--no-docker-check"]
                        )

                        assert mock_app_instance.refresh_interval == 300

    def test_refresh_interval_default_value(self):
        """Test that default refresh interval is 5 seconds."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=Path("/tmp/repo")):
                with patch("src.main.DockerTUIApp") as mock_app:
                    with patch("src.services.command_executor.CommandExecutor"):
                        mock_app_instance = Mock()
                        mock_app.return_value = mock_app_instance

                        result = runner.invoke(main, ["--no-docker-check"])

                        assert mock_app_instance.refresh_interval == 5


class TestPrerequisitesChecking:
    """Tests for prerequisites checking (Control Flow: lines 72-80)."""

    def test_prerequisites_pass_continues(self):
        """Test that passing prerequisites allows continuation."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=Path("/tmp/repo")):
                with patch("src.main.DockerTUIApp") as mock_app:
                    with patch("src.services.command_executor.CommandExecutor"):
                        mock_app_instance = Mock()
                        mock_app.return_value = mock_app_instance

                        result = runner.invoke(main, ["--no-docker-check"])

                        mock_app.assert_called_once()

    def test_prerequisites_fail_exits(self):
        """Test that failing prerequisites causes exit(1)."""
        runner = CliRunner()

        with patch(
            "src.main.check_prerequisites",
            return_value=(False, ["Python version too low", "Missing src/ directory"]),
        ):
            result = runner.invoke(main)

            assert result.exit_code == 1
            assert "ERROR" in result.output
            assert "Prerequisites check failed" in result.output
            assert "Python version too low" in result.output

    def test_prerequisites_check_called_with_debug(self):
        """Test that debug mode outputs debug messages."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(False, ["Error"])):
            result = runner.invoke(main, ["--debug"])

            assert "DEBUG" in result.output


class TestRepositoryRootFinding:
    """Tests for repository root finding (Control Flow: lines 82-93)."""

    def test_repository_root_provided_uses_it(self):
        """Test that providing --repository-root uses that path."""
        runner = CliRunner()
        custom_path = Path("/custom/repo")

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.DockerTUIApp") as mock_app:
                with patch("src.services.command_executor.CommandExecutor"):
                    with patch("src.main.find_repository_root") as mock_find:
                        mock_app_instance = Mock()
                        mock_executor = Mock()
                        mock_executor.repository_root = str(custom_path)
                        mock_app_instance.command_executor = mock_executor
                        mock_app.return_value = mock_app_instance

                        result = runner.invoke(
                            main,
                            [
                                "--repository-root",
                                str(custom_path),
                                "--no-docker-check",
                            ],
                        )

                        # find_repository_root should not be called
                        mock_find.assert_not_called()
                        assert (
                            mock_app_instance.command_executor.repository_root
                            == str(custom_path)
                        )

    def test_repository_root_not_provided_auto_finds(self):
        """Test that not providing --repository-root triggers auto-find."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch(
                "src.main.find_repository_root", return_value=Path("/found/repo")
            ) as mock_find:
                with patch("src.main.DockerTUIApp") as mock_app:
                    with patch("src.services.command_executor.CommandExecutor"):
                        mock_app_instance = Mock()
                        mock_app.return_value = mock_app_instance

                        result = runner.invoke(main, ["--no-docker-check"])

                        mock_find.assert_called_once()

    def test_repository_root_not_found_exits(self):
        """Test that not finding repository root causes exit(1)."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=None):
                result = runner.invoke(main)

                assert result.exit_code == 1
                assert "ERROR" in result.output
                assert (
                    "Could not find DockerContainers repository root" in result.output
                )


class TestDockerAvailabilityChecking:
    """Tests for Docker availability checking (Control Flow: lines 98-128)."""

    def test_no_docker_check_flag_skips_check(self):
        """Test that --no-docker-check skips Docker checking."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=Path("/tmp/repo")):
                with patch("src.services.command_executor.CommandExecutor") as mock_executor_class:
                    with patch("src.main.DockerTUIApp") as mock_app:
                        mock_app_instance = Mock()
                        mock_app.return_value = mock_app_instance

                        result = runner.invoke(main, ["--no-docker-check"])

                        # CommandExecutor should not be called for Docker check
                        assert "Checking Docker availability" not in result.output

    def test_docker_available_continues(self):
        """Test that Docker being available allows continuation."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=Path("/tmp/repo")):
                with patch("src.services.command_executor.CommandExecutor") as mock_executor_class:
                    mock_executor = Mock()
                    mock_executor.check_docker_available.return_value = True
                    mock_executor.check_docker_compose_available.return_value = True
                    mock_executor_class.return_value = mock_executor

                    with patch("src.main.DockerTUIApp") as mock_app:
                        mock_app_instance = Mock()
                        mock_app.return_value = mock_app_instance

                        result = runner.invoke(main)

                        assert "Docker is available" in result.output
                        assert "Docker Compose is available" in result.output

    def test_docker_not_available_prompts_user(self):
        """Test that Docker not available prompts user to continue."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=Path("/tmp/repo")):
                with patch("src.services.command_executor.CommandExecutor") as mock_executor_class:
                    mock_executor = Mock()
                    mock_executor.check_docker_available.return_value = False
                    mock_executor_class.return_value = mock_executor

                    # User says no
                    result = runner.invoke(main, input="n\\n")

                    assert result.exit_code == 1
                    assert "WARNING" in result.output
                    assert "Docker not available" in result.output

    def test_docker_not_available_user_continues(self):
        """Test that user can choose to continue without Docker."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=Path("/tmp/repo")):
                with patch("src.services.command_executor.CommandExecutor") as mock_executor_class:
                    mock_executor = Mock()
                    mock_executor.check_docker_available.return_value = False
                    mock_executor_class.return_value = mock_executor

                    with patch("src.main.DockerTUIApp") as mock_app:
                        mock_app_instance = Mock()
                        mock_app.return_value = mock_app_instance

                        # User says yes
                        result = runner.invoke(main, input="y\\n")

                        mock_app.assert_called_once()

    def test_docker_compose_not_available_shows_warning(self):
        """Test that Docker Compose not available shows warning."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=Path("/tmp/repo")):
                with patch("src.services.command_executor.CommandExecutor") as mock_executor_class:
                    mock_executor = Mock()
                    mock_executor.check_docker_available.return_value = True
                    mock_executor.check_docker_compose_available.return_value = False
                    mock_executor_class.return_value = mock_executor

                    with patch("src.main.DockerTUIApp") as mock_app:
                        mock_app_instance = Mock()
                        mock_app.return_value = mock_app_instance

                        result = runner.invoke(main)

                        assert "WARNING" in result.output
                        assert "Docker Compose not available" in result.output

    def test_docker_check_exception_shows_warning(self):
        """Test that exception during Docker check shows warning."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=Path("/tmp/repo")):
                with patch(
                    "src.main.CommandExecutor",
                    side_effect=Exception("Connection error"),
                ):
                    with patch("src.main.DockerTUIApp") as mock_app:
                        mock_app_instance = Mock()
                        mock_app.return_value = mock_app_instance

                        result = runner.invoke(main, ["--debug"])

                        assert "WARNING" in result.output
                        assert "Could not check Docker status" in result.output
                        assert "DEBUG" in result.output


class TestApplicationInitialization:
    """Tests for application initialization (Control Flow: lines 130-158)."""

    def test_application_starts_successfully(self):
        """Test that application starts with valid configuration."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=Path("/tmp/repo")):
                with patch("src.main.DockerTUIApp") as mock_app:
                    with patch("src.services.command_executor.CommandExecutor"):
                        mock_app_instance = Mock()
                        mock_app.return_value = mock_app_instance

                        result = runner.invoke(main, ["--no-docker-check"])

                        mock_app.assert_called_once()
                        mock_app_instance.run.assert_called_once()

    def test_refresh_interval_applied_to_app(self):
        """Test that refresh interval is applied to app."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=Path("/tmp/repo")):
                with patch("src.main.DockerTUIApp") as mock_app:
                    with patch("src.services.command_executor.CommandExecutor"):
                        mock_app_instance = Mock()
                        mock_app.return_value = mock_app_instance

                        result = runner.invoke(
                            main, ["--refresh-interval", "10", "--no-docker-check"]
                        )

                        assert mock_app_instance.refresh_interval == 10

    def test_keyboard_interrupt_exits_cleanly(self):
        """Test that KeyboardInterrupt causes clean exit."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=Path("/tmp/repo")):
                with patch("src.main.DockerTUIApp") as mock_app:
                    with patch("src.services.command_executor.CommandExecutor"):
                        mock_app_instance = Mock()
                        mock_app_instance.run.side_effect = KeyboardInterrupt()
                        mock_app.return_value = mock_app_instance

                        result = runner.invoke(main, ["--no-docker-check"])

                        assert result.exit_code == 0
                        assert "Goodbye" in result.output

    def test_application_exception_exits_with_error(self):
        """Test that application exception causes error exit."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=Path("/tmp/repo")):
                with patch("src.main.DockerTUIApp") as mock_app:
                    with patch("src.services.command_executor.CommandExecutor"):
                        mock_app_instance = Mock()
                        mock_app_instance.run.side_effect = Exception(
                            "Application crashed"
                        )
                        mock_app.return_value = mock_app_instance

                        result = runner.invoke(main, ["--no-docker-check"])

                        assert result.exit_code == 1
                        assert "ERROR" in result.output
                        assert "Application error" in result.output

    def test_debug_mode_shows_full_traceback(self):
        """Test that debug mode shows full traceback on error."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=Path("/tmp/repo")):
                with patch("src.main.DockerTUIApp") as mock_app:
                    with patch("src.services.command_executor.CommandExecutor"):
                        mock_app_instance = Mock()
                        mock_app_instance.run.side_effect = Exception("Test error")
                        mock_app.return_value = mock_app_instance

                        result = runner.invoke(main, ["--debug", "--no-docker-check"])

                        assert "DEBUG" in result.output
                        assert (
                            "Traceback" in result.output or "traceback" in result.output
                        )


class TestCheckCommand:
    """Tests for check command control flow."""

    def test_check_prerequisites_success(self):
        """Test check command with successful prerequisites."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=Path("/tmp/repo")):
                with patch("src.services.command_executor.CommandExecutor") as mock_executor_class:
                    mock_executor = Mock()
                    mock_executor.check_docker_available.return_value = True
                    mock_executor.check_docker_compose_available.return_value = True
                    mock_executor_class.return_value = mock_executor

                    with patch("src.main.get_all_services", return_value=[]):
                        result = runner.invoke(check)

                        assert result.exit_code == 0
                        assert "[OK]" in result.output
                        assert "Ready to run" in result.output

    def test_check_prerequisites_failure(self):
        """Test check command with failed prerequisites."""
        runner = CliRunner()

        with patch(
            "src.main.check_prerequisites", return_value=(False, ["Error 1", "Error 2"])
        ):
            result = runner.invoke(check)

            assert "[FAIL]" in result.output
            assert "Error 1" in result.output

    def test_check_repository_not_found(self):
        """Test check command when repository not found."""
        runner = CliRunner()

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=None):
                result = runner.invoke(check)

                assert "[FAIL]" in result.output
                assert "Not found" in result.output

    def test_check_shows_service_count(self):
        """Test check command shows service configurations."""
        runner = CliRunner()

        mock_services = [
            Mock(name="Redis", container_name="redis"),
            Mock(name="PostgreSQL", container_name="postgres"),
        ]

        with patch("src.main.check_prerequisites", return_value=(True, [])):
            with patch("src.main.find_repository_root", return_value=Path("/tmp/repo")):
                with patch("src.services.command_executor.CommandExecutor") as mock_executor_class:
                    mock_executor = Mock()
                    mock_executor.check_docker_available.return_value = True
                    mock_executor.check_docker_compose_available.return_value = True
                    mock_executor_class.return_value = mock_executor

                    with patch("src.main.get_all_services", return_value=mock_services):
                        result = runner.invoke(check)

                        assert "Found 2 configured services" in result.output
                        assert "Redis" in result.output
                        assert "PostgreSQL" in result.output


class TestVersionCommand:
    """Tests for version command."""

    def test_version_shows_correct_version(self):
        """Test that version command shows correct version."""
        runner = CliRunner()
        result = runner.invoke(version)

        assert result.exit_code == 0
        assert "0.1.0" in result.output

    def test_version_shows_description(self):
        """Test that version command shows description."""
        runner = CliRunner()
        result = runner.invoke(version)

        assert "Repository-specific" in result.output
