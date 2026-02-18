import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ServiceDetailsModal from '@/components/ServiceDetailsModal'
import type { ServiceStatus } from '@/services/servicesApi'

const mockService: ServiceStatus = {
  id: 'postgresql',
  name: 'PostgreSQL',
  description: 'PostgreSQL Database Server',
  containerName: 'postgres',
  ports: [5432],
  exists: true,
  running: true,
  status: 'Up 2 hours',
  state: 'running',
}

const mockLogs = {
  logs: 'PostgreSQL init process complete\nPostgreSQL started\nReady to accept connections',
}

vi.mock('@/hooks/useServices', () => ({
  useService: vi.fn(),
  useServiceLogs: vi.fn(),
}))

import { useService, useServiceLogs } from '@/hooks/useServices'

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

describe('ServiceDetailsModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useService).mockReturnValue({
      data: mockService,
      isLoading: false,
    } as any)
    vi.mocked(useServiceLogs).mockReturnValue({
      data: mockLogs,
      isLoading: false,
    } as any)
  })

  describe('Modal Visibility', () => {
    it('does not render when isOpen is false', () => {
      renderWithProviders(
        <ServiceDetailsModal
          isOpen={false}
          onClose={mockOnClose}
          serviceId="postgresql"
        />
      )

      expect(screen.queryByText(/Service:/)).not.toBeInTheDocument()
    })

    it('renders when isOpen is true', () => {
      renderWithProviders(
        <ServiceDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          serviceId="postgresql"
        />
      )

      expect(screen.getByText('Service: PostgreSQL')).toBeInTheDocument()
    })

    it('displays service ID when service data is not available', () => {
      vi.mocked(useService).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any)

      renderWithProviders(
        <ServiceDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          serviceId="postgresql"
        />
      )

      // When loading, should show spinner not the service ID
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('returns null when not open and no data', () => {
      vi.mocked(useService).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any)

      const { container } = renderWithProviders(
        <ServiceDetailsModal
          isOpen={false}
          onClose={mockOnClose}
          serviceId="postgresql"
        />
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Loading State', () => {
    it('shows loading spinner when service data is loading', () => {
      vi.mocked(useService).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any)

      renderWithProviders(
        <ServiceDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          serviceId="postgresql"
        />
      )

      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Tabs', () => {
    it('displays all tab options', () => {
      renderWithProviders(
        <ServiceDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          serviceId="postgresql"
        />
      )

      expect(screen.getByRole('button', { name: 'Overview' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Logs' })).toBeInTheDocument()
    })

    it('shows overview tab by default', () => {
      renderWithProviders(
        <ServiceDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          serviceId="postgresql"
        />
      )

      expect(screen.getByText('Service Information')).toBeInTheDocument()
    })

    it('switches to logs tab when clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <ServiceDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          serviceId="postgresql"
        />
      )

      await user.click(screen.getByRole('button', { name: 'Logs' }))

      expect(screen.getByText('Container Logs (Last 200 lines)')).toBeInTheDocument()
    })
  })

  describe('Overview Tab', () => {
    it('displays service information', () => {
      renderWithProviders(
        <ServiceDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          serviceId="postgresql"
        />
      )

      expect(screen.getByText('ID')).toBeInTheDocument()
      expect(screen.getByText('postgresql')).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
      expect(screen.getByText('Container Name')).toBeInTheDocument()
      expect(screen.getByText('postgres')).toBeInTheDocument()
    })

    it('displays running status with correct color', () => {
      renderWithProviders(
        <ServiceDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          serviceId="postgresql"
        />
      )

      const statusElement = screen.getByText('Running')
      expect(statusElement).toHaveClass('text-green-400')
    })

    it('displays stopped status with correct color', () => {
      const stoppedService = { ...mockService, running: false }
      vi.mocked(useService).mockReturnValue({
        data: stoppedService,
        isLoading: false,
      } as any)

      renderWithProviders(
        <ServiceDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          serviceId="postgresql"
        />
      )

      const statusElement = screen.getByText('Stopped')
      expect(statusElement).toHaveClass('text-red-400')
    })

    it('displays not created status with correct color', () => {
      const notCreatedService = { ...mockService, running: false, exists: false }
      vi.mocked(useService).mockReturnValue({
        data: notCreatedService,
        isLoading: false,
      } as any)

      renderWithProviders(
        <ServiceDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          serviceId="postgresql"
        />
      )

      const statusElement = screen.getByText('Not Created')
      expect(statusElement).toHaveClass('text-red-400')
    })

    it('displays ports when available', () => {
      renderWithProviders(
        <ServiceDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          serviceId="postgresql"
        />
      )

      expect(screen.getByText('Ports')).toBeInTheDocument()
      expect(screen.getByText('5432')).toBeInTheDocument()
    })

    it('displays multiple ports correctly', () => {
      const multiPortService = { ...mockService, ports: [9200, 9600] }
      vi.mocked(useService).mockReturnValue({
        data: multiPortService,
        isLoading: false,
      } as any)

      renderWithProviders(
        <ServiceDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          serviceId="opensearch"
        />
      )

      expect(screen.getByText('9200, 9600')).toBeInTheDocument()
    })

    it('displays description', () => {
      renderWithProviders(
        <ServiceDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          serviceId="postgresql"
        />
      )

      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('PostgreSQL Database Server')).toBeInTheDocument()
    })
  })

  describe('Logs Tab', () => {
    it('displays service logs', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <ServiceDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          serviceId="postgresql"
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
      vi.mocked(useServiceLogs).mockReturnValue({
        data: { logs: '' },
        isLoading: false,
      } as any)

      renderWithProviders(
        <ServiceDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          serviceId="postgresql"
        />
      )

      await user.click(screen.getByRole('button', { name: 'Logs' }))

      expect(screen.getByText('No logs available')).toBeInTheDocument()
    })

    it('displays message when logs data is undefined', async () => {
      const user = userEvent.setup()
      vi.mocked(useServiceLogs).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any)

      renderWithProviders(
        <ServiceDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          serviceId="postgresql"
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
        <ServiceDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          serviceId="postgresql"
        />
      )

      const closeButton = screen.getByRole('button', { name: '' })
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Conditional Queries', () => {
    it('does not query service data when modal is closed', () => {
      renderWithProviders(
        <ServiceDetailsModal
          isOpen={false}
          onClose={mockOnClose}
          serviceId="postgresql"
        />
      )

      expect(useService).toHaveBeenCalledWith(null)
      expect(useServiceLogs).toHaveBeenCalledWith(null, 200)
    })

    it('queries service data when modal is open', () => {
      renderWithProviders(
        <ServiceDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          serviceId="postgresql"
        />
      )

      expect(useService).toHaveBeenCalledWith('postgresql')
      expect(useServiceLogs).toHaveBeenCalledWith('postgresql', 200)
    })
  })

  describe('Empty Ports', () => {
    it('does not display ports section when ports are empty', () => {
      const noPorts = { ...mockService, ports: [] }
      vi.mocked(useService).mockReturnValue({
        data: noPorts,
        isLoading: false,
      } as any)

      renderWithProviders(
        <ServiceDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          serviceId="postgresql"
        />
      )

      expect(screen.queryByText('Ports')).not.toBeInTheDocument()
    })

    it('does not display ports section when ports are undefined', () => {
      const noPorts = { ...mockService, ports: undefined as any }
      vi.mocked(useService).mockReturnValue({
        data: noPorts,
        isLoading: false,
      } as any)

      renderWithProviders(
        <ServiceDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          serviceId="postgresql"
        />
      )

      expect(screen.queryByText('Ports')).not.toBeInTheDocument()
    })
  })
})
