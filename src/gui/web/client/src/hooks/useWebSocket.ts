import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { ContainerInfo, ContainerStats } from '@shared/types'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

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

    return () => {
      newSocket.close()
    }
  }, [])

  return { socket, connected }
}

export function useContainerUpdates(enabled: boolean = true) {
  const { socket } = useWebSocket()
  const [containers, setContainers] = useState<ContainerInfo[]>([])

  useEffect(() => {
    if (!socket || !enabled) return

    socket.emit('subscribe:containers')

    socket.on('containers:update', (data: ContainerInfo[]) => {
      setContainers(data)
    })

    return () => {
      socket.emit('unsubscribe:containers')
      socket.off('containers:update')
    }
  }, [socket, enabled])

  return containers
}

export function useContainerStats(containerId: string | null) {
  const { socket } = useWebSocket()
  const [stats, setStats] = useState<ContainerStats | null>(null)

  useEffect(() => {
    if (!socket || !containerId) return

    socket.emit('subscribe:stats', containerId)

    socket.on('stats:update', (data: { containerId: string; stats: ContainerStats }) => {
      if (data.containerId === containerId) {
        setStats(data.stats)
      }
    })

    return () => {
      socket.emit('unsubscribe:stats', containerId)
      socket.off('stats:update')
    }
  }, [socket, containerId])

  return stats
}
