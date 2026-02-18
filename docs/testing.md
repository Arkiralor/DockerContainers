# Testing Guide

This document provides comprehensive guidance for testing in the DockerContainers project, with specific focus on the web GUI testing infrastructure.

## Overview

The project uses a modern testing stack with high standards:
- **Coverage Target**: 80%+ for all code
- **Frameworks**: Vitest for both client and server
- **Testing Levels**: Unit, integration, and E2E tests
- **Philosophy**: Fast, reliable, and maintainable tests

## Testing Stack

### Client Testing (React Web GUI)

**Framework & Tools**:
- **Vitest** - Fast test runner with native Vite integration
- **React Testing Library** - User-centric component testing
- **@testing-library/jest-dom** - DOM matchers
- **@testing-library/user-event** - User interaction simulation
- **MSW (Mock Service Worker)** - API mocking
- **Happy-DOM** - Lightweight DOM implementation

**Location**: `src/gui/web/client/tests/`

### Server Testing (Express API)

**Framework & Tools**:
- **Vitest** - Consistent with client
- **Supertest** - HTTP assertions
- **Node environment** - Native Node.js testing

**Location**: `src/gui/web/server/tests/`

### TUI Testing (Python Terminal UI)

**Framework**: pytest with comprehensive fixtures

**Location**: `src/gui/tui/tests/`

## Quick Start

### Running Tests

**Client**:
```bash
cd src/gui/web/client
npm test                # Watch mode
npm run test:run        # Single run
npm run test:coverage   # With coverage
npm run test:ui         # Interactive UI
```

**Server**:
```bash
cd src/gui/web/server
npm test                # Watch mode
npm run test:run        # Single run
npm run test:coverage   # With coverage
```

**TUI**:
```bash
cd src/gui/tui
source env/bin/activate
pytest                  # All tests
pytest --cov=src        # With coverage
pytest -m unit          # Only unit tests
```

## Test Organization

### Client Test Structure

```
src/gui/web/client/tests/
├── setup.ts                    # Global test setup
├── mocks/
│   ├── server.ts              # MSW server configuration
│   ├── handlers.ts            # API response handlers
│   ├── docker.ts              # Mock Docker data
│   └── websocket.ts           # Mock Socket.io client
├── components/                # Component tests
│   ├── ContainerCard.test.tsx
│   ├── Dashboard.test.tsx
│   └── ...
├── hooks/                     # Custom hook tests
│   ├── useApi.test.ts
│   ├── useServices.test.ts
│   └── useWebSocket.test.ts
├── services/                  # Service layer tests
│   ├── api.test.ts
│   └── servicesApi.test.ts
└── integration/               # Integration tests
    ├── container-workflow.test.tsx
    └── service-management.test.tsx
```

### Server Test Structure

```
src/gui/web/server/tests/
├── setup.ts                   # Global test setup
├── fixtures/                  # Test data
│   ├── docker.ts
│   ├── containers.ts
│   └── services.ts
├── routes/                    # Route handler tests
│   ├── containers.test.ts
│   ├── services.test.ts
│   ├── volumes.test.ts
│   └── system.test.ts
├── services/                  # Service class tests
│   ├── docker.test.ts
│   └── websocket.test.ts
└── integration/               # Integration tests
    ├── api-flow.test.ts
    └── websocket-flow.test.ts
```

## Writing Tests

### Client Component Tests

**Pattern**:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  describe('Rendering', () => {
    it('renders with props', () => {
      render(<MyComponent title="Test" />)
      expect(screen.getByText('Test')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('handles button click', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()

      render(<MyComponent onClick={onClick} />)
      await user.click(screen.getByRole('button'))

      expect(onClick).toHaveBeenCalledTimes(1)
    })
  })
})
```

### Client Hook Tests

**Pattern**:
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMyHook } from '@/hooks/useMyHook'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useMyHook', () => {
  it('fetches data successfully', async () => {
    const { result } = renderHook(() => useMyHook(), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })
})
```

### Server Route Tests

**Pattern**:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '@/index'

vi.mock('@/services/docker')

describe('GET /api/containers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns list of containers', async () => {
    const response = await request(app).get('/api/containers')

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
  })

  it('handles errors gracefully', async () => {
    vi.mocked(DockerService.prototype.listContainers)
      .mockRejectedValue(new Error('Docker error'))

    const response = await request(app).get('/api/containers')

    expect(response.status).toBe(500)
    expect(response.body).toHaveProperty('error')
  })
})
```

### Server Service Tests

**Pattern**:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DockerService } from '@/services/docker'
import Dockerode from 'dockerode'

vi.mock('dockerode')

describe('DockerService', () => {
  let dockerService: DockerService
  let mockDockerClient: any

  beforeEach(() => {
    mockDockerClient = {
      ping: vi.fn().mockResolvedValue(true),
    }
    vi.mocked(Dockerode).mockImplementation(() => mockDockerClient)
    dockerService = new DockerService()
  })

  it('connects to Docker daemon', async () => {
    const result = await dockerService.ping()
    expect(result).toBe(true)
  })
})
```

## Mocking Strategies

### API Mocking (MSW)

