import { http, HttpResponse } from 'msw'
import {
  mockContainers,
  mockContainerDetailedRunning,
  mockContainerDetailedStopped,
  mockVolumes,
  mockSystemInfo,
  mockContainerStats,
  mockServices,
} from './docker'

const API_URL = 'http://localhost:5001'

export const handlers = [
  // Container endpoints
  http.get(`${API_URL}/api/containers`, () => {
    return HttpResponse.json(mockContainers)
  }),

  http.get(`${API_URL}/api/containers/:id`, ({ params }) => {
    const { id } = params
    // Return detailed container response for inspect endpoint
    if (id === 'abcd1234567890' || id === 'abcd1234567890abcdef') {
      return HttpResponse.json(mockContainerDetailedRunning)
    }
    if (id === 'efgh0987654321' || id === 'efgh0987654321abcdef') {
      return HttpResponse.json(mockContainerDetailedStopped)
    }
    if (id === 'ijkl1122334455') {
      return HttpResponse.json({
        ...mockContainerDetailedRunning,
        Id: 'ijkl1122334455',
        Name: '/opensearch-node',
        Config: { ...mockContainerDetailedRunning.Config, Image: 'opensearchproject/opensearch:2.11.0' },
      })
    }
    return new HttpResponse(null, { status: 404 })
  }),

  http.post(`${API_URL}/api/containers/:id/start`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(`${API_URL}/api/containers/:id/stop`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(`${API_URL}/api/containers/:id/restart`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete(`${API_URL}/api/containers/:id`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${API_URL}/api/containers/:id/logs`, () => {
    return HttpResponse.text('Sample log line 1\nSample log line 2\nSample log line 3')
  }),

  http.get(`${API_URL}/api/containers/:id/stats`, () => {
    return HttpResponse.json(mockContainerStats)
  }),

  // Volume endpoints
  http.get(`${API_URL}/api/volumes`, () => {
    return HttpResponse.json(mockVolumes)
  }),

  http.get(`${API_URL}/api/volumes/:name`, ({ params }) => {
    const volume = mockVolumes.find((v) => v.Name === params.name)
    if (!volume) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(volume)
  }),

  http.delete(`${API_URL}/api/volumes/:name`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // System endpoints
  http.get(`${API_URL}/api/system/info`, () => {
    return HttpResponse.json(mockSystemInfo)
  }),

  http.get(`${API_URL}/api/system/version`, () => {
    return HttpResponse.json({ Version: '24.0.0', ApiVersion: '1.43' })
  }),

  http.get(`${API_URL}/api/system/ping`, () => {
    return HttpResponse.text('OK')
  }),

  // Service endpoints
  http.get(`${API_URL}/api/services`, () => {
    return HttpResponse.json(mockServices)
  }),

  http.get(`${API_URL}/api/services/:id`, ({ params }) => {
    const service = mockServices.find((s) => s.id === params.id)
    if (!service) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(service)
  }),

  http.post(`${API_URL}/api/services/:id/start`, () => {
    return HttpResponse.json({ success: true, message: 'Service started' })
  }),

  http.post(`${API_URL}/api/services/:id/stop`, () => {
    return HttpResponse.json({ success: true, message: 'Service stopped' })
  }),

  http.get(`${API_URL}/api/services/:id/logs`, () => {
    return HttpResponse.text('Service log line 1\nService log line 2')
  }),

  // Health check
  http.get(`${API_URL}/api/health`, () => {
    return HttpResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
  }),
]

// Error handlers for testing error scenarios
export const errorHandlers = {
  containerNotFound: http.get(`${API_URL}/api/containers/:id`, () => {
    return HttpResponse.json({ error: 'Container not found' }, { status: 404 })
  }),

  containerActionFailed: http.post(`${API_URL}/api/containers/:id/start`, () => {
    return HttpResponse.json({ error: 'Failed to start container' }, { status: 500 })
  }),

  networkError: http.get(`${API_URL}/api/containers`, () => {
    return HttpResponse.error()
  }),
}
