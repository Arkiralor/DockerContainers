# DockerContainers User Manual

## Overview

DockerContainers provides ready-to-use Docker Compose configurations for popular development services:

- **OpenSearch**
- **PostgreSQL**
- **Redis**

This project is designed specifically for **local development environments**
and offers a quick way to spin up these services without complex setup.

⚠️ **Important**: This is for local development only, not production use.

## What's Included

- **PostgreSQL**: Full-featured SQL database on port 5432
- **Redis**: Key-value store and cache (single or multi-instance) on port 6379+
- **OpenSearch**: Search and analytics engine on port 9200
- **OpenSearch Dashboards**: Web interface for OpenSearch on port 5601
- **Management Scripts**: Automated setup, backup, and maintenance tools
- **Health Monitoring**: Built-in health checks and status reporting

## Prerequisites

Before you begin, ensure you have:

- **Docker**: Version 20.10+ ([Download Docker](https://docker.com/get-started))
- **Docker Compose**: Version 2.0+ (included with Docker Desktop)
- **Git**: For cloning the repository
- **4GB+ RAM**: Recommended for running all services simultaneously

### System Requirements

- **macOS**: Docker Desktop for Mac
- **Linux**: Docker Engine + Docker Compose plugin
- **Windows**: Docker Desktop for Windows with WSL2

## Quick Start Guide

### 1. Clone the Repository

```bash
git clone https://github.com/Arkiralor/DockerContainers.git
cd DockerContainers
```

### 2. Initial Setup

```bash
make setup
```

This creates necessary directories and configuration files.

### 3. Start All Services

```bash
make start
```

Wait for all services to start (usually 30-60 seconds).

### 4. Verify Everything Works

```bash
make status
```

You should see all services as "healthy" or "running".

### 5. Connect to Services

Your services are now available at:

- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **OpenSearch**: `localhost:9200`
- **OpenSearch Dashboards**: `http://localhost:5601`

## Service Connection Details

### PostgreSQL

**Default Connection:**

- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `elay-local`
- **Username**: `postgres`
- **Password**: `password`

**Connection String:**

```bash
postgresql://postgres:password@localhost:5432/elay-local
```

**Using psql:**

```bash
psql -h localhost -p 5432 -U postgres -d elay-local
```

### Redis

**Single Instance (Default):**

- **Host**: `localhost`
- **Port**: `6379`
- **Password**: None (local development)

**Multi-Instance Setup:**

- **Redis 1**: `localhost:6379`
- **Redis 2**: `localhost:6380`
- **Redis 3**: `localhost:6381`
- **Redis 4**: `localhost:6382`
- **Redis 5**: `localhost:6383`

**Using redis-cli:**

```bash
redis-cli -h localhost -p 6379
```

### OpenSearch

**REST API:**

- **URL**: `http://localhost:9200`
- **Username**: `admin`
- **Password**: `admin`

**Testing Connection:**

```bash
curl -u admin:admin http://localhost:9200
```

**OpenSearch Dashboards:**

- **URL**: `http://localhost:5601`
- **Username**: `admin`
- **Password**: `admin`

## Common Commands

### Starting and Stopping

```bash
# Start all services
make start

# Stop all services
make stop

# Restart all services
make restart

# Start individual services
make start-postgres
make start-redis
make start-opensearch
```

### Monitoring

```bash
# Check status of all services
make status

# View running containers
make ps

# Check resource usage
make stats

# Follow logs for a service
make logs-postgres
make logs-redis
make logs-opensearch
```

### Data Management

```bash
# Create backup of all services
make backup

# Restore from backup (interactive)
make restore

# Run health tests
make test
```

### Direct Access

```bash
# Open PostgreSQL shell
make shell-postgres

# Open Redis CLI
make shell-redis

# Access OpenSearch container
make shell-opensearch
```

## Using Individual Services

### PostgreSQL Only

If you only need PostgreSQL:

```bash
cd postgresql/
docker compose up -d
```

Connect at `localhost:5432` with credentials above.

### Redis Only

For Redis (single instance):

```bash
cd redis/
docker compose up -d
```

For Redis (multi-instance):

```bash
cd redis/
docker compose -f docker-compose.multi-redis.yml up -d
```

### OpenSearch Only

```bash
cd opensearch/
docker compose up -d
```

Access OpenSearch at `localhost:9200` and Dashboards at `localhost:5601`.

## Data Persistence and Backups

### Data Storage

All service data persists in Docker volumes, so your data survives container restarts. Data is stored in:

- `postgresql/data/` - PostgreSQL database files
- `redis/data/` - Redis persistence files
- `opensearch/data/` - OpenSearch indices and data

### Creating Backups

```bash
make backup
```

Creates timestamped backups in `./backups/`:

- PostgreSQL: SQL dump files
- Redis: RDB snapshot files
- OpenSearch: Data directory copies

### Restoring Data

```bash
make restore
```

Interactive menu lets you:

1. Choose which service to restore
2. Select from available backups
3. Confirm restoration

## Configuration

### Environment Variables

Each service has an `.env.example` file with configuration options. Copy to `.env` to customize:

```bash
cp postgresql/.env.example postgresql/.env
# Edit postgresql/.env as needed
```

### Service Configuration

Advanced configuration files are in each service's `config/` directory:

- `postgresql/config/postgresql.conf` - PostgreSQL settings
- `redis/config/redis.conf` - Redis configuration
- `opensearch/config/opensearch.yml` - OpenSearch settings

## Multi-Redis Setup

For applications needing multiple Redis instances:

```bash
cd redis/
docker compose -f docker-compose.multi-redis.yml up -d
```

This creates 5 independent Redis instances on ports 6379-6383.

**Use Cases:**

- Separate cache vs session storage
- Different databases for different applications
- Redis clustering simulation
- Development environment matching production

## Troubleshooting

### Services Won't Start

1. **Check Docker is running:**

   ```bash
   docker version
   ```

2. **Check port conflicts:**

   ```bash
   netstat -nl | grep :5432  # PostgreSQL
   netstat -nl | grep :6379  # Redis
   netstat -nl | grep :9200  # OpenSearch
   ```

3. **View service logs:**

   ```bash
   make logs-postgres  # or redis, opensearch
   ```

### OpenSearch Memory Issues

OpenSearch may need system configuration changes:

```bash
# On Linux/macOS:
sudo sysctl -w vm.max_map_count=262144

# Make permanent:
echo 'vm.max_map_count=262144' | sudo tee -a /etc/sysctl.conf
```

### Data Recovery

If data appears lost:

1. **Check volumes exist:**

   ```bash
   docker volume ls
   ```

2. **Restore from backup:**

   ```bash
   make restore
   ```

3. **Reset everything (DATA LOSS!):**

   ```bash
   make clean
   make setup
   make start
   ```

### Performance Issues

If services are slow:

1. **Check resource usage:**

   ```bash
   make stats
   ```

2. **Increase Docker resources** in Docker Desktop settings:
   - Memory: 4GB minimum, 8GB recommended
   - CPU: 2+ cores

3. **Restart Docker** if it's been running for a long time

### Connection Refused Errors

1. **Wait for startup** - Services need 30-60 seconds to fully initialize
2. **Check service health:**

   ```bash
   make status
   ```

3. **Verify ports aren't blocked** by firewall software

## Integration Examples

### Python Applications

```python
import psycopg2
import redis
from opensearchpy import OpenSearch

# PostgreSQL
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="elay-local",
    user="postgres",
    password="password"
)

# Redis
r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# OpenSearch
es = OpenSearch([{'host': 'localhost', 'port': 9200}])
```

### Node.js Applications

```javascript
const { Client } = require('pg')
const redis = require('redis')
const { Client: OpenSearchClient } = require('@opensearch-project/opensearch')

// PostgreSQL
const pgClient = new Client({
  host: 'localhost',
  port: 5432,
  database: 'elay-local',
  user: 'postgres',
  password: 'password'
})

// Redis
const redisClient = redis.createClient({
  host: 'localhost',
  port: 6379
})

// OpenSearch
const osClient = new OpenSearchClient({
  node: 'http://localhost:9200'
})
```

## Getting Help

### Built-in Help

```bash
make help  # Show all available commands
```

### Documentation

- **Service Details**: Check each service's `README.md` file
- **Troubleshooting**: See `docs/troubleshooting.md`
- **Services Overview**: See `docs/services-overview.md`

### Health Checks

```bash
make test  # Run comprehensive health tests
```

### Log Analysis

```bash
# View recent logs
make logs-postgres | tail -100

# Follow logs in real-time
make logs-redis -f

# Search logs for errors
make logs-opensearch | grep -i error
```

## Best Practices

### Development Workflow

1. **Start services** before beginning development
2. **Use backups** before major changes
3. **Stop services** when not needed to save resources
4. **Check status** if connections fail

### Resource Management

```bash
# Start only what you need
make start-postgres  # Just PostgreSQL

# Monitor resource usage
make stats

# Stop when done
make stop
```

### Data Safety

- **Backup regularly** with `make backup`
- **Test backups** with `make restore`
- **Never run `make clean`** unless you want to lose all data

## Uninstalling

To completely remove all services and data:

```bash
make clean  # ⚠️  This deletes ALL data!
```

To remove Docker images:

```bash
docker image prune -a
```

## What's Not Included

These tools/features are **intentionally not included** as they're better installed separately:

- **pgAdmin** - Install separately for PostgreSQL administration
- **RedisInsight** - Install separately for Redis management
- **Production security** - This is for local development only
- **SSL/TLS** - Not needed for localhost connections
- **Monitoring stack** - Use external tools if needed

## Updates

To update services:

1. **Backup your data:** `make backup`
2. **Pull latest changes:** `git pull`
3. **Restart services:** `make restart`

## License

This project is licensed under the MIT License. See [LICENSE.md](LICENSE.md) for details.

---

**Need more help?** Check the `docs/` directory for additional documentation and troubleshooting guides.
