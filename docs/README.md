# Documentation

**Comprehensive documentation for Docker Containers repository**

## Overview

This directory contains additional documentation, guides, and resources for the Docker Containers repository. All documentation is designed for local development use.

## Documentation Index

### Quick Links

- **[Main README](../README.md)** - Start here! Complete overview and quick start
- **[IMPROVEMENTS.md](../IMPROVEMENTS.md)** - Completed improvements and changelog
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - How to contribute to this repository

### Service Documentation

- **[PostgreSQL](../src/postgresql/README.md)** - PostgreSQL setup and usage guide
- **[Redis](../src/redis/README.md)** - Redis single and multi-instance guide
- **[OpenSearch](../src/opensearch/README.md)** - OpenSearch and Dashboards guide
- **[Testing](../test/README.md)** - Automated test suite documentation

### Management Interface Documentation

- **[Terminal UI (TUI)](../src/gui/tui/README.md)** - Keyboard-driven container management interface
- **[Web UI](../src/gui/web/README.md)** - Browser-based service monitoring dashboard

### Additional Guides

- **[Troubleshooting](troubleshooting.md)** - Common issues and solutions
- **[Services Overview](services-overview.md)** - Detailed service information

## Quick Start

New to this repository? Start with these steps:

1. **Read the [Main README](../README.md)** - Understand what this repository provides
2. **Run Setup** - `make setup` to initialize your environment
3. **Start Services** - `make start` to start all services
4. **Run Tests** - `make test` to verify everything works
5. **Explore Services** - Check individual service READMEs for details

## Documentation by Topic

### Getting Started

