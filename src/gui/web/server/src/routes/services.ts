import { Router } from 'express'
import { exec } from 'child_process'
import { promisify } from 'util'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { logger } from '../utils/logger.js'
import { dockerService } from '../services/docker.js'
import { SERVICES } from '../config/services.js'

const execAsync = promisify(exec)
const router = Router()

/**
 * Repository root directory.
 * Calculated programmatically from the current file location, moving 6 levels up:
 * services.ts -> routes/ -> src/ -> server/ -> web/ -> gui/ -> src/ -> (project root)
 * Can be overridden via REPO_ROOT environment variable if the automatic calculation
 * is incorrect for your setup. See example.env for configuration details.
 * This is where make commands are executed from.
 */
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = process.env.REPO_ROOT || resolve(__dirname, '../../../../../..')

/**
 * Executes a make command in the repository root directory.
 *
 * This function runs make commands with a 60-second timeout to prevent hanging.
 * Both stdout and stderr are captured and returned in the result object.
 *
 * @param command - Make target to execute (e.g., "start-redis", "stop-postgres")
 * @returns Promise resolving to execution result with success flag, output, and optional error
 *
 * @example
 * const result = await runMakeCommand('start-redis')
 * if (result.success) {
 *   console.log('Redis started:', result.output)
 * }
 */
async function runMakeCommand(command: string): Promise<{ success: boolean; output: string; error?: string }> {
  try {
    const { stdout, stderr } = await execAsync(`make ${command}`, {
      cwd: REPO_ROOT,
      timeout: 60000
    })
    logger.info(`Make command '${command}' executed successfully`)
    return { success: true, output: stdout, error: stderr }
  } catch (error: unknown) {
    logger.error(`Make command '${command}' failed:`, error)
    const err = error as { stdout?: string; stderr?: string; message?: string }
    return { success: false, output: err.stdout || '', error: err.stderr || err.message }
  }
}

/**
 * Retrieves the current status of a container by name.
 *
 * Searches for a container by name in the Docker container list (including stopped containers).
 * Returns comprehensive status information including existence, running state, and container ID.
 *
 * @param containerName - Name of the container (without leading slash)
 * @returns Promise resolving to status object with existence, running state, and metadata
 *
 * @example
 * const status = await getContainerStatus('redis-stack')
 * if (status.exists && status.running) {
 *   console.log('Container is running with ID:', status.containerId)
 * }
 */
async function getContainerStatus(containerName: string) {
  const containers = await dockerService.listContainers(true)
  const container = containers.find(c =>
    c.Names.some(n => n.replace(/^\//, '') === containerName)
  )

  if (!container) {
    return { exists: false, running: false }
  }

  return {
    exists: true,
    running: container.State.toLowerCase() === 'running',
    status: container.Status,
    state: container.State,
    containerId: container.Id
  }
}

/**
 * GET /api/services
 *
 * Lists all configured services with their current status.
 *
 * Returns an array of service objects containing configuration details from
 * the SERVICES config along with real-time status from Docker (whether container
 * exists, is running, current state, etc.). For grouped services, returns status
 * for all containers within the group.
 *
 * @returns 200 with array of service objects
 * @returns 500 if unable to retrieve service information
 */
router.get('/', async (req, res) => {
  try {
    const services = Object.values(SERVICES)
    const statuses = await Promise.all(
      services.map(async (service) => {
        // Check if this is a grouped service
        if ('containers' in service && service.containers) {
          // Get status for all containers in the group
          const containerStatuses = await Promise.all(
            service.containers.map(async (container) => {
              const status = await getContainerStatus(container.containerName)
              return {
                name: container.name,
                containerName: container.containerName,
                description: container.description,
                ports: container.ports,
                ...status
              }
            })
          )

          // Service is "running" if any container is running
          const anyRunning = containerStatuses.some(c => c.running)
          const allExist = containerStatuses.every(c => c.exists)

          return {
            id: service.id,
            name: service.name,
            description: service.description,
            isGrouped: true,
            containers: containerStatuses,
            running: anyRunning,
            exists: allExist
          }
        } else {
          // Single container service
          const containerName = 'containerName' in service ? service.containerName : undefined
          const ports = 'ports' in service ? service.ports : undefined

          if (!containerName) {
            logger.error(`Service ${service.id} has invalid configuration - missing container name`)
            return {
              id: service.id,
              name: service.name,
              description: service.description,
              isGrouped: false,
              exists: false,
              running: false
            }
          }

          const status = await getContainerStatus(containerName)
          return {
            id: service.id,
            name: service.name,
            description: service.description,
            containerName,
            ports: ports || [],
            isGrouped: false,
            ...status
          }
        }
      })
    )
    res.json(statuses)
  } catch (error) {
    logger.error('Error listing services:', error)
    res.status(500).json({ error: 'Failed to list services' })
  }
})

/**
 * GET /api/services/:serviceId
 *
 * Retrieves detailed information about a specific service.
 *
 * Returns service configuration details from SERVICES config merged with
 * real-time Docker container status. For grouped services, includes status
 * for all containers within the group.
 *
 * @param serviceId - Service identifier (e.g., "redis", "postgres", "opensearch")
 * @returns 200 with service object
 * @returns 404 if service not found in configuration
 * @returns 500 if unable to retrieve service information
 */
router.get('/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params
    const service = SERVICES[serviceId as keyof typeof SERVICES]

    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    // Check if this is a grouped service
    if ('containers' in service && service.containers) {
      // Get status for all containers in the group
      const containerStatuses = await Promise.all(
        service.containers.map(async (container) => {
          const status = await getContainerStatus(container.containerName)
          return {
            name: container.name,
            containerName: container.containerName,
            description: container.description,
            ports: container.ports,
            ...status
          }
        })
      )

      // Service is "running" if any container is running
      const anyRunning = containerStatuses.some(c => c.running)
      const allExist = containerStatuses.every(c => c.exists)

      res.json({
        id: service.id,
        name: service.name,
        description: service.description,
        isGrouped: true,
        containers: containerStatuses,
        running: anyRunning,
        exists: allExist
      })
    } else {
      // Single container service
      const containerName = 'containerName' in service ? service.containerName : undefined
      const ports = 'ports' in service ? service.ports : undefined

      if (!containerName) {
        return res.status(500).json({ error: 'Invalid service configuration - missing container name' })
      }

      const status = await getContainerStatus(containerName)
      res.json({
        id: service.id,
        name: service.name,
        description: service.description,
        containerName,
        ports: ports || [],
        isGrouped: false,
        ...status
      })
    }
  } catch (error) {
    logger.error(`Error getting service ${req.params.serviceId}:`, error)
    res.status(500).json({ error: 'Failed to get service' })
  }
})

