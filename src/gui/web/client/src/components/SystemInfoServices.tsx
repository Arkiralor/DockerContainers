import { useServices } from '@/hooks/useServices'
import { formatBytes } from '@shared/utils'
import { useSystemInfo } from '@/hooks/useApi'
import { Server, HardDrive, Cpu, Activity } from 'lucide-react'

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
