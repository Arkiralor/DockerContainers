export const mockServices = [
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    description: 'PostgreSQL Database Server',
    status: 'running',
    containerName: 'postgres',
    ports: [5432],
  },
  {
    id: 'redis',
    name: 'Redis',
    description: 'Redis Cache Server',
    status: 'stopped',
    containerName: 'redis',
    ports: [6379],
  },
  {
    id: 'opensearch',
    name: 'OpenSearch',
    description: 'OpenSearch Search Engine',
    status: 'running',
    containerName: 'opensearch-node',
    ports: [9200, 9600],
  },
  {
    id: 'dashboards',
    name: 'OpenSearch Dashboards',
    description: 'OpenSearch Dashboards UI',
    status: 'running',
    containerName: 'opensearch-dashboards',
    ports: [5601],
  },
]

export const mockMakeCommandOutput = {
  success: {
    stdout: 'Service started successfully\n',
    stderr: '',
    exitCode: 0,
  },
  failure: {
    stdout: '',
    stderr: 'Error: Failed to start service\n',
    exitCode: 1,
  },
}
