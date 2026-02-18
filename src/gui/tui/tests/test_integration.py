"""Integration tests for end-to-end workflows."""

from datetime import datetime
from unittest.mock import Mock, patch

import pytest

from src.config.services import get_all_services
from src.services.command_executor import CommandExecutor, CommandResult
from src.services.docker_client import ContainerStatus, DockerClient


@pytest.mark.integration
class TestServiceLifecycleIntegration:
    """Integration tests for complete service lifecycle."""

    @patch("src.services.docker_client.docker.from_env")
    @patch("src.services.command_executor.subprocess.run")
    def test_service_start_stop_workflow(
        self,
        mock_subprocess,
        mock_from_env,
        mock_docker_client,
        mock_container_running,
        mock_repository_root,
    ):
        """Test complete workflow of starting and stopping a service."""
        # Setup mocks
        mock_from_env.return_value = mock_docker_client
        mock_docker_client.containers.get.return_value = mock_container_running
        mock_subprocess.return_value = Mock(returncode=0, stdout="Success", stderr="")

        # Initialize clients
        docker_client = DockerClient()
        command_executor = CommandExecutor(str(mock_repository_root))

        # Step 1: Check initial status (should be running)
        status = docker_client.get_container_status("test-container")
        assert status.status == "running"

        # Step 2: Stop service
        result = command_executor.execute_make_command("stop-redis")
        assert result.success is True

        # Step 3: Check stopped status
        mock_container_running.status = "exited"
        mock_container_running.attrs["State"]["Status"] = "exited"
        status = docker_client.get_container_status("test-container")
        assert status.status == "exited"

        # Step 4: Start service again
        result = command_executor.execute_make_command("start-redis")
        assert result.success is True

    @patch("src.services.docker_client.docker.from_env")
    @patch("src.services.command_executor.subprocess.run")
    def test_multiple_services_status_check(
        self,
        mock_subprocess,
        mock_from_env,
        mock_docker_client,
        mock_container_running,
        mock_repository_root,
    ):
        """Test checking status of multiple services at once."""
        mock_from_env.return_value = mock_docker_client
        mock_docker_client.containers.get.return_value = mock_container_running
        mock_subprocess.return_value = Mock(returncode=0, stdout="", stderr="")

        docker_client = DockerClient()

        # Get all configured services
        services = get_all_services()
        container_names = [s.container_name for s in services]

        # Check status of all services
        statuses = docker_client.get_multiple_container_status(container_names)

        assert len(statuses) == len(container_names)
        for container_name in container_names:
            assert container_name in statuses
            assert isinstance(statuses[container_name], ContainerStatus)


@pytest.mark.integration
class TestCommandExecutorDockerClientIntegration:
    """Integration tests between CommandExecutor and Docker client."""

    @patch("src.services.docker_client.docker.from_env")
    @patch("src.services.command_executor.subprocess.run")
    def test_execute_command_and_verify_docker_status(
        self,
        mock_subprocess,
        mock_from_env,
        mock_docker_client,
        mock_container_running,
        mock_repository_root,
    ):
        """Test executing command and verifying via Docker client."""
        mock_from_env.return_value = mock_docker_client
        mock_docker_client.containers.get.return_value = mock_container_running
        mock_subprocess.return_value = Mock(returncode=0, stdout="Started", stderr="")

        command_executor = CommandExecutor(str(mock_repository_root))
        docker_client = DockerClient()

        # Execute start command
        result = command_executor.execute_make_command("start")
        assert result.success is True

        # Verify container is running via Docker
        status = docker_client.get_container_status("test-container")
        assert status.status == "running"

    @patch("src.services.docker_client.docker.from_env")
    @patch("src.services.command_executor.subprocess.run")
    def test_docker_check_before_command_execution(
        self, mock_subprocess, mock_from_env, mock_docker_client, mock_repository_root
    ):
        """Test checking Docker availability before executing commands."""
        mock_from_env.return_value = mock_docker_client
        mock_subprocess.return_value = Mock(returncode=0, stdout="", stderr="")

        command_executor = CommandExecutor(str(mock_repository_root))
        docker_client = DockerClient()

        # Verify Docker is available before command
        is_connected = docker_client.is_connected()
        assert is_connected is True

        # Execute command
        result = command_executor.execute_make_command("status")
        assert result.success is True


