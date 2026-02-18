"""Comprehensive tests for service configurations."""

from src.config.services import ServiceConfig, ServicePort, get_all_services


class TestServicePort:
    """Tests for ServicePort dataclass."""

    def test_service_port_creation(self):
        """Test creating ServicePort instance."""
        port = ServicePort(
            container=5432, host=5432, description="PostgreSQL database port"
        )

        assert port.container == 5432
        assert port.host == 5432
        assert port.description == "PostgreSQL database port"

    def test_service_port_different_mapping(self):
        """Test port with different host and container ports."""
        port = ServicePort(container=80, host=8080, description="HTTP port")

        assert port.container == 80
        assert port.host == 8080

    def test_service_port_minimal(self):
        """Test creating ServicePort with minimal fields."""
        port = ServicePort(container=6379, host=6379, description="Redis")

        assert port.container == 6379
        assert port.host == 6379


class TestServiceConfig:
    """Tests for ServiceConfig dataclass."""

    def test_service_config_creation(self):
        """Test creating ServiceConfig instance."""
        service = ServiceConfig(
            id="postgres",
            name="PostgreSQL",
            description="PostgreSQL database server",
            container_name="postgres",
            ports=[ServicePort(5432, 5432, "DB port")],
            make_commands={"start": "start-postgres", "stop": "stop-postgres"},
            compose_file_path="src/postgresql/docker-compose.yml",
        )

        assert service.id == "postgres"
        assert service.name == "PostgreSQL"
        assert service.container_name == "postgres"
        assert len(service.ports) == 1
        assert "start" in service.make_commands

    def test_service_config_multiple_ports(self):
        """Test service with multiple ports."""
        service = ServiceConfig(
            id="opensearch",
            name="OpenSearch",
            description="Search engine",
            container_name="opensearch",
            ports=[
                ServicePort(9200, 9200, "HTTP"),
                ServicePort(9600, 9600, "Performance Analyzer"),
            ],
            make_commands={"start": "start-opensearch"},
            compose_file_path="src/opensearch/docker-compose.yml",
        )

        assert len(service.ports) == 2
        assert service.ports[0].container == 9200
        assert service.ports[1].container == 9600

    def test_service_config_with_dependencies(self):
        """Test service with dependencies."""
        service = ServiceConfig(
            id="dashboards",
            name="OpenSearch Dashboards",
            description="Visualization tool",
            container_name="opensearch-dashboards",
            ports=[ServicePort(5601, 5601, "Web UI")],
            make_commands={"start": "start-opensearch"},
            compose_file_path="src/opensearch/docker-compose.yml",
            depends_on=["opensearch"],
        )

        assert service.depends_on == ["opensearch"]
        assert len(service.depends_on) == 1

    def test_service_config_no_dependencies(self):
        """Test service without dependencies."""
        service = ServiceConfig(
            id="redis",
            name="Redis",
            description="Cache",
            container_name="redis",
            ports=[ServicePort(6379, 6379, "Redis")],
            make_commands={"start": "start-redis"},
            compose_file_path="src/redis/docker-compose.yml",
        )

        assert service.depends_on is None or service.depends_on == []

    def test_service_config_no_ports(self):
        """Test service without exposed ports."""
        service = ServiceConfig(
            id="worker",
            name="Background Worker",
            description="Background job processor",
            container_name="worker",
            ports=[],
            make_commands={"start": "start-worker"},
            compose_file_path="src/worker/docker-compose.yml",
        )

        assert len(service.ports) == 0


