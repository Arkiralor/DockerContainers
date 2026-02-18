import { describe, it, expect, vi, beforeEach,  afterEach } from 'vitest'
import { servicesApi } from '@/services/servicesApi'
import { mockServices, mockServiceRunning, mockServiceStopped } from '../mocks/docker'

const fetchMock = vi.fn()

describe('ServicesApiService', () => {
  beforeEach(() => {
    global.fetch = fetchMock as any
    fetchMock.mockClear()
  })

  afterEach(() => {
    fetchMock.mockRestore()
  })

  describe('listServices', () => {
    it('fetches all services successfully', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockServices,
      } as Response)

      const result = await servicesApi.listServices()

      expect(result).toEqual(mockServices)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/services',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('returns empty array when no services exist', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response)

      const result = await servicesApi.listServices()

      expect(result).toEqual([])
    })

    it('throws error when request fails', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      } as Response)

      await expect(servicesApi.listServices()).rejects.toThrow('Server error')
    })

    it('throws error when response is not ok and json parsing fails', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      } as Response)

      await expect(servicesApi.listServices()).rejects.toThrow('Request failed')
    })

    it('handles network errors', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'))

      await expect(servicesApi.listServices()).rejects.toThrow('Network error')
    })
  })

  describe('getService', () => {
    it('fetches service details by id', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockServiceRunning,
      } as Response)

      const result = await servicesApi.getService('postgresql')

      expect(result).toEqual(mockServiceRunning)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/services/postgresql',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('fetches stopped service details', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockServiceStopped,
      } as Response)

      const result = await servicesApi.getService('redis')

      expect(result).toEqual(mockServiceStopped)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/services/redis',
        expect.anything()
      )
    })

    it('throws error when service not found', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Service not found' }),
      } as Response)

      await expect(servicesApi.getService('invalid-service')).rejects.toThrow(
        'Service not found'
      )
    })

    it('handles server errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      } as Response)

      await expect(servicesApi.getService('postgresql')).rejects.toThrow(
        'Internal server error'
      )
    })
  })

  describe('startService', () => {
    it('starts service successfully', async () => {
      const mockResponse = {
        success: true,
        output: 'Container started successfully',
      }

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await servicesApi.startService('postgresql')

      expect(result).toEqual(mockResponse)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/services/postgresql/start',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('handles start failure with error message', async () => {
      const mockResponse = {
        success: false,
        output: '',
        error: 'Container already running',
      }

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await servicesApi.startService('postgresql')

      expect(result).toEqual(mockResponse)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Container already running')
    })

    it('throws error when request fails', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to start service' }),
      } as Response)

      await expect(servicesApi.startService('postgresql')).rejects.toThrow(
        'Failed to start service'
      )
    })

    it('handles service not found error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Service not found' }),
      } as Response)

      await expect(servicesApi.startService('invalid-service')).rejects.toThrow(
        'Service not found'
      )
    })

    it('handles network errors', async () => {
      fetchMock.mockRejectedValue(new Error('Network timeout'))

      await expect(servicesApi.startService('postgresql')).rejects.toThrow('Network timeout')
    })
  })

  describe('stopService', () => {
    it('stops service successfully', async () => {
      const mockResponse = {
        success: true,
        output: 'Container stopped successfully',
      }

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await servicesApi.stopService('postgresql')

      expect(result).toEqual(mockResponse)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/services/postgresql/stop',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('handles stop failure with error message', async () => {
      const mockResponse = {
        success: false,
        output: '',
        error: 'Container not running',
      }

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await servicesApi.stopService('postgresql')

      expect(result).toEqual(mockResponse)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Container not running')
    })

    it('throws error when request fails', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to stop service' }),
      } as Response)

      await expect(servicesApi.stopService('postgresql')).rejects.toThrow(
        'Failed to stop service'
      )
    })

    it('handles service not found error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Service not found' }),
      } as Response)

      await expect(servicesApi.stopService('invalid-service')).rejects.toThrow(
        'Service not found'
      )
    })

    it('handles graceful shutdown timeout', async () => {
      const mockResponse = {
        success: true,
        output: 'Container stopped (timeout)',
      }

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await servicesApi.stopService('postgresql')

      expect(result.success).toBe(true)
      expect(result.output).toContain('timeout')
    })
  })

  describe('getServiceLogs', () => {
    it('fetches service logs with default tail', async () => {
      const mockLogs = { logs: 'log line 1\nlog line 2\nlog line 3' }

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockLogs,
      } as Response)

      const result = await servicesApi.getServiceLogs('postgresql')

      expect(result).toEqual(mockLogs)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/services/postgresql/logs?tail=100',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('fetches service logs with custom tail', async () => {
      const mockLogs = { logs: 'recent log line' }

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockLogs,
      } as Response)

      const result = await servicesApi.getServiceLogs('postgresql', 50)

      expect(result).toEqual(mockLogs)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/services/postgresql/logs?tail=50',
        expect.anything()
      )
    })

    it('fetches logs with very large tail value', async () => {
      const mockLogs = { logs: 'many log lines...' }

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockLogs,
      } as Response)

      const result = await servicesApi.getServiceLogs('postgresql', 10000)

      expect(result).toEqual(mockLogs)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5001/api/services/postgresql/logs?tail=10000',
        expect.anything()
      )
    })

    it('handles empty logs', async () => {
      const mockLogs = { logs: '' }

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockLogs,
      } as Response)

      const result = await servicesApi.getServiceLogs('postgresql')

      expect(result).toEqual(mockLogs)
      expect(result.logs).toBe('')
    })

    it('throws error when service not found', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Service not found' }),
      } as Response)

      await expect(servicesApi.getServiceLogs('invalid-service')).rejects.toThrow(
        'Service not found'
      )
    })

    it('throws error when container is not running', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Container is not running' }),
      } as Response)

      await expect(servicesApi.getServiceLogs('postgresql')).rejects.toThrow(
        'Container is not running'
      )
    })

    it('handles server errors when fetching logs', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to fetch logs' }),
      } as Response)

      await expect(servicesApi.getServiceLogs('postgresql')).rejects.toThrow(
        'Failed to fetch logs'
      )
    })
  })
})
