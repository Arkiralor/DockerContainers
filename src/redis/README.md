# Redis Service

**High-performance in-memory data store for local development**

## Overview

This Redis setup provides both single-instance and multi-instance configurations optimized for local development. It includes persistent storage (RDB snapshots), health monitoring, custom configuration support, and resource limits.

## Quick Start

### Single Redis Instance

```bash
# Using Make (recommended)
make start-redis

# Or using docker compose directly
cd redis
docker compose up -d

# Verify it's running
make status
```

### Multi-Instance Redis (5 Servers)

```bash
# Using Make
make start-multi-redis

# Or using docker compose directly
cd redis
docker compose -f docker-compose.multi-redis.yml up -d
```

## Configurations

### Single Instance

Perfect for general caching, session storage, and simple queue operations.

**Connection Details:**
- **Host**: `localhost`
- **Port**: `6379`
- **Persistence**: RDB snapshots
- **Resource Limits**: 512MB RAM, 0.5 CPU

**Quick Test:**
```bash
redis-cli -h localhost -p 6379 ping
# Response: PONG
```

### Multi-Instance (5 Redis Servers)

Ideal for complex applications needing isolated Redis instances for different purposes.

| Instance Name | Port | Use Case |
|---------------|------|----------|
| **caching** | 6379 | General application caching |
| **celery_base_queues** | 6380 | Basic Celery task queues |
| **celery_advanced_queues** | 6381 | Priority/advanced Celery tasks |
| **multipurpose** | 6382 | Multi-purpose operations |
| **miscellaneous** | 6383 | Miscellaneous tasks |

**Key Benefits:**
- Complete isolation between instances
- Independent data persistence
- Can run alongside single instance
- Each has own resource limits
- Perfect for microservices

## Features

### Persistent Data Storage (RDB)

Data is saved to disk using Redis RDB snapshots:
- **Volumes**: `redis_data` (single) or `<instance>_data` (multi)
- **Mount point**: `/data`
- **Benefits**: Data survives restarts and system reboots

**Check volumes:**
```bash
# Single instance
docker volume inspect redis_redis_data

# Multi-instance
docker volume ls | grep redis
```

### Health Checks

Automatic health monitoring using `redis-cli ping`:
- **Interval**: Every 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 5 attempts before unhealthy

**View health:**
```bash
docker inspect redis | grep -A 10 Health
```

### Custom Configuration

To use custom Redis configuration:

1. **Create config file:**
```bash
cat > config/redis.conf <<EOF
# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Performance
tcp-backlog 511
timeout 0
tcp-keepalive 300
EOF
```

1. **Uncomment volume mount in docker-compose.yml:**
```yaml
volumes:
  - redis_data:/data
  - ./config/redis.conf:/usr/local/etc/redis/redis.conf:ro  # Uncomment
```

1. **Restart:**
```bash
make restart-redis
```

### Resource Limits

Each Redis instance has default limits:

| Resource | Limit | Reserved |
|----------|-------|----------|
| **Memory** | 512 MB | 256 MB |
| **CPU** | 0.5 core | - |

Prevents any instance from consuming excessive resources.

### Logging

Automatic log management:
- **Driver**: json-file
- **Max size**: 10 MB per file
- **Max files**: 3 (30 MB total)

**View logs:**
```bash
make logs-redis
# or
docker compose logs -f redis
```

## Usage Examples

### Connecting from Command Line

```bash
# Using Make command
make shell-redis

# Or directly with redis-cli
redis-cli -h localhost -p 6379

# Multi-instance (specify port)
redis-cli -h localhost -p 6380  # celery_base_queues
redis-cli -h localhost -p 6381  # celery_advanced_queues
```

### Connecting from Applications

#### Python (redis-py)
```python
import redis

# Single instance
r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Set and get
r.set('mykey', 'myvalue')
value = r.get('mykey')
print(value)  # 'myvalue'

# Multi-instance
cache = redis.Redis(host='localhost', port=6379)  # caching
celery = redis.Redis(host='localhost', port=6380)  # celery_base_queues
```

#### Node.js (ioredis)
```javascript
const Redis = require('ioredis');

// Single instance
const redis = new Redis({
    host: 'localhost',
    port: 6379
});

// Set and get
await redis.set('mykey', 'myvalue');
const value = await redis.get('mykey');
console.log(value);  // 'myvalue'

// Multi-instance
const cache = new Redis({ port: 6379 });
const celery = new Redis({ port: 6380 });
```

#### Go (go-redis)
```go
package main

import (
    "context"
    "github.com/redis/go-redis/v9"
)

func main() {
    ctx := context.Background()

    // Single instance
    rdb := redis.NewClient(&redis.Options{
        Addr: "localhost:6379",
    })

    // Set and get
    rdb.Set(ctx, "mykey", "myvalue", 0)
    val, _ := rdb.Get(ctx, "mykey").Result()
    fmt.Println(val)  // "myvalue"
}
```

