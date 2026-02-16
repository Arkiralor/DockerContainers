import { ContainerInfo } from '@shared/types'
import { getContainerStatus } from '@shared/utils'
import { Play, Square, RotateCw, Trash2, Info } from 'lucide-react'

interface ContainerCardProps {
  container: ContainerInfo
  onStart: (id: string) => void
  onStop: (id: string) => void
  onRestart: (id: string) => void
  onRemove: (id: string) => void
  onViewDetails: (id: string) => void
  isLoading?: boolean
}

export default function ContainerCard({
  container,
  onStart,
  onStop,
  onRestart,
  onRemove,
  onViewDetails,
  isLoading = false,
}: ContainerCardProps) {
  const status = getContainerStatus(container.State, container.Status)
  const isRunning = container.State.toLowerCase() === 'running'
  const name = container.Names[0]?.replace(/^\//, '') || container.Id.substring(0, 12)

  const statusColors = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    gray: 'bg-gray-500',
    orange: 'bg-orange-500',
  }

  const ports = container.Ports.filter(p => p.PublicPort)
    .map(p => `${p.PublicPort}:${p.PrivatePort}`)
    .join(', ')

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${statusColors[status.color as keyof typeof statusColors]}`} />
            <h3 className="text-lg font-semibold text-white">{name}</h3>
          </div>
          <p className="text-sm text-gray-400">{container.Image}</p>
          <p className="text-xs text-gray-500 mt-1">ID: {container.Id.substring(0, 12)}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${isRunning ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-300'
          }`}>
          {status.label}
        </span>
      </div>

      {ports && (
        <div className="mb-3">
          <p className="text-sm text-gray-400">
            <span className="font-medium">Ports:</span> {ports}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {!isRunning && (
          <button
            onClick={() => onStart(container.Id)}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Start container"
          >
            <Play size={14} />
            Start
          </button>
        )}
        {isRunning && (
          <button
            onClick={() => onStop(container.Id)}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Stop container"
          >
            <Square size={14} />
            Stop
          </button>
        )}
        <button
          onClick={() => onRestart(container.Id)}
          disabled={isLoading || !isRunning}
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Restart container"
        >
          <RotateCw size={14} />
          Restart
        </button>
        <button
          onClick={() => onViewDetails(container.Id)}
          disabled={isLoading}
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="View details"
        >
          <Info size={14} />
          Details
        </button>
        <button
          onClick={() => onRemove(container.Id)}
          disabled={isLoading}
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-red-700 hover:bg-red-800 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-auto"
          title="Remove container"
        >
          <Trash2 size={14} />
          Remove
        </button>
      </div>
    </div>
  )
}
