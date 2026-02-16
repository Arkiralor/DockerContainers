"""Docker client for read-only status checking and log retrieval.

This module provides Docker API integration for monitoring container status,
health checks, and log viewing. It does NOT perform container operations -
those are handled through Makefile commands via CommandExecutor.
"""

import docker
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Union
from docker.errors import DockerException, NotFound, APIError


@dataclass
class ContainerStatus:
    """Container status information."""

    name: str
    status: str  # "running", "stopped", "not_found", "error"
    health: Optional[str] = None  # "healthy", "unhealthy", "starting", None
    created_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    ports: Optional[Dict[str, str]] = None
    image: Optional[str] = None
    error_message: Optional[str] = None


@dataclass
class SystemInfo:
    """Docker system information."""

    version: str
    containers_running: int
    containers_total: int
    images_total: int
    volumes_total: int
    disk_usage: Optional[Dict[str, Union[int, str]]] = None


class DockerClient:
    """Docker API client for read-only operations."""

    def __init__(self):
        """Initialize Docker client."""
        self._client: Optional[docker.DockerClient] = None
        self._connect()

    def _connect(self) -> bool:
        """Connect to Docker daemon.

        Returns:
            True if connection successful, False otherwise
        """
        try:
            self._client = docker.from_env()
            # Test connection
            self._client.ping()
            return True
        except DockerException:
            self._client = None
            return False

    def is_connected(self) -> bool:
        """Check if connected to Docker daemon."""
        if not self._client:
            return False

        try:
            self._client.ping()
            return True
        except DockerException:
            return False

    def reconnect(self) -> bool:
        """Attempt to reconnect to Docker daemon."""
        return self._connect()

    def get_container_status(self, container_name: str) -> ContainerStatus:
        """Get status of a specific container.

        Args:
            container_name: Name of the container to check

        Returns:
            ContainerStatus with current status information
        """
        if not self._client:
            return ContainerStatus(
                name=container_name,
                status="error",
                error_message="Docker client not connected",
            )

        try:
            container = self._client.containers.get(container_name)

            # Parse port mappings
            ports = {}
            if container.attrs.get("NetworkSettings", {}).get("Ports"):
                for container_port, host_configs in container.attrs["NetworkSettings"][
                    "Ports"
                ].items():
                    if host_configs:
                        host_port = host_configs[0]["HostPort"]
                        ports[container_port] = host_port

            # Parse timestamps
            created_at = None
            started_at = None
            try:
                if container.attrs.get("Created"):
                    created_at = datetime.fromisoformat(
                        container.attrs["Created"].replace("Z", "+00:00")
                    )
                if container.attrs.get("State", {}).get("StartedAt"):
                    started_at = datetime.fromisoformat(
                        container.attrs["State"]["StartedAt"].replace("Z", "+00:00")
                    )
            except (ValueError, KeyError):
                pass  # Handle invalid timestamp formats gracefully

            # Get health status if available
            health = None
            if container.attrs.get("State", {}).get("Health"):
                health = container.attrs["State"]["Health"].get("Status")

            return ContainerStatus(
                name=container_name,
                status=container.status,
                health=health,
                created_at=created_at,
                started_at=started_at,
                ports=ports,
                image=container.attrs.get("Config", {}).get("Image", ""),
                error_message=None,
            )

        except NotFound:
            return ContainerStatus(
                name=container_name,
                status="not_found",
                error_message=f"Container '{container_name}' not found",
            )

        except APIError as e:
            return ContainerStatus(
                name=container_name,
                status="error",
                error_message=f"Docker API error: {e}",
            )

        except Exception as e:
            return ContainerStatus(
                name=container_name,
                status="error",
                error_message=f"Unexpected error: {e}",
            )

    def get_multiple_container_status(
        self, container_names: List[str]
    ) -> Dict[str, ContainerStatus]:
        """Get status of multiple containers.

        Args:
            container_names: List of container names to check

        Returns:
            Dictionary mapping container names to their status
        """
        statuses = {}
        for name in container_names:
            statuses[name] = self.get_container_status(name)
        return statuses

    def get_container_logs(
        self,
        container_name: str,
        tail: int = 100,
        since: Optional[datetime] = None,
        follow: bool = False,
    ) -> List[str]:
        """Get logs from a container.

        Args:
            container_name: Name of the container
            tail: Number of lines to retrieve from end of logs
            since: Only return logs since this timestamp
            follow: Stream logs (for real-time viewing)

        Returns:
            List of log lines
        """
        if not self._client:
            return ["ERROR: Docker client not connected"]

        try:
            container = self._client.containers.get(container_name)

            logs_kwargs = {
                "tail": tail,
                "stdout": True,
                "stderr": True,
                "timestamps": True,
                "follow": follow,
            }

            if since:
                logs_kwargs["since"] = since

            logs = container.logs(**logs_kwargs)

            if isinstance(logs, bytes):
                logs_text = logs.decode("utf-8", errors="replace")
            else:
                # Generator for streaming logs
                return logs

            return [line.strip() for line in logs_text.split("\n") if line.strip()]

        except NotFound:
            return [f"ERROR: Container '{container_name}' not found"]

        except APIError as e:
            return [f"ERROR: Docker API error: {e}"]

        except Exception as e:
            return [f"ERROR: Unexpected error: {e}"]

    def get_system_info(self) -> Optional[SystemInfo]:
        """Get Docker system information.

        Returns:
            SystemInfo with Docker system details or None if error
        """
        if not self._client:
            return None

        try:
            info = self._client.info()
            version_info = self._client.version()

            # Count containers by status
            containers = self._client.containers.list(all=True)
            running_containers = len([c for c in containers if c.status == "running"])

            # Get images and volumes count
            images = self._client.images.list()
            volumes = self._client.volumes.list()

            return SystemInfo(
                version=version_info.get("Version", "Unknown"),
                containers_running=running_containers,
                containers_total=len(containers),
                images_total=len(images),
                volumes_total=len(volumes),
            )

        except Exception:
            return None

    def list_all_containers(self) -> List[Dict[str, str]]:
        """List all containers (running and stopped).

        Returns:
            List of dictionaries with container information
        """
        if not self._client:
            return []

        try:
            containers = self._client.containers.list(all=True)
            return [
                {
                    "name": container.name,
                    "status": container.status,
                    "image": container.attrs.get("Config", {}).get("Image", ""),
                    "created": container.attrs.get("Created", ""),
                }
                for container in containers
            ]
        except Exception:
            return []

    def close(self):
        """Close Docker client connection."""
        if self._client:
            try:
                self._client.close()
            except Exception:
                pass  # Ignore errors when closing
            finally:
                self._client = None
