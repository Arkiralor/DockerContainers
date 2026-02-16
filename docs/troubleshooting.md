# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the Docker containers.

## General Docker Issues

### Docker Not Running

**Symptoms**: Commands fail with "Cannot connect to the Docker daemon"

**Solutions**:

```bash
# Check if Docker is running
docker info

# Start Docker (macOS/Windows)
# Use Docker Desktop application

# Start Docker (Linux)
sudo systemctl start docker
```

### Permission Issues  

**Symptoms**: "Permission denied" errors

**Solutions**:

```bash
# Add user to docker group (Linux)
sudo usermod -aG docker $USER
# Then log out and back in

# Or use sudo (not recommended for production)
sudo docker command
```

### Disk Space Issues

**Symptoms**: "No space left on device" errors  

**Solutions**:

```bash
# Clean up Docker resources
docker system prune -a

# Remove unused volumes
docker volume prune

# Check disk usage
docker system df
```

## Service-Specific Issues

## PostgreSQL

### Database Connection Failed

**Symptoms**:

- Connection refused errors
- "could not connect to server" messages

**Diagnosis**:

```bash
# Check container status
cd src/postgresql
docker-compose ps

# Check logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U postgres -d postgres
```

**Solutions**:

1. Verify container is running
2. Check environment variables in `.env`
3. Confirm port mapping (5432)
4. Check firewall settings

### Database Initialization Fails

**Symptoms**: Container exits immediately or startup errors

**Solutions**:

```bash
# Remove data directory and restart (WARNING: DATA LOSS)
rm -rf src/postgresql/data
docker-compose up -d

# Check initialization logs
docker-compose logs postgres
```

### Password Authentication Failed  

**Solutions**:

1. Verify `POSTGRES_PASSWORD` in `.env`
2. Ensure password meets complexity requirements  
3. Clear data directory if password changed

## Redis

### Connection Refused

**Symptoms**: "Connection refused" when connecting to Redis

**Diagnosis**:

```bash
# Check container status
cd src/redis  
docker-compose ps

# Test Redis connectivity
docker-compose exec redis redis-cli ping
```

**Solutions**:

1. Verify container is running
2. Check port mapping (6379)
3. Verify Redis configuration
4. Check authentication if enabled

### Memory Issues

**Symptoms**: Redis crashes or becomes unresponsive

**Solutions**:

```bash
# Check memory usage
docker-compose exec redis redis-cli info memory

# Adjust maxmemory in redis.conf or .env
REDIS_MAXMEMORY=512mb
```

### Persistence Issues

**Symptoms**: Data loss after container restart

**Solutions**:

1. Ensure volume mapping is correct
2. Check `REDIS_APPENDONLY=yes` in `.env`
3. Verify disk space for persistence files

## OpenSearch

### Cluster Health Issues

**Symptoms**: Yellow or red cluster status

**Diagnosis**:

```bash
# Check cluster health
curl -X GET "localhost:9200/_cluster/health?pretty"

# Check node status  
curl -X GET "localhost:9200/_cat/nodes?v"
```

**Solutions**:

1. Increase memory allocation
2. Check disk space
3. Review OpenSearch logs

### Bootstrap Checks Failed

**Symptoms**: OpenSearch fails to start with bootstrap check errors

**Solutions**:

```bash
# For development, disable bootstrap checks
echo "OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m -Des.enforce.bootstrap.checks=false" >> opensearch/.env
```

### Memory Lock Issues  

**Symptoms**: "memory locking requested but not allowed" errors

**Solutions**:

```yaml
# In docker-compose.yml, add:
ulimits:
  memlock:
    soft: -1  
    hard: -1
```

### Security Plugin Issues

**Symptoms**: Authentication or SSL errors

**Solutions**:

```bash  
# Disable security for development
echo "PLUGINS_SECURITY_DISABLED=true" >> opensearch/.env

# Or configure proper certificates
# See OpenSearch security documentation
```

## Network Issues

### Service Communication Problems

**Symptoms**: Services can't communicate with each other

**Diagnosis**:

```bash
# Test network connectivity between containers
docker network ls
docker network inspect <network_name>
```

**Solutions**:

1. Ensure all services use the same network
2. Use service names as hostnames (not localhost)
3. Check firewall rules

### Port Conflicts

**Symptoms**: "Port already in use" errors

**Solutions**:

```bash
# Find what's using the port
lsof -i :5432  # Replace with your port

# Kill the process or change port mapping
# In docker-compose.yml: "5433:5432"
```

## Performance Issues

### Slow Container Startup

**Solutions**:

1. Reduce memory allocation if too high
2. Use SSD storage for volumes
3. Increase available system resources

### High Resource Usage

**Diagnosis**:

```bash
# Monitor resource usage
docker stats

# Check individual container usage
docker exec <container> top
```

**Solutions**:

1. Tune service configurations
2. Implement resource limits in docker-compose.yml
3. Scale horizontally if needed

## Data Issues  

### Data Corruption

**Symptoms**: Database errors or inconsistent data

**Solutions**:

1. Stop all services immediately
2. Restore from latest backup
3. Check filesystem integrity
4. Review logs for cause

### Backup/Restore Problems

**Solutions**:

1. Verify backup script permissions
2. Check available disk space
3. Test restore procedure regularly
4. Ensure services are stopped during restore

## Common Commands for Troubleshooting

```bash
# View all container logs
./scripts/status.sh

# View specific service logs  
cd <service> && docker-compose logs -f

# Access container shell
docker-compose exec <service> bash

# Restart specific service
cd <service> && docker-compose restart

# Rebuild container
cd <service> && docker-compose up -d --build

# Reset everything (DATA LOSS WARNING)
./scripts/stop-all.sh
docker system prune -a
rm -rf */data
./scripts/start-all.sh
```

## Getting Help

1. Check service-specific documentation
2. Review Docker Compose logs
3. Search for error messages in service documentation  
4. Check GitHub issues if using official images
5. Consult Docker and service-specific communities

## Preventive Measures

1. **Regular Backups**: Use `./scripts/backup.sh`
2. **Monitor Resources**: Check `docker stats` regularly
3. **Update Images**: Keep base images updated
4. **Review Logs**: Monitor for warnings/errors
5. **Test Recovery**: Practice restore procedures
