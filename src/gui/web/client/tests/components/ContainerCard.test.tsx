import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContainerCard from '@/components/ContainerCard'
import { mockContainerRunning, mockContainerStopped } from '../mocks/docker'

describe('ContainerCard', () => {
  const mockActions = {
    onStart: vi.fn(),
    onStop: vi.fn(),
    onRestart: vi.fn(),
    onRemove: vi.fn(),
    onViewDetails: vi.fn(),
  }

  beforeEach(() => {
    Object.values(mockActions).forEach((fn) => fn.mockClear())
  })

  describe('Rendering - Running Container', () => {
    it('renders running container information', () => {
      render(<ContainerCard container={mockContainerRunning} {...mockActions} />)

      expect(screen.getByText('postgres')).toBeInTheDocument()
      expect(screen.getByText('postgres:16')).toBeInTheDocument()
      expect(screen.getByText(/ID: abcd12345678/)).toBeInTheDocument()
    })

    it('displays ports when available', () => {
      render(<ContainerCard container={mockContainerRunning} {...mockActions} />)

      expect(screen.getByText(/Ports:/)).toBeInTheDocument()
      expect(screen.getByText(/5432:5432/)).toBeInTheDocument()
    })

    it('shows running status badge', () => {
      render(<ContainerCard container={mockContainerRunning} {...mockActions} />)

      const statusBadge = screen.getByText('Running')
      expect(statusBadge).toBeInTheDocument()
      expect(statusBadge).toHaveClass('bg-green-900')
    })

    it('shows stop button for running container', () => {
      render(<ContainerCard container={mockContainerRunning} {...mockActions} />)

      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument()
    })

    it('enables restart button for running container', () => {
      render(<ContainerCard container={mockContainerRunning} {...mockActions} />)

      const restartButton = screen.getByRole('button', { name: /restart/i })
      expect(restartButton).toBeInTheDocument()
      expect(restartButton).not.toBeDisabled()
    })
  })

  describe('Rendering - Stopped Container', () => {
    it('renders stopped container information', () => {
      render(<ContainerCard container={mockContainerStopped} {...mockActions} />)

      expect(screen.getByText('redis')).toBeInTheDocument()
      expect(screen.getByText('redis:7')).toBeInTheDocument()
    })

    it('shows stopped status badge', () => {
      render(<ContainerCard container={mockContainerStopped} {...mockActions} />)

      const statusBadge = screen.getByText('Stopped')
      expect(statusBadge).toBeInTheDocument()
      expect(statusBadge).toHaveClass('bg-gray-700')
    })

    it('shows start button for stopped container', () => {
      render(<ContainerCard container={mockContainerStopped} {...mockActions} />)

      expect(screen.getByRole('button', { name: /^start$/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /stop/i })).not.toBeInTheDocument()
    })

    it('disables restart button for stopped container', () => {
      render(<ContainerCard container={mockContainerStopped} {...mockActions} />)

      const restartButton = screen.getByRole('button', { name: /restart/i })
      expect(restartButton).toBeDisabled()
    })

    it('does not display ports section when no public ports', () => {
      render(<ContainerCard container={mockContainerStopped} {...mockActions} />)

      expect(screen.queryByText(/Ports:/)).not.toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('calls onStart when start button is clicked', async () => {
      const user = userEvent.setup()
      render(<ContainerCard container={mockContainerStopped} {...mockActions} />)

      await user.click(screen.getByRole('button', { name: /^start$/i }))

      expect(mockActions.onStart).toHaveBeenCalledWith(mockContainerStopped.Id)
      expect(mockActions.onStart).toHaveBeenCalledTimes(1)
    })

    it('calls onStop when stop button is clicked', async () => {
      const user = userEvent.setup()
      render(<ContainerCard container={mockContainerRunning} {...mockActions} />)

      await user.click(screen.getByRole('button', { name: /stop/i }))

      expect(mockActions.onStop).toHaveBeenCalledWith(mockContainerRunning.Id)
      expect(mockActions.onStop).toHaveBeenCalledTimes(1)
    })

    it('calls onRestart when restart button is clicked', async () => {
      const user = userEvent.setup()
      render(<ContainerCard container={mockContainerRunning} {...mockActions} />)

      await user.click(screen.getByRole('button', { name: /restart/i }))

      expect(mockActions.onRestart).toHaveBeenCalledWith(mockContainerRunning.Id)
      expect(mockActions.onRestart).toHaveBeenCalledTimes(1)
    })

    it('calls onRemove when remove button is clicked', async () => {
      const user = userEvent.setup()
      render(<ContainerCard container={mockContainerRunning} {...mockActions} />)

      await user.click(screen.getByRole('button', { name: /remove/i }))

      expect(mockActions.onRemove).toHaveBeenCalledWith(mockContainerRunning.Id)
      expect(mockActions.onRemove).toHaveBeenCalledTimes(1)
    })

    it('calls onViewDetails when details button is clicked', async () => {
      const user = userEvent.setup()
      render(<ContainerCard container={mockContainerRunning} {...mockActions} />)

      await user.click(screen.getByRole('button', { name: /details/i }))

      expect(mockActions.onViewDetails).toHaveBeenCalledWith(mockContainerRunning.Id)
      expect(mockActions.onViewDetails).toHaveBeenCalledTimes(1)
    })
  })

  describe('Loading State', () => {
    it('disables all buttons when isLoading is true', () => {
      render(
        <ContainerCard
          container={mockContainerRunning}
          {...mockActions}
          isLoading={true}
        />
      )

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button).toBeDisabled()
      })
    })

    it('does not disable buttons when isLoading is false', () => {
      render(
        <ContainerCard
          container={mockContainerRunning}
          {...mockActions}
          isLoading={false}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      const detailsButton = screen.getByRole('button', { name: /details/i })

      expect(stopButton).not.toBeDisabled()
      expect(detailsButton).not.toBeDisabled()
    })
  })

  describe('Container Name Display', () => {
    it('strips leading slash from container name', () => {
      render(<ContainerCard container={mockContainerRunning} {...mockActions} />)

      expect(screen.getByText('postgres')).toBeInTheDocument()
      expect(screen.queryByText('/postgres')).not.toBeInTheDocument()
    })

    it('falls back to short ID when name is missing', () => {
      const containerWithoutName = {
        ...mockContainerRunning,
        Names: [],
      }

      render(<ContainerCard container={containerWithoutName} {...mockActions} />)

      expect(screen.getByText('abcd12345678')).toBeInTheDocument()
    })
  })

  describe('Status Indicator', () => {
    it('shows green indicator for running container', () => {
      const { container } = render(
        <ContainerCard container={mockContainerRunning} {...mockActions} />
      )

      const indicator = container.querySelector('.bg-green-500')
      expect(indicator).toBeInTheDocument()
    })

    it('shows red indicator for stopped container', () => {
      const { container } = render(
        <ContainerCard container={mockContainerStopped} {...mockActions} />
      )

      const indicator = container.querySelector('.bg-red-500')
      expect(indicator).toBeInTheDocument()
    })
  })
})
