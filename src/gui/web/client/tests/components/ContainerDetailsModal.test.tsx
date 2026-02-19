import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ContainerDetailsModal from '@/components/ContainerDetailsModal'

const mockDetailedContainer = {
  Id: 'abcd1234567890',
  Name: '/postgres',
  Created: new Date('2024-01-01').toISOString(),
  State: {
    Status: 'running',
    Running: true,
    StartedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  Config: {
    Image: 'postgres:16',
    Env: [
      'POSTGRES_USER=admin',
      'POSTGRES_PASSWORD=secret',
      'POSTGRES_DB=mydb',
    ],
  },
  HostConfig: {
    Memory: 1073741824,
    NanoCpus: 1000000000,
  },
  NetworkSettings: {
    Ports: {
      '5432/tcp': [{ HostIp: '0.0.0.0', HostPort: '5432' }],
    },
  },
  Mounts: [
    {
      Type: 'volume',
      Name: 'postgres_data',
      Source: '/var/lib/docker/volumes/postgres_data/_data',
      Destination: '/var/lib/postgresql/data',
      Mode: 'rw',
    },
  ],
}

const mockLogs = {
  logs: 'PostgreSQL init process complete\\nPostgreSQL started\\nReady to accept connections',
}

vi.mock('@/hooks/useApi', () => ({
  useContainer: vi.fn(),
  useContainerLogs: vi.fn(),
}))

import { useContainer, useContainerLogs } from '@/hooks/useApi'

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

function renderWithProviders(component: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  )
}

