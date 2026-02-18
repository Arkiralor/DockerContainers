import { Server } from 'socket.io'
import { dockerService } from './docker.js'
import { logger } from '../utils/logger.js'

/**
 * Socket.IO server instance shared across the application.
 * Used to broadcast real-time updates to connected clients.
 */
let io: Server

/**
 * Initializes the WebSocket server and sets up event handlers.
 *
 * This function configures Socket.IO event listeners for client connections,
 * subscriptions, and disconnections. It enables real-time updates for:
 * - Container status changes (every 5 seconds)
 * - Container statistics (every 2 seconds)
 *
 * Clients can subscribe to specific update streams and will automatically
 * be unsubscribed on disconnect.
 *
 * @param socketServer - Socket.IO server instance to initialize
 */
export function initializeWebSocket(socketServer: Server) {
  io = socketServer

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`)

    socket.on('subscribe:containers', () => {
      logger.info(`Client ${socket.id} subscribed to container updates`)
      startContainerMonitoring(socket.id)
    })

    socket.on('subscribe:stats', (containerId: string) => {
      logger.info(`Client ${socket.id} subscribed to stats for ${containerId}`)
      startStatsMonitoring(socket.id, containerId)
    })

    socket.on('unsubscribe:containers', () => {
      logger.info(`Client ${socket.id} unsubscribed from container updates`)
      stopContainerMonitoring(socket.id)
    })

    socket.on('unsubscribe:stats', (containerId: string) => {
      logger.info(`Client ${socket.id} unsubscribed from stats for ${containerId}`)
      stopStatsMonitoring(socket.id, containerId)
    })

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`)
      stopContainerMonitoring(socket.id)
      stopAllStatsMonitoring(socket.id)
    })
  })
}

/**
 * Maps socket IDs to their container monitoring interval timers.
 * Used to track and clean up active monitoring subscriptions.
 */
const containerMonitoringIntervals = new Map<string, NodeJS.Timeout>()

/**
 * Maps "socketId:containerId" keys to their stats monitoring interval timers.
 * Allows multiple containers to be monitored per socket and enables
 * granular subscription management.
 */
const statsMonitoringIntervals = new Map<string, NodeJS.Timeout>()

/**
 * Starts monitoring container list updates for a specific client.
 *
 * Creates a recurring interval that fetches the current container list every 5 seconds
 * and emits updates to the subscribed client. If the client is already subscribed,
 * this function does nothing (prevents duplicate intervals).
 *
 * @param socketId - Socket.IO client ID to send updates to
 */
function startContainerMonitoring(socketId: string) {
  if (containerMonitoringIntervals.has(socketId)) {
    return
  }

  const interval = setInterval(async () => {
    try {
      const containers = await dockerService.listContainers(true)
      io.to(socketId).emit('containers:update', containers)
    } catch (error) {
      logger.error('Error monitoring containers:', error)
    }
  }, 5000)

  containerMonitoringIntervals.set(socketId, interval)
}

/**
 * Stops monitoring container list updates for a specific client.
 *
 * Clears the monitoring interval and removes it from tracking.
 * Safe to call even if no monitoring is active.
 *
 * @param socketId - Socket.IO client ID to stop monitoring for
 */
function stopContainerMonitoring(socketId: string) {
  const interval = containerMonitoringIntervals.get(socketId)
  if (interval) {
    clearInterval(interval)
    containerMonitoringIntervals.delete(socketId)
  }
}

/**
 * Starts monitoring resource statistics for a specific container and client.
 *
 * Creates a recurring interval that fetches container CPU, memory, network, and I/O
 * statistics every 2 seconds and emits updates to the subscribed client. Multiple
 * containers can be monitored simultaneously for the same client.
 *
 * If the client is already subscribed to the specified container, this function
 * does nothing (prevents duplicate intervals).
 *
 * @param socketId - Socket.IO client ID to send updates to
 * @param containerId - Container ID or name to monitor
 */
function startStatsMonitoring(socketId: string, containerId: string) {
  const key = `${socketId}:${containerId}`

  if (statsMonitoringIntervals.has(key)) {
    return
  }

  const interval = setInterval(async () => {
    try {
      const stats = await dockerService.getContainerStats(containerId)
      io.to(socketId).emit('stats:update', { containerId, stats })
    } catch (error) {
      logger.error(`Error monitoring stats for ${containerId}:`, error)
    }
  }, 2000)

  statsMonitoringIntervals.set(key, interval)
}

/**
 * Stops monitoring statistics for a specific container and client.
 *
 * Clears the monitoring interval and removes it from tracking.
 * Safe to call even if no monitoring is active for the specified container.
 *
 * @param socketId - Socket.IO client ID to stop monitoring for
 * @param containerId - Container ID or name to stop monitoring
 */
function stopStatsMonitoring(socketId: string, containerId: string) {
  const key = `${socketId}:${containerId}`
  const interval = statsMonitoringIntervals.get(key)

  if (interval) {
    clearInterval(interval)
    statsMonitoringIntervals.delete(key)
  }
}

/**
 * Stops monitoring statistics for all containers associated with a client.
 *
 * Called automatically when a client disconnects to clean up all their
 * active stats subscriptions. Prevents memory leaks from orphaned intervals.
 *
 * @param socketId - Socket.IO client ID to clean up monitoring for
 */
function stopAllStatsMonitoring(socketId: string) {
  const keysToDelete: string[] = []

  statsMonitoringIntervals.forEach((_, key) => {
    if (key.startsWith(`${socketId}:`)) {
      keysToDelete.push(key)
    }
  })

  keysToDelete.forEach(key => {
    const interval = statsMonitoringIntervals.get(key)
    if (interval) {
      clearInterval(interval)
      statsMonitoringIntervals.delete(key)
    }
  })
}

/**
 * Broadcasts a container event to all connected clients.
 *
 * Emits a namespaced event (container:*) to notify all clients about
 * container state changes. Useful for system-wide notifications.
 *
 * @param event - Event name (e.g., "started", "stopped", "removed")
 * @param data - Event payload to send to clients
 *
 * @example
 * broadcastContainerEvent('started', { id: 'abc123', name: 'my-container' })
 * // Clients receive: 'container:started' event with the data
 */
export function broadcastContainerEvent(event: string, data: unknown) {
  if (io) {
    io.emit(`container:${event}`, data)
  }
}
