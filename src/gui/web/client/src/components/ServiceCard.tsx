import { Play, Square, Info } from 'lucide-react'
import type { ServiceStatus } from '@/services/servicesApi'

interface ServiceCardProps {
  service: ServiceStatus
  onStart: (id: string) => void
  onStop: (id: string) => void
  onViewDetails: (id: string) => void
  isLoading: boolean
}

export default function ServiceCard({
  service,
  onStart,
  onStop,
  onViewDetails,
  isLoading
}: ServiceCardProps) {
  const statusColor = service.running ? 'bg-green-500' : service.exists ? 'bg-yellow-500' : 'bg-gray-500'
  const statusText = service.running ? 'Running' : service.exists ? 'Stopped' : 'Not Created'

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-white">{service.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
              <div className={`w-2 h-2 rounded-full ${statusColor}`} />
              <span className="text-gray-300">{statusText}</span>
            </span>
          </div>
          <p className="text-gray-400 text-sm">{service.description}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Container:</span>
          <span className="text-gray-300 font-mono">{service.containerName}</span>
        </div>
        {service.ports && service.ports.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Ports:</span>
            <span className="text-gray-300 font-mono">
              {service.ports.join(', ')}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {!service.running && (
          <button
            onClick={() => onStart(service.id)}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center gap-2"
          >
            <Play size={16} />
            Start
          </button>
        )}
        {service.running && (
          <button
            onClick={() => onStop(service.id)}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center gap-2"
          >
            <Square size={16} />
            Stop
          </button>
        )}
        <button
          onClick={() => onViewDetails(service.id)}
          disabled={!service.exists}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center gap-2"
        >
          <Info size={16} />
          Details
        </button>
      </div>
    </div>
  )
}
