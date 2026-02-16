import { Router } from 'express'
import { dockerService } from '../services/docker.js'
import { logger } from '../utils/logger.js'

const router = Router()

router.get('/info', async (req, res) => {
  try {
    const info = await dockerService.getSystemInfo()
    res.json(info)
  } catch (error) {
    logger.error('Error getting system info:', error)
    res.status(500).json({ error: 'Failed to get system info' })
  }
})

router.get('/version', async (req, res) => {
  try {
    const version = await dockerService.getVersion()
    res.json(version)
  } catch (error) {
    logger.error('Error getting Docker version:', error)
    res.status(500).json({ error: 'Failed to get Docker version' })
  }
})

router.get('/ping', async (req, res) => {
  try {
    const isAlive = await dockerService.ping()
    res.json({ alive: isAlive })
  } catch (error) {
    logger.error('Error pinging Docker:', error)
    res.status(500).json({ error: 'Failed to ping Docker' })
  }
})

export default router
