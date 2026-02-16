# PostgreSQL Service

**Powerful open-source relational database for local development**

## Overview

This PostgreSQL setup provides a production-ready database instance optimized for local development. It includes persistent storage, health monitoring, initialization script support, and resource limits to prevent system issues.

## Quick Start

```bash
# Using Make (recommended)
make start-postgres

# Or using docker compose directly
cd postgresql
docker compose up -d

# Verify it's running
make status
# or
docker compose ps
```

## Configuration

### Connection Details

| Parameter | Value |
|-----------|-------|
| **Host** | `localhost` |
| **Port** | `5432` |
| **Database** | `elay-local` |
| **User** | `postgres` |
| **Password** | `password` |

### Connection String

```
postgresql://postgres:password@localhost:5432/elay-local
```

### Environment Variables

See `.env.example` for all available configuration options:

```bash
POSTGRES_USER=postgres          # Database superuser
POSTGRES_PASSWORD=password      # Superuser password (change for production)
POSTGRES_DB=elay-local         # Default database name
```

To customize:
```bash
# Copy example file
cp .env.example .env

# Edit configuration
vim .env

# Restart service
make restart-postgres
```

## Features

### Persistent Data Storage

Data is stored in a Docker volume that persists across container restarts:
- **Volume name**: `postgres_data`
- **Mount point**: `/var/lib/postgresql/data`
- **Benefits**: Data survives container recreation, updates, and system reboots

Check volume:
```bash
docker volume inspect postgresql_postgres_data
```

### Health Checks

Automatic health monitoring using `pg_isready`:
- **Interval**: Every 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 5 attempts before marking unhealthy

View health status:
```bash
docker inspect postgres | grep -A 10 Health
```

### Initialization Scripts

Place SQL scripts in `initdb.d/` directory to automatically run on first startup:

```bash
# Example: Create tables and seed data
cat > initdb.d/01-create-tables.sql <<EOF
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL
);

INSERT INTO users (username, email) VALUES
    ('admin', 'admin@example.com'),
    ('user1', 'user1@example.com');
EOF
```

**Important**: Scripts only run on **first** container creation. To re-run:
```bash
make stop-postgres
docker volume rm postgresql_postgres_data
make start-postgres
```

### Custom Configuration

To use custom PostgreSQL configuration:

1. Create custom config file:
```bash
cat > config/postgresql.conf <<EOF
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
EOF
```

1. Uncomment volume mount in `docker-compose.yml`:
```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
  - ./config/postgresql.conf:/etc/postgresql/postgresql.conf:ro  # Uncomment this
```

1. Restart service:
```bash
make restart-postgres
```

### Resource Limits

Default resource limits prevent PostgreSQL from consuming all system resources:

| Resource | Limit | Reserved |
|----------|-------|----------|
| **Memory** | 1 GB | 512 MB |
| **CPU** | 1.0 core | - |

These can be adjusted in `docker-compose.yml` under `deploy.resources`.

### Logging

Logs are automatically managed with rotation:
- **Driver**: json-file
- **Max size**: 10 MB per file
- **Max files**: 3 (30 MB total)

View logs:
```bash
make logs-postgres
# or
docker compose logs -f postgres
```

## Usage Examples

### Connecting from Command Line

```bash
# Using make command (opens psql)
make shell-postgres

# Or using psql directly
psql -h localhost -p 5432 -U postgres -d elay-local

# Or using Docker exec
docker exec -it postgres psql -U postgres -d elay-local
```

### Connecting from Applications

#### Python (psycopg2)
```python
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="elay-local",
    user="postgres",
    password="password"
)

cursor = conn.cursor()
cursor.execute("SELECT version();")
print(cursor.fetchone())
```

#### Node.js (pg)
```javascript
const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'elay-local',
    user: 'postgres',
    password: 'password'
});

await client.connect();
const res = await client.query('SELECT NOW()');
console.log(res.rows[0]);
await client.end();
```

#### Go (pgx)
```go
package main

import (
    "context"
    "github.com/jackc/pgx/v5"
)

func main() {
    conn, _ := pgx.Connect(context.Background(),
        "postgresql://postgres:password@localhost:5432/elay-local")
    defer conn.Close(context.Background())

    var version string
    conn.QueryRow(context.Background(), "SELECT version()").Scan(&version)
    fmt.Println(version)
}
```

#### Java (JDBC)
```java
String url = "jdbc:postgresql://localhost:5432/elay-local";
Properties props = new Properties();
props.setProperty("user", "postgres");
props.setProperty("password", "password");

Connection conn = DriverManager.getConnection(url, props);
Statement st = conn.createStatement();
ResultSet rs = st.executeQuery("SELECT version()");
```

## Common Operations

### Create a New Database

```sql
-- Connect to default database
psql -h localhost -p 5432 -U postgres -d postgres

-- Create new database
CREATE DATABASE myapp_dev;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE myapp_dev TO postgres;

-- Connect to new database
\c myapp_dev
```

### Create a New User

```sql
-- Create user
CREATE USER myapp_user WITH ENCRYPTED PASSWORD 'secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE myapp_dev TO myapp_user;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO myapp_user;
```

### Backup Database

