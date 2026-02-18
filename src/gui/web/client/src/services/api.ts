import { ContainerInfo, VolumeInfo, SystemInfo, ContainerStats, ContainerDetails, DockerVersion } from '@shared/types'

/**
 * Base API URL for backend requests.
 * Defaults to localhost:5001 if VITE_API_URL environment variable is not set.
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

/**
 * API service for communicating with the Docker Container Manager backend.
 *
 * This service provides methods for all backend API operations including:
 * - Container management (list, start, stop, restart, remove, logs, stats)
 * - Volume management (list, inspect, remove)
 * - System information (Docker version, info, health check)
 *
 * All methods return promises and automatically handle JSON parsing and error responses.
 */
class ApiService {
  private baseUrl: string

  /**
   * Creates a new ApiService instance.
   * Constructs the base URL by appending '/api' to the configured API_URL.
   */
  constructor() {
    this.baseUrl = `${API_URL}/api`
  }

  /**
   * Makes an HTTP request to the backend API.
   *
   * Handles JSON serialization, error responses, and response parsing automatically.
   * Throws an error if the response is not OK or if JSON parsing fails.
   *
   * @param endpoint - API endpoint path (e.g., '/containers', '/system/info')
   * @param options - Fetch options (method, headers, body, etc.)
   * @returns Promise resolving to parsed JSON response
   * @throws Error with message from server or HTTP status
   *
   * @private
   */
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

  /**
   * Lists Docker containers.
   *
   * @param all - If true, includes stopped containers; if false, only running containers
   * @returns Promise resolving to array of container information objects
   */
  async listContainers(all: boolean = true): Promise<ContainerInfo[]> {
    return this.request<ContainerInfo[]>(`/containers?all=${all}`)
  }

  /**
   * Retrieves detailed information about a specific container.
   *
   * @param id - Container ID or name
   * @returns Promise resolving to detailed container object
   */
  async getContainer(id: string): Promise<ContainerDetails> {
    return this.request(`/containers/${id}`)
  }

  /**
   * Starts a stopped container.
   *
   * @param id - Container ID or name
   * @returns Promise resolving to success object
   */
  async startContainer(id: string): Promise<{ success: boolean }> {
    return this.request(`/containers/${id}/start`, { method: 'POST' })
  }

  /**
   * Stops a running container.
   *
   * @param id - Container ID or name
   * @returns Promise resolving to success object
   */
  async stopContainer(id: string): Promise<{ success: boolean }> {
    return this.request(`/containers/${id}/stop`, { method: 'POST' })
  }

  /**
   * Restarts a container.
   *
   * @param id - Container ID or name
   * @returns Promise resolving to success object
   */
  async restartContainer(id: string): Promise<{ success: boolean }> {
    return this.request(`/containers/${id}/restart`, { method: 'POST' })
  }

  /**
   * Removes a container from the system.
   *
   * @param id - Container ID or name
   * @param force - If true, forcefully removes the container even if running
   * @returns Promise resolving to success object
   */
  async removeContainer(id: string, force: boolean = false): Promise<{ success: boolean }> {
    return this.request(`/containers/${id}?force=${force}`, { method: 'DELETE' })
  }

  /**
   * Retrieves container logs.
   *
   * @param id - Container ID or name
   * @param tail - Number of lines to retrieve from end of logs (default: 100)
   * @returns Promise resolving to object containing logs as string
   */
  async getContainerLogs(id: string, tail: number = 100): Promise<{ logs: string }> {
    return this.request(`/containers/${id}/logs?tail=${tail}`)
  }

  /**
   * Retrieves resource usage statistics for a container.
   *
   * @param id - Container ID or name
   * @returns Promise resolving to container statistics object
   */
  async getContainerStats(id: string): Promise<ContainerStats> {
    return this.request(`/containers/${id}/stats`)
  }

  /**
   * Lists all Docker volumes.
   *
   * @returns Promise resolving to array of volume information objects
   */
  async listVolumes(): Promise<VolumeInfo[]> {
    return this.request<VolumeInfo[]>('/volumes')
  }

  /**
   * Retrieves detailed information about a specific volume.
   *
   * @param name - Volume name
   * @returns Promise resolving to volume information object
   */
  async getVolume(name: string): Promise<VolumeInfo> {
    return this.request(`/volumes/${name}`)
  }

  /**
   * Removes a volume from the system.
   *
   * @param name - Volume name
   * @param force - If true, forcefully removes the volume even if in use
   * @returns Promise resolving to success object
   */
  async removeVolume(name: string, force: boolean = false): Promise<{ success: boolean }> {
    return this.request(`/volumes/${name}?force=${force}`, { method: 'DELETE' })
  }

  /**
   * Retrieves Docker system information.
   *
   * @returns Promise resolving to system information object
   */
  async getSystemInfo(): Promise<SystemInfo> {
    return this.request('/system/info')
  }

  /**
   * Retrieves Docker version information.
   *
   * @returns Promise resolving to version information object
   */
  async getVersion(): Promise<DockerVersion> {
    return this.request('/system/version')
  }

  /**
   * Health check to verify backend API connectivity.
   *
   * @returns Promise resolving to object with alive status
   */
  async ping(): Promise<{ alive: boolean }> {
    return this.request('/system/ping')
  }
}

/**
 * Singleton instance of ApiService for use throughout the application.
 *
 * This pre-configured instance connects to the backend API server and provides
 * all Docker management functionality via HTTP requests.
 */
export const apiService = new ApiService()
