import Docker from 'dockerode'
import { logger } from '../utils/logger.js'

class DockerService {
  private docker: Docker

  constructor() {
    this.docker = new Docker({
      socketPath: process.platform === 'win32'
        ? '//./pipe/docker_engine'
        : '/var/run/docker.sock'
    })
  }

  async ping(): Promise<boolean> {
    try {
      await this.docker.ping()
      return true
    } catch (error) {
      logger.error('Docker ping failed:', error)
      return false
    }
  }

  async listContainers(all: boolean = false) {
    try {
      const containers = await this.docker.listContainers({ all })
      return containers
    } catch (error) {
      logger.error('Failed to list containers:', error)
      throw error
    }
  }

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

  async listVolumes() {
    try {
      const { Volumes } = await this.docker.listVolumes()
      return Volumes || []
    } catch (error) {
      logger.error('Failed to list volumes:', error)
      throw error
    }
  }

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

  async getSystemInfo() {
    try {
      const info = await this.docker.info()
      return info
    } catch (error) {
      logger.error('Failed to get system info:', error)
      throw error
    }
  }

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

export const dockerService = new DockerService()
