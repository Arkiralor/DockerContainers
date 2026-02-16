import { useState } from 'react'
import { useContainer, useContainerLogs } from '@/hooks/useApi'
import { Modal } from './Dialog'
import { formatBytes, formatUptime } from '@shared/utils'

interface ContainerDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  containerId: string
}

export default function ContainerDetailsModal({
  isOpen,
  onClose,
  containerId,
}: ContainerDetailsModalProps) {
  const { data: container, isLoading } = useContainer(isOpen ? containerId : null)
  const { data: logsData } = useContainerLogs(isOpen ? containerId : null, 200)
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'logs'>('overview')

  if (!container && !isLoading) return null

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'config', label: 'Configuration' },
    { id: 'logs', label: 'Logs' },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Container: ${container?.Name || containerId.substring(0, 12)}`} size="xl">
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
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 font-medium transition-colors ${activeTab === tab.id
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">General Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Name" value={container.Name} />
                  <InfoItem label="ID" value={container.Id.substring(0, 12)} />
                  <InfoItem label="Image" value={container.Config.Image} />
                  <InfoItem
                    label="State"
                    value={container.State.Status}
                    className={container.State.Running ? 'text-green-400' : 'text-red-400'}
                  />
                  <InfoItem
                    label="Created"
                    value={new Date(container.Created).toLocaleString()}
                  />
                  {container.State.Running && container.State.StartedAt && (
                    <InfoItem
                      label="Uptime"
                      value={formatUptime(
                        Math.floor(
                          (Date.now() - new Date(container.State.StartedAt).getTime()) / 1000
                        )
                      )}
                    />
                  )}
                </div>
              </div>

              {container.NetworkSettings?.Ports && Object.keys(container.NetworkSettings.Ports).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Port Mappings</h3>
                  <div className="bg-gray-900 rounded p-4">
                    {Object.entries(container.NetworkSettings.Ports).map(([port, bindings]: [string, any]) => (
                      <div key={port} className="text-sm text-gray-300 mb-1">
                        <span className="font-mono">{port}</span>
                        {bindings && Array.isArray(bindings) && bindings.length > 0 && (
                          <span> → {bindings.map((b: any) => `${b.HostIp}:${b.HostPort}`).join(', ')}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {container.Mounts && container.Mounts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Volumes</h3>
                  <div className="bg-gray-900 rounded p-4">
                    {container.Mounts.map((mount: any, idx: number) => (
                      <div key={idx} className="text-sm text-gray-300 mb-2">
                        <div className="font-mono">{mount.Source}</div>
                        <div className="text-gray-500">→ {mount.Destination}</div>
                        <div className="text-gray-600 text-xs">
                          Type: {mount.Type} | Mode: {mount.Mode}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6">
              {container.Config?.Env && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Environment Variables</h3>
                  <div className="bg-gray-900 rounded p-4 max-h-96 overflow-auto">
                    {container.Config.Env.map((env: string, idx: number) => (
                      <div key={idx} className="text-sm text-gray-300 font-mono mb-1">
                        {env}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {container.HostConfig && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Resource Limits</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {container.HostConfig.Memory > 0 && (
                      <InfoItem
                        label="Memory Limit"
                        value={formatBytes(container.HostConfig.Memory)}
                      />
                    )}
                    {container.HostConfig.NanoCpus > 0 && (
                      <InfoItem
                        label="CPU Limit"
                        value={`${container.HostConfig.NanoCpus / 1e9} CPUs`}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Container Logs (Last 200 lines)</h3>
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
