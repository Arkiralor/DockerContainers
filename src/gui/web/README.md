# Docker Container Manager - Web UI

A web-based interface for managing the Docker containers defined in this repository (PostgreSQL, Redis, OpenSearch, and OpenSearch Dashboards).

**Note**: The server runs on port **5001** (not 5000) to avoid conflicts with macOS AirPlay Receiver on port 5000.

## Overview

This web UI provides a visual interface for managing the specific services in this repository:
- **PostgreSQL** - Database server (port 5432)
- **Redis** - Cache server (port 6379)
- **OpenSearch** - Search engine (ports 9200, 9600)
- **OpenSearch Dashboards** - Search UI (port 5601)

It uses the existing Makefile commands under the hood, providing a simple point-and-click interface for operations you'd normally do via command line.

## Features

- **Service Management**: Start, stop, and view status of all 4 services
- **Real-time Monitoring**: Auto-refreshing status indicators (running/stopped/not created)
- **Container Details**: View configuration, ports, volumes, environment variables
- **Log Viewer**: Access container logs (last 200 lines) directly from the UI
- **System Dashboard**: View system resources (CPU, memory) and service counts
- **Makefile Integration**: Executes existing repository commands (`make start-postgres`, etc.)

## How It Works

When you click buttons in the UI:
- **Start PostgreSQL** → Runs `make start-postgres` in the repository root
- **Stop Redis** → Runs `make stop-redis` in the repository root
- **View Logs** → Fetches logs from Docker API

The UI checks Docker API for status but uses your existing Makefile commands for all operations.

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- React Query for data fetching and caching
- Socket.io client for real-time updates

### Backend
- Node.js with Express
- TypeScript
- dockerode for Docker API (status checking only)
- child_process for executing Make commands
- Winston for logging

## Prerequisites

- Node.js 18 or higher (for development)
- Docker Engine running on the host
- Docker Compose (for deployment)
- Access to repository root (mounted as volume in Docker)

## Quick Start (Docker Compose)

The easiest way to run the web UI is with Docker Compose:

```bash
cd src/gui/web
docker compose up -d
```

This starts both the backend API server and frontend web server.

Access the interface at: **http://localhost:3000**

### Stop the GUI

```bash
cd src/gui/web
docker compose down
```

### View Logs

```bash
cd src/gui/web
docker compose logs -f
```

### Rebuild After Code Changes

```bash
cd src/gui/web
docker compose up -d --build
```

## Development Setup

For local development without Docker:

### 1. Install Dependencies

Backend:
```bash
cd server
npm install
cp .env.example .env
```

Frontend:
```bash
cd client
npm install
```

### 2. Start Backend Server

```bash
cd server
npm run dev
```

Server will start on http://localhost:5001

### 3. Start Frontend Dev Server

```bash
cd client
npm run dev
```

Client will start on http://localhost:3000

## Project Structure

```
src/gui/web/
├── client/                     # Frontend React application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── Dashboard.tsx   # Main dashboard
│   │   │   ├── ServiceList.tsx # Service list view
│   │   │   ├── ServiceCard.tsx # Individual service cards
│   │   │   └── ServiceDetailsModal.tsx  # Details modal
│   │   ├── hooks/              # Custom React hooks
│   │   │   └── useServices.ts  # Service API hooks
│   │   └── services/           # API communication
│   │       └── servicesApi.ts  # Services API client
│   ├── nginx.conf              # Nginx config for production
│   ├── Dockerfile              # Client Docker image
│   └── package.json
├── server/                     # Backend API server
│   ├── src/
│   │   ├── routes/
│   │   │   └── services.ts     # Services API endpoints
│   │   ├── config/
│   │   │   └── services.ts     # Hardcoded service definitions
│   │   ├── services/
│   │   │   └── docker.ts       # Docker API wrapper
│   │   └── index.ts            # Express server
│   ├── Dockerfile              # Server Docker image
│   └── package.json
├── shared/                     # Shared types and utilities
│   ├── services.ts             # Service type definitions
│   └── utils.ts                # Shared utility functions
├── docker-compose.yml          # Deployment configuration
└── README.md                   # This file
```

## API Endpoints

### Services (Primary Interface)

- `GET /api/services` - List all 4 hardcoded services with status
- `GET /api/services/:serviceId` - Get specific service status
- `POST /api/services/:serviceId/start` - Start service via `make start-<service>`
- `POST /api/services/:serviceId/stop` - Stop service via `make stop-<service>`
- `GET /api/services/:serviceId/logs` - Get service container logs

### System

