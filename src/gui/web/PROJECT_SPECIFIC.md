# Web UI - Project-Specific Container Management

## Overview

The Docker Container Manager web UI has been updated to specifically manage only the containers defined in this repository:

- **PostgreSQL** (src/postgresql)
- **Redis** (src/redis)
- **OpenSearch** (src/opensearch)
- **OpenSearch Dashboards** (src/opensearch)

The GUI's own containers (docker-gui-server, docker-gui-client) are filtered out and not shown in the interface.

## What Changed

### Project-Specific Filtering

**File**: `shared/project-config.ts`
- Defines the specific containers that belong to this project
- Provides filtering functions to show only project containers
- Lists expected ports and descriptions for each service

**Updated Components**:
1. **ContainerList** - Only displays postgres, redis, opensearch, opensearch-dashboards
2. **SystemInfo** - Shows counts for project containers only (not system-wide stats)
3. **Empty State** - Provides project-specific instructions

### Simplified Interface

The UI now shows exactly what you need:
- **Project Containers**: Count of your 3-4 main containers (postgres, redis, opensearch, dashboards)
- **Running/Stopped**: Counts for your project containers only
- **System Resources**: CPU and Memory (for reference)

## How to Use

### Access the Web UI

```
http://localhost:3000
```

### Managing Containers

The web UI provides a visual interface for operations you normally do via command line:

**Instead of**:
```bash
cd src/postgresql && docker compose up -d
cd src/redis && docker compose up -d
```

**You can**:
- Click "Start" button on postgres container card
- Click "Start" button on redis container card

**Instead of**:
```bash
cd src/postgresql && docker compose down
```

**You can**:
- Click "Stop" button on postgres container card

### What You Can Do

For each container (postgres, redis, opensearch, dashboards):
- ✅ **Start** - Equivalent to `docker compose up -d` in that service's directory
- ✅ **Stop** - Equivalent to `docker compose stop`
- ✅ **Restart** - Equivalent to `docker compose restart`
- ✅ **View Details** - See configuration, volumes, ports, environment variables
- ✅ **View Logs** - See last 200 lines of container logs
- ✅ **Remove** - Equivalent to `docker compose down` (with confirmation)

### Real-Time Monitoring

- Container list auto-refreshes every 5 seconds
- System stats auto-refresh every 30 seconds
- Manual refresh button available

## Current Status

Running containers managed by the web UI:

```bash
$ curl -s 'http://localhost:5001/api/containers?all=true' | \
  jq -r '.[] | select(.Names[0] | test("postgres|redis|opensearch")) | "\(.Names[0]) - \(.State)"'

/postgres - running
/redis - stopped
```

The web UI will show:
- **postgres** container (running, green status)
- **redis** container (stopped, red status)
- **opensearch** and **opensearch-dashboards** (when you start them)

## Starting/Stopping the Web UI

### Start
```bash
cd /Users/arkiralor/Developer/DockerContainers/src/gui/web
docker compose up -d
```

### Stop
```bash
cd /Users/arkiralor/Developer/DockerContainers/src/gui/web
docker compose down
```

### View Logs
```bash
docker compose logs -f
```

### Rebuild (after code changes)
```bash
docker compose up -d --build
```

## Files Modified

1. **shared/project-config.ts** - New file defining project containers
2. **client/src/components/ContainerList.tsx** - Filters to show only project containers
3. **client/src/components/SystemInfo.tsx** - Shows project-specific stats
4. **docker-compose.yml** - Updated build context and ports
5. **client/Dockerfile** - Updated to include shared directory
6. **server/Dockerfile** - Updated to include shared directory

## Integration with Existing Tools

The web UI **complements** the existing Makefile and scripts. You can still use:

```bash
make start-postgres    # Or use web UI "Start" button
make stop-redis        # Or use web UI "Stop" button
make logs-opensearch   # Or use web UI "Details" → "Logs" tab
make status            # Or view web UI dashboard
```

The web UI provides a visual alternative to these commands.

## No Over-Engineering

The implementation is straightforward:
- Shows exactly 3-4 containers (postgres, redis, opensearch, dashboards)
- Simple filtering based on container names
- No complex orchestration or service discovery
- Direct Docker API calls
- Minimal abstraction

## Next Steps

Phase 1.2 is complete. The web UI is project-specific and ready to use.

If you want enhanced monitoring (charts, graphs, detailed metrics), that would be Phase 1.3.
