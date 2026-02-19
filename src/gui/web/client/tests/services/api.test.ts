import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiService } from '@/services/api'
import {
  mockContainers,
  mockContainerRunning,
  mockContainerStats,
  mockVolumes,
  mockVolume,
  mockSystemInfo,
} from '../mocks/docker'

const fetchMock = vi.fn()

describe('ApiService', () => {
  beforeEach(() => {
    global.fetch = fetchMock as unknown as typeof fetch
    fetchMock.mockClear()
  })

  afterEach(() => {
    fetchMock.mockRestore()
  })

  describe('listContainers', () => {
    it('fetches all containers by default', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockContainers,
      } as Response)

      const result = await apiService.listContainers()

      expect(result).toEqual(mockContainers)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/containers?all=true',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('fetches only running containers when all is false', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => [mockContainerRunning],
      } as Response)

      const result = await apiService.listContainers(false)

      expect(result).toEqual([mockContainerRunning])
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/containers?all=false',
        expect.anything()
      )
    })

    it('throws error when request fails', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      } as Response)

      await expect(apiService.listContainers()).rejects.toThrow('Server error')
    })

    it('throws error when response is not ok and json parsing fails', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      } as Response)

      await expect(apiService.listContainers()).rejects.toThrow('Request failed')
    })
  })

  describe('getContainer', () => {
    it('fetches container details by id', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockContainerRunning,
      } as Response)

      const result = await apiService.getContainer('test-id')

      expect(result).toEqual(mockContainerRunning)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/containers/test-id',
        expect.anything()
      )
    })

    it('throws error when container not found', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Container not found' }),
      } as Response)

      await expect(apiService.getContainer('invalid-id')).rejects.toThrow(
        'Container not found'
      )
    })
  })

  describe('startContainer', () => {
    it('starts container and returns success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      const result = await apiService.startContainer('test-id')

      expect(result).toEqual({ success: true })
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/containers/test-id/start',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('throws error when start fails', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to start container' }),
      } as Response)

      await expect(apiService.startContainer('test-id')).rejects.toThrow(
        'Failed to start container'
      )
    })
  })

  describe('stopContainer', () => {
    it('stops container and returns success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      const result = await apiService.stopContainer('test-id')

      expect(result).toEqual({ success: true })
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/containers/test-id/stop',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('throws error when stop fails', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to stop container' }),
      } as Response)

      await expect(apiService.stopContainer('test-id')).rejects.toThrow(
        'Failed to stop container'
      )
    })
  })

  describe('restartContainer', () => {
    it('restarts container and returns success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      const result = await apiService.restartContainer('test-id')

      expect(result).toEqual({ success: true })
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/containers/test-id/restart',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('throws error when restart fails', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to restart container' }),
      } as Response)

      await expect(apiService.restartContainer('test-id')).rejects.toThrow(
        'Failed to restart container'
      )
    })
  })

  describe('removeContainer', () => {
    it('removes container without force by default', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      const result = await apiService.removeContainer('test-id')

      expect(result).toEqual({ success: true })
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/containers/test-id?force=false',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('removes container with force flag', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      const result = await apiService.removeContainer('test-id', true)

      expect(result).toEqual({ success: true })
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/containers/test-id?force=true',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('throws error when removal fails', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Container is running, use force' }),
      } as Response)

      await expect(apiService.removeContainer('test-id')).rejects.toThrow(
        'Container is running, use force'
      )
    })
  })

  describe('getContainerLogs', () => {
    it('fetches container logs with default tail', async () => {
      const mockLogs = { logs: 'log line 1\nlog line 2' }
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockLogs,
      } as Response)

      const result = await apiService.getContainerLogs('test-id')

      expect(result).toEqual(mockLogs)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/containers/test-id/logs?tail=100',
        expect.anything()
      )
    })

    it('fetches container logs with custom tail', async () => {
      const mockLogs = { logs: 'log line 1' }
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockLogs,
      } as Response)

      const result = await apiService.getContainerLogs('test-id', 50)

      expect(result).toEqual(mockLogs)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/containers/test-id/logs?tail=50',
        expect.anything()
      )
    })
  })

  describe('getContainerStats', () => {
    it('fetches container statistics', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockContainerStats,
      } as Response)

      const result = await apiService.getContainerStats('test-id')

      expect(result).toEqual(mockContainerStats)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/containers/test-id/stats',
        expect.anything()
      )
    })

    it('throws error when stats fetch fails', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Container not found' }),
      } as Response)

      await expect(apiService.getContainerStats('invalid-id')).rejects.toThrow(
        'Container not found'
      )
    })
  })

  describe('listVolumes', () => {
    it('fetches all volumes', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockVolumes,
      } as Response)

      const result = await apiService.listVolumes()

      expect(result).toEqual(mockVolumes)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/volumes',
        expect.anything()
      )
    })

    it('returns empty array when no volumes exist', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response)

      const result = await apiService.listVolumes()

      expect(result).toEqual([])
    })
  })

  describe('getVolume', () => {
    it('fetches volume details by name', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockVolume,
      } as Response)

      const result = await apiService.getVolume('postgres_data')

      expect(result).toEqual(mockVolume)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/volumes/postgres_data',
        expect.anything()
      )
    })

    it('throws error when volume not found', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Volume not found' }),
      } as Response)

      await expect(apiService.getVolume('invalid-volume')).rejects.toThrow(
        'Volume not found'
      )
    })
  })

  describe(' removeVolume', () => {
    it('removes volume without force by default', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      const result = await apiService.removeVolume('test-volume')

      expect(result).toEqual({ success: true })
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/volumes/test-volume?force=false',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('removes volume with force flag', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      const result = await apiService.removeVolume('test-volume', true)

      expect(result).toEqual({ success: true })
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/volumes/test-volume?force=true',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('throws error when volume is in use', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Volume is in use' }),
      } as Response)

      await expect(apiService.removeVolume('test-volume')).rejects.toThrow(
        'Volume is in use'
      )
    })
  })

  describe('getSystemInfo', () => {
    it('fetches system information', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockSystemInfo,
      } as Response)

      const result = await apiService.getSystemInfo()

      expect(result).toEqual(mockSystemInfo)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/system/info',
        expect.anything()
      )
    })

    it('throws error when system info fetch fails', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to fetch system info' }),
      } as Response)

      await expect(apiService.getSystemInfo()).rejects.toThrow(
        'Failed to fetch system info'
      )
    })
  })

  describe('getVersion', () => {
    it('fetches Docker version information', async () => {
      const mockVersion = {
        Version: '24.0.0',
        ApiVersion: '1.43',
        GitCommit: 'abc123',
        Os: 'linux',
        Arch: 'amd64',
      }

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockVersion,
      } as Response)

      const result = await apiService.getVersion()

      expect(result).toEqual(mockVersion)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/system/version',
        expect.anything()
      )
    })
  })

  describe('ping', () => {
    it('pings the API and returns alive status', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ alive: true }),
      } as Response)

      const result = await apiService.ping()

      expect(result).toEqual({ alive: true })
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/system/ping',
        expect.anything()
      )
    })

    it('throws error when ping fails', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Service unavailable' }),
      } as Response)

      await expect(apiService.ping()).rejects.toThrow('Service unavailable')
    })
  })
})