- [Quick Start Guide](../README.md#quick-start)
- [Prerequisites](../README.md#prerequisites)
- [Installation](../README.md#installation)
- [First Steps](../README.md#quick-start)

### Service Guides

#### PostgreSQL
- [PostgreSQL Quick Start](../src/postgresql/README.md#quick-start)
- [Connection Examples](../src/postgresql/README.md#usage-examples)
- [Common Operations](../src/postgresql/README.md#common-operations)
- [Performance Tuning](../src/postgresql/README.md#performance-tuning)
- [Troubleshooting PostgreSQL](../src/postgresql/README.md#troubleshooting)

#### Redis
- [Redis Quick Start](../src/redis/README.md#quick-start)
- [Single Instance Guide](../src/redis/README.md#single-instance)
- [Multi-Instance Guide](../src/redis/README.md#multi-instance-5-redis-servers)
- [Redis Commands](../src/redis/README.md#common-operations)
- [Troubleshooting Redis](../src/redis/README.md#troubleshooting)

#### OpenSearch
- [OpenSearch Quick Start](../src/opensearch/README.md#quick-start)
- [API Operations](../src/opensearch/README.md#usage-examples)
- [Using Dashboards](../src/opensearch/README.md#opensearch-dashboards)
- [Search Queries](../src/opensearch/README.md#search-operations)
- [Troubleshooting OpenSearch](../src/opensearch/README.md#troubleshooting)

#### Management Interfaces
- [TUI Installation](../src/gui/tui/README.md#installation)
- [TUI Navigation](../src/gui/tui/README.md#navigation)
- [TUI Troubleshooting](../src/gui/tui/README.md#troubleshooting)
- [Web UI Setup](../src/gui/web/README.md)

### Operations

#### Using the Makefile
- [All Makefile Commands](../README.md#using-the-makefile)
- [Essential Commands](../README.md#essential-commands)
- [Service-Specific Commands](../README.md#individual-services)
- [Linting Commands](../README.md#using-the-makefile)

#### Management Scripts
- [setup.sh](../README.md#setupsh) - Initial environment setup
- [start-all.sh](../README.md#start-allsh) - Start all services
- [stop-all.sh](../README.md#stop-allsh) - Stop all services
- [status.sh](../README.md#statussh) - Check service status
- [backup.sh](../README.md#backupsh) - Create backups
- [restore.sh](../README.md#restoresh) - Restore from backups

#### Backup & Restore
- [Creating Backups](../README.md#creating-backups)
- [Restoring Backups](../README.md#restoring-from-backups)
- [Backup Best Practices](../README.md#backup--restore)

#### Testing
- [Running Tests](../test/README.md#running-tests)
- [Test Coverage](../test/README.md#test-coverage)
- [Writing New Tests](../test/README.md#writing-new-tests)
- [CI/CD Integration](../test/README.md#cicd-integration)

### Troubleshooting

- **[Full Troubleshooting Guide](troubleshooting.md)** - Comprehensive issue resolution
- [Quick Diagnostics](../README.md#quick-diagnostics)
- [Common Issues](../README.md#common-issues)
- [PostgreSQL Issues](../src/postgresql/README.md#troubleshooting)
- [Redis Issues](../src/redis/README.md#troubleshooting)
- [OpenSearch Issues](../src/opensearch/README.md#troubleshooting)
- [TUI Issues](../src/gui/tui/README.md#troubleshooting)

### Advanced Topics

#### Configuration
- [Custom Configurations](../README.md#service-details)
- [Environment Variables](../README.md#configuration)
- [Resource Limits](../README.md#resource-management)

#### Architecture
- [System Architecture](../README.md#architecture)
- [Design Philosophy](../README.md#design-philosophy)
- [How Services Work](../README.md#how-it-works)

#### Development
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Code Style](../CLAUDE.md#code-style-preferences)
- [Git Workflow](../CLAUDE.md#git-workflow)
- [Development Workflow](../README.md#development-workflow)

## Common Tasks

### Daily Operations

**Start your development environment:**
```bash
make start
make status
```

**Check logs:**
```bash
make logs-postgres
make logs-redis
make logs-opensearch
```

**Run tests:**
```bash
make test
```

**Create backup:**
```bash
make backup
```

### Maintenance

**Update services:**
```bash
cd src/postgresql && docker compose pull
cd src/redis && docker compose pull
cd src/opensearch && docker compose pull
```

**Clean up:**
```bash
make clean  # Warning: Deletes all data!
```

**Restart everything:**
```bash
make restart
```

## Repository Structure

```
DockerContainers/
├── docs/                      # This directory
│   ├── README.md              # This file
│   ├── troubleshooting.md     # Issue resolution guide
│   ├── services-overview.md   # Detailed service info
│   └── linting.md             # Code quality documentation
│
├── src/                       # Source directory for all services
│   ├── postgresql/            # PostgreSQL service
│   │   ├── docker-compose.yml
│   │   ├── config/
│   │   ├── initdb.d/
│   │   └── README.md          # PostgreSQL documentation
│   │
│   ├── redis/                 # Redis service
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.multi-redis.yml
│   │   ├── config/
│   │   └── README.md          # Redis documentation
│   │
│   ├── opensearch/            # OpenSearch service
│   │   ├── docker-compose.yml
│   │   ├── config/
│   │   └── README.md          # OpenSearch documentation
│   │
│   └── gui/                   # Management interfaces
│       ├── tui/               # Terminal-based UI
│       │   ├── src/           # TUI source code
│       │   ├── tests/         # TUI test suite
│       │   ├── README.md      # TUI documentation
│       │   └── CHANGELOG.md   # TUI version history
│       └── web/               # Web-based UI
│           └── README.md      # Web UI documentation
│
├── scripts/                   # Management scripts
│   ├── setup.sh
│   ├── start-all.sh
│   ├── stop-all.sh
│   ├── status.sh
│   ├── backup.sh
│   └── restore.sh
│
├── test/                      # Test suite
│   ├── test.sh                # Main test script
│   └── README.md              # Testing documentation
│
├── Makefile                   # Convenient commands
├── README.md                  # Main documentation
└── CONTRIBUTING.md            # Contribution guide
```

## Feature Highlights

### Easy to Use
- One-command setup and start
- Makefile with 25+ convenient commands
- Terminal and web-based management interfaces
- Clear documentation for everything

### Reliable
- 30+ automated tests
- Health checks on all services
- Resource limits prevent issues
- Comprehensive error handling in TUI

### Complete
- Backup and restore capabilities
- Comprehensive troubleshooting guides
- Code examples in multiple languages
- Real-time monitoring and log viewing

### Well-Documented
- Service-specific READMEs
- API usage examples
- Common operations guides
- Management interface documentation

## External Resources

### Official Documentation

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [OpenSearch Documentation](https://opensearch.org/docs/)

### Tools & Clients

- [pgAdmin](https://www.pgadmin.org/) - PostgreSQL GUI
- [DBeaver](https://dbeaver.io/) - Universal database tool
- [RedisInsight](https://redis.io/insight/) - Redis GUI
- [OpenSearch Dashboards](http://localhost:5601) - Included with OpenSearch

### Learning Resources

- [Docker Getting Started](https://docs.docker.com/get-started/)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [Redis University](https://university.redis.com/)
- [OpenSearch Getting Started](https://opensearch.org/docs/latest/getting-started/)

## Documentation Standards

All documentation in this repository follows these standards:

- **Clear and concise** - Easy to understand
- **Example-driven** - Shows real code examples
- **Complete** - Covers common use cases
- **Up-to-date** - Reflects current state
- **Local dev focused** - Optimized for development

## Getting Help

### In-Repository Help

1. **Check documentation**:
   - Start with [Main README](../README.md)
   - Check service-specific READMEs
   - Read [Troubleshooting Guide](troubleshooting.md)

2. **Run diagnostics**:
   ```bash
   make status
   make test
   make logs-<service>
   ```

3. **Check examples**:
   - All READMEs include code examples
   - See service READMEs for connection examples

### External Help

- **GitHub Issues**: [Report issues](https://github.com/Arkiralor/DockerContainers/issues)
- **Docker Forums**: [Docker Community](https://forums.docker.com/)
- **Stack Overflow**: Search for specific error messages

## Keeping Documentation Updated

This documentation is actively maintained. Last major update: **February 2026**

### Recent Updates
- All README files updated with comprehensive guides
- Added Terminal UI (TUI) for keyboard-driven container management
- Added Web UI for browser-based service monitoring
- TUI stability improvements (24 critical bugs fixed)
- Added Makefile command reference
- Added testing documentation
- Enhanced troubleshooting guides
- Added code examples in multiple languages

### Contributing to Documentation

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on improving documentation.

## Quick Reference

### Most Useful Commands

```bash
make help                    # Show all commands
make start                   # Start all services
make stop                    # Stop all services
make status                  # Check service status
make test                    # Run all tests
make backup                  # Create backups
make logs-<service>          # View logs
```

### Most Visited Pages

1. [Main README](../README.md) - Overview and quick start
2. [PostgreSQL Guide](../src/postgresql/README.md) - Database documentation
3. [Redis Guide](../src/redis/README.md) - Cache documentation
4. [TUI Guide](../src/gui/tui/README.md) - Terminal interface documentation
5. [Troubleshooting](troubleshooting.md) - Issue resolution

### Connection Strings

```bash
# PostgreSQL
postgresql://postgres:password@localhost:5432/elay-local

# Redis
redis://localhost:6379

# OpenSearch
http://localhost:9200
```

---

**Well-documented infrastructure for successful development!**

*Last Updated: February 2026*
