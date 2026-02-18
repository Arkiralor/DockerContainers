export interface ContainerInfo {
  Id: string
  Names: string[]
  Image: string
  ImageID: string
  Command: string
  Created: number
  State: string
  Status: string
  Ports: Port[]
  Labels: Record<string, string>
  SizeRw?: number
  SizeRootFs?: number
  HostConfig: {
    NetworkMode: string
  }
  NetworkSettings: {
    Networks: Record<string, NetworkInfo>
  }
  Mounts: Mount[]
}

export interface Port {
  IP?: string
  PrivatePort: number
  PublicPort?: number
  Type: string
}

export interface NetworkInfo {
  IPAMConfig?: any
  Links?: any
  Aliases?: string[]
  NetworkID: string
  EndpointID: string
  Gateway: string
  IPAddress: string
  IPPrefixLen: number
  IPv6Gateway: string
  GlobalIPv6Address: string
  GlobalIPv6PrefixLen: number
  MacAddress: string
}

export interface Mount {
  Type: string
  Name?: string
  Source: string
  Destination: string
  Driver?: string
  Mode: string
  RW: boolean
  Propagation: string
}

export interface VolumeInfo {
  CreatedAt: string
  Driver: string
  Labels: Record<string, string> | null
  Mountpoint: string
  Name: string
  Options: Record<string, string> | null
  Scope: string
}

export interface ContainerStats {
  read: string
  preread: string
  pids_stats: {
    current?: number
  }
  blkio_stats: {
    io_service_bytes_recursive: any[]
  }
  num_procs: number
  storage_stats: {}
  cpu_stats: {
    cpu_usage: {
      total_usage: number
      percpu_usage: number[]
      usage_in_kernelmode: number
      usage_in_usermode: number
    }
    system_cpu_usage: number
    online_cpus: number
    throttling_data: {
      periods: number
      throttled_periods: number
      throttled_time: number
    }
  }
  precpu_stats: {
    cpu_usage: {
      total_usage: number
      percpu_usage: number[]
      usage_in_kernelmode: number
      usage_in_usermode: number
    }
    system_cpu_usage: number
    online_cpus: number
    throttling_data: {
      periods: number
      throttled_periods: number
      throttled_time: number
    }
  }
  memory_stats: {
    usage: number
    max_usage: number
    stats: {
      active_anon: number
      active_file: number
      cache: number
      dirty: number
      hierarchical_memory_limit: number
      inactive_anon: number
      inactive_file: number
      mapped_file: number
      pgfault: number
      pgmajfault: number
      pgpgin: number
      pgpgout: number
      rss: number
      rss_huge: number
      total_active_anon: number
      total_active_file: number
      total_cache: number
      total_dirty: number
      total_inactive_anon: number
      total_inactive_file: number
      total_mapped_file: number
      total_pgfault: number
      total_pgmajfault: number
      total_pgpgin: number
      total_pgpgout: number
      total_rss: number
      total_rss_huge: number
      total_unevictable: number
      total_writeback: number
      unevictable: number
      writeback: number
    }
    limit: number
  }
  name: string
  id: string
  networks: Record<string, {
    rx_bytes: number
    rx_packets: number
    rx_errors: number
    rx_dropped: number
    tx_bytes: number
    tx_packets: number
    tx_errors: number
    tx_dropped: number
  }>
}

export interface SystemInfo {
  ID: string
  Containers: number
  ContainersRunning: number
  ContainersPaused: number
  ContainersStopped: number
  Images: number
  Driver: string
  DriverStatus: [string, string][]
  DockerRootDir: string
  SystemStatus: [string, string][] | null
  Plugins: {
    Volume: string[]
    Network: string[]
    Authorization: string[] | null
    Log: string[]
  }
  MemoryLimit: boolean
  SwapLimit: boolean
  KernelMemory: boolean
  CpuCfsPeriod: boolean
  CpuCfsQuota: boolean
  CPUShares: boolean
  CPUSet: boolean
  PidsLimit: boolean
  IPv4Forwarding: boolean
  BridgeNfIptables: boolean
  BridgeNfIp6tables: boolean
  Debug: boolean
  NFd: number
  OomKillDisable: boolean
  NGoroutines: number
  SystemTime: string
  LoggingDriver: string
  CgroupDriver: string
  NEventsListener: number
  KernelVersion: string
  OperatingSystem: string
  OSType: string
  Architecture: string
  IndexServerAddress: string
  RegistryConfig: any
  NCPU: number
  MemTotal: number
  GenericResources: any[] | null
  HttpProxy: string
  HttpsProxy: string
  NoProxy: string
  Name: string
  Labels: string[]
  ExperimentalBuild: boolean
  ServerVersion: string
  ClusterStore: string
  ClusterAdvertise: string
  Runtimes: Record<string, { path: string }>
  DefaultRuntime: string
  Swarm: any
  LiveRestoreEnabled: boolean
  Isolation: string
  InitBinary: string
  ContainerdCommit: any
  RuncCommit: any
  InitCommit: any
  SecurityOptions: string[]
}

