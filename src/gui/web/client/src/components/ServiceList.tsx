import { useState } from 'react'
import ServiceCard from './ServiceCard'
import ServiceDetailsModal from './ServiceDetailsModal'
import ConfirmDialog from './Dialog'
import {
  useServices,
  useStartService,
  useStopService,
} from '@/hooks/useServices'
import { AlertCircle, RefreshCw } from 'lucide-react'

/**
 * ServiceList Component
 *
 * Displays a grid of service cards for all configured services (PostgreSQL, Redis, OpenSearch).
 * Provides functionality to:
 * - View real-time service status (running, stopped, not created)
 * - Start and stop services via make commands
 * - View detailed service information
 * - Manually refresh service status
 *
 * Features:
 * - Auto-refresh every 5 seconds via useServices hook
 * - Loading state with spinner
 * - Error handling with retry button
 * - Confirmation dialog for stop operations
 * - Running/total count display
 *
 * @returns JSX element displaying the service list or appropriate loading/error states
 */
export default function ServiceList() {
  const { data: services, isLoading, error, refetch } = useServices()
  const startService = useStartService()
  const stopService = useStopService()

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    variant: 'danger' | 'warning'
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    variant: 'warning',
  })

  const handleStart = (id: string) => {
    startService.mutate(id)
  }

  const handleStop = (id: string) => {
    const service = services?.find(s => s.id === id)
    setConfirmDialog({
      isOpen: true,
      title: 'Stop Service',
      message: `Are you sure you want to stop ${service?.name}?`,
      onConfirm: () => {
        stopService.mutate(id)
        setConfirmDialog({ ...confirmDialog, isOpen: false })
      },
      variant: 'warning',
    })
  }

  const handleViewDetails = (id: string) => {
    setSelectedServiceId(id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 flex items-start gap-3">
        <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
        <div>
          <h3 className="text-red-500 font-semibold mb-1">Error Loading Services</h3>
          <p className="text-red-300 text-sm">{(error as Error).message}</p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!services || services.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-12 text-center">
        <p className="text-gray-400 text-lg">No services configured</p>
        <p className="text-gray-500 text-sm mt-2">
          Check your service configuration
        </p>
      </div>
    )
  }

  const runningCount = services.filter(s => s.running).length

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Services</h2>
          <p className="text-gray-400 mt-1">
            {runningCount} of {services.length} running
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onStart={handleStart}
            onStop={handleStop}
            onViewDetails={handleViewDetails}
            isLoading={
              startService.isPending ||
              stopService.isPending
            }
          />
        ))}
      </div>

      <ServiceDetailsModal
        isOpen={!!selectedServiceId}
        onClose={() => setSelectedServiceId(null)}
        serviceId={selectedServiceId || ''}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        variant={confirmDialog.variant}
      />
    </>
  )
}
