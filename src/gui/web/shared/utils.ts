export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

export function calculateCpuPercent(stats: any): number {
  const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage
  const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage
  const cpuCount = stats.cpu_stats.online_cpus || 1

  if (systemDelta > 0 && cpuDelta > 0) {
    return (cpuDelta / systemDelta) * cpuCount * 100
  }

  return 0
}

export function calculateMemoryPercent(stats: any): number {
  const used = stats.memory_stats.usage
  const limit = stats.memory_stats.limit

  if (limit > 0) {
    return (used / limit) * 100
  }

  return 0
}

export function getContainerStatus(state: string, status: string): {
  label: string
  color: string
} {
  const stateLower = state.toLowerCase()

  if (stateLower === 'running') {
    return { label: 'Running', color: 'green' }
  } else if (stateLower === 'exited') {
    return { label: 'Stopped', color: 'red' }
  } else if (stateLower === 'paused') {
    return { label: 'Paused', color: 'yellow' }
  } else if (stateLower === 'restarting') {
    return { label: 'Restarting', color: 'blue' }
  } else if (stateLower === 'created') {
    return { label: 'Created', color: 'gray' }
  } else if (stateLower === 'removing') {
    return { label: 'Removing', color: 'orange' }
  } else if (stateLower === 'dead') {
    return { label: 'Dead', color: 'red' }
  }

  return { label: status, color: 'gray' }
}
