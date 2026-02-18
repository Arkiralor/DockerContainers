import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '@/App'

describe('App', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<App />)
      expect(container).toBeInTheDocument()
    })

    it('renders the Dashboard component', () => {
      render(<App />)

      expect(screen.getByText('Docker Container Manager')).toBeInTheDocument()
    })

    it('renders header content', () => {
      render(<App />)

      expect(
        screen.getByText('Manage PostgreSQL, Redis, and OpenSearch services')
      ).toBeInTheDocument()
    })

    it('renders footer content', () => {
      render(<App />)

      expect(
        screen.getByText('Docker Container Manager - Part of DockerContainers Project')
      ).toBeInTheDocument()
    })
  })

  describe('QueryClientProvider Configuration', () => {
    it('provides QueryClient to child components', () => {
      const { container } = render(<App />)

      // The Dashboard component should render, which requires QueryClient
      expect(container.querySelector('header')).toBeInTheDocument()
      expect(container.querySelector('main')).toBeInTheDocument()
      expect(container.querySelector('footer')).toBeInTheDocument()
    })
  })

  describe('Router Configuration', () => {
    it('renders BrowserRouter correctly', () => {
      const { container } = render(<App />)

      // Should render the main content (implying router is working)
      expect(container.querySelector('main')).toBeInTheDocument()
    })

    it('renders the root route', () => {
      render(<App />)

      // Dashboard should be rendered at root route
      expect(screen.getByText('Docker Container Manager')).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('has dark theme styling', () => {
      const { container } = render(<App />)

      const darkBackground = container.querySelector('.bg-gray-900')
      expect(darkBackground).toBeInTheDocument()
    })

    it('has sticky header', () => {
      const { container } = render(<App />)

      const header = container.querySelector('header')
      expect(header).toHaveClass('sticky')
    })

    it('has centered content area', () => {
      const { container } = render(<App />)

      const main = container.querySelector('.max-w-7xl')
      expect(main).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    it('renders all main sections of Dashboard', () => {
      const { container } = render(<App />)

      // Header should be present
      const header = container.querySelector('header')
      expect(header).toBeInTheDocument()

      // Main content area should be present
      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()

      // Footer should be present
      const footer = container.querySelector('footer')
      expect(footer).toBeInTheDocument()
    })

    it('includes Container icon in header', () => {
      const { container } = render(<App />)

      // Should have SVG icon in header
      const icon = container.querySelector('header svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('QueryClient Default Options', () => {
    it('renders components that use queries without errors', () => {
      // This test verifies that the QueryClient is properly configured
      // by checking if components that depend on it render successfully
      const { container } = render(<App />)

      expect(container.querySelector('main')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has semantic HTML structure', () => {
      const { container } = render(<App />)

      expect(container.querySelector('header')).toBeInTheDocument()
      expect(container.querySelector('main')).toBeInTheDocument()
      expect(container.querySelector('footer')).toBeInTheDocument()
    })

    it('renders heading elements', () => {
      render(<App />)

      const heading = screen.getByText('Docker Container Manager')
      expect(heading.tagName).toBe('H1')
    })
  })

  describe('Component Composition', () => {
    it('wraps Dashboard in QueryClientProvider', () => {
      render(<App />)

      // Dashboard component should render successfully
      // This implies QueryClientProvider is working
      expect(screen.getByText('Docker Container Manager')).toBeInTheDocument()
    })

    it('wraps Dashboard in BrowserRouter', () => {
      render(<App />)

      // Dashboard should render, confirming router is working
      expect(screen.getByText('Docker Container Manager')).toBeInTheDocument()
    })
  })
})