```bash
# Using repository backup script (recommended)
make backup

# Or manually
docker exec postgres pg_dump -U postgres elay-local > backup.sql

# Backup specific table
docker exec postgres pg_dump -U postgres -t users elay-local > users_backup.sql
```

### Restore Database

```bash
# Using repository restore script (recommended)
make restore

# Or manually
docker exec -i postgres psql -U postgres elay-local < backup.sql
```

### Check Database Size

```sql
SELECT
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
ORDER BY pg_database_size(pg_database.datname) DESC;
```

### View Active Connections

```sql
SELECT pid, usename, application_name, client_addr, state
FROM pg_stat_activity
WHERE datname = 'elay-local';
```

### Kill Connections

```sql
-- Kill specific connection
SELECT pg_terminate_backend(12345);  -- Replace with actual PID

-- Kill all connections except yours
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'elay-local' AND pid <> pg_backend_pid();
```

## Makefile Commands

All PostgreSQL-specific make commands:

```bash
make start-postgres          # Start PostgreSQL
make stop-postgres           # Stop PostgreSQL
make restart-postgres        # Restart PostgreSQL
make logs-postgres           # Follow logs
make shell-postgres          # Open psql shell
make status                  # Show service status
make backup                  # Backup database
make restore                 # Restore database
```

## Troubleshooting

### PostgreSQL Won't Start

**Check if port is in use:**
```bash
lsof -i :5432
# or
netstat -an | grep 5432
```

**Check logs:**
```bash
make logs-postgres
# or
docker logs postgres
```

**Common issues:**
- Port 5432 already in use (another PostgreSQL instance running)
- Insufficient permissions on data directory
- Corrupted data files

### Connection Refused

**Verify container is running:**
```bash
docker ps | grep postgres
```

**Test connectivity:**
```bash
# From host
pg_isready -h localhost -p 5432

# From container
docker exec postgres pg_isready
```

**Check firewall:**
```bash
# macOS
sudo pfctl -sr | grep 5432

# Linux
sudo iptables -L | grep 5432
```

### Out of Memory

**Check current usage:**
```bash
docker stats postgres
```

**Adjust resource limits in `docker-compose.yml`:**
```yaml
deploy:
  resources:
    limits:
      memory: 2g  # Increase from 1g
```

### Data Not Persisting

**Verify volume exists:**
```bash
docker volume ls | grep postgres
```

**Check volume mount:**
```bash
docker inspect postgres | grep -A 10 Mounts
```

**Verify correct path:**
The volume should mount to `/var/lib/postgresql/data` (not `/var/lib/postgresql`)

### Slow Queries

**Enable query logging:**
```sql
-- Show slow queries (> 1 second)
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
```

**View slow queries in logs:**
```bash
docker logs postgres | grep "duration:"
```

### Can't Connect After Password Change

**Reset password:**
```bash
docker exec -it postgres psql -U postgres
ALTER USER postgres WITH PASSWORD 'new_password';
\q
```

**Or recreate container:**
```bash
make stop-postgres
docker volume rm postgresql_postgres_data
# Update POSTGRES_PASSWORD in docker-compose.yml or .env
make start-postgres
```

## Performance Tuning

### Recommended Settings for Development

Edit `config/postgresql.conf`:

```conf
# Connection Settings
max_connections = 100
superuser_reserved_connections = 3

# Memory Settings
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 4MB

# Checkpoint Settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# Query Planner
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

### Monitor Performance

```sql
-- Cache hit ratio (should be > 99%)
SELECT
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100
  AS cache_hit_ratio
FROM pg_statio_user_tables;

-- Index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Table bloat
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Security Best Practices

### For Local Development

The default configuration is optimized for convenience:
- Simple default password
- Listen on localhost only
- No SSL required
- Trust local connections

This is **perfect for local development** but **not for production**.

### If You Need More Security

1. **Change default password:**
```yaml
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # Use .env file
```

1. **Enable SSL:**
```yaml
command: >
  postgres
  -c ssl=on
  -c ssl_cert_file=/path/to/server.crt
  -c ssl_key_file=/path/to/server.key
```

1. **Restrict connections:**
Edit `pg_hba.conf` to limit access by IP or user.

## Advanced Topics

### Replication Setup

For master-replica setup, see [PostgreSQL Replication Guide](https://www.postgresql.org/docs/current/high-availability.html).

### Extensions

Enable PostgreSQL extensions:

```sql
-- Enable UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable PostGIS (requires postgis image)
CREATE EXTENSION IF NOT EXISTS postgis;

-- List all extensions
\dx
```

### Using Different PostgreSQL Version

Edit `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine  # or postgres:15, postgres:14, etc.
```

## Additional Resources

- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [pgAdmin](https://www.pgadmin.org/) - GUI management tool
- [DBeaver](https://dbeaver.io/) - Universal database tool
- [Main Repository README](../README.md)
- [Troubleshooting Guide](../docs/troubleshooting.md)

## Support

- **Issues**: [GitHub Issues](https://github.com/Arkiralor/DockerContainers/issues)
- **Logs**: `make logs-postgres`
- **Status**: `make status`
- **Tests**: `make test`

---

**Ready to use PostgreSQL for local development!**

*Last Updated: February 2026*
