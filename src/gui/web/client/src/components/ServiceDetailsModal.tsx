import { useState } from 'react'
import { useService, useServiceLogs } from '@/hooks/useServices'
import { Modal } from './Dialog'

/**
 * Props for ServiceDetailsModal component
 */
interface ServiceDetailsModalProps {
  /** Whether the modal is visible */
  isOpen: boolean
  /** Callback fired when modal should close */
  onClose: () => void
  /** Service ID to display details for */
  serviceId: string
}

/**
 * ServiceDetailsModal Component
 *
 * Modal dialog displaying detailed information about a service.
 * Provides two tabs:
 * - Overview: Service configuration and status information
 * - Logs: Last 200 lines of container logs
 *
 * Data is fetched only when the modal is open (enabled: isOpen ? serviceId : null)
 * to avoid unnecessary API calls.
 *
 * Features:
 * - Tab navigation between overview and logs
 * - Loading state with spinner
 * - Formatted log display with monospace font
 * - Scrollable log viewer
 *
 * @param props - Component props
 * @returns JSX element displaying service details modal
 */
export default function ServiceDetailsModal({
  isOpen,
  onClose,
  serviceId,
}: ServiceDetailsModalProps) {
  const { data: service, isLoading } = useService(isOpen ? serviceId : null)
  const { data: logsData } = useServiceLogs(isOpen ? serviceId : null, 200)
  const [activeTab, setActiveTab] = useState<'overview' | 'logs'>('overview')

  if (!service && !isLoading) return null

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'logs', label: 'Logs' },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Service: ${service?.name || serviceId}`} size="xl">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      ) : (
        <>
          <div className="flex border-b border-gray-700 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'logs')}
                className={`px-4 py-2 font-medium transition-colors ${activeTab === tab.id
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && service && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Service Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="ID" value={service.id} />
                  <InfoItem label="Name" value={service.name} />
                  <InfoItem label="Container Name" value={service.containerName} />
                  <InfoItem
                    label="Status"
                    value={service.running ? 'Running' : service.exists ? 'Stopped' : 'Not Created'}
                    className={service.running ? 'text-green-400' : 'text-red-400'}
                  />
                  {service.ports && service.ports.length > 0 && (
                    <InfoItem
                      label="Ports"
                      value={service.ports.join(', ')}
                    />
                  )}
                  <InfoItem label="Description" value={service.description} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Container Logs (Last 200 lines)
              </h3>
              <div className="bg-gray-900 rounded p-4 max-h-96 overflow-auto">
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                  {logsData?.logs || 'No logs available'}
                </pre>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}

/**
 * InfoItem Component
 *
 * Displays a labeled information item in a definition list format.
 * Used within service details to show key-value pairs.
 *
 * @param props - Component props
 * @param props.label - Label for the information item
 * @param props.value - Value to display
 * @param props.className - Optional CSS class for value styling (default: gray)
 * @returns JSX element displaying labeled information
 */
function InfoItem({
  label,
  value,
  className = 'text-gray-300',
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div>
      <dt className="text-sm text-gray-500 mb-1">{label}</dt>
      <dd className={`text-sm font-medium ${className}`}>{value}</dd>
    </div>
  )
}
