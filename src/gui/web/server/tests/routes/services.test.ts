import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import servicesRoutes from '@/routes/services'
import { dockerService } from '@/services/docker'
import { exec } from 'child_process'
import { mockContainerList } from '../fixtures/containers'

vi.mock('@/services/docker')
vi.mock('child_process', () => ({
  exec: vi.fn(),
}))
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('Services Routes', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/api/services', servicesRoutes)
    vi.clearAllMocks()
  })

  describe('GET /api/services', () => {
    it('should list all services with their status', async () => {
      const mockContainers = [
        { ...mockContainerList[0], Names: ['/postgres'], State: 'running', Status: 'Up 2 hours', Id: 'container1' },
        { ...mockContainerList[0], Names: ['/redis'], State: 'exited', Status: 'Exited (0) 1 hour ago', Id: 'container2' },
        { ...mockContainerList[0], Names: ['/opensearch-node'], State: 'running', Status: 'Up 3 hours', Id: 'container3' },
        { ...mockContainerList[0], Names: ['/opensearch-dashboards'], State: 'running', Status: 'Up 3 hours', Id: 'container4' },
      ]
      vi.mocked(dockerService.listContainers).mockResolvedValue(mockContainers)

      const response = await request(app).get('/api/services')

      expect(response.status).toBe(200)
      // Now we have 3 services: postgresql, redis, opensearch (opensearch-dashboards is part of opensearch)
      expect(response.body).toHaveLength(3)
      expect(response.body[0]).toMatchObject({
        id: 'postgresql',
        name: 'PostgreSQL',
        containerName: 'postgres',
        exists: true,
        running: true,
      })

      // Check that opensearch is a grouped service
      const opensearchService = response.body.find((s: { id: string }) => s.id === 'opensearch')
      expect(opensearchService).toBeDefined()
      expect(opensearchService.isGrouped).toBe(true)
      expect(opensearchService.containers).toHaveLength(2)
      expect(opensearchService.running).toBe(true) // At least one container is running
    })

    it('should return services with exists:false when containers do not exist', async () => {
      vi.mocked(dockerService.listContainers).mockResolvedValue([])

      const response = await request(app).get('/api/services')

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(3)
      expect(response.body[0]).toMatchObject({
        id: 'postgresql',
        name: 'PostgreSQL',
        exists: false,
        running: false,
      })
    })

    it('should return 500 on error', async () => {
      vi.mocked(dockerService.listContainers).mockRejectedValue(new Error('Docker error'))

      const response = await request(app).get('/api/services')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to list services' })
    })
  })

  describe('GET /api/services/:serviceId', () => {
    it('should return service details when service exists', async () => {
      const mockContainers = [
        { ...mockContainerList[0], Names: ['/postgres'], State: 'running', Status: 'Up 2 hours', Id: 'container1' },
      ]
      vi.mocked(dockerService.listContainers).mockResolvedValue(mockContainers)

      const response = await request(app).get('/api/services/postgresql')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        id: 'postgresql',
        name: 'PostgreSQL',
        containerName: 'postgres',
        ports: [5432],
        exists: true,
        running: true,
        containerId: 'container1',
      })
    })

    it('should return 404 when service not found', async () => {
      const response = await request(app).get('/api/services/invalid-service')

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: 'Service not found' })
    })

    it('should return service with exists:false when container does not exist', async () => {
      vi.mocked(dockerService.listContainers).mockResolvedValue([])

      const response = await request(app).get('/api/services/postgresql')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        id: 'postgresql',
        name: 'PostgreSQL',
        exists: false,
        running: false,
      })
    })

    it('should return 500 on error', async () => {
      vi.mocked(dockerService.listContainers).mockRejectedValue(new Error('Docker error'))

      const response = await request(app).get('/api/services/postgresql')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to get service' })
    })
  })

  describe('POST /api/services/:serviceId/start', () => {
    it('should start a service successfully', async () => {
      const mockExec = vi.mocked(exec)
      mockExec.mockImplementation((cmd: any, options: any, callback: any) => {
        callback(null, { stdout: 'Service started\n', stderr: '' })
        return {} as any
      })

      const response = await request(app).post('/api/services/postgresql/start')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        success: true,
        output: 'Service started\n',
      })
    })

    it('should return 404 for invalid service', async () => {
      const response = await request(app).post('/api/services/invalid-service/start')

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: 'Service not found' })
    })

    it('should return 500 on make command failure', async () => {
      const mockExec = vi.mocked(exec)
      mockExec.mockImplementation((cmd: any, options: any, callback: any) => {
        callback(new Error('Make command failed'), { stdout: '', stderr: 'Error message' })
        return {} as any
      })

      const response = await request(app).post('/api/services/postgresql/start')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        success: false,
      })
    })

    it('should return error details on unexpected error', async () => {
      const mockExec = vi.mocked(exec)
      mockExec.mockImplementation((cmd: any, options: any, callback: any) => {
        callback(new Error('Unexpected error'))
        return {} as any
      })

      const response = await request(app).post('/api/services/postgresql/start')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        success: false,
        error: 'Unexpected error'
      })
    })
  })

  describe('POST /api/services/:serviceId/stop', () => {
    it('should stop a service successfully', async () => {
      const mockExec = vi.mocked(exec)
      mockExec.mockImplementation((cmd: any, options: any, callback: any) => {
        callback(null, { stdout: 'Service stopped\n', stderr: '' })
        return {} as any
      })

      const response = await request(app).post('/api/services/postgresql/stop')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        success: true,
        output: 'Service stopped\n',
      })
    })

    it('should return 404 for invalid service', async () => {
      const response = await request(app).post('/api/services/invalid-service/stop')

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: 'Service not found' })
    })

    it('should return error details on error', async () => {
      const mockExec = vi.mocked(exec)
      mockExec.mockImplementation((cmd: any, options: any, callback: any) => {
        callback(new Error('Unexpected error'))
        return {} as any
      })

      const response = await request(app).post('/api/services/postgresql/stop')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        success: false,
        error: 'Unexpected error'
      })
    })
  })

  describe('GET /api/services/:serviceId/logs', () => {
    it('should return service logs when container exists', async () => {
      const mockContainers = [
        { ...mockContainerList[0], Names: ['/postgres'], State: 'running', Id: 'container1' },
      ]
      vi.mocked(dockerService.listContainers).mockResolvedValue(mockContainers)
      vi.mocked(dockerService.getContainerLogs).mockResolvedValue('Log line 1\nLog line 2')

      const response = await request(app).get('/api/services/postgresql/logs')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ logs: 'Log line 1\nLog line 2' })
      expect(dockerService.getContainerLogs).toHaveBeenCalledWith('container1', 100)
    })

    it('should return logs with custom tail parameter', async () => {
      const mockContainers = [
        { ...mockContainerList[0], Names: ['/postgres'], State: 'running', Id: 'container1' },
      ]
      vi.mocked(dockerService.listContainers).mockResolvedValue(mockContainers)
      vi.mocked(dockerService.getContainerLogs).mockResolvedValue('Log line 1')

      const response = await request(app).get('/api/services/postgresql/logs?tail=50')

      expect(response.status).toBe(200)
      expect(dockerService.getContainerLogs).toHaveBeenCalledWith('container1', 50)
    })

    it('should return message when container does not exist', async () => {
      vi.mocked(dockerService.listContainers).mockResolvedValue([])

      const response = await request(app).get('/api/services/postgresql/logs')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ logs: 'Container does not exist' })
    })

    it('should return 404 for invalid service', async () => {
      const response = await request(app).get('/api/services/invalid-service/logs')

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: 'Service not found' })
    })

    it('should return 500 on error', async () => {
      vi.mocked(dockerService.listContainers).mockRejectedValue(new Error('Docker error'))

      const response = await request(app).get('/api/services/postgresql/logs')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to get logs' })
    })
  })
})
