import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import cors from 'cors'
import containerRoutes from '@/routes/containers'
import volumeRoutes from '@/routes/volumes'
import systemRoutes from '@/routes/system'
import servicesRoutes from '@/routes/services'
import { dockerService } from '@/services/docker'
import { exec } from 'child_process'
import { mockContainerList, mockContainerResponse } from '../fixtures/docker'

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

describe('API Flow Integration Tests', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(cors())
    app.use(express.json())

    // Mount all routes
    app.use('/api/containers', containerRoutes)
    app.use('/api/volumes', volumeRoutes)
    app.use('/api/system', systemRoutes)
    app.use('/api/services', servicesRoutes)

    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() })
    })

    vi.clearAllMocks()
  })

  describe('Container Management Flow', () => {
    it('should list containers, get details, and manage lifecycle', async () => {
      const mockContainers = mockContainerList()
      vi.mocked(dockerService.listContainers).mockResolvedValue(mockContainers)
      vi.mocked(dockerService.getContainer).mockResolvedValue(mockContainerResponse)
      vi.mocked(dockerService.stopContainer).mockResolvedValue({ success: true })
      vi.mocked(dockerService.startContainer).mockResolvedValue({ success: true })

      // Step 1: List all containers
      const listResponse = await request(app).get('/api/containers?all=true')
      expect(listResponse.status).toBe(200)
      expect(Array.isArray(listResponse.body)).toBe(true)

      // Step 2: Get details of first container
      const containerId = mockContainers[0].Id
      const detailsResponse = await request(app).get(`/api/containers/${containerId}`)
      expect(detailsResponse.status).toBe(200)
      expect(detailsResponse.body).toHaveProperty('Id')

      // Step 3: Stop the container
      const stopResponse = await request(app).post(`/api/containers/${containerId}/stop`)
      expect(stopResponse.status).toBe(200)
      expect(stopResponse.body).toEqual({ success: true })

      // Step 4: Start the container again
      const startResponse = await request(app).post(`/api/containers/${containerId}/start`)
      expect(startResponse.status).toBe(200)
      expect(startResponse.body).toEqual({ success: true })

      // Verify all calls were made in order
      expect(dockerService.listContainers).toHaveBeenCalledWith(true)
      expect(dockerService.getContainer).toHaveBeenCalledWith(containerId)
      expect(dockerService.stopContainer).toHaveBeenCalledWith(containerId)
      expect(dockerService.startContainer).toHaveBeenCalledWith(containerId)
    })

    it('should get logs and stats for a running container', async () => {
      const containerId = 'abcd1234567890'
      const mockLogs = 'Log line 1\nLog line 2\nLog line 3'
      const mockStats = {
        cpu_stats: { cpu_usage: { total_usage: 5000000000 } },
        memory_stats: { usage: 536870912, limit: 2147483648 },
      }

      vi.mocked(dockerService.getContainerLogs).mockResolvedValue(mockLogs)
      vi.mocked(dockerService.getContainerStats).mockResolvedValue(mockStats)

      // Get logs
      const logsResponse = await request(app).get(`/api/containers/${containerId}/logs?tail=100`)
      expect(logsResponse.status).toBe(200)
      expect(logsResponse.body).toEqual({ logs: mockLogs })

      // Get stats
      const statsResponse = await request(app).get(`/api/containers/${containerId}/stats`)
      expect(statsResponse.status).toBe(200)
      expect(statsResponse.body).toMatchObject(mockStats)
    })

    it('should restart and then remove a container', async () => {
      const containerId = 'abcd1234567890'
      vi.mocked(dockerService.restartContainer).mockResolvedValue({ success: true })
      vi.mocked(dockerService.removeContainer).mockResolvedValue({ success: true })

      // Restart container
      const restartResponse = await request(app).post(`/api/containers/${containerId}/restart`)
      expect(restartResponse.status).toBe(200)

      // Force remove container
      const removeResponse = await request(app).delete(`/api/containers/${containerId}?force=true`)
      expect(removeResponse.status).toBe(200)
      expect(removeResponse.body).toEqual({ success: true })

      expect(dockerService.restartContainer).toHaveBeenCalledWith(containerId)
      expect(dockerService.removeContainer).toHaveBeenCalledWith(containerId, true)
    })
  })

  describe('Service Management Flow', () => {
    it('should list services, get specific service, and manage lifecycle', async () => {
      const mockContainers = [
        { ...mockContainerResponse, Names: ['/postgres'], State: 'running', Id: 'container1' },
        { ...mockContainerResponse, Names: ['/redis'], State: 'exited', Id: 'container2' },
      ]
      vi.mocked(dockerService.listContainers).mockResolvedValue(mockContainers)

      const mockExec = vi.mocked(exec)
      mockExec.mockImplementation((cmd: any, options: any, callback: any) => {
        callback(null, { stdout: 'Service started\n', stderr: '' })
        return {} as any
      })

      // List all services
      const listResponse = await request(app).get('/api/services')
      expect(listResponse.status).toBe(200)
      expect(Array.isArray(listResponse.body)).toBe(true)

      // Get specific service
      const serviceResponse = await request(app).get('/api/services/postgresql')
      expect(serviceResponse.status).toBe(200)
      expect(serviceResponse.body).toHaveProperty('id', 'postgresql')

      // Start service
      const startResponse = await request(app).post('/api/services/postgresql/start')
      expect(startResponse.status).toBe(200)
      expect(startResponse.body).toHaveProperty('success', true)
    })

    it('should get service logs for running services', async () => {
      const mockContainers = [
        { ...mockContainerResponse, Names: ['/postgres'], State: 'running', Id: 'container1' },
      ]
      vi.mocked(dockerService.listContainers).mockResolvedValue(mockContainers)
      vi.mocked(dockerService.getContainerLogs).mockResolvedValue('Service log output')

      const logsResponse = await request(app).get('/api/services/postgresql/logs?tail=50')
      expect(logsResponse.status).toBe(200)
      expect(logsResponse.body).toEqual({ logs: 'Service log output' })
      expect(dockerService.getContainerLogs).toHaveBeenCalledWith('container1', 50)
    })
  })

  describe('Volume Management Flow', () => {
    it('should list volumes, get details, and remove volume', async () => {
      const mockVolumes = [
        {
          Name: 'postgres_data',
          Driver: 'local',
          Mountpoint: '/var/lib/docker/volumes/postgres_data/_data',
        },
        {
          Name: 'redis_data',
          Driver: 'local',
          Mountpoint: '/var/lib/docker/volumes/redis_data/_data',
        },
      ]

      vi.mocked(dockerService.listVolumes).mockResolvedValue(mockVolumes)
      vi.mocked(dockerService.getVolume).mockResolvedValue(mockVolumes[0])
      vi.mocked(dockerService.removeVolume).mockResolvedValue({ success: true })

      // List volumes
      const listResponse = await request(app).get('/api/volumes')
      expect(listResponse.status).toBe(200)
      expect(listResponse.body).toHaveLength(2)

      // Get specific volume
      const volumeResponse = await request(app).get('/api/volumes/postgres_data')
      expect(volumeResponse.status).toBe(200)
      expect(volumeResponse.body).toHaveProperty('Name', 'postgres_data')

      // Remove volume with force
      const removeResponse = await request(app).delete('/api/volumes/postgres_data?force=true')
      expect(removeResponse.status).toBe(200)
      expect(removeResponse.body).toEqual({ success: true })

      expect(dockerService.removeVolume).toHaveBeenCalledWith('postgres_data', true)
    })
  })

  describe('System Information Flow', () => {
    it('should get system info, version, and ping Docker', async () => {
      const mockSystemInfo = {
        Containers: 10,
        ContainersRunning: 7,
        Images: 25,
        Driver: 'overlay2',
      }
      const mockVersion = { Version: '24.0.0', ApiVersion: '1.43' }

      vi.mocked(dockerService.getSystemInfo).mockResolvedValue(mockSystemInfo)
      vi.mocked(dockerService.getVersion).mockResolvedValue(mockVersion)
      vi.mocked(dockerService.ping).mockResolvedValue(true)

      // Get system info
      const infoResponse = await request(app).get('/api/system/info')
      expect(infoResponse.status).toBe(200)
      expect(infoResponse.body).toMatchObject(mockSystemInfo)

      // Get version
      const versionResponse = await request(app).get('/api/system/version')
      expect(versionResponse.status).toBe(200)
      expect(versionResponse.body).toMatchObject(mockVersion)

      // Ping Docker
      const pingResponse = await request(app).get('/api/system/ping')
      expect(pingResponse.status).toBe(200)
      expect(pingResponse.body).toEqual({ alive: true })

      expect(dockerService.getSystemInfo).toHaveBeenCalledOnce()
      expect(dockerService.getVersion).toHaveBeenCalledOnce()
      expect(dockerService.ping).toHaveBeenCalledOnce()
    })
  })

  describe('Health Check Flow', () => {
    it('should check health endpoint and system status', async () => {
      vi.mocked(dockerService.ping).mockResolvedValue(true)

      // Check health
      const healthResponse = await request(app).get('/api/health')
      expect(healthResponse.status).toBe(200)
      expect(healthResponse.body).toHaveProperty('status', 'ok')
      expect(healthResponse.body).toHaveProperty('timestamp')

      // Verify Docker is accessible
      const pingResponse = await request(app).get('/api/system/ping')
      expect(pingResponse.status).toBe(200)
      expect(pingResponse.body).toEqual({ alive: true })
    })
  })

  describe('Error Handling Flow', () => {
    it('should handle Docker connection errors gracefully', async () => {
      vi.mocked(dockerService.listContainers).mockRejectedValue(new Error('Cannot connect to Docker'))
      vi.mocked(dockerService.ping).mockResolvedValue(false)

      // Containers should return 500
      const containersResponse = await request(app).get('/api/containers')
      expect(containersResponse.status).toBe(500)
      expect(containersResponse.body).toEqual({ error: 'Failed to list containers' })

      // Ping should show Docker is not alive
      const pingResponse = await request(app).get('/api/system/ping')
      expect(pingResponse.status).toBe(200)
      expect(pingResponse.body).toEqual({ alive: false })
    })

    it('should handle not found errors appropriately', async () => {
      vi.mocked(dockerService.getContainer).mockRejectedValue(new Error('No such container'))

      const response = await request(app).get('/api/containers/nonexistent')
      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to get container' })
    })

    it('should handle service not found errors', async () => {
      const response = await request(app).get('/api/services/nonexistent-service')
      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: 'Service not found' })
    })
  })

  describe('Complete Workflow: Service Deployment', () => {
    it('should simulate full service deployment workflow', async () => {
      const mockContainersInitial = [
        { ...mockContainerResponse, Names: ['/postgres'], State: 'exited', Id: 'container1' },
      ]
      const mockContainersRunning = [
        { ...mockContainerResponse, Names: ['/postgres'], State: 'running', Id: 'container1' },
      ]

      vi.mocked(dockerService.listContainers)
        .mockResolvedValueOnce(mockContainersInitial)
        .mockResolvedValueOnce(mockContainersRunning)
        .mockResolvedValueOnce(mockContainersRunning)

      vi.mocked(dockerService.getContainerLogs).mockResolvedValue('Service started successfully')

      const mockExec = vi.mocked(exec)
      mockExec.mockImplementation((cmd: any, options: any, callback: any) => {
        callback(null, { stdout: 'Service started\n', stderr: '' })
        return {} as any
      })

      // Step 1: Check initial service status
      const statusResponse = await request(app).get('/api/services/postgresql')
      expect(statusResponse.status).toBe(200)
      expect(statusResponse.body).toHaveProperty('running', false)

      // Step 2: Start the service
      const startResponse = await request(app).post('/api/services/postgresql/start')
      expect(startResponse.status).toBe(200)

      // Step 3: Verify service is running
      const verifyResponse = await request(app).get('/api/services/postgresql')
      expect(verifyResponse.status).toBe(200)
      expect(verifyResponse.body).toHaveProperty('running', true)

      // Step 4: Check logs to confirm startup
      const logsResponse = await request(app).get('/api/services/postgresql/logs')
      expect(logsResponse.status).toBe(200)
      expect(logsResponse.body.logs).toContain('Service started successfully')
    })
  })

  describe('Cross-Resource Coordination', () => {
    it('should coordinate container and volume operations', async () => {
      const mockContainers = [
        { ...mockContainerResponse, Names: ['/postgres'], State: 'running', Id: 'container1' },
      ]
      const mockVolumes = [
        { Name: 'postgres_data', Driver: 'local', Mountpoint: '/var/lib/docker/volumes/postgres_data/_data' },
      ]

      vi.mocked(dockerService.listContainers).mockResolvedValue(mockContainers)
      vi.mocked(dockerService.listVolumes).mockResolvedValue(mockVolumes)
      vi.mocked(dockerService.stopContainer).mockResolvedValue({ success: true })
      vi.mocked(dockerService.removeContainer).mockResolvedValue({ success: true })
      vi.mocked(dockerService.removeVolume).mockResolvedValue({ success: true })

      // List containers and volumes
      const containersResponse = await request(app).get('/api/containers')
      const volumesResponse = await request(app).get('/api/volumes')
      expect(containersResponse.status).toBe(200)
      expect(volumesResponse.status).toBe(200)

      // Stop and remove container before removing volume
      await request(app).post('/api/containers/container1/stop')
      await request(app).delete('/api/containers/container1?force=true')

      // Now safe to remove volume
      const removeVolumeResponse = await request(app).delete('/api/volumes/postgres_data?force=true')
      expect(removeVolumeResponse.status).toBe(200)
    })
  })
})
