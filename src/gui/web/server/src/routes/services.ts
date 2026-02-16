import { Router } from 'express'
import { exec } from 'child_process'
import { promisify } from 'util'
import { logger } from '../utils/logger.js'
import { dockerService } from '../services/docker.js'
import { SERVICES } from '../config/services.js'

const execAsync = promisify(exec)
const router = Router()

const REPO_ROOT = process.env.REPO_ROOT || '/Users/arkiralor/Developer/DockerContainers'

async function runMakeCommand(command: string): Promise<{ success: boolean; output: string; error?: string }> {
  try {
    const { stdout, stderr } = await execAsync(`make ${command}`, {
      cwd: REPO_ROOT,
      timeout: 60000
    })
    logger.info(`Make command '${command}' executed successfully`)
    return { success: true, output: stdout, error: stderr }
  } catch (error: any) {
    logger.error(`Make command '${command}' failed:`, error)
    return { success: false, output: error.stdout || '', error: error.stderr || error.message }
  }
}

async function getContainerStatus(containerName: string) {
  try {
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
  } catch (error) {
    logger.error(`Error getting status for ${containerName}:`, error)
    return { exists: false, running: false, error: 'Failed to get status' }
  }
}

router.get('/', async (req, res) => {
  try {
    const services = Object.values(SERVICES)
    const statuses = await Promise.all(
      services.map(async (service) => {
        const status = await getContainerStatus(service.containerName)
        return {
          id: service.id,
          name: service.name,
          description: service.description,
          containerName: service.containerName,
          ports: service.ports,
          ...status
        }
      })
    )
    res.json(statuses)
  } catch (error) {
    logger.error('Error listing services:', error)
    res.status(500).json({ error: 'Failed to list services' })
  }
})

router.get('/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params
    const service = SERVICES[serviceId as keyof typeof SERVICES]

    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    const status = await getContainerStatus(service.containerName)
    res.json({
      id: service.id,
      name: service.name,
      description: service.description,
      containerName: service.containerName,
      ports: service.ports,
      ...status
    })
  } catch (error) {
    logger.error(`Error getting service ${req.params.serviceId}:`, error)
    res.status(500).json({ error: 'Failed to get service' })
  }
})

router.post('/:serviceId/start', async (req, res) => {
  try {
    const { serviceId } = req.params
    const service = SERVICES[serviceId as keyof typeof SERVICES]

    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    // Dashboards is controlled by OpenSearch compose file
    if (serviceId === 'dashboards') {
      return res.status(400).json({
        error: 'OpenSearch Dashboards starts automatically with OpenSearch. Please start OpenSearch instead.'
      })
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

router.post('/:serviceId/stop', async (req, res) => {
  try {
    const { serviceId } = req.params
    const service = SERVICES[serviceId as keyof typeof SERVICES]

    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    // Dashboards is controlled by OpenSearch compose file
    if (serviceId === 'dashboards') {
      return res.status(400).json({
        error: 'OpenSearch Dashboards stops automatically with OpenSearch. Please stop OpenSearch instead.'
      })
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

router.get('/:serviceId/logs', async (req, res) => {
  try {
    const { serviceId } = req.params
    const tail = parseInt(req.query.tail as string) || 100
    const service = SERVICES[serviceId as keyof typeof SERVICES]

    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    const status = await getContainerStatus(service.containerName)

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
