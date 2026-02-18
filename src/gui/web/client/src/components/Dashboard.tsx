import ServiceList from './ServiceList'
import SystemInfoServices from './SystemInfoServices'
import { Container } from 'lucide-react'

/**
 * Dashboard Component
 *
 * Main application view that serves as the entry point for the Docker Container Manager UI.
 * Provides a complete layout with:
 * - Header with application title and description
 * - System statistics dashboard (SystemInfoServices)
 * - Service management grid (ServiceList)
 * - Footer with project information
 *
 * This is the primary component rendered at the root route and displays all configured
 * services (PostgreSQL, Redis, OpenSearch) with their current status and management controls.
 *
 * @returns JSX element displaying the full dashboard layout
 */
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Container size={32} className="text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold">Docker Container Manager</h1>
            <p className="text-sm text-gray-400">Manage PostgreSQL, Redis, and OpenSearch services</p>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <SystemInfoServices />
        <ServiceList />
      </main>

      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4 mt-12">
        <p className="text-center text-gray-500 text-sm">
          Docker Container Manager - Part of DockerContainers Project
        </p>
      </footer>
    </div>
  )
}
