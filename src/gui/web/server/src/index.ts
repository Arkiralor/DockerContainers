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

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
})

const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

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

app.use('/api/services', servicesRoutes)
app.use('/api/containers', containerRoutes)
app.use('/api/volumes', volumeRoutes)
app.use('/api/system', systemRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

initializeWebSocket(io)

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  httpServer.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})