export type ContainerState = 'created' | 'running' | 'paused' | 'restarting' | 'removing' | 'exited' | 'dead'

export interface ServiceDefinition {
  name: string
  composeFile: string
  directory: string
  containers: string[]
}

export interface PortBinding {
  HostIp: string
  HostPort: string
}

export interface ContainerDetails {
  Id: string
  Created: string
  Path: string
  Args: string[]
  State: {
    Status: string
    Running: boolean
    Paused: boolean
    Restarting: boolean
    OOMKilled: boolean
    Dead: boolean
    Pid: number
    ExitCode: number
    Error: string
    StartedAt: string
    FinishedAt: string
  }
  Image: string
  ResolvConfPath: string
  HostnamePath: string
  HostsPath: string
  LogPath: string
  Name: string
  RestartCount: number
  Driver: string
  Platform: string
  MountLabel: string
  ProcessLabel: string
  AppArmorProfile: string
  ExecIDs: string[] | null
  HostConfig: {
    Binds: string[] | null
    ContainerIDFile: string
    LogConfig: {
      Type: string
      Config: Record<string, string>
    }
    NetworkMode: string
    PortBindings: Record<string, PortBinding[] | null>
    RestartPolicy: {
      Name: string
      MaximumRetryCount: number
    }
    AutoRemove: boolean
    VolumeDriver: string
    VolumesFrom: string[] | null
    CapAdd: string[] | null
    CapDrop: string[] | null
    CgroupnsMode: string
    Dns: string[]
    DnsOptions: string[]
    DnsSearch: string[]
    ExtraHosts: string[] | null
    GroupAdd: string[] | null
    IpcMode: string
    Cgroup: string
    Links: string[] | null
    OomScoreAdj: number
    PidMode: string
    Privileged: boolean
    PublishAllPorts: boolean
    ReadonlyRootfs: boolean
    SecurityOpt: string[] | null
    UTSMode: string
    UsernsMode: string
    ShmSize: number
    Runtime: string
    ConsoleSize: [number, number]
    Isolation: string
    CpuShares: number
    Memory: number
    NanoCpus: number
    CgroupParent: string
    BlkioWeight: number
    BlkioWeightDevice: unknown[]
    BlkioDeviceReadBps: unknown[]
    BlkioDeviceWriteBps: unknown[]
    BlkioDeviceReadIOps: unknown[]
    BlkioDeviceWriteIOps: unknown[]
    CpuPeriod: number
    CpuQuota: number
    CpuRealtimePeriod: number
    CpuRealtimeRuntime: number
    CpusetCpus: string
    CpusetMems: string
    Devices: unknown[]
    DeviceCgroupRules: string[] | null
    DeviceRequests: unknown[] | null
    KernelMemory: number
    KernelMemoryTCP: number
    MemoryReservation: number
    MemorySwap: number
    MemorySwappiness: number | null
    OomKillDisable: boolean
    PidsLimit: number | null
    Ulimits: unknown[] | null
    CpuCount: number
    CpuPercent: number
    IOMaximumIOps: number
    IOMaximumBandwidth: number
    MaskedPaths: string[]
    ReadonlyPaths: string[]
  }
  GraphDriver: {
    Data: {
      LowerDir: string
      MergedDir: string
      UpperDir: string
      WorkDir: string
    }
    Name: string
  }
  Mounts: Mount[]
  Config: {
    Hostname: string
    Domainname: string
    User: string
    AttachStdin: boolean
    AttachStdout: boolean
    AttachStderr: boolean
    ExposedPorts: Record<string, Record<string, never>> | null
    Tty: boolean
    OpenStdin: boolean
    StdinOnce: boolean
    Env: string[]
    Cmd: string[] | null
    Image: string
    Volumes: Record<string, Record<string, never>> | null
    WorkingDir: string
    Entrypoint: string[] | null
    OnBuild: string[] | null
    Labels: Record<string, string>
  }
  NetworkSettings: {
    Bridge: string
    SandboxID: string
    HairpinMode: boolean
    LinkLocalIPv6Address: string
    LinkLocalIPv6PrefixLen: number
    Ports: Record<string, PortBinding[] | null>
    SandboxKey: string
    SecondaryIPAddresses: unknown[] | null
    SecondaryIPv6Addresses: unknown[] | null
    EndpointID: string
    Gateway: string
    GlobalIPv6Address: string
    GlobalIPv6PrefixLen: number
    IPAddress: string
    IPPrefixLen: number
    IPv6Gateway: string
    MacAddress: string
    Networks: Record<string, NetworkInfo>
  }
}

export interface DockerVersion {
  Platform: {
    Name: string
  }
  Components: Array<{
    Name: string
    Version: string
    Details?: Record<string, string>
  }>
  Version: string
  ApiVersion: string
  MinAPIVersion: string
  GitCommit: string
  GoVersion: string
  Os: string
  Arch: string
  KernelVersion: string
  BuildTime: string
}
