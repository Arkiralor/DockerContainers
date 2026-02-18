import { useServices } from '@/hooks/useServices'
import { formatBytes } from '@shared/utils'
import { useSystemInfo } from '@/hooks/useApi'
import { Server, HardDrive, Cpu, Activity } from 'lucide-react'

/**
 * SystemInfoServices Component
 *
 * Displays a summary dashboard showing system and service statistics.
 * Shows key metrics in a grid layout:
 * - Total number of configured services
 * - Number of running services
 * - Number of stopped services
 * - Total system memory
 * - Number of CPUs
 *
 * Data is fetched from both the services API (for service counts) and
 * Docker system info API (for hardware details). Auto-refreshes to stay current.
 *
 * Returns null during loading to prevent layout shift.
 *
 * @returns JSX element displaying system statistics grid, or null if loading
 */
export default function SystemInfoServices() {
  const { data: systemInfo, isLoading: systemLoading } = useSystemInfo()
  const { data: services, isLoading: servicesLoading } = useServices()

  const runningCount = services?.filter(s => s.running).length || 0
  const stoppedCount = (services?.length || 0) - runningCount

  if (systemLoading || servicesLoading || !systemInfo) {
    return null
  }

  const stats = [
    {
      label: 'Total Services',
      value: services?.length || 0,
      icon: Server,
      color: 'text-blue-500',
    },
    {
      label: 'Running',
      value: runningCount,
      icon: Activity,
      color: 'text-green-500',
    },
    {
      label: 'Stopped',
      value: stoppedCount,
      icon: Server,
      color: 'text-red-500',
    },
    {
      label: 'System Memory',
      value: formatBytes(systemInfo.MemTotal),
      icon: HardDrive,
      color: 'text-purple-500',
    },
    {
      label: 'CPUs',
      value: systemInfo.NCPU,
      icon: Cpu,
      color: 'text-yellow-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className={stat.color} size={20} />
            <span className="text-gray-400 text-sm">{stat.label}</span>
          </div>
          <div className="text-2xl font-bold text-white">{stat.value}</div>
        </div>
      ))}
    </div>
  )
}