class TestGetAllServices:
    """Tests for get_all_services function."""

    def test_get_all_services_returns_list(self):
        """Test that get_all_services returns a list."""
        services = get_all_services()

        assert isinstance(services, list)
        assert len(services) > 0

    def test_get_all_services_contains_expected_services(self):
        """Test that all expected services are present."""
        services = get_all_services()
        service_ids = [s.id for s in services]

        # Expected services based on the repository
        # Note: opensearch-dashboards is now part of opensearch as a grouped service
        expected_services = [
            "postgresql",
            "redis",
            "opensearch",
        ]

        for expected in expected_services:
            assert expected in service_ids, f"Missing service: {expected}"

    def test_get_all_services_service_structure(self):
        """Test that each service has required fields."""
        services = get_all_services()

        for service in services:
            assert isinstance(service, ServiceConfig)
            assert service.id is not None
            assert service.name is not None
            assert service.description is not None
            # For grouped services, container_name and ports can be None
            # but they must have containers list instead
            if service.containers:
                assert service.container_name is None
                assert service.ports is None
                assert isinstance(service.containers, list)
                assert len(service.containers) > 0
            else:
                assert service.container_name is not None
                assert isinstance(service.ports, list)
            assert isinstance(service.make_commands, dict)
            assert service.compose_file_path is not None

    def test_get_all_services_unique_ids(self):
        """Test that all service IDs are unique."""
        services = get_all_services()
        service_ids = [s.id for s in services]

        assert len(service_ids) == len(set(service_ids)), "Duplicate service IDs found"

    def test_get_all_services_unique_container_names(self):
        """Test that all container names are unique."""
        services = get_all_services()
        container_names = []

        for s in services:
            if s.containers:
                # For grouped services, check container names within containers
                for container in s.containers:
                    container_names.append(container.container_name)
            else:
                # For single services, use the service container_name
                if s.container_name:
                    container_names.append(s.container_name)

        assert len(container_names) == len(set(container_names)), (
            "Duplicate container names found"
        )


class TestServiceConfigValidation:
    """Tests for service configuration validation."""

    def test_postgresql_service_config(self):
        """Test PostgreSQL service configuration."""
        services = get_all_services()
        postgres = next((s for s in services if s.id == "postgresql"), None)

        assert postgres is not None
        assert postgres.container_name == "postgres"
        assert len(postgres.ports) > 0
        assert any(p.container == 5432 for p in postgres.ports)
        assert "start" in postgres.make_commands
        assert "stop" in postgres.make_commands

    def test_redis_service_config(self):
        """Test Redis service configuration."""
        services = get_all_services()
        redis = next((s for s in services if s.id == "redis"), None)

        assert redis is not None
        assert redis.container_name == "redis"
        assert len(redis.ports) > 0
        assert any(p.container == 6379 for p in redis.ports)

    def test_opensearch_service_config(self):
        """Test OpenSearch service configuration (now a grouped service)."""
        services = get_all_services()
        opensearch = next((s for s in services if s.id == "opensearch"), None)

        assert opensearch is not None
        # OpenSearch is now a grouped service
        assert opensearch.containers is not None
        assert len(opensearch.containers) == 2
        # Check that it contains OpenSearch and Dashboards
        container_names = [c.container_name for c in opensearch.containers]
        assert "opensearch-node" in container_names
        assert "opensearch-dashboards" in container_names
        # Check that containers have ports
        opensearch_container = next(
            (c for c in opensearch.containers if c.container_name == "opensearch-node"),
            None,
        )
        assert opensearch_container is not None
        assert len(opensearch_container.ports) >= 2  # Should have at least 9200 and 9600

    def test_dashboards_in_opensearch_group(self):
        """Test that OpenSearch Dashboards is part of opensearch grouped service."""
        services = get_all_services()
        opensearch = next((s for s in services if s.id == "opensearch"), None)

        assert opensearch is not None
        assert opensearch.containers is not None
        dashboards = next(
            (
                c
                for c in opensearch.containers
                if c.container_name == "opensearch-dashboards"
            ),
            None,
        )
        assert dashboards is not None
        assert any(p.container == 5601 for p in dashboards.ports)


class TestServiceConfigMakeCommands:
    """Tests for make command configurations."""

    def test_all_services_have_start_command(self):
        """Test that all services have a start command."""
        services = get_all_services()

        for service in services:
            assert "start" in service.make_commands, (
                f"Service {service.id} missing start command"
            )
            assert isinstance(service.make_commands["start"], str)
            assert len(service.make_commands["start"]) > 0

    def test_all_services_have_stop_command(self):
        """Test that all services have a stop command."""
        services = get_all_services()

        for service in services:
            assert "stop" in service.make_commands, (
                f"Service {service.id} missing stop command"
            )

    def test_services_have_logs_command(self):
        """Test that single-container services have logs command."""
        services = get_all_services()

        for service in services:
            # Grouped services don't have logs at service level, but at container level
            if service.containers:
                # Each container within a grouped service should have a logs command
                for container in service.containers:
                    if container.make_commands:
                        assert "logs" in container.make_commands, (
                            f"Container {container.container_name} missing logs command"
                        )
            else:
                # Single-container services should have logs command
                assert "logs" in service.make_commands, (
                    f"Service {service.id} missing logs command"
                )

    def test_make_commands_format(self):
        """Test that make commands have correct format."""
        services = get_all_services()

        for service in services:
            for cmd_name, cmd_value in service.make_commands.items():
                assert isinstance(cmd_value, str)
                assert len(cmd_value) > 0
                # Make commands should not have leading/trailing spaces
                assert cmd_value == cmd_value.strip()