/**
 * POST /api/services/:serviceId/start
 *
 * Starts a service using its configured make command.
 *
 * Executes the service's start make command (e.g., "make start-redis") to bring up
 * the service containers. For grouped services, starts all containers in the group.
 *
 * @param serviceId - Service identifier (e.g., "redis", "postgres", "opensearch")
 * @returns 200 with execution result (success, output, error)
 * @returns 400 if service has no start command
 * @returns 404 if service not found in configuration
 * @returns 500 if unable to start service
 */
router.post('/:serviceId/start', async (req, res) => {
  try {
    const { serviceId } = req.params
    const service = SERVICES[serviceId as keyof typeof SERVICES]

    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    const makeCommands = service.makeCommands as { start?: string; stop?: string; logs?: string } | undefined

    if (!makeCommands || !makeCommands.start) {
      return res.status(400).json({ error: 'Service cannot be started directly' })
    }

    const result = await runMakeCommand(makeCommands.start)
    res.json(result)
  } catch (error) {
    logger.error(`Error starting service ${req.params.serviceId}:`, error)
    res.status(500).json({ error: 'Failed to start service' })
  }
})

/**
 * POST /api/services/:serviceId/stop
 *
 * Stops a service using its configured make command.
 *
 * Executes the service's stop make command (e.g., "make stop-redis") to gracefully
 * shut down the service containers. For grouped services, stops all containers in the group.
 *
 * @param serviceId - Service identifier (e.g., "redis", "postgres", "opensearch")
 * @returns 200 with execution result (success, output, error)
 * @returns 400 if service has no stop command
 * @returns 404 if service not found in configuration
 * @returns 500 if unable to stop service
 */
router.post('/:serviceId/stop', async (req, res) => {
  try {
    const { serviceId } = req.params
    const service = SERVICES[serviceId as keyof typeof SERVICES]

    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    const makeCommands = service.makeCommands as { start?: string; stop?: string; logs?: string } | undefined

    if (!makeCommands || !makeCommands.stop) {
      return res.status(400).json({ error: 'Service cannot be stopped directly' })
    }

    const result = await runMakeCommand(makeCommands.stop)
    res.json(result)
  } catch (error) {
    logger.error(`Error stopping service ${req.params.serviceId}:`, error)
    res.status(500).json({ error: 'Failed to stop service' })
  }
})

/**
 * GET /api/services/:serviceId/logs
 *
 * Retrieves container logs for a specific service.
 *
 * Fetches the most recent logs from the service's container. The number of log lines
 * can be controlled via the 'tail' query parameter (default: 100 lines).
 * For grouped services, logs are not supported via this endpoint.
 *
 * @param serviceId - Service identifier (e.g., "redis", "postgres", "opensearch")
 * @param tail - Query parameter: number of lines to retrieve (default: 100)
 * @returns 200 with logs object containing log content
 * @returns 200 with "Container does not exist" message if container not found
 * @returns 400 if service is a grouped service
 * @returns 404 if service not found in configuration
 * @returns 500 if unable to retrieve logs
 */
router.get('/:serviceId/logs', async (req, res) => {
  try {
    const { serviceId } = req.params
    const tail = parseInt(req.query.tail as string) || 100
    const service = SERVICES[serviceId as keyof typeof SERVICES]

    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    // Check if this is a grouped service
    if ('containers' in service && service.containers) {
      return res.status(400).json({
        error: 'Cannot retrieve logs for grouped services. Use container-specific log commands instead.'
      })
    }

    const containerName = 'containerName' in service ? service.containerName : undefined

    if (!containerName) {
      return res.status(500).json({ error: 'Invalid service configuration - missing container name' })
    }

    const status = await getContainerStatus(containerName)

    if (!status.exists) {
      return res.json({ logs: 'Container does not exist' })
    }

    const logs = await dockerService.getContainerLogs(status.containerId!, tail)
    res.json({ logs })
  } catch (error) {
    logger.error(`Error getting logs for service ${req.params.serviceId}:`, error)
    res.status(500).json({ error: 'Failed to get logs' })
  }
})

export default router
