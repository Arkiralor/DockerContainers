# OpenSearch Service

**Powerful search and analytics engine with integrated dashboards for local development**

## Overview

This OpenSearch setup provides a complete search and analytics platform optimized for local development. It includes OpenSearch (the search engine) and OpenSearch Dashboards (visualization UI), with persistent storage, health monitoring, and resource limits.

## Quick Start

```bash
# Using Make (recommended)
make start-opensearch

# Or using docker compose directly
cd opensearch
docker compose up -d

# Verify it's running
make status
```

**Access:**
- OpenSearch API: http://localhost:9200
- OpenSearch Dashboards: http://localhost:5601

## Configuration

### Connection Details

| Component | Port | URL |
|-----------|------|-----|
| **OpenSearch API** | 9200 | http://localhost:9200 |
| **OpenSearch Dashboards** | 5601 | http://localhost:5601 |
| **Performance API** | 9600 | http://localhost:9600 |

### Default Credentials

- **Username**: `admin`
- **Password**: `YourStrongPassword1!`

**Note**: Security is disabled by default for local development convenience. Authentication is not required for basic operations.

### Environment Variables

See `.env.example` for configuration options:

```bash
OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m    # JVM heap size
OPENSEARCH_INITIAL_ADMIN_PASSWORD=YourStrongPassword1!
```

## Features

### ✅ Complete Search Platform

Two integrated components:
- **OpenSearch**: Distributed search and analytics engine (Elasticsearch fork)
- **OpenSearch Dashboards**: Web UI for visualization and management (Kibana fork)

### ✅ Persistent Data Storage

Data persists across restarts:
- **Volume**: `opensearch_data`
- **Mount point**: `/usr/share/opensearch/data`
- **Benefits**: Indices and data survive container recreation

**Check volume:**
```bash
docker volume inspect opensearch_opensearch_data
```

### ✅ Health Checks

Automatic health monitoring:
- **OpenSearch**: Cluster health endpoint
- **Interval**: Every 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 5 attempts

**Check health:**
```bash
curl http://localhost:9200/_cluster/health?pretty
```

### ✅ Single-Node Cluster

Configured for local development:
- Single node (no clustering complexity)
- Security disabled for convenience
- Memory lock enabled for performance

### ✅ Resource Limits

Default limits for stability:

| Resource | Limit | Reserved |
|----------|-------|----------|
| **Memory** | 2 GB | 1 GB |
| **CPU** | 1.0 core | - |

### ✅ Custom Configuration

Configuration stored in `config/opensearch.yml`:

```yaml
# Network settings
network.host: 0.0.0.0

# Security disabled for local dev
plugins.security.disabled: true

# Single node cluster
discovery.type: single-node
```

To modify, edit the file and restart:
```bash
vim config/opensearch.yml
make restart-opensearch
```

### ✅ Service Dependencies

OpenSearch Dashboards waits for OpenSearch to be healthy before starting:
```yaml
depends_on:
  opensearch:
    condition: service_healthy
```

## Usage Examples

### Basic API Operations

#### Check Cluster Health
```bash
curl http://localhost:9200/_cluster/health?pretty
```

#### Get Cluster Info
```bash
curl http://localhost:9200
```

#### List All Indices
```bash
curl http://localhost:9200/_cat/indices?v
```

#### Create an Index
```bash
curl -X PUT "localhost:9200/my-index" -H 'Content-Type: application/json' -d'
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  }
}'
```

#### Index a Document
```bash
curl -X POST "localhost:9200/my-index/_doc/1" -H 'Content-Type: application/json' -d'
{
  "title": "My First Document",
  "content": "This is a test document",
  "timestamp": "2026-02-15T10:00:00"
}'
```

#### Search Documents
```bash
curl -X GET "localhost:9200/my-index/_search" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": {
      "content": "test"
    }
  }
}'
```

#### Delete an Index
```bash
curl -X DELETE "localhost:9200/my-index"
```

### Using OpenSearch from Applications

#### Python (opensearch-py)
```python
from opensearchpy import OpenSearch

# Create client
client = OpenSearch(
    hosts=[{'host': 'localhost', 'port': 9200}],
    http_auth=None,  # No auth needed for local dev
    use_ssl=False,
    verify_certs=False
)

# Index a document
response = client.index(
    index='my-index',
    body={
        'title': 'Python Document',
        'content': 'Indexed from Python'
    }
)

# Search
results = client.search(
    index='my-index',
    body={
        'query': {
            'match': {
                'content': 'Python'
            }
        }
    }
)

print(results['hits']['hits'])
```

#### Node.js (@opensearch-project/opensearch)
```javascript
const { Client } = require('@opensearch-project/opensearch');

// Create client
const client = new Client({
    node: 'http://localhost:9200'
});

// Index a document
await client.index({
    index: 'my-index',
    body: {
        title: 'Node.js Document',
        content: 'Indexed from Node.js'
    }
});

// Search
const response = await client.search({
    index: 'my-index',
    body: {
        query: {
            match: {
                content: 'Node.js'
            }
        }
    }
});

console.log(response.body.hits.hits);
```

