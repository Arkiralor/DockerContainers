# Services Overview

This document provides a detailed overview of all services included in this Docker containers repository.

## OpenSearch

**Purpose**: Full-text search and analytics engine  
**Port**: 9200 (main), 5601 (dashboards)  
**Data Persistence**: Yes (`./data` volume)  
**Configuration**: `config/opensearch.yml`

### Key Features

- Full-text search capabilities
- Real-time analytics
- RESTful API
- Multi-tenancy support
- Security features (when enabled)

### Use Cases

- Application search functionality
- Log analysis and monitoring
- Business intelligence
- Content management systems

### Resource Requirements

- **Memory**: Minimum 512MB, recommended 2GB+
- **Storage**: Varies based on data volume
- **CPU**: 1+ cores recommended

## PostgreSQL  

**Purpose**: Relational database management system  
**Port**: 5432  
**Data Persistence**: Yes (`./data` volume)  
**Configuration**: `config/postgresql.conf`

### Key Features

- ACID compliance
- Advanced SQL features
- Extensibility
- JSON/JSONB support
- Full-text search capabilities
- Streaming replication

### Use Cases  

- Web application databases
- Data warehousing
- Geospatial applications (with PostGIS)
- Time-series data
- OLTP and OLAP workloads

### Resource Requirements

- **Memory**: Minimum 256MB, recommended 1GB+
- **Storage**: Varies based on data volume  
- **CPU**: 1+ cores recommended

## Redis

**Purpose**: In-memory data structure store  
**Port**: 6379  
**Data Persistence**: Optional (RDB snapshots, AOF log)  
**Configuration**: `config/redis.conf`

### Key Features

- In-memory storage with optional persistence
- Multiple data structures (strings, hashes, lists, sets, sorted sets)
- Pub/sub messaging
- Lua scripting support
- Clustering and high availability
- Built-in replication

### Use Cases

- Caching layer
- Session storage
- Real-time analytics
- Message queuing
- Rate limiting
- Leaderboards and counters

### Resource Requirements

- **Memory**: Varies based on dataset size
- **Storage**: Minimal (for persistence files)
- **CPU**: 1+ cores recommended

## Service Dependencies

### Typical Architecture Patterns

1. **Web Application Stack**:

   ```
   Web App → Redis (cache/sessions) → PostgreSQL (primary data)
   ```

2. **Search-Enabled Application**:

   ```
   Web App → PostgreSQL (structured data) → OpenSearch (search/analytics)
   ```

3. **Full Stack**:

   ```
   Web App → Redis (cache) → PostgreSQL (data) → OpenSearch (search/logs)
   ```

## Network Configuration

All services are configured to run on the default Docker network. They can communicate with each other using service names as hostnames:

- `redis:6379`
- `postgresql:5432`
- `opensearch:9200`

## Data Persistence Strategy

### PostgreSQL

- Database files: `postgresql/data/`
- Backups: Use `pg_dump` (see backup script)

### OpenSearch  

- Index data: `opensearch/data/`
- Snapshots: Configure repository for backups

### Redis

- RDB snapshots: `redis/data/dump.rdb`
- AOF log: `redis/data/appendonly.aof`

## Monitoring and Health Checks

Each service includes health check endpoints:

- **PostgreSQL**: `pg_isready` command
- **Redis**: `redis-cli ping` command  
- **OpenSearch**: HTTP GET to `/_cluster/health`

Use the `./scripts/status.sh` script to check the health of all services.

## Scaling Considerations

### Horizontal Scaling

- **PostgreSQL**: Read replicas, connection pooling
- **Redis**: Clustering, sharding
- **OpenSearch**: Multi-node cluster

### Vertical Scaling

- Increase memory allocation in Docker Compose
- Adjust configuration parameters
- Monitor resource usage with `docker stats`

## Backup Strategy

Regular backups are essential:

1. **Automated**: Use `./scripts/backup.sh`
2. **Manual**: Service-specific backup commands
3. **Testing**: Regularly test backup restoration

See individual service documentation for specific backup procedures.