@pytest.mark.integration
class TestLogRetrievalIntegration:
    """Integration tests for log retrieval workflow."""

    @patch("src.services.docker_client.docker.from_env")
    def test_retrieve_and_process_logs(
        self, mock_from_env, mock_docker_client, mock_container_running
    ):
        """Test retrieving and processing container logs."""
        mock_from_env.return_value = mock_docker_client
        mock_docker_client.containers.get.return_value = mock_container_running

        docker_client = DockerClient()

        # Retrieve logs
        logs = docker_client.get_container_logs("test-container", tail=100)

        assert isinstance(logs, list)
        assert len(logs) > 0

        # Verify log format
        for log_line in logs:
            assert isinstance(log_line, str)

    @patch("src.services.docker_client.docker.from_env")
    def test_log_following_simulation(
        self, mock_from_env, mock_docker_client, mock_container_running
    ):
        """Test simulated log following behavior."""
        mock_from_env.return_value = mock_docker_client
        mock_docker_client.containers.get.return_value = mock_container_running

        docker_client = DockerClient()

        # First retrieval
        logs1 = docker_client.get_container_logs("test-container", tail=10)
        initial_count = len(logs1)

        # Simulate new logs
        mock_container_running.logs.return_value = (
            b"Log line 1\nLog line 2\nLog line 3\nNew log line 4\n"
        )

        # Second retrieval with timestamp
        logs2 = docker_client.get_container_logs(
            "test-container",
            tail=10,
            since=datetime.now(),
        )

        # Should have logs
        assert len(logs2) > 0


@pytest.mark.integration
class TestServiceConfigurationIntegration:
    """Integration tests using actual service configurations."""

    @patch("src.services.docker_client.docker.from_env")
    @patch("src.services.command_executor.subprocess.run")
    def test_configure_services_from_config(
        self,
        mock_subprocess,
        mock_from_env,
        mock_docker_client,
        mock_container_running,
        mock_repository_root,
    ):
        """Test using service configurations to manage services."""
        mock_from_env.return_value = mock_docker_client
        mock_docker_client.containers.get.return_value = mock_container_running
        mock_subprocess.return_value = Mock(returncode=0, stdout="", stderr="")

        services = get_all_services()
        docker_client = DockerClient()
        command_executor = CommandExecutor(str(mock_repository_root))

        # For each service, test start command
        for service in services[:2]:  # Test first 2 services
            # Get start command
            start_cmd = service.make_commands.get("start")
            assert start_cmd is not None

            # Execute start
            result = command_executor.execute_make_command(start_cmd)
            assert result.success is True

            # Check status
            status = docker_client.get_container_status(service.container_name)
            assert status is not None

    def test_service_dependencies_resolution(self):
        """Test resolving service dependencies."""
        services = get_all_services()

        # Build dependency map
        service_map = {s.id: s for s in services}

        # Find services with dependencies
        dependent_services = [s for s in services if s.depends_on]

        for service in dependent_services:
            # Verify dependencies exist
            for dep_id in service.depends_on:
                assert dep_id in service_map
                assert service_map[dep_id] is not None

            # Verify dependency start commands
            for dep_id in service.depends_on:
                dep_service = service_map[dep_id]
                assert "start" in dep_service.make_commands


