import { Router } from 'express'
import { dockerService } from '../services/docker.js'
import { logger } from '../utils/logger.js'

const router = Router()

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

router.get('/:id', async (req, res) => {
  try {
    const container = await dockerService.getContainer(req.params.id)
    res.json(container)
  } catch (error) {
    logger.error(`Error getting container ${req.params.id}:`, error)
    res.status(500).json({ error: 'Failed to get container' })
  }
})

router.post('/:id/start', async (req, res) => {
  try {
    const result = await dockerService.startContainer(req.params.id)
    res.json(result)
  } catch (error) {
    logger.error(`Error starting container ${req.params.id}:`, error)
    res.status(500).json({ error: 'Failed to start container' })
  }
})

router.post('/:id/stop', async (req, res) => {
  try {
    const result = await dockerService.stopContainer(req.params.id)
    res.json(result)
  } catch (error) {
    logger.error(`Error stopping container ${req.params.id}:`, error)
    res.status(500).json({ error: 'Failed to stop container' })
  }
})

router.post('/:id/restart', async (req, res) => {
  try {
    const result = await dockerService.restartContainer(req.params.id)
    res.json(result)
  } catch (error) {
    logger.error(`Error restarting container ${req.params.id}:`, error)
    res.status(500).json({ error: 'Failed to restart container' })
  }
})

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