Mock all HTTP requests for consistent,fast tests:

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/containers', () => {
    return HttpResponse.json(mockContainers)
  }),

  http.post('/api/containers/:id/start', () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
```

### React Query Mocking

Provide test-specific QueryClient:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, gcTime: 0 },
    mutations: { retry: false },
  },
})
```

### Docker Client Mocking

Mock dockerode completely:

```typescript
vi.mock('dockerode', () => ({
  default: vi.fn(() => ({
    ping: vi.fn().mockResolvedValue(true),
    listContainers: vi.fn().mockResolvedValue([]),
  })),
}))
```

### WebSocket Mocking

Mock Socket.io client:

```typescript
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
}))
```

## Coverage Requirements

### Thresholds

All code must meet these coverage thresholds:
- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

### Viewing Coverage

**HTML Reports**:
```bash
npm run test:coverage
open coverage/index.html
```

**Terminal Output**:
```bash
npm run test:coverage
```

### Excluded from Coverage

- Test files themselves
- Type declaration files (*.d.ts)
- Entry points (main.tsx, index.ts)
- Configuration files

## Best Practices

### General Principles

1. **Test Behavior, Not Implementation**
   - Focus on what users see and do
   - Avoid testing internal state
   - Use semantic queries (getByRole, getByLabelText)

2. **Follow AAA Pattern**
   - Arrange: Set up test data
   - Act: Perform the action
   - Assert: Verify the result

3. **One Assertion Per Test** (when possible)
   - Makes failures easier to diagnose
   - Keeps tests focused

4. **Test Success and Failure Paths**
   - Happy path (success)
   - Error path (failures)
   - Edge cases (empty data, null values)

### Component Testing

**Do**:
- Test from user's perspective
- Use accessible queries (role, label, text)
- Simulate real user interactions
- Test loading and error states

**Don't**:
- Test implementation details
- Use data-testid unless necessary
- Test third-party library internals
- Over-mock (use real components when possible)

### Hook Testing

**Do**:
- Use renderHook from React Testing Library
- Provide proper wrapper (QueryClient, Router, etc.)
- Test async behavior with waitFor
- Test success, loading, and error states

**Don't**:
- Call hooks outside of React components
- Test hook implementation details
- Forget to cleanup side effects

### Integration Testing

**Do**:
- Test realistic user workflows
- Use fewer mocks (more real components)
- Verify cross-component interactions
- Test routing and navigation

**Don't**:
- Make integration tests too large
- Test everything in one test
- Forget about accessibility

## Debugging Tests

### Console Logging

```typescript
import { screen } from '@testing-library/react'

// See what's rendered
screen.debug()

// See specific element
screen.debug(screen.getByText('Hello'))
```

### Query Debugging

```typescript
// See all available roles
screen.logTestingPlaygroundURL()
```

### Running Single Test

```bash
npm test -- ContainerCard
npm test -- --grep="renders container"
```

### Watch Mode Tips

- Press `f` to run only failed tests
- Press `t` to filter by test name pattern
- Press `p` to filter by file name pattern
- Press `a` to run all tests

## Continuous Integration

### Pre-commit Checks

Before committing:
```bash
npm run lint        # Check code style
npm run test:run    # Run all tests
npm run test:coverage  # Verify coverage
```

### CI Pipeline

Tests run automatically on:
- Pull requests
- Main branch commits
- Release tags

## Common Patterns

### Testing Modals

```typescript
it('opens and closes modal', async () => {
  const user = userEvent.setup()
  render(<ComponentWithModal />)

  // Open modal
  await user.click(screen.getByRole('button', { name: /open/i }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()

  // Close modal
  await user.click(screen.getByRole('button', { name: /close/i }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
```

### Testing Forms

```typescript
it('submits form data', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn()

  render(<Form onSubmit={onSubmit} />)

  await user.type(screen.getByLabelText(/name/i), 'John')
  await user.type(screen.getByLabelText(/email/i), 'john@example.com')
  await user.click(screen.getByRole('button', { name: /submit/i }))

  expect(onSubmit).toHaveBeenCalledWith({
    name: 'John',
    email: 'john@example.com',
  })
})
```

### Testing Async Operations

```typescript
it('loads data asynchronously', async () => {
  render(<AsyncComponent />)

  // Initially loading
  expect(screen.getByText(/loading/i)).toBeInTheDocument()

  // Wait for data
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
  })

  expect(screen.getByText(/data loaded/i)).toBeInTheDocument()
})
```

## Troubleshooting

### Common Issues

**"Cannot find module '@/components/...'"**
- Check vitest.config.ts has correct path aliases
- Ensure tsconfig.json paths match

**"ReferenceError: window is not defined"**
- Ensure test environment is set to 'happy-dom' or 'jsdom'
- Check vitest.config.ts environment setting

**Tests timeout**
- Increase timeout in test: `it('test', { timeout: 10000 }, async () => {})`
- Check for unresolved promises
- Verify mock implementations resolve/reject

**"Cannot read property 'mockResolvedValue' of undefined"**
- Ensure vi.mock() is before imports
- Check mock path matches actual module path
- Verify TypeScript types with vi.mocked()

### Getting Help

1. Check this documentation
2. Review existing test files for examples
3. Check Vitest documentation: https://vitest.dev
4. Check React Testing Library docs: https://testing-library.com/react
5. Open an issue in the repository

## Maintenance

### Updating Dependencies

```bash
npm update vitest @vitest/coverage-v8
npm update @testing-library/react @testing-library/user-event
```

### Adding New Test Suites

1. Create test file following naming convention
2. Import necessary testing utilities
3. Write tests following established patterns
4. Ensure coverage meets thresholds
5. Update this documentation if introducing new patterns

## Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
