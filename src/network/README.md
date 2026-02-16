# Optional Shared Network

This directory provides an optional shared Docker network for inter-container communication. This is **not** part of the standard repository setup.

## Default Repository Architecture

By default, all services in this repository are standalone and accessed via exposed ports on localhost:

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- OpenSearch: `localhost:9200`

Services do not communicate with each other. External applications connect via localhost ports.

## When This Network Is Needed

Use this shared network only when your application meets these specific requirements:

1. Your application runs in a Docker container (not on the host machine)
2. Your containerized application needs to connect to multiple services (PostgreSQL, Redis, OpenSearch)
3. You need service discovery by container name rather than localhost ports

## When NOT to Use This Network

- Your application runs outside Docker (use exposed ports via localhost)
- You only access services individually via their exposed ports
- You prefer the simplicity of port-based connections

## Network Configuration

The `container-net` network provides:

- **Driver**: bridge
- **Attachable**: Allows running containers to join dynamically
- **Subnet**: 172.28.0.0/16 with gateway at 172.28.0.1
- **DNS**: Automatic container name resolution
- **Inter-container communication**: Enabled

## Setup

### Create the Network

```bash
cd network
docker compose up -d
```

Verify network creation:

```bash
docker network ls | grep container-net
docker network inspect container-net
```

## Connecting Services to the Network

### Modify Service Compose Files

To add a service to the shared network, edit its `docker-compose.yml`:

#### PostgreSQL

Edit `postgresql/docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: postgres-local
    # ... existing configuration ...
    networks:
      - default
      - container-net

networks:
  container-net:
    external: true
    name: container-net
```

Restart the service:

```bash
cd postgresql
docker compose up -d
```

#### Redis

Edit `redis/docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: redis-local
    # ... existing configuration ...
    networks:
      - default
      - container-net

networks:
  container-net:
    external: true
    name: container-net
```

Restart the service:

```bash
cd redis
docker compose up -d
```

#### OpenSearch

Edit `opensearch/docker-compose.yml`:

```yaml
services:
  opensearch:
    image: opensearchproject/opensearch:latest
    container_name: opensearch-local
    # ... existing configuration ...
    networks:
      - default
      - container-net

  opensearch-dashboards:
    image: opensearchproject/opensearch-dashboards:latest
    container_name: opensearch-dashboards
    # ... existing configuration ...
    networks:
      - default
      - container-net

networks:
  container-net:
    external: true
    name: container-net
```

Restart the services:

```bash
cd opensearch
docker compose up -d
```

### Connect Running Containers

Alternative method for already running containers:

```bash
docker network connect container-net postgres-local
docker network connect container-net redis-local
docker network connect container-net opensearch-local
```

## Using from Your Application

### Connection Strings

Once services are on the shared network, your containerized application uses container names:

**PostgreSQL:**
```
postgresql://elay_user:elay_pass@postgres-local:5432/elay-local
```

**Redis:**
```
redis://redis-local:6379
```

**OpenSearch:**
```
https://opensearch-local:9200
```

### Example Application Container

Create a compose file for your application:

```yaml
services:
  app:
    build: .
    container_name: your-app
    environment:
      DATABASE_URL: postgresql://elay_user:elay_pass@postgres-local:5432/elay-local
      REDIS_URL: redis://redis-local:6379
      OPENSEARCH_URL: https://opensearch-local:9200
    networks:
      - container-net

networks:
  container-net:
    external: true
    name: container-net
```

## Testing Connectivity

### Verify Network Membership

List all containers on the network:

```bash
docker network inspect container-net --format '{{range .Containers}}{{.Name}} {{end}}'
```

### Test from Application Container

```bash
docker exec -it your-app sh

# Test PostgreSQL
ping postgres-local
nc -zv postgres-local 5432

# Test Redis
ping redis-local
nc -zv redis-local 6379

# Test OpenSearch
ping opensearch-local
nc -zv opensearch-local 9200
```

## Port Mapping Behavior

When containers are on the shared network:

- **Internal communication**: Containers use internal ports (5432, 6379, 9200) via container names
- **External access**: Host machine still uses localhost ports
- **Both work simultaneously**: No conflict between the two access methods

## Managing the Network

### Start

```bash
cd network
docker compose up -d
```

### Stop and Remove

```bash
cd network
docker compose down
```

### Inspect

```bash
docker network inspect container-net
```

### Disconnect Container

```bash
docker network disconnect container-net <container-name>
```

## Configuration Examples

### Django Application

```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'elay-local',
        'USER': 'elay_user',
        'PASSWORD': 'elay_pass',
        'HOST': 'postgres-local',
        'PORT': '5432',
    }
}

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://redis-local:6379',
    }
}
```

### Node.js Application

```javascript
// config.js
module.exports = {
  database: {
    host: 'postgres-local',
    port: 5432,
    user: 'elay_user',
    password: 'elay_pass',
    database: 'elay-local'
  },
  redis: {
    host: 'redis-local',
    port: 6379
  },
  opensearch: {
    node: 'https://opensearch-local:9200'
  }
};
```

## Troubleshooting

### Network Already Exists

```bash
docker network rm container-net
cd network && docker compose up -d
```

### Container Cannot Resolve Hostnames

Verify both containers are on the network:

```bash
docker network inspect container-net
```

Check container names:

```bash
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

Restart containers after connecting to network:

```bash
docker restart <container-name>
```

### Connection Refused

Ensure the service is running:

```bash
docker ps | grep <service-name>
```

Check service health:

```bash
docker inspect <container-name> | grep -A 10 Health
```

Verify using internal port (5432, not 5433 or other mapped ports):

```bash
docker port <container-name>
```

### DNS Resolution Issues

Find container IP address as fallback:

```bash
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' postgres-local
```

Check Docker DNS configuration:

```bash
docker exec your-app cat /etc/resolv.conf
```

## Security Considerations

This network is designed for local development only:

- All containers on this network can communicate freely
- No firewall rules between containers
- Simple passwords are acceptable for local development
- Not suitable for production environments

## Best Practices

1. Use container names for service discovery, not IP addresses
2. Keep internal ports standard (5432 for PostgreSQL, 6379 for Redis)
3. Document which services your application requires
4. Test connectivity before debugging application code
5. Remove the network when switching to different projects

## Integration with Repository

This network is standalone and not included in repository management scripts:

```bash
# Start network separately
cd network && docker compose up -d

# Then start services normally
cd .. && make start

# Or connect individual running services
docker network connect container-net postgres-local
```

## Quick Reference

```bash
# Create network
cd network && docker compose up -d

# Connect service
docker network connect container-net <container-name>

# Verify
docker network inspect container-net

# Test connectivity
docker exec -it your-app ping postgres-local

# Remove network
cd network && docker compose down
```

## Related Documentation

- Main repository: `../README.md`
- PostgreSQL: `../postgresql/README.md`
- Redis: `../redis/README.md`
- OpenSearch: `../opensearch/README.md`
