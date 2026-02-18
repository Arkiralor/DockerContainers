import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useWebSocket, useContainerUpdates, useContainerStats } from '@/hooks/useWebSocket'
import { mockContainers, mockContainerStats } from '../mocks/docker'

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  close: vi.fn(),
}

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}))

describe('useWebSocket hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('useWebSocket', () => {
    it('creates socket connection on mount', () => {
      renderHook(() => useWebSocket())

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
    })

    it('sets connected to true when socket connects', async () => {
      const { result } = renderHook(() => useWebSocket())

      expect(result.current.connected).toBe(false)

      // Simulate connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1]
      connectHandler?.()

      await waitFor(() => expect(result.current.connected).toBe(true))
    })

    it('sets connected to false when socket disconnects', async () => {
      const { result } = renderHook(() => useWebSocket())

      // First connect
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1]
      connectHandler?.()

      await waitFor(() => expect(result.current.connected).toBe(true))

      // Then disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'disconnect'
      )?.[1]
      disconnectHandler?.()

      await waitFor(() => expect(result.current.connected).toBe(false))
    })

    it('closes socket on unmount', () => {
      const { unmount } = renderHook(() => useWebSocket())

      unmount()

      expect(mockSocket.close).toHaveBeenCalled()
    })

    it('returns socket instance', () => {
      const { result } = renderHook(() => useWebSocket())

      expect(result.current.socket).toBe(mockSocket)
    })

    it('initializes with disconnected state', () => {
      const { result } = renderHook(() => useWebSocket())

      expect(result.current.connected).toBe(false)
      expect(result.current.socket).toBeDefined()
    })
  })

  describe('useContainerUpdates', () => {
    it('subscribes to container updates when enabled', async () => {
      vi.clearAllMocks()

      renderHook(() => useContainerUpdates(true))

      // Wait for useWebSocket to create socket
      await waitFor(() => expect(mockSocket.emit).toHaveBeenCalled())

      expect(mockSocket.emit).toHaveBeenCalledWith('subscribe:containers')
      expect(mockSocket.on).toHaveBeenCalledWith('containers:update', expect.any(Function))
    })

    it('does not subscribe when disabled', async () => {
      vi.clearAllMocks()

      renderHook(() => useContainerUpdates(false))

      // Give it a moment to potentially subscribe (it shouldn't)
      await new Promise((resolve) => setTimeout(resolve, 100))

      const subscribeCall = mockSocket.emit.mock.calls.find(
        (call) => call[0] === 'subscribe:containers'
      )
      expect(subscribeCall).toBeUndefined()
    })

    it('updates containers when receiving data', async () => {
      vi.clearAllMocks()

      const { result } = renderHook(() => useContainerUpdates(true))

      await waitFor(() => expect(mockSocket.on).toHaveBeenCalled())

      // Get the containers:update handler
      const updateHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'containers:update'
      )?.[1]

      expect(updateHandler).toBeDefined()

      // Simulate receiving container updates
      updateHandler?.(mockContainers)

      await waitFor(() => expect(result.current).toEqual(mockContainers))
    })

    it('unsubscribes on unmount', async () => {
      vi.clearAllMocks()

      const { unmount } = renderHook(() => useContainerUpdates(true))

      await waitFor(() => expect(mockSocket.emit).toHaveBeenCalledWith('subscribe:containers'))

      unmount()

      expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe:containers')
      expect(mockSocket.off).toHaveBeenCalledWith('containers:update')
    })

    it('resubscribes when enabled changes from false to true', async () => {
      vi.clearAllMocks()

      const { rerender } = renderHook(({ enabled }) => useContainerUpdates(enabled), {
        initialProps: { enabled: false },
      })

      // Should not be subscribed initially
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(mockSocket.emit).not.toHaveBeenCalledWith('subscribe:containers')

      // Enable and check subscription
      rerender({ enabled: true })

      await waitFor(() =>
        expect(mockSocket.emit).toHaveBeenCalledWith('subscribe:containers')
      )
    })

    it('returns empty array initially', () => {
      vi.clearAllMocks()

      const { result } = renderHook(() => useContainerUpdates(true))

      expect(result.current).toEqual([])
    })
  })

  describe('useContainerStats', () => {
    it('subscribes to stats when containerId is provided', async () => {
      vi.clearAllMocks()

      renderHook(() => useContainerStats('test-container-id'))

      await waitFor(() => expect(mockSocket.emit).toHaveBeenCalled())

      expect(mockSocket.emit).toHaveBeenCalledWith('subscribe:stats', 'test-container-id')
      expect(mockSocket.on).toHaveBeenCalledWith('stats:update', expect.any(Function))
    })

    it('does not subscribe when containerId is null', async () => {
      vi.clearAllMocks()

      renderHook(() => useContainerStats(null))

      await new Promise((resolve) => setTimeout(resolve, 100))

      const subscribeCall = mockSocket.emit.mock.calls.find(
        (call) => call[0] === 'subscribe:stats'
      )
      expect(subscribeCall).toBeUndefined()
    })

    it('updates stats when receiving data for matching containerId', async () => {
      vi.clearAllMocks()

      const { result } = renderHook(() => useContainerStats('test-container-id'))

      await waitFor(() => expect(mockSocket.on).toHaveBeenCalled())

      // Get the stats:update handler
      const updateHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'stats:update'
      )?.[1]

      expect(updateHandler).toBeDefined()

      // Simulate receiving stats for the matching container
      updateHandler?.({
        containerId: 'test-container-id',
        stats: mockContainerStats,
      })

      await waitFor(() => expect(result.current).toEqual(mockContainerStats))
    })

    it('ignores stats for non-matching containerId', async () => {
      vi.clearAllMocks()

      const { result } = renderHook(() => useContainerStats('test-container-id'))

      await waitFor(() => expect(mockSocket.on).toHaveBeenCalled())

      const updateHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'stats:update'
      )?.[1]

      // Simulate receiving stats for a different container
      updateHandler?.({
        containerId: 'different-container-id',
        stats: mockContainerStats,
      })

      // Stats should still be null
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(result.current).toBeNull()
    })

    it('unsubscribes on unmount', async () => {
      vi.clearAllMocks()

      const { unmount } = renderHook(() => useContainerStats('test-container-id'))

      await waitFor(() =>
        expect(mockSocket.emit).toHaveBeenCalledWith('subscribe:stats', 'test-container-id')
      )

      unmount()

      expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe:stats', 'test-container-id')
      expect(mockSocket.off).toHaveBeenCalledWith('stats:update')
    })

    it('resubscribes when containerId changes', async () => {
      vi.clearAllMocks()

      const { rerender } = renderHook(
        ({ containerId }) => useContainerStats(containerId),
        {
          initialProps: { containerId: 'container-1' },
        }
      )

      await waitFor(() =>
        expect(mockSocket.emit).toHaveBeenCalledWith('subscribe:stats', 'container-1')
      )

      // Change container ID
      rerender({ containerId: 'container-2' })

      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe:stats', 'container-1')
        expect(mockSocket.emit).toHaveBeenCalledWith('subscribe:stats', 'container-2')
      })
    })

    it('returns null initially', () => {
      vi.clearAllMocks()

      const { result } = renderHook(() => useContainerStats('test-container-id'))

      expect(result.current).toBeNull()
    })

    it('handles multiple stats updates', async () => {
      vi.clearAllMocks()

      const { result } = renderHook(() => useContainerStats('test-container-id'))

      await waitFor(() => expect(mockSocket.on).toHaveBeenCalled())

      const updateHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'stats:update'
      )?.[1]

      // First update
      const stats1 = { ...mockContainerStats, cpu_stats: { ...mockContainerStats.cpu_stats } }
      updateHandler?.({
        containerId: 'test-container-id',
        stats: stats1,
      })

      await waitFor(() => expect(result.current).toEqual(stats1))

      // Second update with different stats
      const stats2 = {
        ...mockContainerStats,
        memory_stats: { ...mockContainerStats.memory_stats, usage: 999999 },
      }
      updateHandler?.({
        containerId: 'test-container-id',
        stats: stats2,
      })

      await waitFor(() => expect(result.current).toEqual(stats2))
    })
  })
})
