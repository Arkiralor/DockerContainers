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