class TestServiceConfigPorts:
    """Tests for port configurations."""

    def test_port_numbers_valid(self):
        """Test that all port numbers are valid."""
        services = get_all_services()

        for service in services:
            if service.containers:
                # For grouped services, check ports in containers
                for container in service.containers:
                    for port in container.ports:
                        # Valid port range is 1-65535
                        assert 1 <= port.container <= 65535, (
                            f"Invalid container port in {service.id}/{container.container_name}"
                        )
                        assert 1 <= port.host <= 65535, (
                            f"Invalid host port in {service.id}/{container.container_name}"
                        )
            else:
                # For single services, check ports directly
                for port in service.ports:
                    # Valid port range is 1-65535
                    assert 1 <= port.container <= 65535, (
                        f"Invalid container port in {service.id}"
                    )
                    assert 1 <= port.host <= 65535, f"Invalid host port in {service.id}"

    def test_port_descriptions(self):
        """Test that ports have descriptions."""
        services = get_all_services()

        for service in services:
            if service.containers:
                # For grouped services, check ports in containers
                for container in service.containers:
                    for port in container.ports:
                        assert port.description is not None
                        assert len(port.description) > 0
            else:
                # For single services, check ports directly
                for port in service.ports:
                    assert port.description is not None
                    assert len(port.description) > 0

    def test_no_duplicate_host_ports(self):
        """Test that no two containers use the same host port."""
        services = get_all_services()
        used_ports = set()

        for service in services:
            if service.containers:
                # For grouped services, check ports in containers
                for container in service.containers:
                    for port in container.ports:
                        assert port.host not in used_ports, f"Duplicate host port {port.host}"
                        used_ports.add(port.host)
            else:
                # For single services, check ports directly
                for port in service.ports:
                    assert port.host not in used_ports, f"Duplicate host port {port.host}"
                    used_ports.add(port.host)


class TestServiceConfigComposeFiles:
    """Tests for compose file paths."""

    def test_compose_file_paths_format(self):
        """Test that compose file paths have correct format."""
        services = get_all_services()

        for service in services:
            assert service.compose_file_path.startswith("src/")
            assert service.compose_file_path.endswith("docker-compose.yml")

    def test_compose_file_paths_unique(self):
        """Test that compose file paths might be shared (for coupled services)."""
        services = get_all_services()
        compose_files = [s.compose_file_path for s in services]

        # dashboards and opensearch share the same compose file
        assert "src/opensearch/docker-compose.yml" in compose_files


class TestServiceConfigDependencies:
    """Tests for service dependencies."""

    def test_dependency_references_valid(self):
        """Test that dependencies reference valid service IDs."""
        services = get_all_services()
        service_ids = {s.id for s in services}

        for service in services:
            if service.depends_on:
                for dependency in service.depends_on:
                    assert dependency in service_ids, (
                        f"Invalid dependency: {dependency}"
                    )

    def test_no_circular_dependencies(self):
        """Test that there are no circular dependencies."""
        services = get_all_services()

        # Build dependency graph
        depends_on = {}
        for service in services:
            depends_on[service.id] = service.depends_on or []

        # Check for circular dependencies using DFS
        def has_cycle(node, visited, rec_stack):
            visited.add(node)
            rec_stack.add(node)

            for neighbor in depends_on.get(node, []):
                if neighbor not in visited:
                    if has_cycle(neighbor, visited, rec_stack):
                        return True
                elif neighbor in rec_stack:
                    return True

            rec_stack.remove(node)
            return False

        visited = set()
        for service_id in depends_on:
            if service_id not in visited:
                assert not has_cycle(service_id, visited, set()), (
                    "Circular dependency detected"
                )


class TestServiceConfigEdgeCases:
    """Tests for edge cases in service configuration."""

    def test_empty_service_list_scenario(self):
        """Test handling when trying to find non-existent service."""
        services = get_all_services()
        non_existent = next((s for s in services if s.id == "nonexistent"), None)

        assert non_existent is None

    def test_service_config_immutability(self):
        """Test that getting services multiple times returns consistent data."""
        services1 = get_all_services()
        services2 = get_all_services()

        assert len(services1) == len(services2)

        # Compare service IDs
        ids1 = sorted([s.id for s in services1])
        ids2 = sorted([s.id for s in services2])
        assert ids1 == ids2
