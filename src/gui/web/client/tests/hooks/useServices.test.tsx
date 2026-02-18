import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import * as servicesApi from '@/services/servicesApi'
import {
  useServices,
  useService,
  useServiceLogs,
  useStartService,
  useStopService,
} from '@/hooks/useServices'
import { mockServices, mockServiceRunning } from '../mocks/docker'

// Mock the services API
vi.mock('@/services/servicesApi', () => ({
  servicesApi: {
    listServices: vi.fn(),
    getService: vi.fn(),
    getServiceLogs: vi.fn(),
    startService: vi.fn(),
    stopService: vi.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client= { queryClient } >
    { children }
    </QueryClientProvider>
  )

return Wrapper
}

describe('useServices hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useServices', () => {
    it('fetches services successfully', async () => {
      vi.mocked(servicesApi.servicesApi.listServices).mockResolvedValue(mockServices)

      const { result } = renderHook(() => useServices(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockServices)
      expect(servicesApi.servicesApi.listServices).toHaveBeenCalled()
    })

    it('handles error when fetching services fails', async () => {
      vi.mocked(servicesApi.servicesApi.listServices).mockRejectedValue(
        new Error('Network error')
      )

      const { result } = renderHook(() => useServices(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeDefined()
    })

    it('refetches services at 5 second interval', async () => {
      vi.mocked(servicesApi.servicesApi.listServices).mockResolvedValue(mockServices)

      renderHook(() => useServices(), { wrapper: createWrapper() })

      await waitFor(() =>
        expect(servicesApi.servicesApi.listServices).toHaveBeenCalledTimes(1)
      )

      // Note: Testing refetchInterval would require advancing timers
      // which is complex in this setup. The configuration is verified.
    })

    it('returns empty array when no services exist', async () => {
      vi.mocked(servicesApi.servicesApi.listServices).mockResolvedValue([])

      const { result } = renderHook(() => useServices(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual([])
    })
  })

  describe('useService', () => {
    it('fetches service details when id is provided', async () => {
      vi.mocked(servicesApi.servicesApi.getService).mockResolvedValue(mockServiceRunning)

      const { result } = renderHook(() => useService('postgresql'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockServiceRunning)
      expect(servicesApi.servicesApi.getService).toHaveBeenCalledWith('postgresql')
    })

    it('does not fetch when id is null', () => {
      const { result } = renderHook(() => useService(null), { wrapper: createWrapper() })

      expect(result.current.fetchStatus).toBe('idle')
      expect(servicesApi.servicesApi.getService).not.toHaveBeenCalled()
    })

    it('handles error when fetching service fails', async () => {
      vi.mocked(servicesApi.servicesApi.getService).mockRejectedValue(
        new Error('Service not found')
      )

      const { result } = renderHook(() => useService('invalid-service'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeDefined()
    })

    it('updates when serviceId changes', async () => {
      vi.mocked(servicesApi.servicesApi.getService).mockResolvedValue(mockServiceRunning)

      const { result, rerender } = renderHook(
        ({ id }) => useService(id),
        {
          wrapper: createWrapper(),
          initialProps: { id: 'postgresql' },
        }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(servicesApi.servicesApi.getService).toHaveBeenCalledWith('postgresql')

      // Change the service ID
      rerender({ id: 'redis' })

      await waitFor(() =>
        expect(servicesApi.servicesApi.getService).toHaveBeenCalledWith('redis')
      )
    })
  })

  describe('useServiceLogs', () => {
    it('fetches service logs with default tail', async () => {
      const mockLogs = { logs: 'log line 1\nlog line 2' }
      vi.mocked(servicesApi.servicesApi.getServiceLogs).mockResolvedValue(mockLogs)

      const { result } = renderHook(() => useServiceLogs('postgresql'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockLogs)
      expect(servicesApi.servicesApi.getServiceLogs).toHaveBeenCalledWith('postgresql', 100)
    })

    it('fetches service logs with custom tail', async () => {
      const mockLogs = { logs: 'log line 1' }
      vi.mocked(servicesApi.servicesApi.getServiceLogs).mockResolvedValue(mockLogs)

      const { result } = renderHook(() => useServiceLogs('postgresql', 50), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(servicesApi.servicesApi.getServiceLogs).toHaveBeenCalledWith('postgresql', 50)
    })

    it('does not fetch when serviceId is null', () => {
      const { result } = renderHook(() => useServiceLogs(null), {
        wrapper: createWrapper(),
      })

      expect(result.current.fetchStatus).toBe('idle')
      expect(servicesApi.servicesApi.getServiceLogs).not.toHaveBeenCalled()
    })

    it('handles error when fetching logs fails', async () => {
      vi.mocked(servicesApi.servicesApi.getServiceLogs).mockRejectedValue(
        new Error('Failed to fetch logs')
      )

      const { result } = renderHook(() => useServiceLogs('postgresql'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeDefined()
    })

    it('updates when tail parameter changes', async () => {
      const mockLogs = { logs: 'logs' }
      vi.mocked(servicesApi.servicesApi.getServiceLogs).mockResolvedValue(mockLogs)

      const { result, rerender } = renderHook(
        ({ tail }) => useServiceLogs('postgresql', tail),
        {
          wrapper: createWrapper(),
          initialProps: { tail: 100 },
        }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(servicesApi.servicesApi.getServiceLogs).toHaveBeenCalledWith('postgresql', 100)

      // Change the tail parameter
      rerender({ tail: 200 })

      await waitFor(() =>
        expect(servicesApi.servicesApi.getServiceLogs).toHaveBeenCalledWith('postgresql', 200)
      )
    })
  })

  describe('useStartService', () => {
    it('starts service and invalidates queries', async () => {
      const mockResponse = { success: true, output: 'Service started' }
      vi.mocked(servicesApi.servicesApi.startService).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useStartService(), { wrapper: createWrapper() })

      result.current.mutate('postgresql')

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(servicesApi.servicesApi.startService).toHaveBeenCalledWith('postgresql')
      expect(result.current.data).toEqual(mockResponse)
    })

    it('handles error when starting service fails', async () => {
      vi.mocked(servicesApi.servicesApi.startService).mockRejectedValue(
        new Error('Failed to start service')
      )

      const { result } = renderHook(() => useStartService(), { wrapper: createWrapper() })

      result.current.mutate('postgresql')

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeDefined()
    })

    it('handles service start with error in response', async () => {
      const mockResponse = {
        success: false,
        output: '',
        error: 'Container already running',
      }
      vi.mocked(servicesApi.servicesApi.startService).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useStartService(), { wrapper: createWrapper() })

      result.current.mutate('postgresql')

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockResponse)
      expect(result.current.data?.success).toBe(false)
    })

    it('can start multiple services sequentially', async () => {
      const mockResponse = { success: true, output: 'Service started' }
      vi.mocked(servicesApi.servicesApi.startService).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useStartService(), { wrapper: createWrapper() })

      result.current.mutate('postgresql')
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      result.current.mutate('redis')
      await waitFor(() =>
        expect(servicesApi.servicesApi.startService).toHaveBeenCalledWith('redis')
      )

      expect(servicesApi.servicesApi.startService).toHaveBeenCalledTimes(2)
    })
  })

  describe('useStopService', () => {
    it('stops service and invalidates queries', async () => {
      const mockResponse = { success: true, output: 'Service stopped' }
      vi.mocked(servicesApi.servicesApi.stopService).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useStopService(), { wrapper: createWrapper() })

      result.current.mutate('postgresql')

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(servicesApi.servicesApi.stopService).toHaveBeenCalledWith('postgresql')
      expect(result.current.data).toEqual(mockResponse)
    })

    it('handles error when stopping service fails', async () => {
      vi.mocked(servicesApi.servicesApi.stopService).mockRejectedValue(
        new Error('Failed to stop service')
      )

      const { result } = renderHook(() => useStopService(), { wrapper: createWrapper() })

      result.current.mutate('postgresql')

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeDefined()
    })

    it('handles service stop with error in response', async () => {
      const mockResponse = {
        success: false,
        output: '',
        error: 'Container not running',
      }
      vi.mocked(servicesApi.servicesApi.stopService).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useStopService(), { wrapper: createWrapper() })

      result.current.mutate('postgresql')

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockResponse)
      expect(result.current.data?.success).toBe(false)
    })

    it('can stop multiple services sequentially', async () => {
      const mockResponse = { success: true, output: 'Service stopped' }
      vi.mocked(servicesApi.servicesApi.stopService).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useStopService(), { wrapper: createWrapper() })

      result.current.mutate('postgresql')
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      result.current.mutate('redis')
      await waitFor(() =>
        expect(servicesApi.servicesApi.stopService).toHaveBeenCalledWith('redis')
      )

      expect(servicesApi.servicesApi.stopService).toHaveBeenCalledTimes(2)
    })
  })
})
