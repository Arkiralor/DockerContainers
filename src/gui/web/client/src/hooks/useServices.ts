import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { servicesApi } from '@/services/servicesApi'

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.listServices(),
    refetchInterval: 5000,
  })
}

export function useService(serviceId: string | null) {
  return useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => servicesApi.getService(serviceId!),
    enabled: !!serviceId,
  })
}

export function useServiceLogs(serviceId: string | null, tail: number = 100) {
  return useQuery({
    queryKey: ['service-logs', serviceId, tail],
    queryFn: () => servicesApi.getServiceLogs(serviceId!, tail),
    enabled: !!serviceId,
  })
}

export function useStartService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (serviceId: string) => servicesApi.startService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useStopService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (serviceId: string) => servicesApi.stopService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}
