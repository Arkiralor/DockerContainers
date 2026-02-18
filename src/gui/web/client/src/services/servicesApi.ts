/**
 * Service status information interface.
 *
 * Combines service configuration with real-time Docker container status.
 */
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

/**
 * Base API URL for backend requests.
 * Defaults to localhost:5001 if VITE_API_URL environment variable is not set.
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

/**
 * API service for managing configured services (PostgreSQL, Redis, OpenSearch).
 *
 * This service provides methods for:
 * - Listing all configured services with their status
 * - Getting individual service status
 * - Starting and stopping services via make commands
 * - Retrieving service container logs
 *
 * Unlike the general container API, this service works with predefined services
 * defined in the backend configuration and uses make commands for operations.
 */
class ServicesApiService {
  private baseUrl: string

  /**
   * Creates a new ServicesApiService instance.
   * Constructs the base URL pointing to the /api/services endpoint.
   */
  constructor() {
    this.baseUrl = `${API_URL}/api/services`
  }

  /**
   * Makes an HTTP request to the services API.
   *
   * Handles JSON serialization, error responses, and response parsing automatically.
   * Throws an error if the response is not OK or if JSON parsing fails.
   *
   * @param endpoint - API endpoint path (relative to /api/services)
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
   * Lists all configured services with their current status.
   *
   * Returns service configuration (name, description, ports) merged with
   * real-time Docker container status (running, exists, state).
   *
   * @returns Promise resolving to array of service status objects
   */
  async listServices(): Promise<ServiceStatus[]> {
    return this.request<ServiceStatus[]>('')
  }

  /**
   * Retrieves status for a specific service.
   *
   * Returns service configuration merged with real-time Docker container status.
   *
   * @param serviceId - Service identifier (e.g., "redis", "postgres", "opensearch")
   * @returns Promise resolving to service status object
   */
  async getService(serviceId: string): Promise<ServiceStatus> {
    return this.request<ServiceStatus>(`/${serviceId}`)
  }

  /**
   * Starts a service using its configured make command.
   *
   * Executes the service's make start command (e.g., "make start-redis") to
   * bring up the service containers. Returns command output.
   *
   * @param serviceId - Service identifier (e.g., "redis", "postgres", "opensearch")
   * @returns Promise resolving to execution result with success flag, output, and optional error
   */
  async startService(serviceId: string): Promise<{ success: boolean; output: string; error?: string }> {
    return this.request(`/${serviceId}/start`, { method: 'POST' })
  }

  /**
   * Stops a service using its configured make command.
   *
   * Executes the service's make stop command (e.g., "make stop-redis") to
   * gracefully shut down the service containers. Returns command output.
   *
   * @param serviceId - Service identifier (e.g., "redis", "postgres", "opensearch")
   * @returns Promise resolving to execution result with success flag, output, and optional error
   */
  async stopService(serviceId: string): Promise<{ success: boolean; output: string; error?: string }> {
    return this.request(`/${serviceId}/stop`, { method: 'POST' })
  }

  /**
   * Retrieves logs from a service's container.
   *
   * Fetches the most recent logs from the service's Docker container.
   *
   * @param serviceId - Service identifier (e.g., "redis", "postgres", "opensearch")
   * @param tail - Number of lines to retrieve from end of logs (default: 100)
   * @returns Promise resolving to object containing logs as string
   */
  async getServiceLogs(serviceId: string, tail: number = 100): Promise<{ logs: string }> {
    return this.request(`/${serviceId}/logs?tail=${tail}`)
  }
}

/**
 * Singleton instance of ServicesApiService for use throughout the application.
 *
 * This pre-configured instance provides access to the configured services
 * (PostgreSQL, Redis, OpenSearch) management functionality.
 */
export const servicesApi = new ServicesApiService()
