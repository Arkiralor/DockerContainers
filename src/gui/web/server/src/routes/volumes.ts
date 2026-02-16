import { Router } from 'express'
import { dockerService } from '../services/docker.js'
import { logger } from '../utils/logger.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const volumes = await dockerService.listVolumes()
    res.json(volumes)
  } catch (error) {
    logger.error('Error listing volumes:', error)
    res.status(500).json({ error: 'Failed to list volumes' })
  }
})

router.get('/:name', async (req, res) => {
  try {
    const volume = await dockerService.getVolume(req.params.name)
    res.json(volume)
  } catch (error) {
    logger.error(`Error getting volume ${req.params.name}:`, error)
    res.status(500).json({ error: 'Failed to get volume' })
  }
})

router.delete('/:name', async (req, res) => {
  try {
    const force = req.query.force === 'true'
    const result = await dockerService.removeVolume(req.params.name, force)
    res.json(result)
  } catch (error) {
    logger.error(`Error removing volume ${req.params.name}:`, error)
    res.status(500).json({ error: 'Failed to remove volume' })
  }
})

export default router
