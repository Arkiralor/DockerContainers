import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SystemInfoServices from '@/components/SystemInfoServices'
import { mockSystemInfo } from '../mocks/docker'
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

vi.mock('@/hooks/useApi', () => ({
  useSystemInfo: vi.fn(),
}))

vi.mock('@/hooks/useServices', () => ({
  useServices: vi.fn(),
}))

import { useSystemInfo } from '@/hooks/useApi'
import { useServices } from '@/hooks/useServices'

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

describe('SystemInfoServices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('renders nothing when system info is loading', () => {
      vi.mocked(useSystemInfo).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as unknown as ReturnType<typeof useSystemInfo>)
      vi.mocked(useServices).mockReturnValue({
        data: mockServices,
        isLoading: false,
      } as unknown as ReturnType<typeof useServices>)

      const { container } = renderWithProviders(<SystemInfoServices />)
      expect(container.firstChild).toBeNull()
    })

    it('renders nothing when services are loading', () => {
      vi.mocked(useSystemInfo).mockReturnValue({
        data: mockSystemInfo,
        isLoading: false,
      } as unknown as ReturnType<typeof useSystemInfo>)
      vi.mocked(useServices).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as unknown as ReturnType<typeof useServices>)

      const { container } = renderWithProviders(<SystemInfoServices />)
      expect(container.firstChild).toBeNull()
    })

    it('renders nothing when system info is not available', () => {
      vi.mocked(useSystemInfo).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as unknown as ReturnType<typeof useSystemInfo>)
      vi.mocked(useServices).mockReturnValue({
        data: mockServices,
        isLoading: false,
      } as unknown as ReturnType<typeof useServices>)

      const { container } = renderWithProviders(<SystemInfoServices />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Rendering Stats', () => {
    beforeEach(() => {
      vi.mocked(useSystemInfo).mockReturnValue({
        data: mockSystemInfo,
        isLoading: false,
      } as unknown as ReturnType<typeof useSystemInfo>)
      vi.mocked(useServices).mockReturnValue({
        data: mockServices,
        isLoading: false,
      } as unknown as ReturnType<typeof useServices>)
    })

    it('displays total services count', () => {
      renderWithProviders(<SystemInfoServices />)

      expect(screen.getByText('Total Services')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('displays running services count', () => {
      renderWithProviders(<SystemInfoServices />)

      expect(screen.getByText('Running')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('displays stopped services count', () => {
      renderWithProviders(<SystemInfoServices />)

      expect(screen.getByText('Stopped')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('displays system memory', () => {
      renderWithProviders(<SystemInfoServices />)

      expect(screen.getByText('System Memory')).toBeInTheDocument()
      // 16777216000 bytes = 15.62 GB using formatBytes
      const memoryElements = screen.getAllByText(/GB/)
      expect(memoryElements.length).toBeGreaterThan(0)
    })

    it('displays CPU count', () => {
      renderWithProviders(<SystemInfoServices />)

      expect(screen.getByText('CPUs')).toBeInTheDocument()
      expect(screen.getByText('8')).toBeInTheDocument()
    })
  })

  describe('Grid Layout', () => {
    beforeEach(() => {
      vi.mocked(useSystemInfo).mockReturnValue({
        data: mockSystemInfo,
        isLoading: false,
      } as unknown as ReturnType<typeof useSystemInfo>)
      vi.mocked(useServices).mockReturnValue({
        data: mockServices,
        isLoading: false,
      } as unknown as ReturnType<typeof useServices>)
    })

    it('renders stats in a grid layout', () => {
      const { container } = renderWithProviders(<SystemInfoServices />)

      const grid = container.querySelector('.grid')
      expect(grid).toBeInTheDocument()
    })

    it('displays 5 stat cards', () => {
      const { container } = renderWithProviders(<SystemInfoServices />)

      const statCards = container.querySelectorAll('.bg-gray-800.rounded-lg')
      expect(statCards.length).toBe(5)
    })
  })

  describe('Icon Display', () => {
    beforeEach(() => {
      vi.mocked(useSystemInfo).mockReturnValue({
        data: mockSystemInfo,
        isLoading: false,
      } as unknown as ReturnType<typeof useSystemInfo>)
      vi.mocked(useServices).mockReturnValue({
        data: mockServices,
        isLoading: false,
      } as unknown as ReturnType<typeof useServices>)
    })

    it('displays icons with correct colors', () => {
      const { container } = renderWithProviders(<SystemInfoServices />)

      expect(container.querySelector('.text-blue-500')).toBeInTheDocument()
      expect(container.querySelector('.text-green-500')).toBeInTheDocument()
      expect(container.querySelector('.text-red-500')).toBeInTheDocument()
      expect(container.querySelector('.text-purple-500')).toBeInTheDocument()
      expect(container.querySelector('.text-yellow-500')).toBeInTheDocument()
    })
  })

  describe('Empty Services', () => {
    it('handles empty services list', () => {
      vi.mocked(useSystemInfo).mockReturnValue({
        data: mockSystemInfo,
        isLoading: false,
      } as unknown as ReturnType<typeof useSystemInfo>)
      vi.mocked(useServices).mockReturnValue({
        data: [],
        isLoading: false,
      } as unknown as ReturnType<typeof useServices>)

      renderWithProviders(<SystemInfoServices />)

      // Check for "0" in the context of services
      expect(screen.getByText('Total Services')).toBeInTheDocument()
      expect(screen.getByText('Running')).toBeInTheDocument()
      expect(screen.getByText('Stopped')).toBeInTheDocument()
      const zeros = screen.getAllByText('0')
      expect(zeros.length).toBeGreaterThanOrEqual(2)
    })

    it('handles undefined services', () => {
      vi.mocked(useSystemInfo).mockReturnValue({
        data: mockSystemInfo,
        isLoading: false,
      } as unknown as ReturnType<typeof useSystemInfo>)
      vi.mocked(useServices).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as unknown as ReturnType<typeof useServices>)

      renderWithProviders(<SystemInfoServices />)

      const zeros = screen.getAllByText('0')
      expect(zeros.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Service Counts', () => {
    it('calculates running count correctly when all services are running', () => {
      const allRunning = mockServices.map((s) => ({ ...s, running: true }))
      vi.mocked(useSystemInfo).mockReturnValue({
        data: mockSystemInfo,
        isLoading: false,
      } as unknown as ReturnType<typeof useSystemInfo>)
      vi.mocked(useServices).mockReturnValue({
        data: allRunning,
        isLoading: false,
      } as unknown as ReturnType<typeof useServices>)

      renderWithProviders(<SystemInfoServices />)

      expect(screen.getByText('Running')).toBeInTheDocument()
      // Total Services, Running, and Count should all show 3
      const threes = screen.getAllByText('3')
      expect(threes.length).toBeGreaterThanOrEqual(2)
    })

    it('calculates stopped count correctly when all services are stopped', () => {
      const allStopped = mockServices.map((s) => ({ ...s, running: false }))
      vi.mocked(useSystemInfo).mockReturnValue({
        data: mockSystemInfo,
        isLoading: false,
      } as unknown as ReturnType<typeof useSystemInfo>)
      vi.mocked(useServices).mockReturnValue({
        data: allStopped,
        isLoading: false,
      } as unknown as ReturnType<typeof useServices>)

      renderWithProviders(<SystemInfoServices />)

      expect(screen.getByText('Stopped')).toBeInTheDocument()
      const threes = screen.getAllByText('3')
      expect(threes.length).toBeGreaterThanOrEqual(2)
    })
  })
})
