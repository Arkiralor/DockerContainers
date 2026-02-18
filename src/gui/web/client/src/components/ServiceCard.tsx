import { Play, Square, Info } from 'lucide-react'
import type { ServiceStatus } from '@/services/servicesApi'

/**
 * Props for ServiceCard component
 */
interface ServiceCardProps {
  /** Service status information including configuration and runtime state */
  service: ServiceStatus
  /** Callback fired when start button is clicked */
  onStart: (id: string) => void
  /** Callback fired when stop button is clicked */
  onStop: (id: string) => void
  /** Callback fired when details button is clicked */
  onViewDetails: (id: string) => void
  /** Whether a service operation is in progress (disables buttons) */
  isLoading: boolean
}

/**
 * ServiceCard Component
 *
 * Displays a card showing service information and controls.
 * Shows service name, description, container name, exposed ports, and current status.
 * Provides buttons to start/stop the service and view details.
 *
 * For grouped services (like OpenSearch Stack), displays a hierarchical view
 * of all containers within the group.
 *
 * Visual states:
 * - Running: Green indicator, shows Stop button
 * - Stopped: Yellow indicator, shows Start button
 * - Not Created: Gray indicator, shows disabled Start button
 *
 * @param props - Component props
 * @returns JSX element displaying a service card
 */
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
        {service.isGrouped && service.containers ? (
          /* Grouped service - show all containers */
          <>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Type:</span>
              <span className="text-gray-300">Service Group ({service.containers.length} containers)</span>
            </div>
            <div className="ml-4 space-y-2 border-l-2 border-gray-700 pl-4">
              {service.containers.map((container) => {
                const containerStatusColor = container.running ? 'bg-green-500' : container.exists ? 'bg-yellow-500' : 'bg-gray-500'
                const containerStatusText = container.running ? 'Running' : container.exists ? 'Stopped' : 'Not Created'

                return (
                  <div key={container.containerName} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${containerStatusColor}`} />
                      <span className="text-gray-300 font-medium text-sm">{container.name}</span>
                      <span className="text-gray-500 text-xs">({containerStatusText})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs ml-3.5">
                      <span className="text-gray-500">Container:</span>
                      <span className="text-gray-400 font-mono">{container.containerName}</span>
                    </div>
                    {container.ports && container.ports.length > 0 && (
                      <div className="flex items-center gap-2 text-xs ml-3.5">
                        <span className="text-gray-500">Ports:</span>
                        <span className="text-gray-400 font-mono">
                          {container.ports.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          /* Single container service */
          <>
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
          </>
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
            Start{service.isGrouped ? ' All' : ''}
          </button>
        )}
        {service.running && (
          <button
            onClick={() => onStop(service.id)}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center gap-2"
          >
            <Square size={16} />
            Stop{service.isGrouped ? ' All' : ''}
          </button>
        )}
        <button
          onClick={() => onViewDetails(service.id)}
          disabled={!service.exists || service.isGrouped}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center gap-2"
        >
          <Info size={16} />
          Details
        </button>
      </div>
      {service.isGrouped && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          This is a grouped service. All containers are managed together.
        </p>
      )}
    </div>
  )
}
