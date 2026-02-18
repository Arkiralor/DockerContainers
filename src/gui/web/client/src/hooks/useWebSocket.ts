import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { ContainerInfo, ContainerStats } from '@shared/types'

/**
 * Socket.IO server URL.
 * Defaults to localhost:5000 if VITE_API_URL environment variable is not set.
 */
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * React hook for establishing and managing WebSocket connection.
 *
 * Creates a Socket.IO connection to the backend server and maintains
 * connection state. The socket is automatically cleaned up on unmount.
 *
 * @returns Object with socket instance and connection status
 *
 * @example
 * const { socket, connected } = useWebSocket()
 * if (connected) {
 *   socket.emit('subscribe:containers')
 * }
 */
export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const newSocket = io(SOCKET_URL)

    newSocket.on('connect', () => {
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      setConnected(false)
    })

    setSocket(newSocket)

    // Cleanup on unmount
    return () => {
      newSocket.close()
    }
  }, [])

  return { socket, connected }
}

/**
 * React hook for receiving real-time container list updates via WebSocket.
 *
 * Subscribes to container updates from the backend (every 5 seconds on server).
 * Automatically subscribes on mount and unsubscribes on unmount.
 *
 * @param enabled - Whether to enable the subscription (default: true)
 * @returns Array of container information objects
 *
 * @example
 * const containers = useContainerUpdates()
 * console.log(`Found ${containers.length} containers`)
 */
export function useContainerUpdates(enabled: boolean = true) {
  const { socket } = useWebSocket()
  const [containers, setContainers] = useState<ContainerInfo[]>([])

  useEffect(() => {
    if (!socket || !enabled) return

    // Subscribe to container updates
    socket.emit('subscribe:containers')

    socket.on('containers:update', (data: ContainerInfo[]) => {
      setContainers(data)
    })

    // Cleanup: unsubscribe on unmount or when disabled
    return () => {
      socket.emit('unsubscribe:containers')
      socket.off('containers:update')
    }
  }, [socket, enabled])

  return containers
}

/**
 * React hook for receiving real-time container statistics via WebSocket.
 *
 * Subscribes to statistics updates for a specific container (every 2 seconds on server).
 * Returns CPU, memory, network, and I/O statistics. Automatically subscribes on mount
 * and unsubscribes on unmount or when container ID changes.
 *
 * @param containerId - Container ID or name (null to skip subscription)
 * @returns Container statistics object or null if not available
 *
 * @example
 * const stats = useContainerStats(containerId)
 * if (stats) {
 *   const memUsage = (stats.memory_stats.usage / stats.memory_stats.limit * 100).toFixed(2)
 *   console.log(`Memory: ${memUsage}%`)
 * }
 */
export function useContainerStats(containerId: string | null) {
  const { socket } = useWebSocket()
  const [stats, setStats] = useState<ContainerStats | null>(null)

  useEffect(() => {
    if (!socket || !containerId) return

    // Subscribe to stats for this container
    socket.emit('subscribe:stats', containerId)

    socket.on('stats:update', (data: { containerId: string; stats: ContainerStats }) => {
      // Only update if stats are for the container we're watching
      if (data.containerId === containerId) {
        setStats(data.stats)
      }
    })

    // Cleanup: unsubscribe on unmount or when container changes
    return () => {
      socket.emit('unsubscribe:stats', containerId)
      socket.off('stats:update')
    }
  }, [socket, containerId])

  return stats
}
