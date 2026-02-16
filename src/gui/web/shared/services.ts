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
    containerName: 'opensearch',
    ports: [9200],
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

export type ServiceId = keyof typeof SERVICES

export function getServices() {
  return Object.values(SERVICES)
}

export function getService(id: string) {
  return SERVICES[id as ServiceId]
}
