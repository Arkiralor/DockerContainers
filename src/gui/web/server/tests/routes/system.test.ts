import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import systemRoutes from '@/routes/system'
import { dockerService } from '@/services/docker'

vi.mock('@/services/docker')
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('System Routes', () => {
  let app: express.Application

  const mockSystemInfo = {
    ID: 'DOCKER:1234',
    Containers: 10,
    ContainersRunning: 7,
    ContainersPaused: 0,
    ContainersStopped: 3,
    Images: 25,
    Driver: 'overlay2',
    NCPU: 8,
    MemTotal: 16777216000,
    ServerVersion: '24.0.0',
    OperatingSystem: 'Docker Desktop',
    Architecture: 'x86_64',
  }

  const mockDockerVersion = {
    Version: '24.0.0',
    ApiVersion: '1.43',
    GitCommit: 'abc123',
    GoVersion: 'go1.20.4',
    Os: 'linux',
    Arch: 'amd64',
    KernelVersion: '5.15.0',
    BuildTime: '2023-05-19T12:00:00.000000000+00:00',
  }

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/api/system', systemRoutes)
    vi.clearAllMocks()
  })

  describe('GET /api/system/info', () => {
    it('should return Docker system information', async () => {
      vi.mocked(dockerService.getSystemInfo).mockResolvedValue(mockSystemInfo)

      const response = await request(app).get('/api/system/info')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockSystemInfo)
      expect(dockerService.getSystemInfo).toHaveBeenCalledOnce()
    })

    it('should return 500 on error', async () => {
      vi.mocked(dockerService.getSystemInfo).mockRejectedValue(new Error('Docker not running'))

      const response = await request(app).get('/api/system/info')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to get system info' })
    })
  })

  describe('GET /api/system/version', () => {
    it('should return Docker version information', async () => {
      vi.mocked(dockerService.getVersion).mockResolvedValue(mockDockerVersion)

      const response = await request(app).get('/api/system/version')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockDockerVersion)
      expect(dockerService.getVersion).toHaveBeenCalledOnce()
    })

    it('should return 500 on error', async () => {
      vi.mocked(dockerService.getVersion).mockRejectedValue(new Error('Failed to get version'))

      const response = await request(app).get('/api/system/version')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to get Docker version' })
    })
  })

  describe('GET /api/system/ping', () => {
    it('should return alive:true when Docker is running', async () => {
      vi.mocked(dockerService.ping).mockResolvedValue(true)

      const response = await request(app).get('/api/system/ping')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ alive: true })
      expect(dockerService.ping).toHaveBeenCalledOnce()
    })

    it('should return alive:false when Docker is not running', async () => {
      vi.mocked(dockerService.ping).mockResolvedValue(false)

      const response = await request(app).get('/api/system/ping')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ alive: false })
    })

    it('should return 500 on error', async () => {
      vi.mocked(dockerService.ping).mockRejectedValue(new Error('Connection failed'))

      const response = await request(app).get('/api/system/ping')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to ping Docker' })
    })
  })
})
