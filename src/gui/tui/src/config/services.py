"""Hardcoded service definitions matching the web UI configuration.

This module defines the Docker services that this TUI can manage.
These are repository-specific services defined in src/ directories.
"""

from dataclasses import dataclass


@dataclass
class ServicePort:
    """Represents a port configuration for a service."""

    container: int
    host: int
    description: str


@dataclass
class ServiceConfig:
    """Configuration for a Docker service managed by this repository."""

    id: str
    name: str
    description: str
    container_name: str
    ports: list[ServicePort]
    make_commands: dict[str, str]
    compose_file_path: str
    depends_on: list[str] | None = None


# Hardcoded service definitions matching web UI
SERVICES: dict[str, ServiceConfig] = {
    "postgresql": ServiceConfig(
        id="postgresql",
        name="PostgreSQL",
        description="PostgreSQL database server for local development",
        container_name="postgres",
        ports=[ServicePort(container=5432, host=5432, description="PostgreSQL")],
        make_commands={
            "start": "start-postgres",
            "stop": "stop-postgres",
            "logs": "logs-postgres",
            "shell": "shell-postgres",
        },
        compose_file_path="src/postgresql/docker-compose.yml",
    ),
    "redis": ServiceConfig(
        id="redis",
        name="Redis",
        description="Redis cache and message broker for local development",
        container_name="redis",
        ports=[ServicePort(container=6379, host=6379, description="Redis")],
        make_commands={
            "start": "start-redis",
            "stop": "stop-redis",
            "logs": "logs-redis",
            "shell": "shell-redis",
        },
        compose_file_path="src/redis/docker-compose.yml",
    ),
    "opensearch": ServiceConfig(
        id="opensearch",
        name="OpenSearch",
        description="OpenSearch engine for search and analytics",
        container_name="opensearch",
        ports=[
            ServicePort(container=9200, host=9200, description="OpenSearch API"),
            ServicePort(
                container=9600, host=9600, description="OpenSearch Performance Analyzer"
            ),
        ],
        make_commands={
            "start": "start-opensearch",
            "stop": "stop-opensearch",
            "logs": "logs-opensearch",
            "shell": "shell-opensearch",
        },
        compose_file_path="src/opensearch/docker-compose.yml",
    ),
    "opensearch-dashboards": ServiceConfig(
        id="opensearch-dashboards",
        name="OpenSearch Dashboards",
        description="Web interface for OpenSearch data visualization",
        container_name="opensearch-dashboards",
        ports=[ServicePort(container=5601, host=5601, description="Dashboards Web UI")],
        make_commands={
            "start": "start-opensearch",  # Note: Dashboards starts with OpenSearch
            "stop": "stop-opensearch",  # Note: Dashboards stops with OpenSearch
            "logs": "logs-dashboards",
        },
        compose_file_path="src/opensearch/docker-compose.yml",
        depends_on=["opensearch"],
    ),
}


# System-wide operations (not tied to specific services)
SYSTEM_OPERATIONS = {
    "start_all": {"command": "start", "description": "Start all services"},
    "stop_all": {"command": "stop", "description": "Stop all services"},
    "status": {
        "command": "status",
        "description": "Show detailed status of all services",
    },
    "setup": {
        "script": "./scripts/setup.sh",
        "description": "Initial environment setup",
    },
    "backup": {
        "script": "./scripts/backup.sh",
        "description": "Create backups of all services",
    },
    "restore": {
        "script": "./scripts/restore.sh",
        "description": "Restore services from backup",
    },
    "test": {"command": "test", "description": "Run automated test suite"},
}


def get_service_config(service_id: str) -> ServiceConfig | None:
    """Get configuration for a specific service."""
    return SERVICES.get(service_id)


def get_all_services() -> list[ServiceConfig]:
    """Get all service configurations."""
    return list(SERVICES.values())


def get_service_ids() -> list[str]:
    """Get list of all service IDs."""
    return list(SERVICES.keys())
