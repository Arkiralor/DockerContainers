import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import containerRoutes from '@/routes/containers'
import { dockerService } from '@/services/docker'
import { mockContainerList, mockContainerResponse } from '../fixtures/containers'

vi.mock('@/services/docker')
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('Container Routes', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/api/containers', containerRoutes)
    vi.clearAllMocks()
  })

  describe('GET /api/containers', () => {
    it('should list all running containers by default', async () => {
      vi.mocked(dockerService.listContainers).mockResolvedValue(mockContainerList)

      const response = await request(app).get('/api/containers')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockContainerList)
      expect(dockerService.listContainers).toHaveBeenCalledWith(false)
    })

    it('should list all containers including stopped when all=true', async () => {
      vi.mocked(dockerService.listContainers).mockResolvedValue(mockContainerList)

      const response = await request(app).get('/api/containers?all=true')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockContainerList)
      expect(dockerService.listContainers).toHaveBeenCalledWith(true)
    })

    it('should return 500 on error', async () => {
      vi.mocked(dockerService.listContainers).mockRejectedValue(new Error('Docker error'))

      const response = await request(app).get('/api/containers')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to list containers' })
    })
  })

  describe('GET /api/containers/:id', () => {
    it('should return container details', async () => {
      vi.mocked(dockerService.getContainer).mockResolvedValue(mockContainerResponse)

      const response = await request(app).get('/api/containers/abcd1234567890')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockContainerResponse)
      expect(dockerService.getContainer).toHaveBeenCalledWith('abcd1234567890')
    })

    it('should return 500 when container not found', async () => {
      vi.mocked(dockerService.getContainer).mockRejectedValue(new Error('Container not found'))

      const response = await request(app).get('/api/containers/invalid-id')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to get container' })
    })

    it('should return 500 on error', async () => {
      vi.mocked(dockerService.getContainer).mockRejectedValue(new Error('Unexpected error'))

      const response = await request(app).get('/api/containers/abcd1234567890')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to get container' })
    })
  })

  describe('POST /api/containers/:id/start', () => {
    it('should start a container successfully', async () => {
      vi.mocked(dockerService.startContainer).mockResolvedValue({ success: true })

      const response = await request(app).post('/api/containers/abcd1234567890/start')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ success: true })
      expect(dockerService.startContainer).toHaveBeenCalledWith('abcd1234567890')
    })

    it('should return 500 on error', async () => {
      vi.mocked(dockerService.startContainer).mockRejectedValue(new Error('Failed to start'))

      const response = await request(app).post('/api/containers/abcd1234567890/start')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to start container' })
    })
  })

  describe('POST /api/containers/:id/stop', () => {
    it('should stop a container successfully', async () => {
      vi.mocked(dockerService.stopContainer).mockResolvedValue({ success: true })

      const response = await request(app).post('/api/containers/abcd1234567890/stop')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ success: true })
      expect(dockerService.stopContainer).toHaveBeenCalledWith('abcd1234567890')
    })

    it('should return 500 on error', async () => {
      vi.mocked(dockerService.stopContainer).mockRejectedValue(new Error('Failed to stop'))

      const response = await request(app).post('/api/containers/abcd1234567890/stop')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to stop container' })
    })
  })

  describe('POST /api/containers/:id/restart', () => {
    it('should restart a container successfully', async () => {
      vi.mocked(dockerService.restartContainer).mockResolvedValue({ success: true })

      const response = await request(app).post('/api/containers/abcd1234567890/restart')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ success: true })
      expect(dockerService.restartContainer).toHaveBeenCalledWith('abcd1234567890')
    })

    it('should return 500 on error', async () => {
      vi.mocked(dockerService.restartContainer).mockRejectedValue(new Error('Failed to restart'))

      const response = await request(app).post('/api/containers/abcd1234567890/restart')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to restart container' })
    })
  })

  describe('DELETE /api/containers/:id', () => {
    it('should remove a container without force', async () => {
      vi.mocked(dockerService.removeContainer).mockResolvedValue({ success: true })

      const response = await request(app).delete('/api/containers/abcd1234567890')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ success: true })
      expect(dockerService.removeContainer).toHaveBeenCalledWith('abcd1234567890', false)
    })

    it('should remove a container with force=true', async () => {
      vi.mocked(dockerService.removeContainer).mockResolvedValue({ success: true })

      const response = await request(app).delete('/api/containers/abcd1234567890?force=true')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ success: true })
      expect(dockerService.removeContainer).toHaveBeenCalledWith('abcd1234567890', true)
    })

    it('should return 500 on error', async () => {
      vi.mocked(dockerService.removeContainer).mockRejectedValue(new Error('Failed to remove'))

      const response = await request(app).delete('/api/containers/abcd1234567890')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to remove container' })
    })
  })

  describe('GET /api/containers/:id/logs', () => {
    it('should return container logs with default tail', async () => {
      const mockLogs = 'Log line 1\nLog line 2\nLog line 3'
      vi.mocked(dockerService.getContainerLogs).mockResolvedValue(mockLogs)

      const response = await request(app).get('/api/containers/abcd1234567890/logs')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ logs: mockLogs })
      expect(dockerService.getContainerLogs).toHaveBeenCalledWith('abcd1234567890', 100)
    })

    it('should return container logs with custom tail', async () => {
      const mockLogs = 'Log line 1\nLog line 2'
      vi.mocked(dockerService.getContainerLogs).mockResolvedValue(mockLogs)

      const response = await request(app).get('/api/containers/abcd1234567890/logs?tail=50')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ logs: mockLogs })
      expect(dockerService.getContainerLogs).toHaveBeenCalledWith('abcd1234567890', 50)
    })

    it('should return 500 on error', async () => {
      vi.mocked(dockerService.getContainerLogs).mockRejectedValue(new Error('Failed to get logs'))

      const response = await request(app).get('/api/containers/abcd1234567890/logs')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to get container logs' })
    })
  })

  describe('GET /api/containers/:id/stats', () => {
    it('should return container stats', async () => {
      const mockStats = {
        read: new Date().toISOString(),
        cpu_stats: {
          cpu_usage: { total_usage: 5000000000 },
          system_cpu_usage: 100000000000,
          online_cpus: 4,
        },
        memory_stats: {
          usage: 536870912,
          limit: 2147483648,
        },
      }
      vi.mocked(dockerService.getContainerStats).mockResolvedValue(mockStats)

      const response = await request(app).get('/api/containers/abcd1234567890/stats')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockStats)
      expect(dockerService.getContainerStats).toHaveBeenCalledWith('abcd1234567890')
    })

    it('should return 500 on error', async () => {
      vi.mocked(dockerService.getContainerStats).mockRejectedValue(new Error('Failed to get stats'))

      const response = await request(app).get('/api/containers/abcd1234567890/stats')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to get container stats' })
    })
  })
})
