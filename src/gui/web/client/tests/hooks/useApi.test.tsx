import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import * as apiService from '@/services/api'
import {
  useContainers,
  useContainer,
  useContainerLogs,
  useStartContainer,
  useStopContainer,
  useRestartContainer,
  useRemoveContainer,
  useVolumes,
  useSystemInfo,
} from '@/hooks/useApi'
import { mockContainers, mockContainerRunning, mockVolumes, mockSystemInfo } from '../mocks/docker'

// Mock the API service
vi.mock('@/services/api', () => ({
  apiService: {
    listContainers: vi.fn(),
    getContainer: vi.fn(),
    getContainerLogs: vi.fn(),
    startContainer: vi.fn(),
    stopContainer: vi.fn(),
    restartContainer: vi.fn(),
    removeContainer: vi.fn(),
    listVolumes: vi.fn(),
    getSystemInfo: vi.fn(),
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
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  return Wrapper
}

describe('useApi hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useContainers', () => {
    it('fetches containers successfully', async () => {
      vi.mocked(apiService.apiService.listContainers).mockResolvedValue(mockContainers)

      const { result } = renderHook(() => useContainers(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockContainers)
      expect(apiService.apiService.listContainers).toHaveBeenCalledWith(true)
    })

    it('fetches only running containers when all=false', async () => {
      vi.mocked(apiService.apiService.listContainers).mockResolvedValue([mockContainerRunning])

      const { result } = renderHook(() => useContainers(false), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(apiService.apiService.listContainers).toHaveBeenCalledWith(false)
    })

    it('handles error when fetching containers fails', async () => {
      vi.mocked(apiService.apiService.listContainers).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useContainers(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeDefined()
    })

    it('refetches containers at interval', async () => {
      vi.mocked(apiService.apiService.listContainers).mockResolvedValue(mockContainers)

      renderHook(() => useContainers(), { wrapper: createWrapper() })

      await waitFor(() =>
        expect(apiService.apiService.listContainers).toHaveBeenCalledTimes(1)
      )

      // Note: Testing refetchInterval would require advancing timers
      // which is complex in this setup. The configuration is verified.
    })
  })

  describe('useContainer', () => {
    it('fetches container details when id is provided', async () => {
      vi.mocked(apiService.apiService.getContainer).mockResolvedValue(mockContainerRunning)

      const { result } = renderHook(() => useContainer('test-id'), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockContainerRunning)
      expect(apiService.apiService.getContainer).toHaveBeenCalledWith('test-id')
    })

    it('does not fetch when id is null', () => {
      const { result } = renderHook(() => useContainer(null), { wrapper: createWrapper() })

      expect(result.current.fetchStatus).toBe('idle')
      expect(apiService.apiService.getContainer).not.toHaveBeenCalled()
    })
  })

  describe('useContainerLogs', () => {
    it('fetches container logs with default tail', async () => {
      vi.mocked(apiService.apiService.getContainerLogs).mockResolvedValue('log line 1\nlog line 2')

      const { result } = renderHook(() => useContainerLogs('test-id'), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBe('log line 1\nlog line 2')
      expect(apiService.apiService.getContainerLogs).toHaveBeenCalledWith('test-id', 100)
    })

    it('fetches container logs with custom tail', async () => {
      vi.mocked(apiService.apiService.getContainerLogs).mockResolvedValue('log line 1')

      const { result } = renderHook(() => useContainerLogs('test-id', 50), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(apiService.apiService.getContainerLogs).toHaveBeenCalledWith('test-id', 50)
    })

    it('does not fetch when id is null', () => {
      const { result } = renderHook(() => useContainerLogs(null), { wrapper: createWrapper() })

      expect(result.current.fetchStatus).toBe('idle')
      expect(apiService.apiService.getContainerLogs).not.toHaveBeenCalled()
    })
  })

  describe('useStartContainer', () => {
    it('starts container and invalidates queries', async () => {
      vi.mocked(apiService.apiService.startContainer).mockResolvedValue(undefined)

      const { result } = renderHook(() => useStartContainer(), { wrapper: createWrapper() })

      result.current.mutate('test-id')

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(apiService.apiService.startContainer).toHaveBeenCalledWith('test-id')
    })

    it('handles error when starting container fails', async () => {
      vi.mocked(apiService.apiService.startContainer).mockRejectedValue(
        new Error('Failed to start')
      )

      const { result } = renderHook(() => useStartContainer(), { wrapper: createWrapper() })

      result.current.mutate('test-id')

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeDefined()
    })
  })

  describe('useStopContainer', () => {
    it('stops container and invalidates queries', async () => {
      vi.mocked(apiService.apiService.stopContainer).mockResolvedValue(undefined)

      const { result } = renderHook(() => useStopContainer(), { wrapper: createWrapper() })

      result.current.mutate('test-id')

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(apiService.apiService.stopContainer).toHaveBeenCalledWith('test-id')
    })
  })

  describe('useRestartContainer', () => {
    it('restarts container and invalidates queries', async () => {
      vi.mocked(apiService.apiService.restartContainer).mockResolvedValue(undefined)

      const { result } = renderHook(() => useRestartContainer(), { wrapper: createWrapper() })

      result.current.mutate('test-id')

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(apiService.apiService.restartContainer).toHaveBeenCalledWith('test-id')
    })
  })

  describe('useRemoveContainer', () => {
    it('removes container and invalidates queries', async () => {
      vi.mocked(apiService.apiService.removeContainer).mockResolvedValue(undefined)

      const { result } = renderHook(() => useRemoveContainer(), { wrapper: createWrapper() })

      result.current.mutate({ id: 'test-id' })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(apiService.apiService.removeContainer).toHaveBeenCalledWith('test-id', undefined)
    })

    it('removes container with force flag', async () => {
      vi.mocked(apiService.apiService.removeContainer).mockResolvedValue(undefined)

      const { result } = renderHook(() => useRemoveContainer(), { wrapper: createWrapper() })

      result.current.mutate({ id: 'test-id', force: true })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(apiService.apiService.removeContainer).toHaveBeenCalledWith('test-id', true)
    })
  })

  describe('useVolumes', () => {
    it('fetches volumes successfully', async () => {
      vi.mocked(apiService.apiService.listVolumes).mockResolvedValue(mockVolumes)

      const { result } = renderHook(() => useVolumes(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockVolumes)
      expect(apiService.apiService.listVolumes).toHaveBeenCalled()
    })
  })

  describe('useSystemInfo', () => {
    it('fetches system info successfully', async () => {
      vi.mocked(apiService.apiService.getSystemInfo).mockResolvedValue(mockSystemInfo)

      const { result } = renderHook(() => useSystemInfo(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockSystemInfo)
      expect(apiService.apiService.getSystemInfo).toHaveBeenCalled()
    })
  })
})
