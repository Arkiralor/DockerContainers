import { createServer } from 'http'
import { Server } from 'socket.io'
import express from 'express'
import cors from 'cors'
import containerRoutes from '../../src/routes/containers.js'
import servicesRoutes from '../../src/routes/services.js'
import volumesRoutes from '../../src/routes/volumes.js'
import systemRoutes from '../../src/routes/system.js'
import { initializeWebSocket } from '../../src/services/websocket.js'

let server: any
let io: Server
let httpServer: any

export const TEST_PORT = 5002
export const TEST_WS_PORT = 5003

export async function startTestServer() {
  if (server) {
    return { server, io, httpServer, port: TEST_PORT }
  }

  const app = express()

  // Middleware
  app.use(cors())
  app.use(express.json())

  // Routes
  app.use('/api/containers', containerRoutes)
  app.use('/api/services', servicesRoutes)
  app.use('/api/volumes', volumesRoutes)
  app.use('/api/system', systemRoutes)

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' })
  })

  // Create HTTP server
  httpServer = createServer(app)

  // Initialize WebSocket
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  initializeWebSocket(io)

  // Start server
  await new Promise<void>((resolve) => {
    server = httpServer.listen(TEST_PORT, () => {
      console.log(`Test server running on port ${TEST_PORT}`)
      resolve()
    })
  })

  return { server, io, httpServer, port: TEST_PORT }
}

export async function stopTestServer() {
  if (!server) {
    return
  }

  await new Promise<void>((resolve, reject) => {
    io?.close()
    server.close((err: any) => {
      if (err) {
        reject(err)
      } else {
        server = null
        io = null as any
        httpServer = null
        console.log('Test server stopped')
        resolve()
      }
    })
  })
}

export function getTestServerUrl() {
  return `http://localhost:${TEST_PORT}`
}

export function getTestWsUrl() {
  return `ws://localhost:${TEST_PORT}`
}

// If run directly as a script, start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  startTestServer().catch((error) => {
    console.error('Failed to start test server:', error)
    process.exit(1)
  })

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down...')
    await stopTestServer()
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down...')
    await stopTestServer()
    process.exit(0)
  })
}