@pytest.mark.integration
class TestErrorHandlingIntegration:
    """Integration tests for error handling across components."""

    @patch("src.services.docker_client.docker.from_env")
    @patch("src.services.command_executor.subprocess.run")
    def test_docker_unavailable_graceful_handling(
        self, mock_subprocess, mock_from_env, mock_repository_root
    ):
        """Test graceful handling when Docker is unavailable."""
        from docker.errors import DockerException

        mock_from_env.side_effect = DockerException("Docker daemon not running")
        # First call: make availability check (success)
        # Second call: docker availability check (failure)
        mock_subprocess.side_effect = [
            Mock(returncode=0, stdout="", stderr=""),  # make check
            Mock(returncode=1, stdout="", stderr="Docker not available"),  # docker check
        ]

        docker_client = DockerClient()
        command_executor = CommandExecutor(str(mock_repository_root))

        # Docker client should handle unavailable daemon
        is_connected = docker_client.is_connected()
        assert is_connected is False

        # Command executor should report Docker unavailability
        docker_available = command_executor.check_docker_available()
        assert docker_available is False

    @patch("src.services.docker_client.docker.from_env")
    @patch("src.services.command_executor.subprocess.run")
    def test_container_not_found_handling(
        self, mock_subprocess, mock_from_env, mock_docker_client, mock_repository_root
    ):
        """Test handling when container is not found."""
        from docker.errors import NotFound

        mock_from_env.return_value = mock_docker_client
        mock_docker_client.containers.get.side_effect = NotFound("Container not found")
        mock_subprocess.return_value = Mock(returncode=0, stdout="", stderr="")

        docker_client = DockerClient()
        command_executor = CommandExecutor(str(mock_repository_root))

        # Should return not_found status instead of raising
        status = docker_client.get_container_status("nonexistent")
        assert status.status == "not_found"
        assert status.error_message is not None

        # Commands should still execute
        result = command_executor.execute_make_command("status")
        assert isinstance(result, CommandResult)

    @patch("src.services.docker_client.docker.from_env")
    @patch("src.services.command_executor.subprocess.run")
    def test_partial_service_availability(
        self,
        mock_subprocess,
        mock_from_env,
        mock_docker_client,
        mock_container_running,
        mock_repository_root,
    ):
        """Test handling when some services are available and others aren't."""
        from docker.errors import NotFound

        def container_get_side_effect(name):
            if name == "available":
                return mock_container_running
            else:
                raise NotFound("Not found")

        mock_from_env.return_value = mock_docker_client
        mock_docker_client.containers.get.side_effect = container_get_side_effect
        mock_subprocess.return_value = Mock(returncode=0, stdout="", stderr="")

        docker_client = DockerClient()

        # Check multiple containers
        statuses = docker_client.get_multiple_container_status(
            ["available", "missing1", "missing2"]
        )

        assert len(statuses) == 3
        assert statuses["available"].status == "running"
        assert statuses["missing1"].status == "not_found"
        assert statuses["missing2"].status == "not_found"


@pytest.mark.integration
@pytest.mark.slow
class TestCompleteWorkflowIntegration:
    """Integration tests for complete workflows."""

    @patch("src.services.docker_client.docker.from_env")
    @patch("src.services.command_executor.subprocess.run")
    def test_complete_service_management_workflow(
        self,
        mock_subprocess,
        mock_from_env,
        mock_docker_client,
        mock_container_running,
        mock_container_stopped,
        mock_repository_root,
    ):
        """Test complete workflow: start -> check -> logs -> stop."""
        # Setup
        container_states = {"current": "stopped"}

        def get_container_side_effect(name):
            if container_states["current"] == "running":
                return mock_container_running
            else:
                return mock_container_stopped

        mock_from_env.return_value = mock_docker_client
        mock_docker_client.containers.get.side_effect = get_container_side_effect
        mock_subprocess.return_value = Mock(returncode=0, stdout="Success", stderr="")

        docker_client = DockerClient()
        command_executor = CommandExecutor(str(mock_repository_root))

        # 1. Initial status check (stopped)
        status = docker_client.get_container_status("test-container")
        assert status.status == "exited"

        # 2. Start service
        result = command_executor.execute_make_command("start-redis")
        assert result.success is True
        container_states["current"] = "running"

        # 3. Verify running
        status = docker_client.get_container_status("test-container")
        assert status.status == "running"

        # 4. Retrieve logs
        logs = docker_client.get_container_logs("test-container", tail=50)
        assert len(logs) > 0

        # 5. Stop service
        result = command_executor.execute_make_command("stop-redis")
        assert result.success is True
        container_states["current"] = "stopped"

        # 6. Verify stopped
        status = docker_client.get_container_status("test-container")
        assert status.status == "exited"

    @patch("src.services.docker_client.docker.from_env")
    @patch("src.services.command_executor.subprocess.run")
    def test_multi_service_orchestration(
        self,
        mock_subprocess,
        mock_from_env,
        mock_docker_client,
        mock_container_running,
        mock_repository_root,
    ):
        """Test orchestrating multiple services."""
        mock_from_env.return_value = mock_docker_client
        mock_docker_client.containers.get.return_value = mock_container_running
        mock_subprocess.return_value = Mock(returncode=0, stdout="", stderr="")

        services = get_all_services()
        docker_client = DockerClient()
        command_executor = CommandExecutor(str(mock_repository_root))

        # Start all services
        for service in services:
            if "start" in service.make_commands:
                result = command_executor.execute_make_command(
                    service.make_commands["start"]
                )
                assert isinstance(result, CommandResult)

        # Check status of all services
        container_names = [s.container_name for s in services]
        statuses = docker_client.get_multiple_container_status(container_names)

        assert len(statuses) == len(services)
