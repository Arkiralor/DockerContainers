import { vi } from 'vitest'

export interface MockSocket {
  on: ReturnType<typeof vi.fn>
  off: ReturnType<typeof vi.fn>
  emit: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
  connected: boolean
}

export function createMockSocket(): MockSocket {
  return {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
  }
}

export const mockSocketEvents = {
  'containers:update': 'containers:update',
  'stats:update': 'stats:update',
  'subscribe:containers': 'subscribe:containers',
  'unsubscribe:containers': 'unsubscribe:containers',
  'subscribe:stats': 'subscribe:stats',
  'unsubscribe:stats': 'unsubscribe:stats',
}

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => createMockSocket()),
}))
