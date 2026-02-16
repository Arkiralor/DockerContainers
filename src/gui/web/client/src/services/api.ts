import { ContainerInfo, VolumeInfo, SystemInfo, ContainerStats } from '@shared/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

class ApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_URL}/api`
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async listContainers(all: boolean = true): Promise<ContainerInfo[]> {
    return this.request<ContainerInfo[]>(`/containers?all=${all}`)
  }

  async getContainer(id: string): Promise<any> {
    return this.request(`/containers/${id}`)
  }

  async startContainer(id: string): Promise<{ success: boolean }> {
    return this.request(`/containers/${id}/start`, { method: 'POST' })
  }

  async stopContainer(id: string): Promise<{ success: boolean }> {
    return this.request(`/containers/${id}/stop`, { method: 'POST' })
  }

  async restartContainer(id: string): Promise<{ success: boolean }> {
    return this.request(`/containers/${id}/restart`, { method: 'POST' })
  }

  async removeContainer(id: string, force: boolean = false): Promise<{ success: boolean }> {
    return this.request(`/containers/${id}?force=${force}`, { method: 'DELETE' })
  }

  async getContainerLogs(id: string, tail: number = 100): Promise<{ logs: string }> {
    return this.request(`/containers/${id}/logs?tail=${tail}`)
  }

  async getContainerStats(id: string): Promise<ContainerStats> {
    return this.request(`/containers/${id}/stats`)
  }

  async listVolumes(): Promise<VolumeInfo[]> {
    return this.request<VolumeInfo[]>('/volumes')
  }

  async getVolume(name: string): Promise<VolumeInfo> {
    return this.request(`/volumes/${name}`)
  }

  async removeVolume(name: string, force: boolean = false): Promise<{ success: boolean }> {
    return this.request(`/volumes/${name}?force=${force}`, { method: 'DELETE' })
  }

  async getSystemInfo(): Promise<SystemInfo> {
    return this.request('/system/info')
  }

  async getVersion(): Promise<any> {
    return this.request('/system/version')
  }

  async ping(): Promise<{ alive: boolean }> {
    return this.request('/system/ping')
  }
}

export const apiService = new ApiService()
