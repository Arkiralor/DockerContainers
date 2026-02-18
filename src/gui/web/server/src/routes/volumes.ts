import { Router } from 'express'
import { dockerService } from '../services/docker.js'
import { logger } from '../utils/logger.js'

/**
 * Express router for Docker volume management endpoints.
 * Provides REST API for listing, inspecting, and removing Docker volumes.
 */
const router = Router()

/**
 * GET /api/volumes
 *
 * Lists all Docker volumes on the system.
 *
 * Returns an array of volume objects containing name, driver, mount point,
 * and other volume metadata.
 *
 * @returns 200 with array of volume objects
 * @returns 500 if unable to retrieve volume list
 */
router.get('/', async (req, res) => {
  try {
    const volumes = await dockerService.listVolumes()
    res.json(volumes)
  } catch (error) {
    logger.error('Error listing volumes:', error)
    res.status(500).json({ error: 'Failed to list volumes' })
  }
})

/**
 * GET /api/volumes/:name
 *
 * Retrieves detailed information about a specific volume.
 *
 * Returns comprehensive volume inspection data including driver, mount point,
 * labels, options, and scope.
 *
 * @param name - Volume name
 * @returns 200 with detailed volume object
 * @returns 500 if volume not found or unable to retrieve information
 */
router.get('/:name', async (req, res) => {
  try {
    const volume = await dockerService.getVolume(req.params.name)
    res.json(volume)
  } catch (error) {
    logger.error(`Error getting volume ${req.params.name}:`, error)
    res.status(500).json({ error: 'Failed to get volume' })
  }
})

/**
 * DELETE /api/volumes/:name
 *
 * Removes a volume from the system.
 *
 * Deletes the volume. If the volume is in use by a container, use query
 * parameter 'force=true' to forcefully remove it. Without force, volumes
 * in use cannot be removed.
 *
 * @param name - Volume name
 * @param force - Query parameter: if "true", forcefully removes volumes in use
 * @returns 200 with success object
 * @returns 500 if volume not found, in use (without force), or unable to remove
 */
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
