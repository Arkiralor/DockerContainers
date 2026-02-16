import { useState } from 'react'
import ContainerCard from './ContainerCard'
import ContainerDetailsModal from './ContainerDetailsModal'
import ConfirmDialog from './Dialog'
import {
  useContainers,
  useStartContainer,
  useStopContainer,
  useRestartContainer,
  useRemoveContainer,
} from '@/hooks/useApi'
import { isProjectContainer } from '@shared/project-config'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ContainerList() {
  const { data: allContainers, isLoading, error, refetch } = useContainers(true)

  const containers = allContainers?.filter(container =>
    isProjectContainer(container.Names[0])
  )
  const startContainer = useStartContainer()
  const stopContainer = useStopContainer()
  const restartContainer = useRestartContainer()
  const removeContainer = useRemoveContainer()

  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null)
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
    startContainer.mutate(id)
  }

  const handleStop = (id: string) => {
    const container = containers?.find(c => c.Id === id)
    setConfirmDialog({
      isOpen: true,
      title: 'Stop Container',
      message: `Are you sure you want to stop "${container?.Names[0]?.replace(/^\//, '') || id.substring(0, 12)}"?`,
      onConfirm: () => {
        stopContainer.mutate(id)
        setConfirmDialog({ ...confirmDialog, isOpen: false })
      },
      variant: 'warning',
    })
  }

  const handleRestart = (id: string) => {
    restartContainer.mutate(id)
  }

  const handleRemove = (id: string) => {
    const container = containers?.find(c => c.Id === id)
    const isRunning = container?.State.toLowerCase() === 'running'

    setConfirmDialog({
      isOpen: true,
      title: 'Remove Container',
      message: `Are you sure you want to remove "${container?.Names[0]?.replace(/^\//, '') || id.substring(0, 12)}"?${isRunning ? '\n\nThe container is currently running and will be forcefully removed.' : ''
        }`,
      onConfirm: () => {
        removeContainer.mutate({ id, force: isRunning })
        setConfirmDialog({ ...confirmDialog, isOpen: false })
      },
      variant: 'danger',
    })
  }

  const handleViewDetails = (id: string) => {
    setSelectedContainerId(id)
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
          <h3 className="text-red-500 font-semibold mb-1">Error Loading Containers</h3>
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

  if (!containers || containers.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-12 text-center">
        <p className="text-gray-400 text-lg">No project containers found</p>
        <p className="text-gray-500 text-sm mt-2">
          Start PostgreSQL, Redis, or OpenSearch containers to see them here
        </p>
        <p className="text-gray-600 text-xs mt-4">
          Use the Makefile commands or docker compose in src/ directories
        </p>
      </div>
    )
  }

  const runningCount = containers.filter(c => c.State.toLowerCase() === 'running').length

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Containers</h2>
          <p className="text-gray-400 mt-1">
            {runningCount} of {containers.length} running
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
        {containers.map((container) => (
          <ContainerCard
            key={container.Id}
            container={container}
            onStart={handleStart}
            onStop={handleStop}
            onRestart={handleRestart}
            onRemove={handleRemove}
            onViewDetails={handleViewDetails}
            isLoading={
              startContainer.isPending ||
              stopContainer.isPending ||
              restartContainer.isPending ||
              removeContainer.isPending
            }
          />
        ))}
      </div>

      <ContainerDetailsModal
        isOpen={!!selectedContainerId}
        onClose={() => setSelectedContainerId(null)}
        containerId={selectedContainerId || ''}
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
