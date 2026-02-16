import { useSystemInfo, useContainers } from '@/hooks/useApi'
import { formatBytes } from '@shared/utils'
import { isProjectContainer } from '@shared/project-config'
import { Server, HardDrive, Cpu, Activity } from 'lucide-react'

export default function SystemInfo() {
  const { data: systemInfo, isLoading: systemLoading } = useSystemInfo()
  const { data: allContainers, isLoading: containersLoading } = useContainers(true)

  const projectContainers = allContainers?.filter(container =>
    isProjectContainer(container.Names[0])
  ) || []

  const runningCount = projectContainers.filter(c => c.State.toLowerCase() === 'running').length
  const stoppedCount = projectContainers.length - runningCount

  if (systemLoading || containersLoading || !systemInfo) {
    return null
  }

  const stats = [
    {
      label: 'Project Containers',
      value: projectContainers.length,
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
