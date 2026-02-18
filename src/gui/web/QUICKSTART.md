# Web UI Quick Start Guide

This guide will help you get the Docker Container Manager Web UI up and running quickly.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Docker Engine running on your system

## Installation

### Step 1: Install Dependencies

Navigate to the web UI directory and install dependencies for both client and server:

```bash
cd src/gui/web

cd server
npm install

cd ../client
npm install

cd ..
```

### Step 2: Configure Environment

The server needs a `.env` file. Copy the example and modify if needed:

```bash
cd server
cp example.env .env
```

Default configuration:
- Server runs on port 5000
- Client URL for CORS: http://localhost:3000
- Log level: info

### Step 3: Start the Backend Server

Open a terminal and start the backend server:

```bash
cd src/gui/web/server
npm run dev
```

The server will start on http://localhost:5000

You should see output indicating the server is running and connected to Docker.

### Step 4: Start the Frontend Client

Open a new terminal and start the frontend development server:

```bash
cd src/gui/web/client
npm run dev
```

The client will start on http://localhost:3000

### Step 5: Access the Web Interface

Open your browser and navigate to:

```
http://localhost:3000
```

You should see the Docker Container Manager dashboard with:
- System information (total containers, running containers, etc.)
- List of all Docker containers
- Controls to start, stop, restart, and remove containers

## Features

### Container Management
- View all containers (running and stopped)
- Start stopped containers
- Stop running containers
- Restart containers
- Remove containers (with confirmation)
- View detailed container information

### Container Details
Click the "Details" button on any container to view:
- General information (ID, image, state, uptime)
- Port mappings
- Volume mounts
- Environment variables
- Resource limits
- Container logs

### Real-time Updates
The interface automatically refreshes:
- Container list updates every 5 seconds
- System information updates every 30 seconds
- Manual refresh available via Refresh button

### Safety Features
- Confirmation dialogs for destructive actions (stop, remove)
- Force removal for running containers
- Loading states to prevent double-clicks
- Error handling with retry options

## Troubleshooting

### Cannot Connect to Docker

**Error**: "Failed to list containers" or connection errors

**Solution**: Ensure Docker is running:
```bash
docker ps
```

If Docker is not running, start Docker Desktop or the Docker daemon.

### Port Already in Use

**Error**: "EADDRINUSE: address already in use :::5000"

**Solution**: Either:
1. Stop the process using port 5000
2. Change the PORT in `server/.env`

### CORS Errors

**Error**: CORS policy errors in browser console

**Solution**: Ensure the CLIENT_URL in `server/.env` matches your frontend URL:
```bash
CLIENT_URL=http://localhost:3000
```

### Build Errors

If you encounter build errors, try:

```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm run build

cd ../server
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Development Tips

### Hot Reload

Both client and server support hot reload:
- Client: Changes are reflected immediately in the browser
- Server: Automatically restarts when you modify TypeScript files

### API Testing

Test the API directly:

```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/containers
curl http://localhost:5000/api/system/info
```

### Logs

Check server logs in the terminal where you ran `npm run dev`

The logs show:
- API requests and responses
- WebSocket connections
- Docker operations
- Errors and warnings

## Next Steps

- Explore the container details modal for in-depth information
- Try starting and stopping containers
- View container logs
- Monitor system resources

## Production Deployment

For production deployment, see the main README.md for instructions on:
- Building production bundles
- Using Docker Compose to deploy the web UI
- Configuring nginx for the frontend
- Running the server as a service
