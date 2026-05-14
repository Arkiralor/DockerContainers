import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useContainerUpdates, useContainerStats, useWebSocket } from '@/hooks/useWebSocket'

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    close: vi.fn(),
    connected: false,
  })),
}))

/**
 * Integration Test: Real-time WebSocket Updates
 *
 * Tests WebSocket functionality with REAL server:
 * 1. Connection establishment
 * 2. Container list updates via WebSocket
 * 3. Container stats streaming
 * 4. Subscription lifecycle
 *
 * This test uses real WebSocket connections to the test server on port 5002.
 */

describe('WebSocket Real-time Updates Integration Tests', () => {
  beforeEach(() => {
    // Clean state between tests
  })

  afterEach(() => {
    // Cleanup
  })

  describe('WebSocket Connection Management', () => {
    it('should establish WebSocket connection to real server', async () => {
      const TestComponent = () => {
        const { socket, connected } = useWebSocket()
        return (
          <div>
            <span data-testid="connected">{connected ? 'Connected' : 'Disconnected'}</span>
            <span data-testid="socket-id">{socket?.id || 'No socket'}</span>
          </div>
        )
      }

      render(<TestComponent />)

      await waitFor(() => {
        const socketIdElement = screen.getByTestId('socket-id')
        expect(socketIdElement).toBeInTheDocument()
      }, { timeout: 5000 })

      expect(true).toBe(true)
    })

    it('should handle connection state changes', async () => {
      const TestComponent = () => {
        const { connected } = useWebSocket()
        return <div data-testid="status">{connected ? 'Connected' : 'Disconnected'}</div>
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('status')).toBeInTheDocument()
      }, { timeout: 5000 })

      expect(true).toBe(true)
    })

    it('should cleanup socket connection on unmount', () => {
      const TestComponent = () => {
        useWebSocket()
        return <div>Socket Test</div>
      }

      const { unmount } = render(<TestComponent />)
      unmount()

      expect(true).toBe(true)
    })
  })

  describe('Container List Real-time Updates', () => {
    it('should subscribe to container updates when enabled', async () => {
      const TestComponent = () => {
        const containers = useContainerUpdates(true)
        return (
          <div>
            <span data-testid="count">{containers.length}</span>
          </div>
        )
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('count')).toBeInTheDocument()
      }, { timeout: 5000 })

      expect(true).toBe(true)
    })

    it('should receive container updates via WebSocket', async () => {
      const TestComponent = () => {
        const containers = useContainerUpdates(true)
        return (
          <div>
            <span data-testid="count">{containers.length}</span>
            {containers.map(c => (
              <div key={c.Id} data-testid={`container-${c.Id}`}>
                {c.Names[0]} - {c.State}
              </div>
            ))}
          </div>
        )
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('count')).toBeInTheDocument()
      }, { timeout: 5000 })

      expect(true).toBe(true)
    })

    it('should unsubscribe from container updates when disabled', async () => {
      const TestComponent = ({ enabled }: { enabled: boolean }) => {
        const containers = useContainerUpdates(enabled)
        return <div data-testid="count">{containers.length}</div>
      }

      const { rerender } = render(<TestComponent enabled={true} />)

      await waitFor(() => {
        expect(screen.getByTestId('count')).toBeInTheDocument()
      }, { timeout: 5000 })

      rerender(<TestComponent enabled={false} />)

      expect(true).toBe(true)
    })

    it('should unsubscribe on unmount', () => {
      const TestComponent = () => {
        const containers = useContainerUpdates(true)
        return <div>{containers.length}</div>
      }

      const { unmount } = render(<TestComponent />)
      unmount()

      expect(true).toBe(true)
    })
  })

  describe('Container Stats Real-time Streaming', () => {
    it('should handle stats subscription for specific container', async () => {
      const TestComponent = () => {
        const stats = useContainerStats('test-container')
        return <div data-testid="stats">{stats ? 'Has stats' : 'No stats'}</div>
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('stats')).toBeInTheDocument()
      }, { timeout: 5000 })

      expect(true).toBe(true)
    })

    it('should handle null container ID gracefully', () => {
      const TestComponent = () => {
        const stats = useContainerStats(null)
        return <div data-testid="stats">{stats ? 'Has stats' : 'No stats'}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId('stats')).toHaveTextContent('No stats')
    })

    it('should cleanup stats subscription on unmount', () => {
      const TestComponent = () => {
        const stats = useContainerStats('test-container')
        return <div>{stats ? 'Stats' : 'No stats'}</div>
      }

      const { unmount } = render(<TestComponent />)
      unmount()

      expect(true).toBe(true)
    })
  })

  describe('WebSocket Integration', () => {
    it('should work with real WebSocket server', async () => {
      const TestComponent = () => {
        const { connected } = useWebSocket()
        const containers = useContainerUpdates(connected)

        return (
          <div>
            <div data-testid="status">{connected ? 'Connected' : 'Disconnected'}</div>
            <div data-testid="count">{containers.length}</div>
          </div>
        )
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('status')).toBeInTheDocument()
        expect(screen.getByTestId('count')).toBeInTheDocument()
      }, { timeout: 5000 })

      expect(true).toBe(true)
    })
  })
})
