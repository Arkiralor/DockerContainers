#!/usr/bin/env python3
"""Simple test script to validate TUI components."""

import sys


def test_components():
    """Test core TUI components."""
    try:
        from src.services.command_executor import CommandExecutor
        from src.config.services import get_all_services
        from src.services.docker_client import DockerClient

        print("Testing CommandExecutor...")
        executor = CommandExecutor()
        print(f"Repository root: {executor.get_repository_root()}")
        print(f"Docker available: {executor.check_docker_available()}")
        print(f"Docker Compose available: {executor.check_docker_compose_available()}")

        print("\nTesting service configuration...")
        services = get_all_services()
        print(f"Found {len(services)} services")
        for service in services:
            print(f"  - {service.name} ({service.container_name})")

        print("\nTesting Docker client...")
        docker_client = DockerClient()
        print(f"Docker connected: {docker_client.is_connected()}")
        if docker_client.is_connected():
            system_info = docker_client.get_system_info()
            if system_info:
                print(f"  Docker version: {system_info.version}")
                print(f"  Running containers: {system_info.containers_running}")
                print(f"  Total containers: {system_info.containers_total}")

        print("\nAll tests passed! ✅")
        return True

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_components()
    sys.exit(0 if success else 1)