#### Java (Jedis)
```java
import redis.clients.jedis.Jedis;

public class RedisExample {
    public static void main(String[] args) {
        // Single instance
        Jedis jedis = new Jedis("localhost", 6379);

        // Set and get
        jedis.set("mykey", "myvalue");
        String value = jedis.get("mykey");
        System.out.println(value);  // "myvalue"

        jedis.close();
    }
}
```

## Common Operations

### Basic Operations

```bash
# Connect to Redis
redis-cli -h localhost -p 6379

# Set a key
SET mykey "Hello World"

# Get a key
GET mykey

# Check if key exists
EXISTS mykey

# Delete a key
DEL mykey

# Set with expiration (60 seconds)
SETEX mykey 60 "Temporary value"

# Get time to live
TTL mykey

# Set multiple keys
MSET key1 "value1" key2 "value2" key3 "value3"

# Get multiple keys
MGET key1 key2 key3
```

### Working with Lists

```bash
# Push to list
LPUSH mylist "item1"
LPUSH mylist "item2"
RPUSH mylist "item3"

# Get list length
LLEN mylist

# Get range
LRANGE mylist 0 -1

# Pop from list
LPOP mylist
RPOP mylist
```

### Working with Sets

```bash
# Add to set
SADD myset "member1"
SADD myset "member2" "member3"

# Get all members
SMEMBERS myset

# Check membership
SISMEMBER myset "member1"

# Remove member
SREM myset "member1"
```

### Working with Hashes

```bash
# Set hash field
HSET user:1000 username "john"
HSET user:1000 email "john@example.com"

# Get hash field
HGET user:1000 username

# Get all fields
HGETALL user:1000

# Delete field
HDEL user:1000 email
```

### Database Management

```bash
# Select database (0-15)
SELECT 1

# Get database size
DBSIZE

# Flush current database
FLUSHDB

# Flush all databases (WARNING: Deletes everything!)
FLUSHALL

# Get Redis info
INFO

# Get specific section
INFO memory
INFO stats
INFO replication
```

## Backup & Restore

### Create Backup

```bash
# Using repository backup script (recommended)
make backup

# Or manually trigger RDB save
redis-cli -h localhost -p 6379 BGSAVE

# Check save status
redis-cli -h localhost -p 6379 LASTSAVE

# Copy RDB file
docker cp redis:/data/dump.rdb ./backup-$(date +%Y%m%d).rdb
```

### Restore Backup

```bash
# Using repository restore script (recommended)
make restore

# Or manually:
# 1. Stop Redis
make stop-redis

# 2. Replace RDB file
docker cp ./backup.rdb redis:/data/dump.rdb

# 3. Start Redis
make start-redis
```

## Multi-Instance Management

### Start Specific Instances

```bash
# Start only caching and celery_base_queues
cd redis
docker compose -f docker-compose.multi-redis.yml up -d caching celery_base_queues

# Check which are running
docker compose -f docker-compose.multi-redis.yml ps
```

### Connect to Specific Instance

```bash
# Connect to caching (6379)
redis-cli -h localhost -p 6379

# Connect to celery_base_queues (6380)
redis-cli -h localhost -p 6380

# Connect to celery_advanced_queues (6381)
redis-cli -h localhost -p 6381
```

### Stop Specific Instances

```bash
# Stop specific instance
cd redis
docker compose -f docker-compose.multi-redis.yml stop caching

# Stop all instances
make stop-multi-redis
# or
docker compose -f docker-compose.multi-redis.yml down
```

### View Logs for Specific Instance

```bash
cd redis
docker compose -f docker-compose.multi-redis.yml logs -f caching
docker compose -f docker-compose.multi-redis.yml logs -f celery_base_queues
```

## Makefile Commands

All Redis-specific make commands:

```bash
# Single Instance
make start-redis             # Start single Redis instance
make stop-redis              # Stop single instance
make restart-redis           # Restart single instance
make shell-redis             # Open Redis CLI
make logs-redis              # View logs

# Multi-Instance
make start-multi-redis       # Start all 5 instances
make stop-multi-redis        # Stop all 5 instances

# Common
make status                  # Show service status
make backup                  # Backup all Redis instances
make restore                 # Restore from backup
make test                    # Run automated tests
```

## Troubleshooting

### Redis Won't Start

**Check if port is in use:**
```bash
lsof -i :6379
# or
netstat -an | grep 6379
```

**Check logs:**
```bash
make logs-redis
# or
docker logs redis
```

**Common issues:**
- Port already in use (another Redis instance)
- Insufficient memory
- Corrupted RDB file

### Connection Refused

**Verify container is running:**
```bash
docker ps | grep redis
```

