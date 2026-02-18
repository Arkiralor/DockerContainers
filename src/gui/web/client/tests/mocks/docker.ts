import type { ContainerInfo, VolumeInfo, SystemInfo, ContainerStats } from '@shared/types'

// Detailed container response (from inspect/getContainer endpoint)
export const mockContainerDetailedRunning: any = {
  Id: 'abcd1234567890abcdef',
  Name: '/postgres',
  Image: 'sha256:1234567890abcdef',
  Created: new Date(Date.now() - 86400000).toISOString(),
  State: {
    Status: 'running',
    Running: true,
    Paused: false,
    Restarting: false,
    OOMKilled: false,
    Dead: false,
    Pid: 1234,
    ExitCode: 0,
    Error: '',
    StartedAt: new Date(Date.now() - 7200000).toISOString(),
    FinishedAt: '0001-01-01T00:00:00Z',
  },
  Config: {
    Image: 'postgres:16',
    Cmd: ['postgres'],
    Env: [
      'POSTGRES_PASSWORD=postgres',
      'POSTGRES_USER=postgres',
      'POSTGRES_DB=elay-local',
      'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    ],
    ExposedPorts: {
      '5432/tcp': {},
    },
  },
  HostConfig: {
    NetworkMode: 'bridge',
    PortBindings: {
      '5432/tcp': [{ HostIp: '0.0.0.0', HostPort: '5432' }],
    },
    Binds: ['postgres_data:/var/lib/postgresql/data'],
    Memory: 1073741824,
    NanoCpus: 1000000000,
  },
  NetworkSettings: {
    Networks: {
      bridge: {
        NetworkID: 'network123',
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
    Ports: {
      '5432/tcp': [{ HostIp: '0.0.0.0', HostPort: '5432' }],
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

export const mockContainerDetailedStopped: any = {
  ...mockContainerDetailedRunning,
  Id: 'efgh0987654321abcdef',
  Name: '/redis',
  State: {
    ...mockContainerDetailedRunning.State,
    Status: 'exited',
    Running: false,
    ExitCode: 0,
    FinishedAt: new Date(Date.now() - 300000).toISOString(),
  },
  Config: {
    ...mockContainerDetailedRunning.Config,
    Image: 'redis:7',
  },
}

// List container responses (from listContainers endpoint)
export const mockContainerRunning: ContainerInfo = {
  Id: 'abcd1234567890',
  Names: ['/postgres'],
  Image: 'postgres:16',
  ImageID: 'sha256:1234567890abcdef',
  Command: 'docker-entrypoint.sh postgres',
  Created: Date.now() / 1000 - 86400,
  State: 'running',
  Status: 'Up 2 hours',
  Ports: [
    {
      PrivatePort: 5432,
      PublicPort: 5432,
      Type: 'tcp',
      IP: '0.0.0.0',
    },
  ],
  Labels: {},
  HostConfig: {
    NetworkMode: 'bridge',
  },
  NetworkSettings: {
    Networks: {
      bridge: {
        NetworkID: 'network123',
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
  Mounts: [
    {
      Type: 'volume',
      Name: 'postgres_data',
      Source: '/var/lib/docker/volumes/postgres_data/_data',
      Destination: '/var/lib/postgresql/data',
      Mode: 'rw',
      RW: true,
      Propagation: '',
    },
  ],
}

export const mockContainerStopped: ContainerInfo = {
  ...mockContainerRunning,
  Id: 'efgh0987654321',
  Names: ['/redis'],
  Image: 'redis:7',
  State: 'exited',
  Status: 'Exited (0) 5 minutes ago',
  Ports: [],
}

export const mockContainers: ContainerInfo[] = [
  mockContainerRunning,
  mockContainerStopped,
  {
    ...mockContainerRunning,
    Id: 'ijkl1122334455',
    Names: ['/opensearch-node'],
    Image: 'opensearchproject/opensearch:2.11.0',
    State: 'running',
    Status: 'Up 1 hour',
    Ports: [
      { PrivatePort: 9200, PublicPort: 9200, Type: 'tcp', IP: '0.0.0.0' },
      { PrivatePort: 9600, PublicPort: 9600, Type: 'tcp', IP: '0.0.0.0' },
    ],
  },
]

export const mockVolume: VolumeInfo = {
  CreatedAt: new Date().toISOString(),
  Driver: 'local',
  Labels: null,
  Mountpoint: '/var/lib/docker/volumes/postgres_data/_data',
  Name: 'postgres_data',
  Options: null,
  Scope: 'local',
}

export const mockVolumes: VolumeInfo[] = [
  mockVolume,
  {
    ...mockVolume,
    Name: 'redis_data',
    Mountpoint: '/var/lib/docker/volumes/redis_data/_data',
  },
]

export const mockSystemInfo: SystemInfo = {
  ID: 'DOCKER:1234',
  Containers: 10,
  ContainersRunning: 7,
  ContainersPaused: 0,
  ContainersStopped: 3,
  Images: 25,
  Driver: 'overlay2',
  DriverStatus: [['Backing Filesystem', 'ext4']],
  DockerRootDir: '/var/lib/docker',
  SystemStatus: null,
  Plugins: {
    Volume: ['local'],
    Network: ['bridge', 'host', 'null', 'overlay'],
    Authorization: null,
    Log: ['json-file', 'syslog'],
  },
  MemoryLimit: true,
  SwapLimit: true,
  KernelMemory: true,
  CpuCfsPeriod: true,
  CpuCfsQuota: true,
  CPUShares: true,
  CPUSet: true,
  PidsLimit: true,
  IPv4Forwarding: true,
  BridgeNfIptables: true,
  BridgeNfIp6tables: true,
  Debug: false,
  NFd: 123,
  OomKillDisable: true,
  NGoroutines: 250,
  SystemTime: new Date().toISOString(),
  LoggingDriver: 'json-file',
  CgroupDriver: 'cgroupfs',
  NEventsListener: 5,
  KernelVersion: '5.15.0',
  OperatingSystem: 'Ubuntu 22.04',
  OSType: 'linux',
  Architecture: 'x86_64',
  IndexServerAddress: 'https://index.docker.io/v1/',
  RegistryConfig: {},
  NCPU: 8,
  MemTotal: 16777216000,
  GenericResources: null,
  HttpProxy: '',
  HttpsProxy: '',
  NoProxy: '',
  Name: 'docker-host',
  Labels: [],
  ExperimentalBuild: false,
  ServerVersion: '24.0.0',
  ClusterStore: '',
  ClusterAdvertise: '',
  Runtimes: {
    runc: { path: 'runc' },
  },
  DefaultRuntime: 'runc',
  Swarm: {},
  LiveRestoreEnabled: false,
  Isolation: '',
  InitBinary: 'docker-init',
  ContainerdCommit: {},
  RuncCommit: {},
  InitCommit: {},
  SecurityOptions: ['apparmor', 'seccomp'],
}

export const mockContainerStats: ContainerStats = {
  read: new Date().toISOString(),
  preread: new Date(Date.now() - 1000).toISOString(),
  pids_stats: {
    current: 10,
  },
  blkio_stats: {
    io_service_bytes_recursive: [],
  },
  num_procs: 0,
  storage_stats: {},
  cpu_stats: {
    cpu_usage: {
      total_usage: 5000000000,
      percpu_usage: [1250000000, 1250000000, 1250000000, 1250000000],
      usage_in_kernelmode: 1000000000,
      usage_in_usermode: 4000000000,
    },
    system_cpu_usage: 100000000000,
    online_cpus: 4,
    throttling_data: {
      periods: 0,
      throttled_periods: 0,
      throttled_time: 0,
    },
  },
  precpu_stats: {
    cpu_usage: {
      total_usage: 4500000000,
      percpu_usage: [1125000000, 1125000000, 1125000000, 1125000000],
      usage_in_kernelmode: 900000000,
      usage_in_usermode: 3600000000,
    },
    system_cpu_usage: 99000000000,
    online_cpus: 4,
    throttling_data: {
      periods: 0,
      throttled_periods: 0,
      throttled_time: 0,
    },
  },
  memory_stats: {
    usage: 536870912,
    max_usage: 1073741824,
    stats: {
      active_anon: 268435456,
      active_file: 134217728,
      cache: 268435456,
      dirty: 0,
      hierarchical_memory_limit: 9223372036854771712,
      inactive_anon: 0,
      inactive_file: 134217728,
      mapped_file: 67108864,
      pgfault: 1000000,
      pgmajfault: 1000,
      pgpgin: 500000,
      pgpgout: 400000,
      rss: 268435456,
      rss_huge: 0,
      total_active_anon: 268435456,
      total_active_file: 134217728,
      total_cache: 268435456,
      total_dirty: 0,
      total_inactive_anon: 0,
      total_inactive_file: 134217728,
      total_mapped_file: 67108864,
      total_pgfault: 1000000,
      total_pgmajfault: 1000,
      total_pgpgin: 500000,
      total_pgpgout: 400000,
      total_rss: 268435456,
      total_rss_huge: 0,
      total_unevictable: 0,
      total_writeback: 0,
      unevictable: 0,
      writeback: 0,
    },
    limit: 2147483648,
  },
  name: '/postgres',
  id: 'abcd1234567890',
  networks: {
    eth0: {
      rx_bytes: 1048576,
      rx_packets: 1000,
      rx_errors: 0,
      rx_dropped: 0,
      tx_bytes: 524288,
      tx_packets: 500,
      tx_errors: 0,
      tx_dropped: 0,
    },
  },
}

export interface ServiceStatus {
  id: string
  name: string
  description: string
  status: 'running' | 'stopped' | 'unknown'
  containerName: string
  ports: number[]
}

export const mockServiceRunning: ServiceStatus = {
  id: 'postgresql',
  name: 'PostgreSQL',
  description: 'PostgreSQL Database Server',
  status: 'running',
  containerName: 'postgres',
  ports: [5432],
}

export const mockServiceStopped: ServiceStatus = {
  id: 'redis',
  name: 'Redis',
  description: 'Redis Cache Server',
  status: 'stopped',
  containerName: 'redis',
  ports: [6379],
}

export const mockServices: ServiceStatus[] = [
  mockServiceRunning,
  mockServiceStopped,
  {
    id: 'opensearch',
    name: 'OpenSearch',
    description: 'OpenSearch Search Engine',
    status: 'running',
    containerName: 'opensearch-node',
    ports: [9200, 9600],
  },
  {
    id: 'dashboards',
    name: 'OpenSearch Dashboards',
    description: 'OpenSearch Dashboards UI',
    status: 'running',
    containerName: 'opensearch-dashboards',
    ports: [5601],
  },
]
