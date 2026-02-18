import Docker from 'dockerode'
import { logger } from '../utils/logger.js'

/**
 * Service for interacting with the Docker daemon via the Docker Engine API.
 *
 * This class provides methods for managing Docker containers, volumes, and retrieving
 * system information. It wraps the dockerode library and provides error handling and logging.
 *
 * The service connects to the Docker daemon via Unix socket (/var/run/docker.sock) on Unix-like
 * systems or named pipe (//./pipe/docker_engine) on Windows.
 */
class DockerService {
  private docker: Docker

  /**
   * Creates a new DockerService instance and establishes connection to Docker daemon.
   *
   * The socket path is automatically determined based on the platform:
   * - Windows: //./pipe/docker_engine
   * - Unix-like: /var/run/docker.sock
   */
  constructor() {
    this.docker = new Docker({
      socketPath: process.platform === 'win32'
        ? '//./pipe/docker_engine'
        : '/var/run/docker.sock'
    })
  }

  /**
   * Pings the Docker daemon to verify connectivity.
   *
   * @returns Promise resolving to true if Docker is reachable, false otherwise
   */
  async ping(): Promise<boolean> {
    try {
      await this.docker.ping()
      return true
    } catch (error) {
      logger.error('Docker ping failed:', error)
      return false
    }
  }

  /**
   * Lists Docker containers on the system.
   *
   * @param all - If true, includes stopped containers; if false, only running containers are returned
   * @returns Promise resolving to array of container information objects
   * @throws Error if Docker API call fails
   */
  async listContainers(all: boolean = false) {
    try {
      const containers = await this.docker.listContainers({ all })
      return containers
    } catch (error) {
      logger.error('Failed to list containers:', error)
      throw error
    }
  }

  /**
   * Retrieves detailed information about a specific container.
   *
   * @param id - Container ID or name
   * @returns Promise resolving to detailed container inspection data
   * @throws Error if container not found or Docker API call fails
   */
  async getContainer(id: string) {
    try {
      const container = this.docker.getContainer(id)
      const info = await container.inspect()
      return info
    } catch (error) {
      logger.error(`Failed to get container ${id}:`, error)
      throw error
    }
  }

  /**
   * Starts a stopped container.
   *
   * @param id - Container ID or name
   * @returns Promise resolving to success object
   * @throws Error if container not found, already running, or Docker API call fails
   */
  async startContainer(id: string) {
    try {
      const container = this.docker.getContainer(id)
      await container.start()
      logger.info(`Container ${id} started`)
      return { success: true }
    } catch (error) {
      logger.error(`Failed to start container ${id}:`, error)
      throw error
    }
  }

  /**
   * Stops a running container.
   *
   * @param id - Container ID or name
   * @returns Promise resolving to success object
   * @throws Error if container not found, already stopped, or Docker API call fails
   */
  async stopContainer(id: string) {
    try {
      const container = this.docker.getContainer(id)
      await container.stop()
      logger.info(`Container ${id} stopped`)
      return { success: true }
    } catch (error) {
      logger.error(`Failed to stop container ${id}:`, error)
      throw error
    }
  }

  /**
   * Restarts a container (stops then starts it).
   *
   * @param id - Container ID or name
   * @returns Promise resolving to success object
   * @throws Error if container not found or Docker API call fails
   */
  async restartContainer(id: string) {
    try {
      const container = this.docker.getContainer(id)
      await container.restart()
      logger.info(`Container ${id} restarted`)
      return { success: true }
    } catch (error) {
      logger.error(`Failed to restart container ${id}:`, error)
      throw error
    }
  }

  /**
   * Removes a container from the system.
   *
   * @param id - Container ID or name
   * @param force - If true, forcefully removes the container even if running
   * @returns Promise resolving to success object
   * @throws Error if container not found, running (and force=false), or Docker API call fails
   */
  async removeContainer(id: string, force: boolean = false) {
    try {
      const container = this.docker.getContainer(id)
      await container.remove({ force })
      logger.info(`Container ${id} removed`)
      return { success: true }
    } catch (error) {
      logger.error(`Failed to remove container ${id}:`, error)
      throw error
    }
  }

