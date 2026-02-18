/**
 * Docker Container Manager API Server
 *
 * Main entry point for the Express.js server that provides:
 * - REST API for Docker container and volume management
 * - REST API for managing configured services (PostgreSQL, Redis, OpenSearch)
 * - WebSocket support for real-time updates
 * - CORS-enabled endpoints for web client access
 *
 * The server integrates:
 * - Express.js for HTTP routing
 * - Socket.IO for WebSockets
 * - Winston for logging
 * - Dockerode (via services) for Docker API access
 */

import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import { logger } from './utils/logger.js'
import containerRoutes from './routes/containers.js'
import volumeRoutes from './routes/volumes.js'
import systemRoutes from './routes/system.js'
import servicesRoutes from './routes/services.js'
import { initializeWebSocket } from './services/websocket.js'

// Load environment variables from .env file
dotenv.config()

const app = express()
const httpServer = createServer(app)

/**
 * Socket.IO server instance.
 * Configured with CORS to allow connections from the web client.
 * Origin and methods can be customized via CLIENT_URL environment variable.
 */
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
})

/**
 * Server port.
 * Defaults to 5000 if PORT environment variable not set.
 */
const PORT = process.env.PORT || 5000

// Enable CORS for all routes
app.use(cors())
// Parse JSON request bodies
app.use(express.json())

/**
 * GET /
 *
 * Root endpoint providing API information and available endpoints.
 * Useful for API discovery and health checking.
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Docker Container Manager API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      services: '/api/services',
      containers: '/api/containers',
      volumes: '/api/volumes',
      system: '/api/system',
      frontend: process.env.CLIENT_URL || 'http://localhost:3000'
    },
    message: 'Access the web UI at ' + (process.env.CLIENT_URL || 'http://localhost:3000')
  })
})

// Mount API route handlers
app.use('/api/services', servicesRoutes)
app.use('/api/containers', containerRoutes)
app.use('/api/volumes', volumeRoutes)
app.use('/api/system', systemRoutes)

/**
 * GET /api/health
 *
 * Health check endpoint.
 * Returns 200 OK with timestamp to verify the server is running.
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Initialize WebSocket server for real-time updates
initializeWebSocket(io)

// Start the HTTP server
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
})

/**
 * Graceful shutdown handler.
 *
 * Listens for SIGTERM signal and gracefully closes the server,
 * allowing in-flight requests to complete before exiting.
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  httpServer.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})
