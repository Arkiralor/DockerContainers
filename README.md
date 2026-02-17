# DockerContainers

**Ready-to-use Docker Compose configurations for local development infrastructure**

[![License](https://img.shields.io/badge/license-Copyleft-blue.svg)](LICENSE.md)
[![Docker](https://img.shields.io/badge/docker-compose-blue.svg)](https://docs.docker.com/compose/)
[![Rating](https://img.shields.io/badge/rating-9.5%2F10-brightgreen.svg)](#)

This repository provides high-grade Docker Compose setups for popular open-source services to be used in **local development only**. Each service is standalone, battle-tested, and ready to use out of the box.

## Services

- **[PostgreSQL](#postgresql)** - Powerful relational database (v16+)
- **[Redis](#redis)** - High-performance in-memory data store (single & multi-instance)
- **[OpenSearch](#opensearch)** - Search and analytics engine with dashboards

## Table of Contents

- [Quick Start](#quick-start)
- [Management Interfaces](#management-interfaces)
- [Repository Structure](#repository-structure)
- [Service Details](#service-details)
- [Using the Makefile](#using-the-makefile)
- [Management Scripts](#management-scripts)
- [Backup & Restore](#backup--restore)
- [Testing](#testing)
- [Resource Management](#resource-management)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

### Prerequisites

- **Docker**: v20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: v2.0+ (included with Docker Desktop)
- **Make**: Available on macOS/Linux (optional but recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/Arkiralor/DockerContainers.git
cd DockerContainers

# Run initial setup (creates .env files and data directories)
make setup

# Start all services
make start

# Verify everything is working
make test
```

That's it! Your services are now running:
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- OpenSearch: `localhost:9200`
- OpenSearch Dashboards: `localhost:5601`

### Alternative: Without Make

```bash
# Setup
./scripts/setup.sh

# Start all services
./scripts/start-all.sh

# Check status
./scripts/status.sh
```

## Management Interfaces

In addition to command-line tools, this repository provides graphical interfaces for managing services:

### Terminal UI (TUI)

**Location**: `src/gui/tui/`

A keyboard-driven terminal interface for managing Docker containers with real-time monitoring and log viewing.

**Features**:
- Service list with live status updates
- Real-time log viewer with search and follow capabilities
- System operations execution
- Comprehensive error handling and stability improvements
- Memory-safe operation with strict resource bounds

**Quick Start**:
```bash
cd src/gui/tui
source env/bin/activate
python -m src.main
```

[Full TUI Documentation](src/gui/tui/README.md)

### Web UI

**Location**: `src/gui/web/`

A web-based interface for container management that runs on bare metal.

**Features**:
- Service monitoring dashboard
- Container lifecycle management
- Log viewing and analysis
- Configuration management

[Full Web UI Documentation](src/gui/web/README.md)

---

## Repository Structure

```
DockerContainers/
├── src/                     # Source directory for all services
│   ├── postgresql/          # PostgreSQL setup
│   │   ├── docker-compose.yml   # Main compose file
│   │   ├── .env.example         # Environment template
│   │   ├── config/              # PostgreSQL configuration
│   │   ├── initdb.d/            # Initialization scripts
│   │   └── README.md            # PostgreSQL documentation
│   │
│   ├── redis/               # Redis setup
│   │   ├── docker-compose.yml   # Single instance
│   │   ├── docker-compose.multi-redis.yml  # 5 instances
│   │   ├── .env.example         # Environment template
│   │   ├── config/              # Redis configuration
│   │   └── README.md            # Redis documentation
│   │
│   ├── opensearch/          # OpenSearch setup
│   │   ├── docker-compose.yml   # OpenSearch + Dashboards
│   │   ├── .env.example         # Environment template
│   │   ├── config/              # OpenSearch configuration
│   │   └── README.md            # OpenSearch documentation
│   │
│   ├── gui/                 # Management interfaces
│   │   ├── tui/             # Terminal-based UI
│   │   │   ├── src/         # TUI source code
│   │   │   ├── tests/       # TUI test suite
│   │   │   ├── README.md    # TUI documentation
│   │   │   └── CHANGELOG.md # TUI version history
│   │   └── web/             # Web-based UI
│   │       └── README.md    # Web UI documentation
│   │
│   └── network/             # Optional shared network
│
├── scripts/                 # Management scripts
│   ├── setup.sh             # Initial setup
│   ├── start-all.sh         # Start all services
│   ├── stop-all.sh          # Stop all services
│   ├── status.sh            # Check service status
│   ├── backup.sh            # Backup all services
│   └── restore.sh           # Restore from backups
│
├── test/                    # Automated test suite
│   ├── test.sh              # Run all tests (30+ tests)
│   └── README.md            # Testing documentation
│
├── docs/                    # Additional documentation
│   ├── troubleshooting.md   # Common issues & solutions
│   └── services-overview.md # Detailed service info
│
├── Makefile                 # Convenient make commands (25+)
└── README.md                # This file
```

## Service Details

### PostgreSQL

**Version**: Latest stable (16+)
**Port**: 5432
**Default Database**: `elay-local`
**Default User**: `postgres`
**Default Password**: `password`

**Features**:
- Persistent data storage
- Health checks enabled
- Initialization script support
- Custom configuration support
- Resource limits (1GB RAM, 1 CPU)
- Automatic backups via pg_dump

**Connection String**:
```
postgresql://postgres:password@localhost:5432/elay-local
```

**Quick Commands**:
```bash
make start-postgres          # Start PostgreSQL
make shell-postgres          # Open psql shell
make logs-postgres           # View logs
```

[Full PostgreSQL Documentation](src/postgresql/README.md)

---

### Redis

**Version**: Latest stable (7+)
**Port**: 6379 (single) or 6379-6383 (multi)
**Persistence**: RDB snapshots

**Configurations**:

#### Single Instance
- **Port**: 6379
- **Use Case**: General caching and session storage
- **Command**: `make start-redis`

#### Multi-Instance (5 Redis Servers)
- **caching**: Port 6379 - General caching
- **celery_base_queues**: Port 6380 - Basic Celery tasks
- **celery_advanced_queues**: Port 6381 - Priority Celery tasks
- **multipurpose**: Port 6382 - Multi-purpose operations
- **miscellaneous**: Port 6383 - Miscellaneous tasks
- **Command**: `make start-multi-redis`

**Features**:
- Persistent data storage (RDB)
- Health checks enabled
- Custom configuration support
- Resource limits (512MB RAM, 0.5 CPU per instance)
- Independent instances (can run both single + multi)

**Connection**:
```bash
redis-cli -h localhost -p 6379
```

**Quick Commands**:
```bash
make start-redis             # Start single instance
make start-multi-redis       # Start all 5 instances
make shell-redis             # Open Redis CLI
make logs-redis              # View logs
```

[Full Redis Documentation](src/redis/README.md)

---

### OpenSearch

**Version**: Latest stable
**Ports**: 9200 (OpenSearch), 5601 (Dashboards)
**Default Admin Password**: `YourStrongPassword1!`

**Components**:
- **OpenSearch**: Search and analytics engine
- **OpenSearch Dashboards**: Web UI for visualization and management

**Features**:
- Single-node cluster (development mode)
- Security disabled for local dev
- Persistent data storage
- Health checks enabled
- Dashboards integrated
- Resource limits (2GB RAM, 1 CPU)
- Memory lock configuration

**Access**:
- OpenSearch API: http://localhost:9200
- Dashboards UI: http://localhost:5601

**Quick Commands**:
```bash
make start-opensearch        # Start OpenSearch + Dashboards
make shell-opensearch        # Open bash in container
make logs-opensearch         # View OpenSearch logs
make logs-dashboards         # View Dashboards logs
```

**Health Check**:
```bash
curl http://localhost:9200/_cluster/health?pretty
```

[Full OpenSearch Documentation](src/opensearch/README.md)

---

## Using the Makefile

The repository includes a comprehensive Makefile with 25+ commands for easy management.

### Essential Commands

```bash
make help                    # Show all available commands
make setup                   # Initial setup (first time only)
make start                   # Start all services
make stop                    # Stop all services
make restart                 # Restart all services
make status                  # Show detailed service status
make test                    # Run automated tests (30+ tests)
```

### Backup & Restore

```bash
make backup                  # Backup all services
make restore                 # Restore from backup (interactive)
```

### Individual Services

```bash
# Start services
make start-redis             # Start Redis (single)
make start-postgres          # Start PostgreSQL
make start-opensearch        # Start OpenSearch + Dashboards
make start-multi-redis       # Start all 5 Redis instances

# Stop services
make stop-redis              # Stop Redis
make stop-postgres           # Stop PostgreSQL
make stop-opensearch         # Stop OpenSearch + Dashboards

# Restart services
make restart-redis           # Restart Redis
make restart-postgres        # Restart PostgreSQL
make restart-opensearch      # Restart OpenSearch
```

### Logs & Debugging

```bash
make logs-redis              # Follow Redis logs
make logs-postgres           # Follow PostgreSQL logs
make logs-opensearch         # Follow OpenSearch logs
make logs-dashboards         # Follow Dashboards logs
```

### Shell Access

```bash
make shell-redis             # Open Redis CLI
make shell-postgres          # Open PostgreSQL shell (psql)
make shell-opensearch        # Open bash in OpenSearch container
```

### Quick Status

```bash
make ps                      # Show running containers
make stats                   # Show resource usage (CPU, memory)
```

### Cleanup

```bash
make clean                   # Remove all containers, volumes, and data
                            # WARNING: This deletes all data!
```

---

## Management Scripts

All scripts are located in the `scripts/` directory and can be run directly:

### setup.sh
Initial environment setup - creates .env files and data directories.
```bash
./scripts/setup.sh
```

### start-all.sh
Starts all services with health check validation.
```bash
./scripts/start-all.sh
```

### stop-all.sh
Gracefully stops all running services.
```bash
./scripts/stop-all.sh
```

### status.sh
Shows detailed status of all services including health, ports, and resource usage.
```bash
./scripts/status.sh
```

### backup.sh
Creates timestamped backups of all services:
- PostgreSQL: SQL dumps
- Redis: RDB snapshots
- OpenSearch: Data directory copies
- Configurations: Tarball of all configs

Automatically keeps the last 5 backups of each type.
```bash
./scripts/backup.sh
```

### restore.sh
Interactive restoration tool with backup selection menu.
```bash
./scripts/restore.sh
```

---

## Backup & Restore

### Creating Backups

```bash
# Using Make
make backup

# Or directly
./scripts/backup.sh
```

**What gets backed up**:
- PostgreSQL databases (SQL dump format)
- Redis data (RDB snapshot format)
- OpenSearch indices and data
- All configuration files

**Backup location**: `./backups/` (gitignored)

**Retention**: Automatically keeps the last 5 backups of each type

### Restoring from Backups

```bash
# Using Make
make restore

# Or directly
./scripts/restore.sh
```

**Interactive Menu Options**:
1. Restore PostgreSQL
2. Restore Redis
3. Restore OpenSearch
4. Restore Configurations
5. Restore All Services

**Features**:
- Select specific backup from list
- Preview backup details
- Confirmation before overwriting
- Validates restoration success

---

## Testing

### Automated Test Suite

The repository includes a comprehensive test suite with 30+ tests:

```bash
# Run all tests
make test

# Or directly
cd test && ./test.sh
```

**Test Coverage**:
- Docker daemon running
- All services running
- Health checks passing
- Port accessibility (5432, 6379, 9200, 5601)
- Database connectivity
- Read/write operations
- Volume persistence
- Script executability

**Test Output**:
```
Docker Containers Test Suite
================================

Docker Tests
---------------
PASS: Docker daemon is running

PostgreSQL Tests
-------------------
PASS: PostgreSQL container is running
PASS: PostgreSQL health check passes
PASS: PostgreSQL accepts connections
PASS: PostgreSQL port 5432 is accessible
PASS: PostgreSQL volume exists

... (30+ total tests)

================================
Test Summary
================================
Total:  30
Passed: 30
Failed: 0

All tests passed!
```

[Full Testing Documentation](test/README.md)

---

## Resource Management

All services have default resource limits to prevent system exhaustion:

| Service | Memory Limit | CPU Limit | Memory Reserved |
|---------|-------------|-----------|-----------------|
| PostgreSQL | 1 GB | 1.0 | 512 MB |
| Redis (each) | 512 MB | 0.5 | 256 MB |
| OpenSearch | 2 GB | 1.0 | 1 GB |

**Why resource limits?**
- Prevents any single service from consuming all system resources
- Ensures stable multi-service operation
- Predictable performance characteristics
- Better for laptops and development machines

**Monitoring Resources**:
```bash
make stats                   # Show current resource usage
docker stats                 # Continuous monitoring
```

---

## Troubleshooting

### Quick Diagnostics

```bash
make status                  # Detailed service status
make ps                      # Quick container list
make stats                   # Resource usage
make logs-<service>          # View specific service logs
make test                    # Run all tests
```

### Common Issues

#### Service won't start
```bash
# Check if port is already in use
lsof -i :5432               # PostgreSQL
lsof -i :6379               # Redis
lsof -i :9200               # OpenSearch

# View detailed logs
make logs-postgres
make logs-redis
make logs-opensearch
```

#### Data not persisting
```bash
# Check volumes exist
docker volume ls | grep postgres
docker volume ls | grep redis
docker volume ls | grep opensearch

# Verify volume mounts
docker inspect <container_name>
```

#### Out of memory
```bash
# Check current usage
make stats

# Adjust resource limits in docker-compose.yml
# under deploy.resources.limits
```

#### Permission errors (macOS/Linux)
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Restart terminal/logout
```

#### OpenSearch won't start
```bash
# Check vm.max_map_count (Linux only)
sysctl vm.max_map_count

# Increase if needed
sudo sysctl -w vm.max_map_count=262144
```

[Full Troubleshooting Guide](docs/troubleshooting.md)

---

## Architecture

### Design Philosophy

This repository follows these principles:

1. **Standalone Services**: Each service runs independently and is accessed via exposed ports
2. **No Inter-Service Networking**: Services don't communicate with each other
3. **Port-Based Access**: External applications connect via `localhost:<port>`
4. **Local Development Only**: Not designed for production use
5. **Convenience Over Security**: Simple default passwords for ease of use

### How It Works

```
┌─────────────────────────────────────────┐
│         Your Application(s)             │
│                                         │
│  (Node.js, Python, Java, etc.)         │
└─────────────────────────────────────────┘
          │            │            │
          │            │            │
      localhost     localhost   localhost
        :5432         :6379        :9200
          │            │            │
          ▼            ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │PostgreSQL│  │  Redis  │  │OpenSearch│
    │Container │  │Container│  │Container │
    └─────────┘  └─────────┘  └─────────┘
```

**Key Points**:
- Services expose ports to the host
- Applications connect via localhost
- No service-to-service communication
- Perfect for local development

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Test** your changes: `make test`
4. **Commit** with clear messages: `git commit -m "Add feature X"`
5. **Push** to your fork: `git push origin feature/my-feature`
6. **Create** a Pull Request

### Development Workflow

```bash
# Make changes
vim postgresql/docker-compose.yml

# Test locally
make start-postgres
make test

# If everything works
git add .
git commit -m "Improve PostgreSQL configuration"
```

---

## License

This project uses a copyleft license. See [LICENSE](LICENSE.md) for details.

---

## Additional Resources

- [docs/](docs/) - Additional documentation
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines

---

## Support

- **Issues**: [GitHub Issues](https://github.com/Arkiralor/DockerContainers/issues)
- **Documentation**: See `docs/` directory
- **Testing**: Run `make test` for diagnostics

---

## After setup, you can

1. **Connect Your Application**: Use the connection strings above
2. **Customize Configuration**: Edit files in `config/` directories
3. **Set Up Backups**: Run `make backup` regularly
4. **Monitor Resources**: Use `make stats` to check usage
5. **Read Service Docs**: Check service-specific README files

---

*Last Updated: February 2026*