  /**
   * Retrieves logs from a container.
   *
   * Fetches both stdout and stderr streams with timestamps. Logs are returned as a
   * UTF-8 encoded string.
   *
   * @param id - Container ID or name
   * @param tail - Number of lines to retrieve from the end of the logs (default: 100)
   * @returns Promise resolving to log content as string
   * @throws Error if container not found or Docker API call fails
   */
  async getContainerLogs(id: string, tail: number = 100) {
    try {
      const container = this.docker.getContainer(id)
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail,
        timestamps: true
      })
      return logs.toString('utf-8')
    } catch (error) {
      logger.error(`Failed to get logs for container ${id}:`, error)
      throw error
    }
  }

  /**
   * Retrieves resource usage statistics for a container.
   *
   * Returns a snapshot of CPU, memory, network, and block I/O statistics.
   * Statistics are not streamed (one-time retrieval).
   *
   * @param id - Container ID or name
   * @returns Promise resolving to container statistics object
   * @throws Error if container not found or Docker API call fails
   */
  async getContainerStats(id: string) {
    try {
      const container = this.docker.getContainer(id)
      const stats = await container.stats({ stream: false })
      return stats
    } catch (error) {
      logger.error(`Failed to get stats for container ${id}:`, error)
      throw error
    }
  }

  /**
   * Lists all Docker volumes on the system.
   *
   * @returns Promise resolving to array of volume information objects; empty array if no volumes exist
   * @throws Error if Docker API call fails
   */
  async listVolumes() {
    try {
      const { Volumes } = await this.docker.listVolumes()
      return Volumes || []
    } catch (error) {
      logger.error('Failed to list volumes:', error)
      throw error
    }
  }

  /**
   * Retrieves detailed information about a specific volume.
   *
   * @param name - Volume name
   * @returns Promise resolving to detailed volume inspection data
   * @throws Error if volume not found or Docker API call fails
   */
  async getVolume(name: string) {
    try {
      const volume = this.docker.getVolume(name)
      const info = await volume.inspect()
      return info
    } catch (error) {
      logger.error(`Failed to get volume ${name}:`, error)
      throw error
    }
  }

  /**
   * Removes a volume from the system.
   *
   * @param name - Volume name
   * @param force - If true, forcefully removes the volume even if in use
   * @returns Promise resolving to success object
   * @throws Error if volume not found, in use (and force=false), or Docker API call fails
   */
  async removeVolume(name: string, force: boolean = false) {
    try {
      const volume = this.docker.getVolume(name)
      await volume.remove({ force })
      logger.info(`Volume ${name} removed`)
      return { success: true }
    } catch (error) {
      logger.error(`Failed to remove volume ${name}:`, error)
      throw error
    }
  }

  /**
   * Retrieves Docker system information.
   *
   * Returns information about the Docker installation including number of containers,
   * images, storage driver, operating system, architecture, etc.
   *
   * @returns Promise resolving to system information object
   * @throws Error if Docker API call fails
   */
  async getSystemInfo() {
    try {
      const info = await this.docker.info()
      return info
    } catch (error) {
      logger.error('Failed to get system info:', error)
      throw error
    }
  }

  /**
   * Retrieves Docker version information.
   *
   * Returns version information about the Docker daemon, API, and related components.
   *
   * @returns Promise resolving to version information object
   * @throws Error if Docker API call fails
   */
  async getVersion() {
    try {
      const version = await this.docker.version()
      return version
    } catch (error) {
      logger.error('Failed to get Docker version:', error)
      throw error
    }
  }
}

/**
 * Singleton instance of DockerService for use throughout the application.
 *
 * This pre-configured instance connects to the local Docker daemon and provides
 * all Docker management functionality.
 */
export const dockerService = new DockerService()
