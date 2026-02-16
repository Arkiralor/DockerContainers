import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '@/services/api'

export function useContainers(all: boolean = true) {
  return useQuery({
    queryKey: ['containers', all],
    queryFn: () => apiService.listContainers(all),
    refetchInterval: 5000,
  })
}

export function useContainer(id: string | null) {
  return useQuery({
    queryKey: ['container', id],
    queryFn: () => apiService.getContainer(id!),
    enabled: !!id,
  })
}

export function useContainerLogs(id: string | null, tail: number = 100) {
  return useQuery({
    queryKey: ['container-logs', id, tail],
    queryFn: () => apiService.getContainerLogs(id!, tail),
    enabled: !!id,
  })
}

export function useStartContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiService.startContainer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
    },
  })
}

export function useStopContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiService.stopContainer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
    },
  })
}

export function useRestartContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiService.restartContainer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
    },
  })
}

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

export function useVolumes() {
  return useQuery({
    queryKey: ['volumes'],
    queryFn: () => apiService.listVolumes(),
    refetchInterval: 10000,
  })
}

export function useSystemInfo() {
  return useQuery({
    queryKey: ['system-info'],
    queryFn: () => apiService.getSystemInfo(),
    refetchInterval: 30000,
  })
}
