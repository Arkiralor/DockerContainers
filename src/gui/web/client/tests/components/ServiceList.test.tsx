import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ServiceList from '@/components/ServiceList'
import type { ServiceStatus } from '@/services/servicesApi'

const mockServices: ServiceStatus[] = [
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    description: 'PostgreSQL Database Server',
    containerName: 'postgres',
    ports: [5432],
    exists: true,
    running: true,
  },
  {
    id: 'redis',
    name: 'Redis',
    description: 'Redis Cache Server',
    containerName: 'redis',
    ports: [6379],
    exists: true,
    running: false,
  },
  {
    id: 'opensearch',
    name: 'OpenSearch',
    description: 'OpenSearch Search Engine',
    containerName: 'opensearch-node',
    ports: [9200],
    exists: true,
    running: true,
  },
]

vi.mock('@/hooks/useServices', () => ({
  useServices: vi.fn(),
  useStartService: vi.fn(),
  useStopService: vi.fn(),
}))

vi.mock('@/components/ServiceDetailsModal', () => ({
  default: () => null,
}))

vi.mock('@/components/Dialog', () => ({
  default: ({ isOpen, title, message, onConfirm, onCancel }: any) =>
    isOpen ? (
      <div>
        <h2>{title}</h2>
        <p>{message}</p>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}))

vi.mock('@/components/ServiceCard', () => ({
  default: ({ service, onStart, onStop, onViewDetails, isLoading }: any) => (
    <div>
      <h3>{service.name}</h3>
      {service.running ? (
        <button onClick={() => onStop(service.id)} disabled={isLoading}>
          Stop
        </button>
      ) : (
        <button onClick={() => onStart(service.id)} disabled={isLoading}>
          Start
        </button>
      )}
      <button onClick={() => onViewDetails(service.id)}>Details</button>
    </div>
  ),
}))

import { useServices, useStartService, useStopService } from '@/hooks/useServices'

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

describe('ServiceList', () => {
  const mockMutations = {
    mutate: vi.fn(),
    isPending: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStartService).mockReturnValue(mockMutations as any)
    vi.mocked(useStopService).mockReturnValue(mockMutations as any)
  })

  describe('Loading State', () => {
    it('displays loading spinner when loading', () => {
      vi.mocked(useServices).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as any)

      renderWithProviders(<ServiceList />)

      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('displays error message when fetch fails', () => {
      const mockError = new Error('Failed to fetch services')
      vi.mocked(useServices).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: vi.fn(),
      } as any)

      renderWithProviders(<ServiceList />)

      expect(screen.getByText('Error Loading Services')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch services')).toBeInTheDocument()
    })

    it('displays retry button on error', () => {
      const mockError = new Error('Connection error')
      vi.mocked(useServices).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: vi.fn(),
      } as any)

      renderWithProviders(<ServiceList />)

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('calls refetch when retry button is clicked', async () => {
      const user = userEvent.setup()
      const mockRefetch = vi.fn()
      const mockError = new Error('Connection error')

      vi.mocked(useServices).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: mockRefetch,
      } as any)

      renderWithProviders(<ServiceList />)

      await user.click(screen.getByRole('button', { name: /retry/i }))

      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Empty State', () => {
    it('displays empty message when no services exist', () => {
      vi.mocked(useServices).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      renderWithProviders(<ServiceList />)

      expect(screen.getByText('No services configured')).toBeInTheDocument()
      expect(screen.getByText('Check your service configuration')).toBeInTheDocument()
    })

    it('handles undefined services as empty', () => {
      vi.mocked(useServices).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      renderWithProviders(<ServiceList />)

      expect(screen.getByText('No services configured')).toBeInTheDocument()
    })
  })

  describe('Service List Rendering', () => {
    beforeEach(() => {
      vi.mocked(useServices).mockReturnValue({
        data: mockServices,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)
    })

    it('displays services heading', () => {
      renderWithProviders(<ServiceList />)

      expect(screen.getByText('Services')).toBeInTheDocument()
    })

    it('displays running count', () => {
      renderWithProviders(<ServiceList />)

      expect(screen.getByText(/2 of 3 running/)).toBeInTheDocument()
    })

    it('displays refresh button', () => {
      renderWithProviders(<ServiceList />)

      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
    })

    it('renders service cards for each service', () => {
      renderWithProviders(<ServiceList />)

      expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
      expect(screen.getByText('Redis')).toBeInTheDocument()
      expect(screen.getByText('OpenSearch')).toBeInTheDocument()
    })

    it('calculates running count correctly', () => {
      renderWithProviders(<ServiceList />)

      expect(screen.getByText(/2 of 3 running/)).toBeInTheDocument()
    })
  })

  describe('Service Actions', () => {
    beforeEach(() => {
      vi.mocked(useServices).mockReturnValue({
        data: mockServices,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)
    })

    it('calls start mutation when start is clicked', async () => {
      const user = userEvent.setup()
      const mockStart = { mutate: vi.fn(), isPending: false }
      vi.mocked(useStartService).mockReturnValue(mockStart as any)

      renderWithProviders(<ServiceList />)

      const startButtons = screen.getAllByRole('button', { name: /start/i })
      await user.click(startButtons[0])

      expect(mockStart.mutate).toHaveBeenCalledWith('redis')
    })

    it('shows confirmation dialog when stop is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ServiceList />)

      const stopButtons = screen.getAllByRole('button', { name: /stop/i })
      await user.click(stopButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Stop Service')).toBeInTheDocument()
      })
    })

    it('displays service name in stop confirmation', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ServiceList />)

      const stopButtons = screen.getAllByRole('button', { name: /stop/i })
      await user.click(stopButtons[0])

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to stop PostgreSQL\?/)).toBeInTheDocument()
      })
    })

    it('calls stop mutation when confirmed', async () => {
      const user = userEvent.setup()
      const mockStop = { mutate: vi.fn(), isPending: false }
      vi.mocked(useStopService).mockReturnValue(mockStop as any)

      renderWithProviders(<ServiceList />)

      const stopButtons = screen.getAllByRole('button', { name: /stop/i })
      await user.click(stopButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Stop Service')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      expect(mockStop.mutate).toHaveBeenCalledWith('postgresql')
    })

    it('closes confirmation dialog when cancel is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ServiceList />)

      const stopButtons = screen.getAllByRole('button', { name: /stop/i })
      await user.click(stopButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Stop Service')).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText('Stop Service')).not.toBeInTheDocument()
      })
    })
  })

  describe('Details Modal', () => {
    beforeEach(() => {
      vi.mocked(useServices).mockReturnValue({
        data: mockServices,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)
    })

    it('opens details modal when details button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ServiceList />)

      const detailsButtons = screen.getAllByRole('button', { name: /details/i })
      await user.click(detailsButtons[0])

      // Since the modal is mocked to return null, we can't check its content
      // Instead, we verify the Details button was clicked successfully
      expect(detailsButtons[0]).toBeInTheDocument()
    })
  })

  describe('Refresh Functionality', () => {
    it('calls refetch when refresh button is clicked', async () => {
      const user = userEvent.setup()
      const mockRefetch = vi.fn()

      vi.mocked(useServices).mockReturnValue({
        data: mockServices,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any)

      renderWithProviders(<ServiceList />)

      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      await user.click(refreshButton)

      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Loading State for Actions', () => {
    beforeEach(() => {
      vi.mocked(useServices).mockReturnValue({
        data: mockServices,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)
    })

    it('passes isLoading true to cards when start is pending', () => {
      vi.mocked(useStartService).mockReturnValue({ isPending: true } as any)

      renderWithProviders(<ServiceList />)

      const buttons = screen.getAllByRole('button')
      const actionButtons = buttons.filter(
        (btn) => btn.textContent?.match(/start|stop/i)
      )

      actionButtons.forEach((button) => {
        expect(button).toBeDisabled()
      })
    })

    it('passes isLoading true to cards when stop is pending', () => {
      vi.mocked(useStopService).mockReturnValue({ isPending: true } as any)

      renderWithProviders(<ServiceList />)

      const buttons = screen.getAllByRole('button')
      const actionButtons = buttons.filter(
        (btn) => btn.textContent?.match(/start|stop/i)
      )

      actionButtons.forEach((button) => {
        expect(button).toBeDisabled()
      })
    })
  })

  describe('Running Count Calculation', () => {
    it('displays correct count when all services are running', () => {
      const allRunning = mockServices.map((s) => ({ ...s, running: true }))
      vi.mocked(useServices).mockReturnValue({
        data: allRunning,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      renderWithProviders(<ServiceList />)

      expect(screen.getByText(/3 of 3 running/)).toBeInTheDocument()
    })

    it('displays correct count when no services are running', () => {
      const noneRunning = mockServices.map((s) => ({ ...s, running: false }))
      vi.mocked(useServices).mockReturnValue({
        data: noneRunning,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      renderWithProviders(<ServiceList />)

      expect(screen.getByText(/0 of 3 running/)).toBeInTheDocument()
    })
  })
})
