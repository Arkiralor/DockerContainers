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

## Service Access

All services are standalone and accessed via exposed ports on localhost. External applications connect directly to each service independently.

### Connection Points

- **Redis**: `localhost:6379`
- **PostgreSQL**: `localhost:5432`
- **OpenSearch**: `localhost:9200`
- **OpenSearch Dashboards**: `localhost:5601`

### Typical Usage Patterns

1. **Web Application Stack**:
   - Application connects to Redis at `localhost:6379` for caching and sessions
   - Application connects to PostgreSQL at `localhost:5432` for primary data storage

2. **Search-Enabled Application**:
   - Application connects to PostgreSQL at `localhost:5432` for structured data
   - Application connects to OpenSearch at `localhost:9200` for search and analytics

3. **Full Stack**:
   - Application connects to Redis at `localhost:6379` for caching
   - Application connects to PostgreSQL at `localhost:5432` for data storage
   - Application connects to OpenSearch at `localhost:9200` for search and log analysis

### Multi-Redis Setup

When using `docker-compose.multi-redis.yml`, five independent Redis instances are available:

- **redis-1**: `localhost:6379`
- **redis-2**: `localhost:6380`
- **redis-3**: `localhost:6381`
- **redis-4**: `localhost:6382`
- **redis-5**: `localhost:6383`

## Network Architecture

Services do not communicate with each other. Each service runs independently and is accessed by external applications via exposed ports. This design provides:

- Simple, predictable connectivity
- Service isolation
- Easy debugging and troubleshooting
- Flexibility to start only needed services

## Data Persistence Strategy

### PostgreSQL

- Database files: `src/postgresql/data/`
- Backups: Use `pg_dump` (see backup script)

### OpenSearch  

- Index data: `src/opensearch/data/`
- Snapshots: Configure repository for backups

### Redis

- RDB snapshots: `src/redis/data/dump.rdb`
- AOF log: `src/redis/data/appendonly.aof`

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
