import { Router } from 'express'
import { dockerService } from '../services/docker.js'
import { logger } from '../utils/logger.js'

/**
 * Express router for Docker system information endpoints.
 * Provides REST API for retrieving Docker daemon information, version, and health status.
 */
const router = Router()

/**
 * GET /api/system/info
 *
 * Retrieves comprehensive Docker system information.
 *
 * Returns details about the Docker installation including number of containers,
 * images, storage driver, operating system, architecture, memory, CPU count, etc.
 *
 * @returns 200 with system information object
 * @returns 500 if unable to retrieve system information
 */
router.get('/info', async (req, res) => {
  try {
    const info = await dockerService.getSystemInfo()
    res.json(info)
  } catch (error) {
    logger.error('Error getting system info:', error)
    res.status(500).json({ error: 'Failed to get system info' })
  }
})

/**
 * GET /api/system/version
 *
 * Retrieves Docker version information.
 *
 * Returns version details about the Docker daemon, API version, Go version,
 * Git commit, build time, and platform information.
 *
 * @returns 200 with version information object
 * @returns 500 if unable to retrieve version information
 */
router.get('/version', async (req, res) => {
  try {
    const version = await dockerService.getVersion()
    res.json(version)
  } catch (error) {
    logger.error('Error getting Docker version:', error)
    res.status(500).json({ error: 'Failed to get Docker version' })
  }
})

/**
 * GET /api/system/ping
 *
 * Health check endpoint to verify Docker daemon connectivity.
 *
 * Simple ping to verify that the Docker daemon is reachable and responding.
 * Returns a boolean indicating whether the daemon is alive.
 *
 * @returns 200 with alive status object { alive: boolean }
 * @returns 500 if unable to ping Docker daemon
 */
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
