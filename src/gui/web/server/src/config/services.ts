/**
 * Configuration for all Docker services managed by this application.
 *
 * This file defines metadata and operational details for each service including:
 * - Service identification (id, name, description)
 * - Docker container name for status queries
 * - Exposed ports
 * - Make commands for start/stop/logs operations
 * - Dependencies on other services
 *
 * The configuration is frozen (as const) to prevent runtime modifications.
 */
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
    name: 'OpenSearch',
    description: 'OpenSearch Search Engine',
    composeDir: 'src/opensearch',
    containerName: 'opensearch-node',
    ports: [9200, 9600],
    makeCommands: {
      start: 'start-opensearch',
      stop: 'stop-opensearch',
      logs: 'logs-opensearch'
    }
  },
  dashboards: {
    id: 'dashboards',
    name: 'OpenSearch Dashboards',
    description: 'OpenSearch Dashboards UI',
    composeDir: 'src/opensearch',
    containerName: 'opensearch-dashboards',
    ports: [5601],
    makeCommands: {
      logs: 'logs-dashboards'
    },
    dependsOn: 'opensearch'
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
