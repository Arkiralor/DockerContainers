import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ServiceCard from '@/components/ServiceCard'
import type { ServiceStatus } from '@/services/servicesApi'

describe('ServiceCard', () => {
  const mockActions = {
    onStart: vi.fn(),
    onStop: vi.fn(),
    onViewDetails: vi.fn(),
  }

  const mockServiceRunning: ServiceStatus = {
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

  const mockServiceStopped: ServiceStatus = {
    id: 'redis',
    name: 'Redis',
    description: 'Redis Cache Server',
    containerName: 'redis',
    ports: [6379],
    exists: true,
    running: false,
    status: 'Exited (0) 5 minutes ago',
    state: 'exited',
  }

  const mockServiceNotCreated: ServiceStatus = {
    id: 'opensearch',
    name: 'OpenSearch',
    description: 'OpenSearch Search Engine',
    containerName: 'opensearch-node',
    ports: [9200, 9600],
    exists: false,
    running: false,
  }

  beforeEach(() => {
    Object.values(mockActions).forEach((fn) => fn.mockClear())
  })

  describe('Rendering - Running Service', () => {
    it('renders running service information', () => {
      render(<ServiceCard service={mockServiceRunning} {...mockActions} isLoading={false} />)

      expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
      expect(screen.getByText('PostgreSQL Database Server')).toBeInTheDocument()
      expect(screen.getByText('postgres')).toBeInTheDocument()
    })

    it('displays ports when available', () => {
      render(<ServiceCard service={mockServiceRunning} {...mockActions} isLoading={false} />)

      expect(screen.getByText(/Ports:/)).toBeInTheDocument()
      expect(screen.getByText('5432')).toBeInTheDocument()
    })

    it('displays multiple ports correctly', () => {
      render(<ServiceCard service={mockServiceNotCreated} {...mockActions} isLoading={false} />)

      expect(screen.getByText(/Ports:/)).toBeInTheDocument()
      expect(screen.getByText('9200, 9600')).toBeInTheDocument()
    })

    it('shows running status indicator', () => {
      const { container } = render(
        <ServiceCard service={mockServiceRunning} {...mockActions} isLoading={false} />
      )

      const statusIndicator = container.querySelector('.bg-green-500')
      expect(statusIndicator).toBeInTheDocument()
      expect(screen.getByText('Running')).toBeInTheDocument()
    })

    it('shows stop button for running service', () => {
      render(<ServiceCard service={mockServiceRunning} {...mockActions} isLoading={false} />)

      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /start/i })).not.toBeInTheDocument()
    })

    it('enables details button for running service', () => {
      render(<ServiceCard service={mockServiceRunning} {...mockActions} isLoading={false} />)

      const detailsButton = screen.getByRole('button', { name: /details/i })
      expect(detailsButton).toBeInTheDocument()
      expect(detailsButton).not.toBeDisabled()
    })
  })

  describe('Rendering - Stopped Service', () => {
    it('renders stopped service information', () => {
      render(<ServiceCard service={mockServiceStopped} {...mockActions} isLoading={false} />)

      expect(screen.getByText('Redis')).toBeInTheDocument()
      expect(screen.getByText('Redis Cache Server')).toBeInTheDocument()
      expect(screen.getByText('redis')).toBeInTheDocument()
    })

    it('shows stopped status indicator', () => {
      const { container } = render(
        <ServiceCard service={mockServiceStopped} {...mockActions} isLoading={false} />
      )

      const statusIndicator = container.querySelector('.bg-yellow-500')
      expect(statusIndicator).toBeInTheDocument()
      expect(screen.getByText('Stopped')).toBeInTheDocument()
    })

    it('shows start button for stopped service', () => {
      render(<ServiceCard service={mockServiceStopped} {...mockActions} isLoading={false} />)

      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /stop/i })).not.toBeInTheDocument()
    })

    it('enables details button for stopped service', () => {
      render(<ServiceCard service={mockServiceStopped} {...mockActions} isLoading={false} />)

      const detailsButton = screen.getByRole('button', { name: /details/i })
      expect(detailsButton).not.toBeDisabled()
    })
  })

  describe('Rendering - Not Created Service', () => {
    it('renders not created service information', () => {
      render(<ServiceCard service={mockServiceNotCreated} {...mockActions} isLoading={false} />)

      expect(screen.getByText('OpenSearch')).toBeInTheDocument()
      expect(screen.getByText('OpenSearch Search Engine')).toBeInTheDocument()
    })

    it('shows not created status indicator', () => {
      const { container } = render(
        <ServiceCard service={mockServiceNotCreated} {...mockActions} isLoading={false} />
      )

      const statusIndicator = container.querySelector('.bg-gray-500')
      expect(statusIndicator).toBeInTheDocument()
      expect(screen.getByText('Not Created')).toBeInTheDocument()
    })

    it('shows start button for not created service', () => {
      render(<ServiceCard service={mockServiceNotCreated} {...mockActions} isLoading={false} />)

      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
    })

    it('disables details button for not created service', () => {
      render(<ServiceCard service={mockServiceNotCreated} {...mockActions} isLoading={false} />)

      const detailsButton = screen.getByRole('button', { name: /details/i })
      expect(detailsButton).toBeDisabled()
    })
  })

  describe('User Interactions', () => {
    it('calls onStart when start button is clicked', async () => {
      const user = userEvent.setup()
      render(<ServiceCard service={mockServiceStopped} {...mockActions} isLoading={false} />)

      await user.click(screen.getByRole('button', { name: /start/i }))

      expect(mockActions.onStart).toHaveBeenCalledWith(mockServiceStopped.id)
      expect(mockActions.onStart).toHaveBeenCalledTimes(1)
    })

    it('calls onStop when stop button is clicked', async () => {
      const user = userEvent.setup()
      render(<ServiceCard service={mockServiceRunning} {...mockActions} isLoading={false} />)

      await user.click(screen.getByRole('button', { name: /stop/i }))

      expect(mockActions.onStop).toHaveBeenCalledWith(mockServiceRunning.id)
      expect(mockActions.onStop).toHaveBeenCalledTimes(1)
    })

    it('calls onViewDetails when details button is clicked', async () => {
      const user = userEvent.setup()
      render(<ServiceCard service={mockServiceRunning} {...mockActions} isLoading={false} />)

      await user.click(screen.getByRole('button', { name: /details/i }))

      expect(mockActions.onViewDetails).toHaveBeenCalledWith(mockServiceRunning.id)
      expect(mockActions.onViewDetails).toHaveBeenCalledTimes(1)
    })
  })

  describe('Loading State', () => {
    it('disables start/stop buttons when isLoading is true', () => {
      render(<ServiceCard service={mockServiceRunning} {...mockActions} isLoading={true} />)

      const stopButton = screen.getByRole('button', { name: /stop/i })
      expect(stopButton).toBeDisabled()
    })

    it('does not disable details button when service does not exist', () => {
      render(<ServiceCard service={mockServiceNotCreated} {...mockActions} isLoading={true} />)

      const detailsButton = screen.getByRole('button', { name: /details/i })
      expect(detailsButton).toBeDisabled()
    })

    it('enables buttons when isLoading is false and service is running', () => {
      render(<ServiceCard service={mockServiceRunning} {...mockActions} isLoading={false} />)

      const stopButton = screen.getByRole('button', { name: /stop/i })
      const detailsButton = screen.getByRole('button', { name: /details/i })

      expect(stopButton).not.toBeDisabled()
      expect(detailsButton).not.toBeDisabled()
    })
  })

  describe('Container Name Display', () => {
    it('displays container name correctly', () => {
      render(<ServiceCard service={mockServiceRunning} {...mockActions} isLoading={false} />)

      expect(screen.getByText('postgres')).toBeInTheDocument()
    })
  })

  describe('Ports Display', () => {
    it('does not display ports section when ports array is empty', () => {
      const serviceNoPorts = { ...mockServiceRunning, ports: [] }
      render(<ServiceCard service={serviceNoPorts} {...mockActions} isLoading={false} />)

      expect(screen.queryByText(/Ports:/)).not.toBeInTheDocument()
    })

    it('displays single port correctly', () => {
      render(<ServiceCard service={mockServiceRunning} {...mockActions} isLoading={false} />)

      expect(screen.getByText('5432')).toBeInTheDocument()
    })

    it('displays multiple ports separated by commas', () => {
      const serviceMultiplePorts = {
        ...mockServiceRunning,
        ports: [5432, 5433, 5434],
      }
      render(<ServiceCard service={serviceMultiplePorts} {...mockActions} isLoading={false} />)

      expect(screen.getByText('5432, 5433, 5434')).toBeInTheDocument()
    })
  })
})
