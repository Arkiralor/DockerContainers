# Client Testing Guide

This directory contains all tests for the React web client application.

## Test Structure

```
tests/
├── setup.ts                    # Global test configuration
├── mocks/                      # Mock data and handlers
│   ├── server.ts              # MSW server setup
│   ├── handlers.ts            # API request handlers
│   ├── docker.ts              # Mock Docker data
│   └── websocket.ts           # Mock Socket.io client
├── components/                # Component tests
├── hooks/                     # Custom hook tests
├── services/                  # Service layer tests
└── integration/               # Integration tests
```

## Running Tests

```bash
# Watch mode (recommended for development)
npm test

# Single run (for CI)
npm run test:run

# With coverage
npm run test:coverage

# With UI
npm run test:ui

# Watch specific file
npm test ContainerCard
```

## Test Categories

### Component Tests (`components/`)

Test React components in isolation:
- Rendering with various props
- User interactions
- Conditional rendering
- Loading and error states
- Accessibility

**Example**:
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContainerCard from '@/components/ContainerCard'

it('calls onStart when start button clicked', async () => {
  const user = userEvent.setup()
  const onStart = vi.fn()

  render(<ContainerCard container={mockContainer} onStart={onStart} />)
  await user.click(screen.getByRole('button', { name: /start/i }))

  expect(onStart).toHaveBeenCalledWith(mockContainer.Id)
})
```

### Hook Tests (`hooks/`)

Test custom React hooks:
- Data fetching with React Query
- WebSocket connections
- State management

**Example**:
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useContainers } from '@/hooks/useApi'

it('fetches containers successfully', async () => {
  const { result } = renderHook(() => useContainers(), {
    wrapper: createQueryWrapper()
  })

  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data).toHaveLength(3)
})
```

### Service Tests (`services/`)

Test API service classes:
- HTTP requests
- Error handling
- Request/response transformation

**Example**:
```typescript
it('starts container via API', async () => {
  const containerId = 'test-123'
  await apiService.startContainer(containerId)

  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining(`/api/containers/${containerId}/start`),
    expect.objectContaining({ method: 'POST' })
  )
})
```

### Integration Tests (`integration/`)

Test complete user workflows:
- Multi-component interactions
- Real user scenarios
- Navigation flows

**Example**:
```typescript
it('completes full container management workflow', async () => {
  const user = userEvent.setup()
  render(<App />)

  // View container list
  await waitFor(() => expect(screen.getByText('postgres')).toBeInTheDocument())

  // Open details
  await user.click(screen.getByRole('button', { name: /details/i }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()

  // Perform action
  await user.click(screen.getByRole('button', { name: /stop/i }))
  await waitFor(() => expect(screen.getByText(/stopped/i)).toBeInTheDocument())
})
```

## Mocking

### API Mocking (MSW)

All API requests are mocked using MSW. Handlers are defined in `mocks/handlers.ts`:

```typescript
// Default behavior (success responses)
import { server } from './mocks/server'

// Override for specific test
server.use(
  http.get('/api/containers', () => {
    return HttpResponse.json([],  {status: 500 })
  })
)
```

### React Query Setup

Use the provided wrapper for hooks that depend on React Query:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const createQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### WebSocket Mocking

Socket.io client is mocked in `mocks/websocket.ts`. All socket interactions are simulated.

## Mock Data

Realistic mock data is available in `mocks/docker.ts`:

- `mockContainerRunning` - Running container
- `mockContainerStopped` - Stopped container
- `mockContainers` - Array of containers
- `mockVolumes` - Docker volumes
- `mockSystemInfo` - System information
- `mockServices` - Service statuses

## Writing Good Tests

### Use Semantic Queries

Prefer queries that match how users interact:

```typescript
// Good
screen.getByRole('button', { name: /start/i })
screen.getByLabelText(/container name/i)
screen.getByText('PostgreSQL')

// Avoid
screen.getByTestId('start-button')
container.querySelector('.button')
```

### Test User Behavior

Focus on what users see and do:

```typescript
// Good
it('shows error message when API fails', async () => {
  server.use(/* errorresponse */)
  render(<ContainerList />)
  await waitFor(() => {
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
  })
})

// Avoid
it('sets error state to true', () => {
  // Testing implementation details
})
```

### Async Operations

Always use `waitFor` for async assertions:

```typescript
await waitFor(() => {
  expect(screen.getByText('Data loaded')).toBeInTheDocument()
})
```

### Clean Up

Tests auto-cleanup, but be aware of:
- Timers (use `vi.useFakeTimers()`)
- WebSocket connections (clean up in `afterEach`)
- Event listeners (remove in cleanup)

## Coverage

Target: 80%+ coverage for all files

View coverage:
```bash
npm run test:coverage
open coverage/index.html
```

## Debugging

### See What's Rendered

```typescript
import { screen } from '@testing-library/react'

screen.debug()  // Print entire DOM
screen.debug(screen.getByText('Something'))  // Print specific element
```

### Run Single Test

```bash
npm test -- ContainerCard.test
npm test -- --grep="renders container"
```

### Watch Mode Commands

- `f` - Run only failed tests
- `t` - Filter by test name
- `p` - Filter by file pattern
- `a` - Run all tests
- `q` - Quit

## Common Issues

**"Cannot find module '@/components'"**
- Path aliases are configured in vit est.config.ts
- Ensure imports match the alias configuration

**"Test timeout"**
- Increase timeout: `it('test', { timeout: 10000 }, async () => {})`
- Check for unresolved promises
- Verify all async operations use `await`

**"Element not found"**
- Use `screen.debug()` to see what's rendered
- Check if element appears after async operation
- Use `waitFor` for elements that appear after loading

## Best Practices

1. **One concept per test** - Keep tests focused
2. **Descriptive test names** - "calls onStart when start button clicked"
3. **Test success and failure** - Happy path and error cases
4. **Use real data** - Mock data should be realistic
5. **Avoid implementation details** - Test behavior, not internals
6. **Cleanup side effects** - Prevent test pollution
7. **Fast tests** - Mock external dependencies

## Resources

- [React Testing Library Docs](https://testing-library.com/react)
- [Vitest Docs](https://vitest.dev)
- [MSW Docs](https://mswjs.io)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Main Testing Guide](../../../../docs/testing.md)
