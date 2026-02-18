# Server Testing Guide

This directory contains all tests for the Express API server.

## Test Structure

```
tests/
├── setup.ts                   # Global test configuration
├── fixtures/                  # Test data and mocks
│   ├── docker.ts             # Mock Docker responses
│   ├── containers.ts         # Container test data
│   └── services.ts           # Service test data
├── routes/                   # API route tests
│   ├── containers.test.ts
│   ├── services.test.ts
│   ├── volumes.test.ts
│   └── system.test.ts
├── services/                 # Service class tests
│   ├── docker.test.ts
│   └── websocket.test.ts
└── integration/              # Integration tests
    ├── api-flow.test.ts
    └── websocket-flow.test.ts
```

## Running Tests

```bash
# Watch mode
npm test

# Single run
npm run test:run

# With coverage
npm run test:coverage

# Watch specific file
npm test containers.test
```

## Test Categories

### Route Tests (`routes/`)

Test Express route handlers:
- HTTP request/response
- Status codes
- Request validation
- Error handling

**Example**:
```typescript
import request from 'supertest'
import app from '@/index'

describe('GET /api/containers', () => {
  it('returns list of containers', async () => {
    const response = await request(app).get('/api/containers')

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
  })

  it('handles query parameters', async () => {
    const response = await request(app)
      .get('/api/containers')
      .query({ all: 'true' })

    expect(response.status).toBe(200)
  })
})
```

### Service Tests (`services/`)

Test business logic classes:
- Docker API interactions
- WebSocket management
- Error handling

**Example**:
```typescript
import { DockerService } from '@/services/docker'

vi.mock('dockerode')

describe('DockerService', () => {
  let dockerService: DockerService

  beforeEach(() => {
    dockerService = new DockerService()
  })

  it('lists containers successfully', async () => {
    const containers = await dockerService.listContainers()

    expect(Array.isArray(containers)).toBe(true)
  })
})
```

### Integration Tests (`integration/`)

Test complete request/response cycles:
- Full API workflows
- WebSocket connections
- Error propagation

**Example**:
```typescript
it('completes container management workflow', async () => {
  // List containers
  const listResponse = await request(app).get('/api/containers')
  const containerId = listResponse.body[0].Id

  // Start container
  await request(app)
    .post(`/api/containers/${containerId}/start`)
    .expect(204)

  // Verify status changed
  const detailResponse = await request(app)
    .get(`/api/containers/${containerId}`)

  expect(detailResponse.body.State).toBe('running')
})
```

## Mocking

### Docker Client Mocking

Dockerode is completely mocked using fixtures:

```typescript
import { createMockDockerodeClient } from '../fixtures/docker'

vi.mock('dockerode', () => ({
  default: vi.fn(() => createMockDockerodeClient()),
}))
```

### Child Process Mocking

Mock `child_process.exec` for Make command execution:

```typescript
vi.mock('child_process', () => ({
  exec: vi.fn((cmd, callback) => {
    callback(null, { stdout: 'Success', stderr: '' })
  }),
}))
```

### Socket.io Server Mocking

Mock Socket.io for WebSocket tests:

```typescript
vi.mock('socket.io', () => ({
  Server: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
  })),
}))
```

## Test Fixtures

Realistic test data in `fixtures/`:

**docker.ts**:
- `createMockDockerodeClient()` - Full Docker client mock
- `mockRunningContainer` - Container object with methods
- `mockStoppedContainer` - Stopped container

**containers.ts**:
- `mockContainerResponse` - API response format
- `mockContainerList` - Array of containers
- `mockContainerObject` - Container with Dockerode methods

**services.ts**:
- `mockServices` - Service status array
- `mockMakeCommandOutput` - Make command responses

## Writing Good Tests

### Test HTTP Layer

Focus on the API contract:

```typescript
// Good
it('returns 404 for non-existent container', async () => {
  const response =await request(app).get('/api/containers/invalid-id')

  expect(response.status).toBe(404)
  expect(response.body).toHaveProperty('error')
})

// Avoid implementation details
it('calls DockerService.getContainer', async () => {
  // Testing internal implementation
})
```

### Test Both Success and Failure

```typescript
describe('POST /api/containers/:id/start', () => {
  it('starts container successfully', async () => {
    const response = await request(app)
      .post('/api/containers/test-id/start')

    expect(response.status).toBe(204)
  })

  it('returns 500 when Docker operation fails', async () => {
    vi.mocked(DockerService.prototype.startContainer)
      .mockRejectedValue(new Error('Docker error'))

    const response = await request(app)
      .post('/api/containers/test-id/start')

    expect(response.status).toBe(500)
  })
})
```

### Clean Setup/Teardown

```typescript
describe('DockerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset state
  })

  afterEach(() => {
    // Cleanup
  })
})
```

## Supertest Patterns

### Basic Request

```typescript
await request(app)
  .get('/api/endpoint')
  .expect(200)
  .expect('Content-Type', /json/)
```

### With Body

```typescript
await request(app)
  .post('/api/endpoint')
  .send({ data: 'value' })
  .expect(201)
```

### With Headers

```typescript
await request(app)
  .get('/api/endpoint')
  .set('Authorization', 'Bearer token')
  .expect(200)
```

### With Query Parameters

```typescript
await request(app)
  .get('/api/endpoint')
  .query({ filter: 'value', limit: 10 })
  .expect(200)
```

## Coverage

Target: 80%+ coverage for all source files

View coverage:
```bash
npm run test:coverage
open coverage/index.html
```

Excluded from coverage:
- Test files
- Type definitions
- Configuration files

## Debugging

### Console Logging

```typescript
it('debugs response', async () => {
  const response = await request(app).get('/api/containers')
  console.log(response.body)  // Inspect response
})
```

### Run Single Test

```bash
npm test -- containers.test
npm test -- --grep="starts container"
```

### Watch Mode

Same commands as client:
- `f` - Failed tests only
- `t` - Filter by name
- `p` - Filter by file
- `q` - Quit

## Common Issues

**"Cannot find module '@/services'"**
- Check vitest.config.ts path resolution
- Ensure tsconfig.json paths are correct

**"Docker error: connect ENOENT"**
- Docker client is mocked, shouldn't connect
- Check vi.mock('dockerode') is before imports
- Verify mock implementation

**"Port already in use"**
- Don't start actual server in tests
- Use `request(app)` directly (no `.listen()`)
- Supertest handles port binding

## Best Practices

1. **Mock external dependencies** - Docker, file system, child processes
2. **Test the HTTP interface** - Not internal implementation
3. **Use descriptive test names** - "returns 404 for non-existent container"
4. **Test error cases** - Network errors, invalid input, Docker failures
5. **Fast tests** - All mocked, no real Docker/network calls
6. **Cleanup between tests** - Use beforeEach/afterEach
7. **Realistic fixtures** - Match actual API responses

## Environment Variables

Test environment variables are set in `tests/setup.ts`:

```typescript
process.env.NODE_ENV = 'test'
process.env.PORT = '5001'
process.env.LOG_LEVEL = 'error'
```

Override in specific tests:

```typescript
it('uses custom port', () => {
  process.env.PORT = '9000'
  // Test with custom port
})
```

## Resources

- [Vitest Docs](https://vitest.dev)
- [Supertest Docs](https://github.com/visionmedia/supertest)
- [Express Testing Guide](https://expressjs.com/en/guide/testing.html)
- [Main Testing Guide](../../../../docs/testing.md)