#### Go (opensearch-go)
```go
package main

import (
    "context"
    "github.com/opensearch-project/opensearch-go/v2"
)

func main() {
    client, _ := opensearch.NewClient(opensearch.Config{
        Addresses: []string{"http://localhost:9200"},
    })

    // Index a document
    client.Index(
        "my-index",
        strings.NewReader(`{"title":"Go Document","content":"Indexed from Go"}`),
    )

    // Search
    res, _ := client.Search(
        client.Search.WithIndex("my-index"),
        client.Search.WithBody(strings.NewReader(`{"query":{"match":{"content":"Go"}}}`)),
    )
}
```

## OpenSearch Dashboards

### Accessing Dashboards

Open http://localhost:5601 in your browser.

### Key Features

1. **Discover**: Explore and search your data
2. **Visualize**: Create charts and graphs
3. **Dashboard**: Build custom dashboards
4. **Dev Tools**: Interactive console for API calls

### Using Dev Tools Console

The Dev Tools console provides an interactive way to run API commands:

1. Navigate to http://localhost:5601
2. Click "Dev Tools" in the left sidebar
3. Use the console:

```
# Create an index
PUT /my-index
{
  "settings": {
    "number_of_shards": 1
  }
}

# Index a document
POST /my-index/_doc
{
  "title": "Test Document",
  "content": "This is from Dashboards"
}

# Search
GET /my-index/_search
{
  "query": {
    "match_all": {}
  }
}
```

## Common Operations

### Index Management

```bash
# List all indices
curl http://localhost:9200/_cat/indices?v

# Get index settings
curl http://localhost:9200/my-index/_settings?pretty

# Get index mapping
curl http://localhost:9200/my-index/_mapping?pretty

# Update index settings
curl -X PUT "localhost:9200/my-index/_settings" -H 'Content-Type: application/json' -d'
{
  "index": {
    "number_of_replicas": 1
  }
}'

# Refresh index
curl -X POST "localhost:9200/my-index/_refresh"

# Close index
curl -X POST "localhost:9200/my-index/_close"

# Open index
curl -X POST "localhost:9200/my-index/_open"
```

### Document Operations

```bash
# Get document by ID
curl http://localhost:9200/my-index/_doc/1

# Update document
curl -X POST "localhost:9200/my-index/_doc/1/_update" -H 'Content-Type: application/json' -d'
{
  "doc": {
    "status": "updated"
  }
}'

# Delete document
curl -X DELETE "localhost:9200/my-index/_doc/1"

# Bulk operations
curl -X POST "localhost:9200/_bulk" -H 'Content-Type: application/json' --data-binary @bulk-data.json
```

### Search Operations

```bash
# Match all
curl -X GET "localhost:9200/my-index/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match_all": {}
  }
}'

# Match query
curl -X GET "localhost:9200/my-index/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": {
      "content": "search term"
    }
  }
}'

# Term query
curl -X GET "localhost:9200/my-index/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "term": {
      "status": "active"
    }
  }
}'

# Range query
curl -X GET "localhost:9200/my-index/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "range": {
      "timestamp": {
        "gte": "2026-01-01",
        "lte": "2026-12-31"
      }
    }
  }
}'

# Bool query (combining conditions)
curl -X GET "localhost:9200/my-index/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        {"match": {"content": "important"}}
      ],
      "filter": [
        {"term": {"status": "active"}}
      ]
    }
  }
}'
```

### Aggregations

```bash
# Terms aggregation
curl -X GET "localhost:9200/my-index/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "aggs": {
    "status_counts": {
      "terms": {
        "field": "status.keyword"
      }
    }
  },
  "size": 0
}'

# Date histogram
curl -X GET "localhost:9200/my-index/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "aggs": {
    "documents_over_time": {
      "date_histogram": {
        "field": "timestamp",
        "calendar_interval": "day"
      }
    }
  },
  "size": 0
}'
```

## Backup & Restore

### Create Backup

```bash
# Using repository backup script (recommended)
make backup

# Or manually (copies data directory)
docker cp opensearch-node:/usr/share/opensearch/data ./opensearch-backup
```

### Restore Backup

```bash
# Using repository restore script (recommended)
make restore

# Or manually:
# 1. Stop OpenSearch
make stop-opensearch

# 2. Replace data directory
docker cp ./opensearch-backup opensearch-node:/usr/share/opensearch/data

# 3. Start OpenSearch
make start-opensearch
```

### Snapshot and Restore (Official Method)

```bash
# Register snapshot repository
curl -X PUT "localhost:9200/_snapshot/my_backup" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/usr/share/opensearch/backups"
  }
}'

# Create snapshot
curl -X PUT "localhost:9200/_snapshot/my_backup/snapshot_1?wait_for_completion=true"

# List snapshots
curl http://localhost:9200/_snapshot/my_backup/_all?pretty

# Restore snapshot
curl -X POST "localhost:9200/_snapshot/my_backup/snapshot_1/_restore"
```