describe('ContainerDetailsModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useContainer).mockReturnValue({
      data: mockDetailedContainer,
      isLoading: false,
    } as unknown as ReturnType<typeof useContainer>)
    vi.mocked(useContainerLogs).mockReturnValue({
      data: mockLogs,
      isLoading: false,
    } as unknown as ReturnType<typeof useContainerLogs>)
  })

  describe('Modal Visibility', () => {
    it('does not render when isOpen is false', () => {
      renderWithProviders(
        <ContainerDetailsModal
          isOpen={false}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      expect(screen.queryByText(/Container:/)).not.toBeInTheDocument()
    })

    it('renders when isOpen is true', () => {
      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      expect(screen.getByText('Container: /postgres')).toBeInTheDocument()
    })

    it('displays container ID when name is not available', () => {
      vi.mocked(useContainer).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as unknown as ReturnType<typeof useContainer>)

      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('shows loading spinner when container data is loading', () => {
      vi.mocked(useContainer).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as unknown as ReturnType<typeof useContainer>)

      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Tabs', () => {
    it('displays all tab options', () => {
      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      expect(screen.getByRole('button', { name: 'Overview' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Configuration' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Logs' })).toBeInTheDocument()
    })

    it('shows overview tab by default', () => {
      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      expect(screen.getByText('General Information')).toBeInTheDocument()
    })

    it('switches to config tab when clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      await user.click(screen.getByRole('button', { name: 'Configuration' }))

      expect(screen.getByText('Environment Variables')).toBeInTheDocument()
    })

    it('switches to logs tab when clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      await user.click(screen.getByRole('button', { name: 'Logs' }))

      expect(screen.getByText('Container Logs (Last 200 lines)')).toBeInTheDocument()
    })
  })

  describe('Overview Tab', () => {
    it('displays general information', () => {
      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('/postgres')).toBeInTheDocument()
      expect(screen.getByText('ID')).toBeInTheDocument()
      expect(screen.getByText('abcd12345678')).toBeInTheDocument()
      expect(screen.getByText('Image')).toBeInTheDocument()
      expect(screen.getByText('postgres:16')).toBeInTheDocument()
    })

    it('displays state with correct color for running container', () => {
      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      const stateElement = screen.getByText('running')
      expect(stateElement).toHaveClass('text-green-400')
    })

    it('displays state with correct color for stopped container', () => {
      const stoppedContainer = {
        ...mockDetailedContainer,
        State: { Status: 'exited', Running: false },
      }
      vi.mocked(useContainer).mockReturnValue({
        data: stoppedContainer,
        isLoading: false,
      } as unknown as ReturnType<typeof useContainer>)

      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      const stateElement = screen.getByText('exited')
      expect(stateElement).toHaveClass('text-red-400')
    })

    it('displays created date', () => {
      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      expect(screen.getByText('Created')).toBeInTheDocument()
    })

    it('displays uptime for running container', () => {
      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      expect(screen.getByText('Uptime')).toBeInTheDocument()
    })

    it('displays port mappings', () => {
      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      expect(screen.getByText('Port Mappings')).toBeInTheDocument()
      expect(screen.getByText(/5432\/tcp/)).toBeInTheDocument()
    })

    it('displays volumes', () => {
      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      expect(screen.getByText('Volumes')).toBeInTheDocument()
      expect(screen.getByText(/postgres_data/)).toBeInTheDocument()
    })
  })

  describe('Configuration Tab', () => {
    it('displays environment variables', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      await user.click(screen.getByRole('button', { name: 'Configuration' }))

      expect(screen.getByText('Environment Variables')).toBeInTheDocument()
      expect(screen.getByText('POSTGRES_USER=admin')).toBeInTheDocument()
      expect(screen.getByText('POSTGRES_PASSWORD=secret')).toBeInTheDocument()
      expect(screen.getByText('POSTGRES_DB=mydb')).toBeInTheDocument()
    })

    it('displays resource limits', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      await user.click(screen.getByRole('button', { name: 'Configuration' }))

      expect(screen.getByText('Resource Limits')).toBeInTheDocument()
      expect(screen.getByText('Memory Limit')).toBeInTheDocument()
      expect(screen.getByText('1 GB')).toBeInTheDocument()
      expect(screen.getByText('CPU Limit')).toBeInTheDocument()
      expect(screen.getByText('1 CPUs')).toBeInTheDocument()
    })

    it('does not show memory limit when set to 0', async () => {
      const user = userEvent.setup()
      const containerNoLimits = {
        ...mockDetailedContainer,
        HostConfig: { Memory: 0, NanoCpus: 0 },
      }
      vi.mocked(useContainer).mockReturnValue({
        data: containerNoLimits,
        isLoading: false,
      } as unknown as ReturnType<typeof useContainer>)

      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      await user.click(screen.getByRole('button', { name: 'Configuration' }))

      expect(screen.queryByText('Memory Limit')).not.toBeInTheDocument()
      expect(screen.queryByText('CPU Limit')).not.toBeInTheDocument()
    })
  })

  describe('Logs Tab', () => {
    it('displays container logs', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      await user.click(screen.getByRole('button', { name: 'Logs' }))

      expect(screen.getByText('Container Logs (Last 200 lines)')).toBeInTheDocument()
      expect(
        screen.getByText(
          /PostgreSQL init process complete.*PostgreSQL started.*Ready to accept connections/
        )
      ).toBeInTheDocument()
    })

    it('displays message when no logs available', async () => {
      const user = userEvent.setup()
      vi.mocked(useContainerLogs).mockReturnValue({
        data: { logs: '' },
        isLoading: false,
      } as unknown as ReturnType<typeof useContainerLogs>)

      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      await user.click(screen.getByRole('button', { name: 'Logs' }))

      expect(screen.getByText('No logs available')).toBeInTheDocument()
    })

    it('displays message when logs data is undefined', async () => {
      const user = userEvent.setup()
      vi.mocked(useContainerLogs).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as unknown as ReturnType<typeof useContainerLogs>)

      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      await user.click(screen.getByRole('button', { name: 'Logs' }))

      expect(screen.getByText('No logs available')).toBeInTheDocument()
    })
  })

  describe('Modal Close', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      const closeButton = screen.getByRole('button', { name: '' })
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Conditional Queries', () => {
    it('does not query container data when modal is closed', () => {
      renderWithProviders(
        <ContainerDetailsModal
          isOpen={false}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      expect(useContainer).toHaveBeenCalledWith(null)
      expect(useContainerLogs).toHaveBeenCalledWith(null, 200)
    })

    it('queries container data when modal is open', () => {
      renderWithProviders(
        <ContainerDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          containerId="abcd1234567890"
        />
      )

      expect(useContainer).toHaveBeenCalledWith('abcd1234567890')
      expect(useContainerLogs).toHaveBeenCalledWith('abcd1234567890', 200)
    })
  })
})
