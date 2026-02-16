export interface ServiceStatus {
  id: string
  name: string
  description: string
  containerName: string
  ports: number[]
  exists: boolean
  running: boolean
  status?: string
  state?: string
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

class ServicesApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_URL}/api/services`
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

  async listServices(): Promise<ServiceStatus[]> {
    return this.request<ServiceStatus[]>('')
  }

  async getService(serviceId: string): Promise<ServiceStatus> {
    return this.request<ServiceStatus>(`/${serviceId}`)
  }

  async startService(serviceId: string): Promise<{ success: boolean; output: string; error?: string }> {
    return this.request(`/${serviceId}/start`, { method: 'POST' })
  }

  async stopService(serviceId: string): Promise<{ success: boolean; output: string; error?: string }> {
    return this.request(`/${serviceId}/stop`, { method: 'POST' })
  }

  async getServiceLogs(serviceId: string, tail: number = 100): Promise<{ logs: string }> {
    return this.request(`/${serviceId}/logs?tail=${tail}`)
  }
}

export const servicesApi = new ServicesApiService()
