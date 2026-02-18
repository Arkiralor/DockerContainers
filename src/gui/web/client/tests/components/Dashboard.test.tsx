import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from '@/components/Dashboard'

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

describe('Dashboard', () => {
  describe('Rendering', () => {
    it('renders the header with title', () => {
      renderWithProviders(<Dashboard />)

      expect(screen.getByText('Docker Container Manager')).toBeInTheDocument()
    })

    it('renders the header subtitle', () => {
      renderWithProviders(<Dashboard />)

      expect(
        screen.getByText('Manage PostgreSQL, Redis, and OpenSearch services')
      ).toBeInTheDocument()
    })

    it('renders the main content area', () => {
      const { container } = renderWithProviders(<Dashboard />)

      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
    })

    it('renders the footer', () => {
      renderWithProviders(<Dashboard />)

      expect(
        screen.getByText('Docker Container Manager - Part of DockerContainers Project')
      ).toBeInTheDocument()
    })

    it('renders the Container icon in header', () => {
      const { container } = renderWithProviders(<Dashboard />)

      const svg = container.querySelector('header svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('has sticky header at top', () => {
      const { container } = renderWithProviders(<Dashboard />)

      const header = container.querySelector('header')
      expect(header).toHaveClass('sticky', 'top-0')
    })

    it('has dark background theme', () => {
      const { container } = renderWithProviders(<Dashboard />)

      const root = container.querySelector('.bg-gray-900')
      expect(root).toBeInTheDocument()
    })

    it('centers content with max width', () => {
      const { container } = renderWithProviders(<Dashboard />)

      const main = container.querySelector('.max-w-7xl')
      expect(main).toBeInTheDocument()
    })

    it('has footer with border at bottom', () => {
      const { container } = renderWithProviders(<Dashboard />)

      const footer = container.querySelector('footer')
      expect(footer).toHaveClass('border-t')
    })
  })

  describe('Component Composition', () => {
    it('renders without crashing', () => {
      const { container } = renderWithProviders(<Dashboard />)

      expect(container).toBeInTheDocument()
    })

    it('applies correct styling classes to header', () => {
      const { container } = renderWithProviders(<Dashboard />)

      const header = container.querySelector('header')
      expect(header).toHaveClass('bg-gray-800', 'border-b', 'border-gray-700')
    })

    it('applies correct styling to main container', () => {
      const { container } = renderWithProviders(<Dashboard />)

      const main = container.querySelector('main')
      expect(main).toHaveClass('p-6', 'max-w-7xl', 'mx-auto')
    })
  })
})
