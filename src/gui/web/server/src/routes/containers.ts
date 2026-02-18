import { Router } from 'express'
import { dockerService } from '../services/docker.js'
import { logger } from '../utils/logger.js'

/**
 * Express router for container management endpoints.
 * Provides REST API for Docker container operations including listing, starting,
 * stopping, restarting, removing, and retrieving logs/stats.
 */
const router = Router()

/**
 * GET /api/containers
 *
 * Lists Docker containers.
 *
 * By default returns only running containers. Use query parameter 'all=true'
 * to include stopped containers.
 *
 * @param all - Query parameter: if "true", includes stopped containers
 * @returns 200 with array of container objects
 * @returns 500 if unable to retrieve container list
 */
router.get('/', async (req, res) => {
  try {
    const all = req.query.all === 'true'
    const containers = await dockerService.listContainers(all)
    res.json(containers)
  } catch (error) {
    logger.error('Error listing containers:', error)
    res.status(500).json({ error: 'Failed to list containers' })
  }
})

/**
 * GET /api/containers/:id
 *
 * Retrieves detailed information about a specific container.
 *
 * Returns comprehensive container inspection data including configuration,
 * state, network settings, mounts, and resource limits.
 *
 * @param id - Container ID or name
 * @returns 200 with detailed container object
 * @returns 500 if container not found or unable to retrieve information
 */
router.get('/:id', async (req, res) => {
  try {
    const container = await dockerService.getContainer(req.params.id)
    res.json(container)
  } catch (error) {
    logger.error(`Error getting container ${req.params.id}:`, error)
    res.status(500).json({ error: 'Failed to get container' })
  }
})

/**
 * POST /api/containers/:id/start
 *
 * Starts a stopped container.
 *
 * Sends the start command to Docker to begin running the container.
 * If the container is already running, this may result in an error.
 *
 * @param id - Container ID or name
 * @returns 200 with success object
 * @returns 500 if container not found, already running, or unable to start
 */
router.post('/:id/start', async (req, res) => {
  try {
    const result = await dockerService.startContainer(req.params.id)
    res.json(result)
  } catch (error) {
    logger.error(`Error starting container ${req.params.id}:`, error)
    res.status(500).json({ error: 'Failed to start container' })
  }
})

/**
 * POST /api/containers/:id/stop
 *
 * Stops a running container.
 *
 * Sends the stop command to Docker to gracefully shut down the container.
 * Docker will send SIGTERM and wait for the container to exit.
 *
 * @param id - Container ID or name
 * @returns 200 with success object
 * @returns 500 if container not found, already stopped, or unable to stop
 */
router.post('/:id/stop', async (req, res) => {
  try {
    const result = await dockerService.stopContainer(req.params.id)
    res.json(result)
  } catch (error) {
    logger.error(`Error stopping container ${req.params.id}:`, error)
    res.status(500).json({ error: 'Failed to stop container' })
  }
})

/**
 * POST /api/containers/:id/restart
 *
 * Restarts a container (stops then starts it).
 *
 * Sends the restart command to Docker which will gracefully stop the container
 * and immediately start it again.
 *
 * @param id - Container ID or name
 * @returns 200 with success object
 * @returns 500 if container not found or unable to restart
 */
router.post('/:id/restart', async (req, res) => {
  try {
    const result = await dockerService.restartContainer(req.params.id)
    res.json(result)
  } catch (error) {
    logger.error(`Error restarting container ${req.params.id}:`, error)
    res.status(500).json({ error: 'Failed to restart container' })
  }
})

/**
 * DELETE /api/containers/:id
 *
 * Removes a container from the system.
 *
 * Deletes the container. If the container is running, use query parameter
 * 'force=true' to forcefully remove it. Without force, running containers
 * cannot be removed.
 *
 * @param id - Container ID or name
 * @param force - Query parameter: if "true", forcefully removes running containers
 * @returns 200 with success object
 * @returns 500 if container not found, running (without force), or unable to remove
 */
router.delete('/:id', async (req, res) => {
  try {
    const force = req.query.force === 'true'
    const result = await dockerService.removeContainer(req.params.id, force)
    res.json(result)
  } catch (error) {
    logger.error(`Error removing container ${req.params.id}:`, error)
    res.status(500).json({ error: 'Failed to remove container' })
  }
})

/**
 * GET /api/containers/:id/logs
 *
 * Retrieves container logs.
 *
 * Fetches stdout and stderr logs from the container with timestamps.
 * The number of lines can be controlled via the 'tail' query parameter.
 *
 * @param id - Container ID or name
 * @param tail - Query parameter: number of lines to retrieve (default: 100)
 * @returns 200 with logs object containing log content as string
 * @returns 500 if container not found or unable to retrieve logs
 */
router.get('/:id/logs', async (req, res) => {
  try {
    const tail = req.query.tail ? parseInt(req.query.tail as string) : 100
    const logs = await dockerService.getContainerLogs(req.params.id, tail)
    res.json({ logs })
  } catch (error) {
    logger.error(`Error getting logs for container ${req.params.id}:`, error)
    res.status(500).json({ error: 'Failed to get container logs' })
  }
})

/**
 * GET /api/containers/:id/stats
 *
 * Retrieves real-time resource usage statistics for a container.
 *
 * Returns a snapshot of CPU, memory, network, and block I/O statistics.
 * This is not a streaming endpoint; each request returns a single snapshot.
 *
 * @param id - Container ID or name
 * @returns 200 with statistics object
 * @returns 500 if container not found or unable to retrieve stats
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const stats = await dockerService.getContainerStats(req.params.id)
    res.json(stats)
  } catch (error) {
    logger.error(`Error getting stats for container ${req.params.id}:`, error)
    res.status(500).json({ error: 'Failed to get container stats' })
  }
})

export default router
