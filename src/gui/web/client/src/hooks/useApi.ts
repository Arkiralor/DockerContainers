import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '@/services/api'

/**
 * React Query hook for fetching containers list.
 *
 * Automatically refetches every 5 seconds to keep the container list current.
 * Caches results and handles loading/error states.
 *
 * @param all - If true, includes stopped containers; if false, only running containers
 * @returns React Query object with container data, loading state, and error
 */
export function useContainers(all: boolean = true) {
  return useQuery({
    queryKey: ['containers', all],
    queryFn: () => apiService.listContainers(all),
    refetchInterval: 5000,
  })
}

/**
 * React Query hook for fetching a single container's detailed information.
 *
 * Only fetches when id is provided (enabled: !!id).
 * Useful for container details modals or pages.
 *
 * @param id - Container ID or name (null to skip fetching)
 * @returns React Query object with container data, loading state, and error
 */
export function useContainer(id: string | null) {
  return useQuery({
    queryKey: ['container', id],
    queryFn: () => apiService.getContainer(id!),
    enabled: !!id,
  })
}

/**
 * React Query hook for fetching container logs.
 *
 * Only fetches when id is provided (enabled: !!id).
 * Retrieves the specified number of most recent log lines.
 *
 * @param id - Container ID or name (null to skip fetching)
 * @param tail - Number of log lines to retrieve (default: 100)
 * @returns React Query object with logs data, loading state, and error
 */
export function useContainerLogs(id: string | null, tail: number = 100) {
  return useQuery({
    queryKey: ['container-logs', id, tail],
    queryFn: () => apiService.getContainerLogs(id!, tail),
    enabled: !!id,
  })
}

/**
 * React Query mutation hook for starting a container.
 *
 * Automatically invalidates and refetches the containers list on success
 * to reflect the updated container state.
 *
 * @returns Mutation object with mutate function, loading state, and error
 *
 * @example
 * const startContainer = useStartContainer()
 * startContainer.mutate(containerId)
 */
export function useStartContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiService.startContainer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
    },
  })
}

/**
 * React Query mutation hook for stopping a container.
 *
 * Automatically invalidates and refetches the containers list on success
 * to reflect the updated container state.
 *
 * @returns Mutation object with mutate function, loading state, and error
 *
 * @example
 * const stopContainer = useStopContainer()
 * stopContainer.mutate(containerId)
 */
export function useStopContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiService.stopContainer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
    },
  })
}

/**
 * React Query mutation hook for restarting a container.
 *
 * Automatically invalidates and refetches the containers list on success
 * to reflect the updated container state.
 *
 * @returns Mutation object with mutate function, loading state, and error
 *
 * @example
 * const restartContainer = useRestartContainer()
 * restartContainer.mutate(containerId)
 */
export function useRestartContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiService.restartContainer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
    },
  })
}

/**
 * React Query mutation hook for removing a container.
 *
 * Automatically invalidates and refetches the containers list on success
 * to reflect the removal. Supports force removal option.
 *
 * @returns Mutation object with mutate function, loading state, and error
 *
 * @example
 * const removeContainer = useRemoveContainer()
 * removeContainer.mutate({ id: containerId, force: true })
 */
export function useRemoveContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
      apiService.removeContainer(id, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
    },
  })
}

/**
 * React Query hook for fetching Docker volumes list.
 *
 * Automatically refetches every 10 seconds to keep the volumes list current.
 * Caches results and handles loading/error states.
 *
 * @returns React Query object with volumes data, loading state, and error
 */
export function useVolumes() {
  return useQuery({
    queryKey: ['volumes'],
    queryFn: () => apiService.listVolumes(),
    refetchInterval: 10000,
  })
}

/**
 * React Query hook for fetching Docker system information.
 *
 * Automatically refetches every 30 seconds to keep system info current.
 * Returns information about the Docker installation including containers,
 * images, OS, architecture, etc.
 *
 * @returns React Query object with system info data, loading state, and error
 */
export function useSystemInfo() {
  return useQuery({
    queryKey: ['system-info'],
    queryFn: () => apiService.getSystemInfo(),
    refetchInterval: 30000,
  })
}
