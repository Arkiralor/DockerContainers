/**
 * Configuration for all Docker services managed by this application.
 *
 * This file defines metadata and operational details for each service including:
 * - Service identification (id, name, description)
 * - Docker container name for status queries (single services)
 * - Container groups with individual containers (grouped services)
 * - Exposed ports
 * - Make commands for start/stop/logs operations
 * - Dependencies on other services
 *
 * The configuration is frozen (as const) to prevent runtime modifications.
 */

interface ServiceContainer {
  name: string
  containerName: string
  description: string
  ports: number[]
  makeCommands?: Record<string, string>
}

export const SERVICES = {
  postgresql: {
    id: 'postgresql',
    name: 'PostgreSQL',
    description: 'PostgreSQL Database Server',
    composeDir: 'src/postgresql',
    containerName: 'postgres',
    ports: [5432],
    makeCommands: {
      start: 'start-postgres',
      stop: 'stop-postgres',
      logs: 'logs-postgres'
    }
  },
  redis: {
    id: 'redis',
    name: 'Redis',
    description: 'Redis Cache Server',
    composeDir: 'src/redis',
    containerName: 'redis',
    ports: [6379],
    makeCommands: {
      start: 'start-redis',
      stop: 'stop-redis',
      logs: 'logs-redis'
    }
  },
  opensearch: {
    id: 'opensearch',
    name: 'OpenSearch Stack',
    description: 'OpenSearch engine and dashboards for search, analytics, and visualization',
    composeDir: 'src/opensearch',
    makeCommands: {
      start: 'start-opensearch',
      stop: 'stop-opensearch'
    },
    containers: [
      {
        name: 'OpenSearch',
        containerName: 'opensearch-node',
        description: 'Search and analytics engine',
        ports: [9200, 9600],
        makeCommands: {
          logs: 'logs-opensearch'
        }
      },
      {
        name: 'OpenSearch Dashboards',
        containerName: 'opensearch-dashboards',
        description: 'Web interface for data visualization',
        ports: [5601],
        makeCommands: {
          logs: 'logs-dashboards'
        }
      }
    ] as ServiceContainer[]
  }
} as const

/**
 * Type representing valid service IDs.
 * Derived from the keys of the SERVICES object.
 */
export type ServiceId = keyof typeof SERVICES

/**
 * Retrieves all configured services as an array.
 *
 * @returns Array of service configuration objects
 *
 * @example
 * const allServices = getServices()
 * allServices.forEach(service => console.log(service.name))
 */
export function getServices() {
  return Object.values(SERVICES)
}

/**
 * Retrieves a specific service configuration by ID.
 *
 * @param id - Service identifier (e.g., "redis", "postgres", "opensearch")
 * @returns Service configuration object or undefined if not found
 *
 * @example
 * const redis = getService('redis')
 * console.log(redis.ports) // [6379]
 */
export function getService(id: string) {
  return SERVICES[id as ServiceId]
}
