import { describe, it, expect, vi, beforeEach } from 'vitest'
import Docker from 'dockerode'
import { dockerService } from '@/services/docker'
import { mockContainerList, mockContainerResponse, mockContainerObject } from '../fixtures/docker'

vi.mock('dockerode')
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('DockerService', () => {
  let mockDocker: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create a fresh mock for each test
    mockDocker = {
      ping: vi.fn().mockResolvedValue(true),
      version: vi.fn().mockResolvedValue({ Version: '24.0.0', ApiVersion: '1.43' }),
      info: vi.fn().mockResolvedValue({
        ID: 'DOCKER:1234',
        Containers: 10,
        ContainersRunning: 7,
        ContainersPaused: 0,
        ContainersStopped: 3,
        Images: 25,
        Driver: 'overlay2',
        NCPU: 8,
        MemTotal: 16777216000,
        ServerVersion: '24.0.0',
      }),
      listContainers: vi.fn().mockResolvedValue(mockContainerList()),
      getContainer: vi.fn((id: string) => ({
        ...mockContainerObject,
        id,
        inspect: vi.fn().mockResolvedValue(mockContainerResponse),
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
        restart: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
        logs: vi.fn().mockResolvedValue(Buffer.from('Log line 1\nLog line 2\n')),
        stats: vi.fn().mockResolvedValue({
          read: new Date().toISOString(),
          cpu_stats: {
            cpu_usage: { total_usage: 5000000000 },
            system_cpu_usage: 100000000000,
            online_cpus: 4,
          },
          memory_stats: {
            usage: 536870912,
            limit: 2147483648,
          },
        }),
      })),
      listVolumes: vi.fn().mockResolvedValue({
        Volumes: [
          {
            CreatedAt: new Date().toISOString(),
            Driver: 'local',
            Labels: null,
            Mountpoint: '/var/lib/docker/volumes/postgres_data/_data',
            Name: 'postgres_data',
            Options: null,
            Scope: 'local',
          },
        ],
        Warnings: null,
      }),
      getVolume: vi.fn((name: string) => ({
        name,
        inspect: vi.fn().mockResolvedValue({
          Name: name,
          Driver: 'local',
          Mountpoint: `/var/lib/docker/volumes/${name}/_data`,
        }),
        remove: vi.fn().mockResolvedValue(undefined),
      })),
    }

    // Mock the Docker constructor to return our mock
    vi.mocked(Docker).mockImplementation(() => mockDocker)

      // Reset the dockerService instance by accessing its private docker property
      // This is a workaround since dockerService is a singleton
      ; (dockerService as any).docker = mockDocker
  })

  describe('ping', () => {
    it('should return true when Docker is running', async () => {
      const result = await dockerService.ping()

      expect(result).toBe(true)
      expect(mockDocker.ping).toHaveBeenCalledOnce()
    })

    it('should return false when Docker ping fails', async () => {
      mockDocker.ping.mockRejectedValue(new Error('Connection refused'))

      const result = await dockerService.ping()

      expect(result).toBe(false)
    })
  })

  describe('listContainers', () => {
    it('should list running containers by default', async () => {
      const result = await dockerService.listContainers()

      expect(result).toEqual(mockContainerList())
      expect(mockDocker.listContainers).toHaveBeenCalledWith({ all: false })
    })

    it('should list all containers when all=true', async () => {
      const result = await dockerService.listContainers(true)

      expect(result).toEqual(mockContainerList())
      expect(mockDocker.listContainers).toHaveBeenCalledWith({ all: true })
    })

    it('should throw error on failure', async () => {
      mockDocker.listContainers.mockRejectedValue(new Error('Failed to list containers'))

      await expect(dockerService.listContainers()).rejects.toThrow('Failed to list containers')
    })
  })

  describe('getContainer', () => {
    it('should get container details', async () => {
      const result = await dockerService.getContainer('abcd1234567890')

      expect(result).toEqual(mockContainerResponse)
      expect(mockDocker.getContainer).toHaveBeenCalledWith('abcd1234567890')
    })

    it('should throw error when container not found', async () => {
      const mockContainerWithError = {
        inspect: vi.fn().mockRejectedValue(new Error('No such container'))
      }
      mockDocker.getContainer.mockReturnValueOnce(mockContainerWithError)

      await expect(dockerService.getContainer('invalid-id')).rejects.toThrow('No such container')
    })
  })

  describe('startContainer', () => {
    it('should start a container successfully', async () => {
      const result = await dockerService.startContainer('abcd1234567890')

      expect(result).toEqual({ success: true })
      expect(mockDocker.getContainer).toHaveBeenCalledWith('abcd1234567890')
    })

    it('should throw error on failure', async () => {
      const mockContainerWithError = {
        start: vi.fn().mockRejectedValue(new Error('Container already started'))
      }
      mockDocker.getContainer.mockReturnValueOnce(mockContainerWithError)

      await expect(dockerService.startContainer('abcd1234567890')).rejects.toThrow('Container already started')
    })
  })

  describe('stopContainer', () => {
    it('should stop a container successfully', async () => {
      const result = await dockerService.stopContainer('abcd1234567890')

      expect(result).toEqual({ success: true })
      expect(mockDocker.getContainer).toHaveBeenCalledWith('abcd1234567890')
    })

    it('should throw error on failure', async () => {
      const mockContainerWithError = {
        stop: vi.fn().mockRejectedValue(new Error('Container not running'))
      }
      mockDocker.getContainer.mockReturnValueOnce(mockContainerWithError)

      await expect(dockerService.stopContainer('abcd1234567890')).rejects.toThrow('Container not running')
    })
  })

  describe('restartContainer', () => {
    it('should restart a container successfully', async () => {
      const result = await dockerService.restartContainer('abcd1234567890')

      expect(result).toEqual({ success: true })
      expect(mockDocker.getContainer).toHaveBeenCalledWith('abcd1234567890')
    })

    it('should throw error on failure', async () => {
      const mockContainerWithError = {
        restart: vi.fn().mockRejectedValue(new Error('Failed to restart'))
      }
      mockDocker.getContainer.mockReturnValueOnce(mockContainerWithError)

      await expect(dockerService.restartContainer('abcd1234567890')).rejects.toThrow('Failed to restart')
    })
  })

  describe('removeContainer', () => {
    it('should remove a container without force', async () => {
      const result = await dockerService.removeContainer('abcd1234567890', false)

      expect(result).toEqual({ success: true })
      expect(mockDocker.getContainer).toHaveBeenCalledWith('abcd1234567890')
    })

    it('should remove a container with force', async () => {
      const result = await dockerService.removeContainer('abcd1234567890', true)

      expect(result).toEqual({ success: true })
      expect(mockDocker.getContainer).toHaveBeenCalledWith('abcd1234567890')
    })

    it('should throw error when container cannot be removed', async () => {
      const mockContainerWithError = {
        remove: vi.fn().mockRejectedValue(new Error('Container is running'))
      }
      mockDocker.getContainer.mockReturnValueOnce(mockContainerWithError)

      await expect(dockerService.removeContainer('abcd1234567890')).rejects.toThrow('Container is running')
    })
  })

  describe('getContainerLogs', () => {
    it('should get container logs with default tail', async () => {
      const result = await dockerService.getContainerLogs('abcd1234567890')

      expect(result).toBe('Log line 1\nLog line 2\n')
      expect(mockDocker.getContainer).toHaveBeenCalledWith('abcd1234567890')
    })

    it('should get container logs with custom tail', async () => {
      const result = await dockerService.getContainerLogs('abcd1234567890', 50)

      expect(result).toBe('Log line 1\nLog line 2\n')
    })

    it('should throw error on failure', async () => {
      const mockContainerWithError = {
        logs: vi.fn().mockRejectedValue(new Error('Failed to get logs'))
      }
      mockDocker.getContainer.mockReturnValueOnce(mockContainerWithError)

      await expect(dockerService.getContainerLogs('abcd1234567890')).rejects.toThrow('Failed to get logs')
    })
  })

  describe('getContainerStats', () => {
    it('should get container stats', async () => {
      const result = await dockerService.getContainerStats('abcd1234567890')

      expect(result).toHaveProperty('cpu_stats')
      expect(result).toHaveProperty('memory_stats')
      expect(mockDocker.getContainer).toHaveBeenCalledWith('abcd1234567890')
    })

    it('should throw error on failure', async () => {
      const mockContainerWithError = {
        stats: vi.fn().mockRejectedValue(new Error('Failed to get stats'))
      }
      mockDocker.getContainer.mockReturnValueOnce(mockContainerWithError)

      await expect(dockerService.getContainerStats('abcd1234567890')).rejects.toThrow('Failed to get stats')
    })
  })

  describe('listVolumes', () => {
    it('should list all volumes', async () => {
      const result = await dockerService.listVolumes()

      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('Name', 'postgres_data')
      expect(mockDocker.listVolumes).toHaveBeenCalledOnce()
    })

    it('should return empty array when no volumes exist', async () => {
      mockDocker.listVolumes.mockResolvedValue({ Volumes: null, Warnings: null })

      const result = await dockerService.listVolumes()

      expect(result).toEqual([])
    })

    it('should throw error on failure', async () => {
      mockDocker.listVolumes.mockRejectedValue(new Error('Failed to list volumes'))

      await expect(dockerService.listVolumes()).rejects.toThrow()
    })
  })

  describe('getVolume', () => {
    it('should get volume details', async () => {
      const result = await dockerService.getVolume('postgres_data')

      expect(result).toHaveProperty('Name', 'postgres_data')
      expect(mockDocker.getVolume).toHaveBeenCalledWith('postgres_data')
    })

    it('should throw error when volume not found', async () => {
      const mockVolumeWithError = {
        inspect: vi.fn().mockRejectedValue(new Error('No such volume'))
      }
      mockDocker.getVolume.mockReturnValueOnce(mockVolumeWithError)

      await expect(dockerService.getVolume('invalid-volume')).rejects.toThrow('No such volume')
    })
  })

  describe('removeVolume', () => {
    it('should remove a volume without force', async () => {
      const result = await dockerService.removeVolume('postgres_data', false)

      expect(result).toEqual({ success: true })
      expect(mockDocker.getVolume).toHaveBeenCalledWith('postgres_data')
    })

    it('should remove a volume with force', async () => {
      const result = await dockerService.removeVolume('postgres_data', true)

      expect(result).toEqual({ success: true })
    })

    it('should throw error when volume is in use', async () => {
      const mockVolumeWithError = {
        remove: vi.fn().mockRejectedValue(new Error('Volume is in use'))
      }
      mockDocker.getVolume.mockReturnValueOnce(mockVolumeWithError)

      await expect(dockerService.removeVolume('postgres_data')).rejects.toThrow('Volume is in use')
    })
  })

  describe('getSystemInfo', () => {
    it('should get Docker system information', async () => {
      const result = await dockerService.getSystemInfo()

      expect(result).toHaveProperty('Containers', 10)
      expect(result).toHaveProperty('ContainersRunning', 7)
      expect(mockDocker.info).toHaveBeenCalledOnce()
    })

    it('should throw error on failure', async () => {
      mockDocker.info.mockRejectedValue(new Error('Failed to get system info'))

      await expect(dockerService.getSystemInfo()).rejects.toThrow()
    })
  })

  describe('getVersion', () => {
    it('should get Docker version information', async () => {
      const result = await dockerService.getVersion()

      expect(result).toHaveProperty('Version', '24.0.0')
      expect(result).toHaveProperty('ApiVersion', '1.43')
      expect(mockDocker.version).toHaveBeenCalledOnce()
    })

    it('should throw error on failure', async () => {
      mockDocker.version.mockRejectedValue(new Error('Failed to get version'))

      await expect(dockerService.getVersion()).rejects.toThrow()
    })
  })
})