- `GET /api/health` - API health check
- `GET /api/system/info` - Docker system information
- `GET /api/system/version` - Docker version
- `GET /api/system/ping` - Ping Docker daemon

### Legacy Endpoints (Still Available)

- `GET /api/containers` - List all Docker containers
- `GET /api/volumes` - List all Docker volumes

## Service Configuration

The 4 services are hardcoded in `server/src/config/services.ts`:

```typescript
{
  postgresql: {
    id: 'postgresql',
    name: 'PostgreSQL',
    containerName: 'postgres',
    ports: [5432],
    makeCommands: {
      start: 'start-postgres',
      stop: 'stop-postgres',
      logs: 'logs-postgres'
    }
  },
  redis: { ... },
  opensearch: { ... },
  dashboards: { ... }
}
```

## Environment Variables

### Server (.env)

```bash
PORT=5001                          # API server port
CLIENT_URL=http://localhost:3000   # Frontend URL for CORS
LOG_LEVEL=info                     # Logging level
NODE_ENV=production                # Environment
REPO_ROOT=/repo                    # Repository root path (for Docker)
```

### Client (.env)

```bash
VITE_API_URL=http://localhost:5001  # Backend API URL
```

## Docker Compose Configuration

The `docker-compose.yml` mounts:
- Docker socket: `/var/run/docker.sock` (for status checking)
- Repository root: `/Users/arkiralor/Developer/DockerContainers` → `/repo` (for Make commands)

This allows the server to execute `make` commands in your repository.

## How Operations Work

### Starting a Service

1. User clicks "Start" on PostgreSQL card
2. Frontend sends `POST /api/services/postgresql/start`
3. Backend executes `make start-postgres` in repository root
4. UI polls for status and updates display

### Checking Status

1. Frontend polls `/api/services` every 5 seconds
2. Backend queries Docker API for each container name
3. Returns `exists`, `running`, and `status` for each service
4. UI updates status badges and enables/disables buttons

### Viewing Logs

1. User clicks "Details" → "Logs" tab
2. Frontend requests `/api/services/:id/logs?tail=200`
3. Backend queries Docker API for container logs
4. Logs displayed in modal

## Troubleshooting

### Cannot Connect to Docker Socket

**Error**: "Failed to connect to Docker daemon"

**Solution**: Ensure Docker Desktop is running:
```bash
docker ps
```

If Docker is not running, start Docker Desktop.

### Port 5001 Already in Use

**Error**: "EADDRINUSE: address already in use :::5001"

**Solution**:
1. Find what's using the port: `lsof -i :5001`
2. Stop that process, or change PORT in `docker-compose.yml` and `server/.env`

### Make Command Failures

**Error**: "make: command not found" or "No rule to make target"

**Solution**:
1. Ensure you're running from repository root
2. Check that REPO_ROOT in docker-compose.yml is correct
3. Verify Makefile exists in repository root

### Services Not Showing

**Problem**: Only 2 services appear instead of 4

**Solution**:
1. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
2. Clear browser cache
3. Rebuild client: `docker compose up -d --build docker-gui-client`

### Cannot Start Service

**Error**: Service start button doesn't work

**Check**:
1. Look at server logs: `docker compose logs docker-gui-server`
2. Verify the container name in `server/src/config/services.ts` matches actual container name
3. Ensure Make commands work: `make start-postgres` from repository root

## Port Configuration

- **Frontend (Nginx)**: http://localhost:3000
- **Backend (Express)**: http://localhost:5001
- **Note**: Port 5000 avoided due to macOS AirPlay Receiver conflict

## Building for Production

### Build Both Images

```bash
docker compose build
```

### Build Individual Services

```bash
docker compose build docker-gui-server
docker compose build docker-gui-client
```

## Deployment Notes

This is designed for **local development only**. For production use, you would need:
- SSL/TLS certificates
- Authentication and authorization
- Rate limiting
- Security hardening
- Environment-specific configurations

## Integration with Repository Tools

The web UI complements existing repository management tools:

| Operation | Command Line | Web UI |
|-----------|-------------|---------|
| Start PostgreSQL | `make start-postgres` | Click "Start" button |
| Stop Redis | `make stop-redis` | Click "Stop" button |
| View logs | `make logs-opensearch` | Click "Details" → "Logs" |
| Check status | `make status` | View dashboard |

Both approaches work identically - they use the same underlying commands.

## Related Documentation

- Main repository: `../../README.md`
- PostgreSQL service: `../postgresql/README.md`
- Redis service: `../redis/README.md`
- OpenSearch service: `../opensearch/README.md`
- Project guidelines: `../../CLAUDE.md`

## License

Part of the DockerContainers project for local development infrastructure management.
