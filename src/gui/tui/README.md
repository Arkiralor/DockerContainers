# Docker Container TUI

A keyboard-driven terminal interface for managing Docker containers defined in the DockerContainers repository. This TUI provides an efficient way to start, stop, monitor, and manage repository-specific services using existing Makefile commands and scripts.

## Features

- **Service Management**: Start, stop, and monitor PostgreSQL, Redis, OpenSearch, and OpenSearch Dashboards
- **Real-time Monitoring**: Auto-refreshing status with configurable intervals
- **Log Viewer**: View container logs with real-time following and search capabilities
- **System Operations**: Execute backup, restore, setup, and other system-wide operations
- **Keyboard Navigation**: Fully keyboard-driven interface for efficiency
- **Repository Integration**: Uses existing Makefile commands and shell scripts

## Prerequisites

- Python 3.10 or higher
- Docker Desktop or Docker daemon running
- DockerContainers repository (this tool must be run from within the repository)
- Virtual environment (recommended)

## Installation

### 1. Navigate to the TUI directory
```bash
cd src/gui/tui
```

### 2. Activate the virtual environment
```bash
source env/bin/activate
```

### 3. Install dependencies
```bash
# Make the install script executable
chmod +x .scripts/install.sh

# Run the installation
./.scripts/install.sh
```

Or install manually:
```bash
pip install -r requirements.in
```

### 4. Verify installation
```bash
python -m src.main check
```

## Usage

### Starting the TUI

```bash
# Activate virtual environment if not already active
source env/bin/activate

# Start the TUI
python -m src.main
```

### Command Line Options

```bash
# Show help
python -m src.main --help

# Start with custom refresh interval (default: 5 seconds)
python -m src.main --refresh-interval 10

# Specify repository root path
python -m src.main --repository-root /path/to/DockerContainers

# Skip Docker connectivity check
python -m src.main --no-docker-check

# Enable debug mode
python -m src.main --debug

# Check system prerequisites
python -m src.main check
```

### Alternative Installation Methods

You can also install the package directly:

```bash
# Install in development mode
pip install -e .

# Then run as a command
docker-tui
```

## Navigation

### Main Screen
- `s` - Services screen
- `o` - Operations screen
- `?` - Help screen
- `r` - Refresh status
- `q` or `Ctrl+C` - Quit

### Services Screen
- `↑/↓` - Navigate service list
- `Enter` or `Space` - Start/Stop selected service
- `l` - View logs for selected service
- `d` - Show service details
- `r` - Refresh status
- `Escape` or `q` - Back to main screen

### Log Viewer
- `f` - Toggle real-time log following
- `r` - Refresh logs
- `c` - Clear displayed logs
- `s` - Save logs to file
- `+/-` - Increase/decrease number of log lines
- `Escape` or `q` - Back to services

### Operations Screen  
- `↑/↓` - Navigate operations list
- `Enter` - Execute selected operation
- `r` - Refresh status
- `Escape` or `q` - Back to main screen

## Services Managed

The TUI manages the following repository-defined services:

| Service | Container | Ports | Description |
|---------|-----------|-------|-------------|
| PostgreSQL | postgres | 5432 | PostgreSQL database server |
| Redis | redis | 6379 | Redis cache and message broker |
| OpenSearch | opensearch | 9200, 9600 | Search and analytics engine |
| OpenSearch Dashboards | opensearch-dashboards | 5601 | Data visualization interface |

## Operations Available

- **Start All** - Start all services (`make start`)
- **Stop All** - Stop all services (`make stop`)  
- **Status** - Show detailed status (`make status`)
- **Setup** - Initial environment setup (`./scripts/setup.sh`)
- **Backup** - Create service backups (`./scripts/backup.sh`)
- **Restore** - Restore from backups (`./scripts/restore.sh`)
- **Test** - Run test suite (`make test`)

## Architecture

The TUI is designed as a **thin wrapper** around existing repository tools:

- **Service Operations**: All start/stop commands use `make` targets
- **Status Checking**: Docker API used for real-time status (read-only)
- **Log Viewing**: Docker API used for log retrieval
- **System Operations**: Shell scripts executed via subprocess
- **No Container Manipulation**: TUI never directly modifies containers

This approach ensures consistency with existing workflows and maintains compatibility with manual operations.

## Configuration

### Auto-refresh Interval
The default auto-refresh interval is 5 seconds. You can customize this:

```bash
# 10-second refresh interval
python -m src.main --refresh-interval 10
```

### Repository Root Detection
The TUI automatically finds the repository root by looking for the Makefile. If detection fails:

```bash
# Specify explicit path
python -m src.main --repository-root /path/to/DockerContainers
```

## Troubleshooting

### Common Issues

**TUI won't start - "Repository root not found"**
- Ensure you're running from within the DockerContainers repository
- Check that Makefile exists in the repository root
- Use `--repository-root` option to specify path explicitly

**Docker connection errors**
- Ensure Docker Desktop is running
- Check Docker daemon status: `docker version`
- Use `--no-docker-check` to skip connectivity check

**Import errors**
- Ensure virtual environment is activated: `source env/bin/activate`
- Reinstall dependencies: `pip install -r requirements.in`
- Check Python version: `python --version` (requires 3.10+)

**Services not responding to commands**
- Verify Makefile targets exist: `make help`
- Check Docker Compose files in `src/` directories
- Run `python -m src.main check` for system status

### Debug Mode

Enable debug mode for verbose error information:

```bash
python -m src.main --debug
```

### System Check

Run the system check command to validate your setup:

```bash
python -m src.main check
```

This checks:
- Python version and dependencies
- Repository structure
- Docker availability
- Service configurations
- Makefile targets

## Development

### Project Structure
```
src/gui/tui/
├── src/
│   ├── config/
│   │   └── services.py      # Service definitions
│   ├── services/
│   │   ├── command_executor.py  # Make/script execution
│   │   └── docker_client.py     # Docker API integration
│   ├── tui/
│   │   ├── app.py               # Main Textual application
│   │   └── screens/             # TUI screens
│   ├── utils/
│   │   └── helpers.py           # Utility functions
│   └── main.py              # CLI entry point
├── requirements.in          # Dependencies
├── pyproject.toml          # Project configuration
└── README.md               # This file
```

### Adding New Services

1. Update `src/config/services.py` with new service definition
2. Ensure corresponding Makefile targets exist
3. Test service operations manually
4. Update this README if needed

### Extending Functionality

The TUI uses the Textual framework for the interface. Key extension points:

- **New Screens**: Add to `src/tui/screens/`
- **Service Operations**: Update `src/config/services.py`
- **System Operations**: Add to `SYSTEM_OPERATIONS` dict
- **Docker Integration**: Extend `src/services/docker_client.py`

## License

This TUI is part of the DockerContainers repository and follows the same license terms.

## Support

For issues and questions:

1. Check this README for common solutions
2. Run `python -m src.main check` to validate setup
3. Enable debug mode: `python -m src.main --debug`
4. Check repository documentation in `docs/`
