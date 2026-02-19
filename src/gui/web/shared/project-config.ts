export const PROJECT_CONTAINERS = {
  postgres: {
    name: 'postgres',
    displayName: 'PostgreSQL',
    composeDir: 'src/postgresql',
    ports: [5432],
    description: 'PostgreSQL Database Server'
  },
  redis: {
    name: 'redis',
    displayName: 'Redis',
    composeDir: 'src/redis',
    ports: [6379],
    description: 'Redis Cache Server'
  },
  opensearch: {
    name: 'opensearch',
    displayName: 'OpenSearch',
    composeDir: 'src/opensearch',
    ports: [9200],
    description: 'OpenSearch Search Engine'
  },
  'opensearch-dashboards': {
    name: 'opensearch-dashboards',
    displayName: 'OpenSearch Dashboards',
    composeDir: 'src/opensearch',
    ports: [5601],
    description: 'OpenSearch Dashboards UI'
  }
} as const

export type ProjectContainerName = keyof typeof PROJECT_CONTAINERS

export function isProjectContainer(containerName: string): boolean {
  const cleanName = containerName.replace(/^\//, '')
  return cleanName in PROJECT_CONTAINERS
}

export function getProjectContainers() {
  return Object.values(PROJECT_CONTAINERS)
}
