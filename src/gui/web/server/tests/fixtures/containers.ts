import { vi } from 'vitest'

export const mockContainerResponse = {
  Id: 'abcd1234567890',
  Names: ['/postgres'],
  Image: 'postgres:16',
  State: 'running',
  Status: 'Up 2 hours',
  Ports: [{ PrivatePort: 5432, PublicPort: 5432, Type: 'tcp', IP: '0.0.0.0' }],
  Labels: {},
  HostConfig: { NetworkMode: 'bridge' },
  NetworkSettings: {
    Networks: {
      bridge: {
        NetworkID: 'net123',
        EndpointID: 'endpoint123',
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
  Mounts: [],
}

export const mockContainerList = [
  mockContainerResponse,
  {
    ...mockContainerResponse,
    Id: 'efgh0987654321',
    Names: ['/redis'],
    Image: 'redis:7',
    State: 'exited',
    Status: 'Exited (0) 5 minutes ago',
    Ports: [],
  },
]

export const mockContainerObject = {
  id: 'abcd1234567890',
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
    precpu_stats: {
      cpu_usage: { total_usage: 4500000000 },
      system_cpu_usage: 99000000000,
    },
    memory_stats: {
      usage: 536870912,
      limit: 2147483648,
    },
  }),
}