**Test connectivity:**
```bash
redis-cli -h localhost -p 6379 ping
```

**Check if Redis is accepting connections:**
```bash
docker exec redis redis-cli ping
```

### Out of Memory

**Check memory usage:**
```bash
docker stats redis

# Or within Redis
redis-cli INFO memory
```

**Check maxmemory setting:**
```bash
redis-cli CONFIG GET maxmemory
redis-cli CONFIG GET maxmemory-policy
```

**Adjust memory limit in docker-compose.yml:**
```yaml
deploy:
  resources:
    limits:
      memory: 1g  # Increase from 512m
```

### Data Not Persisting

**Verify volume exists:**
```bash
docker volume ls | grep redis
```

**Check RDB configuration:**
```bash
redis-cli CONFIG GET save
redis-cli CONFIG GET dir
```

**Manually trigger save:**
```bash
redis-cli BGSAVE
redis-cli SAVE  # Blocking save
```

### Slow Performance

**Check slow log:**
```bash
redis-cli SLOWLOG GET 10
```

**Monitor commands:**
```bash
redis-cli MONITOR
```

**Check memory fragmentation:**
```bash
redis-cli INFO memory | grep fragmentation
```

### Multi-Instance Port Conflicts

**Verify ports are available:**
```bash
lsof -i :6379
lsof -i :6380
lsof -i :6381
lsof -i :6382
lsof -i :6383
```

**Check all instances are running:**
```bash
cd redis
docker compose -f docker-compose.multi-redis.yml ps
```

## Performance Tuning

### Recommended Settings for Development

Create `config/redis.conf`:

```conf
# Memory Management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes

# Performance
tcp-backlog 511
timeout 0
tcp-keepalive 300

# Logging
loglevel notice

# Limits
maxclients 10000
```

### Monitor Performance

```bash
# Real-time stats
redis-cli --stat

# Monitor all commands
redis-cli MONITOR

# Get comprehensive info
redis-cli INFO all

# Check slow queries
redis-cli SLOWLOG GET 10
redis-cli SLOWLOG LEN
redis-cli SLOWLOG RESET
```

### Memory Optimization

```bash
# Check memory usage
redis-cli INFO memory

# Get memory usage by key
redis-cli --bigkeys

# Sample random keys
redis-cli --memkeys --memkeys-samples 1000
```

## Security Best Practices

### For Local Development

Default configuration is optimized for convenience:
- No authentication required
- Listen on localhost only
- No SSL/TLS
- Simple operation

This is **perfect for local development** but **not for production**.

### If You Need More Security

1. **Enable authentication:**
```bash
# In config/redis.conf
requirepass your_strong_password_here
```

```bash
# Connect with password
redis-cli -h localhost -p 6379 -a your_strong_password_here
```

1. **Rename dangerous commands:**
```bash
# In config/redis.conf
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG "CONFIG_SECRET_NAME"
```

## Advanced Topics

### Pub/Sub Messaging

```bash
# Terminal 1: Subscribe
redis-cli
SUBSCRIBE mychannel

# Terminal 2: Publish
redis-cli
PUBLISH mychannel "Hello World"
```

### Transactions

```bash
MULTI
SET key1 "value1"
SET key2 "value2"
INCR counter
EXEC
```

### Pipelining

Reduce round-trip time by batching commands:

```python
import redis

r = redis.Redis()
pipe = r.pipeline()
pipe.set('key1', 'value1')
pipe.set('key2', 'value2')
pipe.set('key3', 'value3')
results = pipe.execute()
```

### Lua Scripts

```bash
# Atomic increment with max value
EVAL "local val = redis.call('GET', KEYS[1]); if val == false then val = 0 else val = tonumber(val) end; if val < tonumber(ARGV[1]) then redis.call('INCR', KEYS[1]); return 1 else return 0 end" 1 mykey 100
```

## Using with Celery

### Python Configuration

```python
from celery import Celery

# Single broker and backend
app = Celery('myapp',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/1'
)

# Multi-instance (recommended)
app = Celery('myapp',
    broker='redis://localhost:6380/0',      # celery_base_queues
    backend='redis://localhost:6381/0'      # celery_advanced_queues
)
```

## Additional Resources

- [Redis Official Documentation](https://redis.io/documentation)
- [Redis Commands Reference](https://redis.io/commands)
- [RedisInsight](https://redis.io/insight/) - GUI management tool
- [Main Repository README](../README.md)
- [Troubleshooting Guide](../docs/troubleshooting.md)

## Support

- **Issues**: [GitHub Issues](https://github.com/Arkiralor/DockerContainers/issues)
- **Logs**: `make logs-redis`
- **Status**: `make status`
- **Tests**: `make test`

---

**Ready to use Redis for local development!**

*Last Updated: February 2026*
