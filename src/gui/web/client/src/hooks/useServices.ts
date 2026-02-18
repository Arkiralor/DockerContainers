import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { servicesApi } from '@/services/servicesApi'

/**
 * React Query hook for fetching configured services list with status.
 *
 * Automatically refetches every 5 seconds to keep service statuses current.
 * Returns services (PostgreSQL, Redis, OpenSearch) with their configuration
 * and real-time container status.
 *
 * @returns React Query object with services data, loading state, and error
 */
export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.listServices(),
    refetchInterval: 5000,
  })
}

/**
 * React Query hook for fetching a single service's status.
 *
 * Only fetches when serviceId is provided (enabled: !!serviceId).
 * Useful for service details modals or pages.
 *
 * @param serviceId - Service identifier (e.g., "redis", "postgres") or null to skip fetching
 * @returns React Query object with service data, loading state, and error
 */
export function useService(serviceId: string | null) {
  return useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => servicesApi.getService(serviceId!),
    enabled: !!serviceId,
  })
}

/**
 * React Query hook for fetching service container logs.
 *
 * Only fetches when serviceId is provided (enabled: !!serviceId).
 * Retrieves the specified number of most recent log lines.
 *
 * @param serviceId - Service identifier or null to skip fetching
 * @param tail - Number of log lines to retrieve (default: 100)
 * @returns React Query object with logs data, loading state, and error
 */
export function useServiceLogs(serviceId: string | null, tail: number = 100) {
  return useQuery({
    queryKey: ['service-logs', serviceId, tail],
    queryFn: () => servicesApi.getServiceLogs(serviceId!, tail),
    enabled: !!serviceId,
  })
}

/**
 * React Query mutation hook for starting a service via make command.
 *
 * Automatically invalidates and refetches the services list on success
 * to reflect the updated service state.
 *
 * @returns Mutation object with mutate function, loading state, and error
 *
 * @example
 * const startService = useStartService()
 * startService.mutate('redis')
 */
export function useStartService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (serviceId: string) => servicesApi.startService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

/**
 * React Query mutation hook for stopping a service via make command.
 *
 * Automatically invalidates and refetches the services list on success
 * to reflect the updated service state.
 *
 * @returns Mutation object with mutate function, loading state, and error
 *
 * @example
 * const stopService = useStopService()
 * stopService.mutate('redis')
 */
export function useStopService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (serviceId: string) => servicesApi.stopService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}
