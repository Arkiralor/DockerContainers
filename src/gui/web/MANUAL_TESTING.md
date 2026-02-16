# Manual Testing Instructions

The backend server is now running successfully on **http://localhost:5001**. Follow these steps to test the full application with the frontend interface.

## Prerequisites

- Backend server running on port 5001 (already started)
- Docker daemon running
- Node.js 18+ installed

## Step 1: Start Some Containers (Optional but Recommended)

To fully test container management features, start a few containers:

```bash
# Start PostgreSQL
cd /Users/arkiralor/Developer/DockerContainers/src/postgresql
docker compose up -d

# Start Redis
cd /Users/arkiralor/Developer/DockerContainers/src/redis
docker compose up -d

# Verify containers are running
docker ps
```

## Step 2: Start the Frontend

Open a new terminal window and run:

```bash
cd /Users/arkiralor/Developer/DockerContainers/src/gui/web/client
npm run dev
```

The frontend will start on **http://localhost:3000**

## Step 3: Open the Application

Open your web browser and navigate to:

```
http://localhost:3000
```

## What to Test

### 1. System Dashboard
- [  ] System info displays correctly (containers, CPUs, memory, images)
- [  ] Running vs total container counts are accurate
- [  ] Stats update automatically

### 2. Container List
- [  ] All containers are displayed (running and stopped)
- [  ] Container cards show correct information:
  - [  ] Container name
  - [  ] Image name
  - [  ] Status with color indicator
  - [  ] Port mappings
  - [  ] Container ID

### 3. Container Operations
- [  ] **Start** a stopped container
  - Click Start button
  - Verify container status changes to "Running"
  - Green status badge appears

- [  ] **Stop** a running container
  - Click Stop button
  - Confirmation dialog appears
  - Confirm to stop
  - Verify container status changes to "Stopped"

- [  ] **Restart** a running container
  - Click Restart button
  - Container restarts successfully
  - Status remains "Running"

- [  ] **Remove** a container
  - Click Remove button on a stopped container
  - Confirmation dialog appears with warning
  - Confirm to remove
  - Container disappears from list

- [  ] **Force Remove** a running container
  - Click Remove button on a running container
  - Warning shows it will be forcefully removed
  - Confirm to remove
  - Container is stopped and removed

### 4. Container Details Modal
- [  ] Click "Details" button on any container
- [  ] Modal opens with three tabs
- [  ] **Overview Tab**:
  - [  ] General information (ID, image, state, created date)
  - [  ] Uptime (if running)
  - [  ] Port mappings displayed correctly
  - [  ] Volume mounts listed
- [  ] **Configuration Tab**:
  - [  ] Environment variables displayed
  - [  ] Resource limits shown (memory, CPU)
- [  ] **Logs Tab**:
  - [  ] Last 200 lines of logs displayed
  - [  ] Logs are formatted and readable
- [  ] Close modal with X button or click outside

### 5. Real-time Updates
- [  ] Open application in browser
- [  ] In terminal, start a container: `docker start <container-name>`
- [  ] Verify the UI updates automatically (within 5 seconds)
- [  ] In terminal, stop the container: `docker stop <container-name>`
- [  ] Verify the UI updates automatically

### 6. Loading States
- [  ] Buttons show loading/disabled state during operations
- [  ] Cannot double-click buttons while operation in progress
- [  ] Loading spinner shows while fetching data

### 7. Error Handling
- [  ] Stop the backend server
- [  ] Verify error message appears in UI
- [  ] Click "Retry" button
- [  ] Restart backend server
- [  ] Verify connection restores

### 8. Refresh Functionality
- [  ] Click "Refresh" button
- [  ] Container list updates immediately
- [  ] No errors occur

### 9. Responsive Design
- [  ] Resize browser window to mobile size (~375px width)
  - [  ] Container cards stack in single column
  - [  ] All content remains readable
  - [  ] Buttons remain accessible
- [  ] Resize to tablet size (~768px width)
  - [  ] Layout adjusts appropriately
- [  ] Desktop view (~1440px width)
  - [  ] Container cards show in 2-column grid
  - [  ] Max width container centers content

### 10. Browser Compatibility
Test in multiple browsers:
- [  ] Chrome/Edge (Chromium)
- [  ] Firefox
- [  ] Safari (macOS)

## Expected Behavior

### When Containers Are Running
- Green status badge
- "Stop" and "Restart" buttons enabled
- "Start" button hidden
- Can view logs in details modal

### When Containers Are Stopped
- Red/gray status badge
- "Start" button enabled
- "Stop" and "Restart" buttons disabled/hidden
- Can still view configuration and volume information

### WebSocket Connection
- Check browser console (F12)
- Should see WebSocket connection established
- No repeated connection errors
- Updates happen automatically without manual refresh

## Stopping the Servers

When done testing:

### Stop Frontend
```bash
# In the terminal running the client
Press Ctrl+C
```

### Stop Backend
```bash
# Find the process
ps aux | grep "tsx watch"

# Kill it
pkill -f "tsx watch src/index.ts"
```

### Stop Test Containers
```bash
cd /Users/arkiralor/Developer/DockerContainers/src/postgresql
docker compose down

cd /Users/arkiralor/Developer/DockerContainers/src/redis
docker compose down
```

## Reporting Issues

If you encounter any issues during testing:

1. Check browser console for errors (F12 → Console tab)
2. Check server logs in the terminal running the backend
3. Note the steps to reproduce
4. Document expected vs actual behavior

## Test Results

After completing manual testing, update the TESTING.md file with results.
