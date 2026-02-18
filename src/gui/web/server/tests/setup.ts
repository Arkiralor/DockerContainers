import { beforeEach, vi } from 'vitest'

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.PORT = '5001'
process.env.CLIENT_URL = 'http://localhost:3000'
process.env.LOG_LEVEL = 'error'
process.env.REPO_ROOT = '/test/repo'

// Mock logger to prevent console spam during tests
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})
