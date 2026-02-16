import { Server } from 'socket.io'
import { dockerService } from './docker.js'
import { logger } from '../utils/logger.js'

let io: Server

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

const containerMonitoringIntervals = new Map<string, NodeJS.Timeout>()
const statsMonitoringIntervals = new Map<string, NodeJS.Timeout>()

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

function stopContainerMonitoring(socketId: string) {
  const interval = containerMonitoringIntervals.get(socketId)
  if (interval) {
    clearInterval(interval)
    containerMonitoringIntervals.delete(socketId)
  }
}

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

function stopStatsMonitoring(socketId: string, containerId: string) {
  const key = `${socketId}:${containerId}`
  const interval = statsMonitoringIntervals.get(key)

  if (interval) {
    clearInterval(interval)
    statsMonitoringIntervals.delete(key)
  }
}

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

export function broadcastContainerEvent(event: string, data: any) {
  if (io) {
    io.emit(`container:${event}`, data)
  }
}
