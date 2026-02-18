import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import volumeRoutes from '@/routes/volumes'
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

describe('Volume Routes', () => {
  let app: express.Application

  const mockVolumes = [
    {
      CreatedAt: '2024-01-01T00:00:00Z',
      Driver: 'local',
      Labels: null,
      Mountpoint: '/var/lib/docker/volumes/postgres_data/_data',
      Name: 'postgres_data',
      Options: null,
      Scope: 'local',
    },
    {
      CreatedAt: '2024-01-01T00:00:00Z',
      Driver: 'local',
      Labels: null,
      Mountpoint: '/var/lib/docker/volumes/redis_data/_data',
      Name: 'redis_data',
      Options: null,
      Scope: 'local',
    },
  ]

  const mockVolumeDetails = {
    Name: 'postgres_data',
    Driver: 'local',
    Mountpoint: '/var/lib/docker/volumes/postgres_data/_data',
    Labels: null,
    Scope: 'local',
    Options: null,
  }

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/api/volumes', volumeRoutes)
    vi.clearAllMocks()
  })

  describe('GET /api/volumes', () => {
    it('should list all volumes', async () => {
      vi.mocked(dockerService.listVolumes).mockResolvedValue(mockVolumes)

      const response = await request(app).get('/api/volumes')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockVolumes)
      expect(dockerService.listVolumes).toHaveBeenCalledOnce()
    })

    it('should return empty array when no volumes exist', async () => {
      vi.mocked(dockerService.listVolumes).mockResolvedValue([])

      const response = await request(app).get('/api/volumes')

      expect(response.status).toBe(200)
      expect(response.body).toEqual([])
    })

    it('should return 500 on error', async () => {
      vi.mocked(dockerService.listVolumes).mockRejectedValue(new Error('Docker error'))

      const response = await request(app).get('/api/volumes')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to list volumes' })
    })
  })

  describe('GET /api/volumes/:name', () => {
    it('should return volume details', async () => {
      vi.mocked(dockerService.getVolume).mockResolvedValue(mockVolumeDetails)

      const response = await request(app).get('/api/volumes/postgres_data')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockVolumeDetails)
      expect(dockerService.getVolume).toHaveBeenCalledWith('postgres_data')
    })

    it('should return 500 when volume not found', async () => {
      vi.mocked(dockerService.getVolume).mockRejectedValue(new Error('Volume not found'))

      const response = await request(app).get('/api/volumes/nonexistent_volume')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to get volume' })
    })

    it('should return 500 on error', async () => {
      vi.mocked(dockerService.getVolume).mockRejectedValue(new Error('Unexpected error'))

      const response = await request(app).get('/api/volumes/postgres_data')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to get volume' })
    })
  })

  describe('DELETE /api/volumes/:name', () => {
    it('should remove a volume without force', async () => {
      vi.mocked(dockerService.removeVolume).mockResolvedValue({ success: true })

      const response = await request(app).delete('/api/volumes/postgres_data')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ success: true })
      expect(dockerService.removeVolume).toHaveBeenCalledWith('postgres_data', false)
    })

    it('should remove a volume with force=true', async () => {
      vi.mocked(dockerService.removeVolume).mockResolvedValue({ success: true })

      const response = await request(app).delete('/api/volumes/postgres_data?force=true')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ success: true })
      expect(dockerService.removeVolume).toHaveBeenCalledWith('postgres_data', true)
    })

    it('should handle force=false explicitly', async () => {
      vi.mocked(dockerService.removeVolume).mockResolvedValue({ success: true })

      const response = await request(app).delete('/api/volumes/postgres_data?force=false')

      expect(response.status).toBe(200)
      expect(dockerService.removeVolume).toHaveBeenCalledWith('postgres_data', false)
    })

    it('should return 500 when volume is in use', async () => {
      vi.mocked(dockerService.removeVolume).mockRejectedValue(
        new Error('volume is in use - remove the container using it first')
      )

      const response = await request(app).delete('/api/volumes/postgres_data')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to remove volume' })
    })

    it('should return 500 on error', async () => {
      vi.mocked(dockerService.removeVolume).mockRejectedValue(new Error('Unexpected error'))

      const response = await request(app).delete('/api/volumes/postgres_data')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to remove volume' })
    })
  })
})