## Makefile Commands

```bash
make start-opensearch        # Start OpenSearch + Dashboards
make stop-opensearch         # Stop OpenSearch
make restart-opensearch      # Restart OpenSearch
make logs-opensearch         # View OpenSearch logs
make logs-dashboards         # View Dashboards logs
make shell-opensearch        # Open bash in container
make status                  # Show service status
make backup                  # Backup OpenSearch data
make restore                 # Restore from backup
```

## Troubleshooting

### OpenSearch Won't Start

**Check if port is in use:**
```bash
lsof -i :9200
lsof -i :9600
```

**Check logs:**
```bash
make logs-opensearch
# or
docker logs opensearch-node
```

**Common issues:**
- Insufficient memory
- vm.max_map_count too low (Linux)
- Port conflicts

### Fix vm.max_map_count (Linux only)

```bash
# Check current value
sysctl vm.max_map_count

# Increase temporarily
sudo sysctl -w vm.max_map_count=262144

# Increase permanently
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Out of Memory

**Check memory usage:**
```bash
docker stats opensearch-node
```

**Adjust JVM heap in docker-compose.yml:**
```yaml
environment:
  - "OPENSEARCH_JAVA_OPTS=-Xms1g -Xmx1g"  # Increase from 512m
```

**Adjust container memory limit:**
```yaml
deploy:
  resources:
    limits:
      memory: 4g  # Increase from 2g
```

### Cluster Health Issues

**Check cluster health:**
```bash
curl http://localhost:9200/_cluster/health?pretty
```

**Possible statuses:**
- **green**: All good
- **yellow**: Missing replicas (expected in single-node)
- **red**: Some data unavailable

**Force allocation:**
```bash
curl -X POST "localhost:9200/_cluster/reroute?retry_failed=true"
```

### Dashboards Can't Connect

**Verify OpenSearch is running:**
```bash
curl http://localhost:9200
```

**Check Dashboards logs:**
```bash
make logs-dashboards
```

**Verify Dashboards configuration:**
```yaml
environment:
  - OPENSEARCH_HOSTS=http://opensearch:9200
```

### Slow Performance

**Check cluster stats:**
```bash
curl http://localhost:9200/_cluster/stats?pretty
curl http://localhost:9200/_nodes/stats?pretty
```

**Monitor queries:**
```bash
curl http://localhost:9200/_tasks?detailed=true&actions=*search*
```

**Check slow queries:**
```bash
curl http://localhost:9200/_nodes/stats/indices/search?pretty
```

## Performance Tuning

### Recommended Settings for Development

Edit `config/opensearch.yml`:

```yaml
# Network
network.host: 0.0.0.0

# Discovery
discovery.type: single-node

# Memory
bootstrap.memory_lock: true

# Performance
indices.query.bool.max_clause_count: 2048
indices.fielddata.cache.size: 20%
indices.breaker.total.limit: 70%
```

### Monitor Performance

```bash
# Node stats
curl http://localhost:9200/_nodes/stats?pretty

# Cluster stats
curl http://localhost:9200/_cluster/stats?pretty

# Index stats
curl http://localhost:9200/my-index/_stats?pretty

# Hot threads
curl http://localhost:9200/_nodes/hot_threads
```

## Security Best Practices

### For Local Development

Default configuration prioritizes convenience:
- ✅ Security plugin disabled
- ✅ No authentication required
- ✅ HTTP (no HTTPS)
- ✅ Simple operation

This is **perfect for local development** but **not for production**.

### Enabling Security (Optional)

To enable security features:

1. **Enable security in config/opensearch.yml:**
```yaml
plugins.security.disabled: false
```

2. **Generate certificates**
3. **Configure users and roles**
4. **Update application connections**

See [OpenSearch Security Documentation](https://opensearch.org/docs/latest/security/) for details.

## System Requirements

### Minimum

- **RAM**: 2 GB
- **CPU**: 1 core
- **Disk**: 5 GB

### Recommended for Development

- **RAM**: 4 GB
- **CPU**: 2 cores
- **Disk**: 10 GB

## Additional Resources

- [OpenSearch Official Documentation](https://opensearch.org/docs/)
- [OpenSearch API Reference](https://opensearch.org/docs/latest/api-reference/)
- [OpenSearch Dashboards Guide](https://opensearch.org/docs/latest/dashboards/)
- [Query DSL Reference](https://opensearch.org/docs/latest/query-dsl/)
- [Main Repository README](../README.md)
- [Troubleshooting Guide](../docs/troubleshooting.md)

## Support

- **Issues**: [GitHub Issues](https://github.com/Arkiralor/DockerContainers/issues)
- **Logs**: `make logs-opensearch` / `make logs-dashboards`
- **Status**: `make status`
- **Tests**: `make test`

---

**Ready to use OpenSearch for local development!**

*Last Updated: February 2026*
