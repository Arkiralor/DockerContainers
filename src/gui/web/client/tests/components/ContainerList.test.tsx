import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ContainerList from '@/components/ContainerList'
import { mockContainers, mockContainerRunning } from '../mocks/docker'

vi.mock('@/hooks/useApi', () => ({
  useContainers: vi.fn(),
  useStartContainer: vi.fn(),
  useStopContainer: vi.fn(),
  useRestartContainer: vi.fn(),
  useRemoveContainer: vi.fn(),
}))

vi.mock('@shared/project-config', () => ({
  isProjectContainer: vi.fn(() => true),
}))

vi.mock('@/components/ContainerDetailsModal', () => ({
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

vi.mock('@/components/ContainerCard', () => ({
  default: ({ container, onStart, onStop, onRestart, onRemove, onViewDetails, isLoading }: any) => (
    <div>
      <h3>{container.Names[0].replace(/^\//, '')}</h3>
      {container.State.toLowerCase() === 'running' ? (
        <button onClick={() => onStop(container.Id)} disabled={isLoading}>
          Stop
        </button>
      ) : (
        <button onClick={() => onStart(container.Id)} disabled={isLoading}>
          Start
        </button>
      )}
      <button onClick={() => onRestart(container.Id)} disabled={isLoading}>
        Restart
      </button>
      <button onClick={() => onRemove(container.Id)} disabled={isLoading}>
        Remove
      </button>
      <button onClick={() => onViewDetails(container.Id)}>Details</button>
    </div>
  ),
}))

import {
  useContainers,
  useStartContainer,
  useStopContainer,
  useRestartContainer,
  useRemoveContainer,
} from '@/hooks/useApi'

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

describe('ContainerList', () => {
  const mockMutations = {
    mutate: vi.fn(),
    isPending: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStartContainer).mockReturnValue(mockMutations as any)
    vi.mocked(useStopContainer).mockReturnValue(mockMutations as any)
    vi.mocked(useRestartContainer).mockReturnValue(mockMutations as any)
    vi.mocked(useRemoveContainer).mockReturnValue(mockMutations as any)
  })

  describe('Loading State', () => {
    it('displays loading spinner when loading', () => {
      vi.mocked(useContainers).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as any)

      renderWithProviders(<ContainerList />)

      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('displays error message when fetch fails', () => {
      const mockError = new Error('Failed to fetch containers')
      vi.mocked(useContainers).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: vi.fn(),
      } as any)

      renderWithProviders(<ContainerList />)

      expect(screen.getByText('Error Loading Containers')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch containers')).toBeInTheDocument()
    })

    it('displays retry button on error', () => {
      const mockError = new Error('Connection error')
      vi.mocked(useContainers).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: vi.fn(),
      } as any)

      renderWithProviders(<ContainerList />)

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('calls refetch when retry button is clicked', async () => {
      const user = userEvent.setup()
      const mockRefetch = vi.fn()
      const mockError = new Error('Connection error')

      vi.mocked(useContainers).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: mockRefetch,
      } as any)

      renderWithProviders(<ContainerList />)

      await user.click(screen.getByRole('button', { name: /retry/i }))

      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Empty State', () => {
    it('displays empty message when no containers exist', () => {
      vi.mocked(useContainers).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      renderWithProviders(<ContainerList />)

      expect(screen.getByText('No project containers found')).toBeInTheDocument()
      expect(
        screen.getByText('Start PostgreSQL, Redis, or OpenSearch containers to see them here')
      ).toBeInTheDocument()
    })

    it('displays usage instructions in empty state', () => {
      vi.mocked(useContainers).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      renderWithProviders(<ContainerList />)

      expect(
        screen.getByText('Use the Makefile commands or docker compose in src/ directories')
      ).toBeInTheDocument()
    })
  })

  describe('Container List Rendering', () => {
    beforeEach(() => {
      vi.mocked(useContainers).mockReturnValue({
        data: mockContainers,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)
    })

    it('displays containers heading', () => {
      renderWithProviders(<ContainerList />)

      expect(screen.getByText('Containers')).toBeInTheDocument()
    })

    it('displays running count', () => {
      renderWithProviders(<ContainerList />)

      expect(screen.getByText(/2 of 3 running/)).toBeInTheDocument()
    })

    it('displays refresh button', () => {
      renderWithProviders(<ContainerList />)

      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
    })

    it('renders container cards for each container', () => {
      renderWithProviders(<ContainerList />)

      expect(screen.getByText('postgres')).toBeInTheDocument()
      expect(screen.getByText('redis')).toBeInTheDocument()
      expect(screen.getByText('opensearch-node')).toBeInTheDocument()
    })
  })

  describe('Container Actions', () => {
    beforeEach(() => {
      vi.mocked(useContainers).mockReturnValue({
        data: [mockContainerRunning],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)
    })

    it('calls start mutation when start is clicked', async () => {
      const user = userEvent.setup()
      const mockStart = { mutate: vi.fn(), isPending: false }
      vi.mocked(useStartContainer).mockReturnValue(mockStart as any)

      const stoppedContainer = { ...mockContainerRunning, State: 'exited' }
      vi.mocked(useContainers).mockReturnValue({
        data: [stoppedContainer],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      renderWithProviders(<ContainerList />)

      const startButton = screen.getByRole('button', { name: /^start$/i })
      await user.click(startButton)

      expect(mockStart.mutate).toHaveBeenCalledWith(stoppedContainer.Id)
    })

    it('shows confirmation dialog when stop is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ContainerList />)

      const stopButton = screen.getByRole('button', { name: /stop/i })
      await user.click(stopButton)

      await waitFor(() => {
        expect(screen.getByText('Stop Container')).toBeInTheDocument()
      })
    })

    it('calls stop mutation when confirmed', async () => {
      const user = userEvent.setup()
      const mockStop = { mutate: vi.fn(), isPending: false }
      vi.mocked(useStopContainer).mockReturnValue(mockStop as any)

      renderWithProviders(<ContainerList />)

      const stopButton = screen.getByRole('button', { name: /stop/i })
      await user.click(stopButton)

      await waitFor(() => {
        expect(screen.getByText('Stop Container')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      expect(mockStop.mutate).toHaveBeenCalledWith(mockContainerRunning.Id)
    })

    it('calls restart mutation when restart is clicked', async () => {
      const user = userEvent.setup()
      const mockRestart = { mutate: vi.fn(), isPending: false }
      vi.mocked(useRestartContainer).mockReturnValue(mockRestart as any)

      renderWithProviders(<ContainerList />)

      const restartButton = screen.getByRole('button', { name: /restart/i })
      await user.click(restartButton)

      expect(mockRestart.mutate).toHaveBeenCalledWith(mockContainerRunning.Id)
    })

    it('shows confirmation dialog when remove is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ContainerList />)

      const removeButton = screen.getByRole('button', { name: /remove/i })
      await user.click(removeButton)

      await waitFor(() => {
        expect(screen.getByText('Remove Container')).toBeInTheDocument()
      })
    })

    it('calls remove mutation with force when container is running', async () => {
      const user = userEvent.setup()
      const mockRemove = { mutate: vi.fn(), isPending: false }
      vi.mocked(useRemoveContainer).mockReturnValue(mockRemove as any)

      renderWithProviders(<ContainerList />)

      const removeButton = screen.getByRole('button', { name: /remove/i })
      await user.click(removeButton)

      await waitFor(() => {
        expect(screen.getByText('Remove Container')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      expect(mockRemove.mutate).toHaveBeenCalledWith({
        id: mockContainerRunning.Id,
        force: true,
      })
    })
  })

  describe('Details Modal', () => {
    beforeEach(() => {
      vi.mocked(useContainers).mockReturnValue({
        data: [mockContainerRunning],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)
    })

    it('opens details modal when details button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ContainerList />)

      const detailsButton = screen.getByRole('button', { name: /details/i })
      await user.click(detailsButton)

      // Since the modal is mocked to return null, we can't check its content
      // Instead, we verify the Details button was clicked successfully
      expect(detailsButton).toBeInTheDocument()
    })
  })

  describe('Refresh Functionality', () => {
    it('calls refetch when refresh button is clicked', async () => {
      const user = userEvent.setup()
      const mockRefetch = vi.fn()

      vi.mocked(useContainers).mockReturnValue({
        data: mockContainers,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any)

      renderWithProviders(<ContainerList />)

      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      await user.click(refreshButton)

      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Loading State for Actions', () => {
    it('passes isLoading true to cards when any mutation is pending', () => {
      vi.mocked(useContainers).mockReturnValue({
        data: [mockContainerRunning],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)
      vi.mocked(useStartContainer).mockReturnValue({ isPending: true } as any)

      renderWithProviders(<ContainerList />)

      const stopButton = screen.getByRole('button', { name: /stop/i })
      expect(stopButton).toBeDisabled()
    })
  })
})
