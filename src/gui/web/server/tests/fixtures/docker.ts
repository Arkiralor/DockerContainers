import { vi } from 'vitest'

export const mockContainerData: Partial<any> = {
  Id: 'abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  Names: ['/postgres'],
  Image: 'postgres:16',
  ImageID: 'sha256:1234567890abcdef1234567890abcdef',
  Command: 'docker-entrypoint.sh postgres',
  Created: Math.floor(Date.now() / 1000) - 86400,
  State: 'running',
  Status: 'Up 2 hours',
  Ports: [
    {
      IP: '0.0.0.0',
      PrivatePort: 5432,
      PublicPort: 5432,
      Type: 'tcp',
    },
  ],
  Labels: {
    'com.docker.compose.project': 'dockercontainers',
    'com.docker.compose.service': 'postgres',
  },
  SizeRw: 1024,
  SizeRootFs: 2048,
  HostConfig: {
    NetworkMode: 'bridge',
  },
  NetworkSettings: {
    Networks: {
      bridge: {
        NetworkID: 'networkid123',
        EndpointID: 'endpointid123',
        Gateway: '172.17.0.1',
        IPAddress: '172.17.0.2',
        IPPrefixLen: 16,
        IPv6Gateway: '',
        GlobalIPv6Address: '',
        GlobalIPv6PrefixLen: 0,
        MacAddress: '02:42:ac:11:00:02',
      },
    },
  },
  Mounts: [
    {
      Type: 'volume',
      Name: 'postgres_data',
      Source: '/var/lib/docker/volumes/postgres_data/_data',
      Destination: '/var/lib/postgresql/data',
      Driver: 'local',
      Mode: 'rw',
      RW: true,
      Propagation: '',
    },
  ],
}

export const mockRunningContainer = {
  ...mockContainerData,
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
    precpu_stats: {
      cpu_usage: { total_usage: 4500000000 },
      system_cpu_usage: 99000000000,
      online_cpus: 4,
    },
    memory_stats: {
      usage: 536870912,
      limit: 2147483648,
    },
  }),
}

export const mockStoppedContainer = {
  ...mockContainerData,
  Id: 'efgh0987654321',
  Names: ['/redis'],
  Image: 'redis:7',
  State: 'exited',
  Status: 'Exited (0) 5 minutes ago',
  Ports: [],
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockRejectedValue(new Error('Container already stopped')),
  restart: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
}

export const mockContainerObject = mockRunningContainer

export const mockContainerResponse = mockContainerData

export function createMockContainerList() {
  return [
    mockContainerData,
    { ...mockContainerData, Id: 'container2', Names: ['/redis'], State: 'exited', Status: 'Exited (0) 1 hour ago' },
    { ...mockContainerData, Id: 'container3', Names: ['/opensearch-node'], State: 'running', Status: 'Up 3 hours' },
  ]
}

export const mockContainerList = createMockContainerList

export function createMockDockerodeClient() {
  return {
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
    listContainers: vi.fn().mockResolvedValue(createMockContainerList()),
    getContainer: vi.fn((id: string) => ({
      ...mockRunningContainer,
      id,
      inspect: vi.fn().mockResolvedValue(mockContainerData),
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
}
