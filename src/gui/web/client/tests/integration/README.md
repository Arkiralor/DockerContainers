# Integration Tests

This directory contains comprehensive integration tests for the Docker GUI web client. These tests validate complete user workflows and real-world scenarios using minimal mocking.

## Test Files

### 1. container-workflow.test.tsx (738 lines)

Tests complete container management workflows from a user's perspective.

**Coverage Areas:**
- List Containers
  - Display all project containers with status summary
  - Loading and error states
  - Empty state handling
  - Refresh functionality
- View Container Details
  - Open modal and display comprehensive information
  - Tab navigation (Overview, Configuration, Logs)
  - Modal close behavior
- Container Lifecycle Operations
  - Start stopped containers
  - Stop running containers with confirmation
  - Restart containers
  - Remove containers (with force option for running containers)
- Error Handling
  - Failed operations (port conflicts, timeouts)
  - Network errors
  - User-friendly error messages
- Cross-Component State Synchronization
  - List view and details modal consistency
- Complete User Workflows
  - End-to-end scenarios: view → details → action → logs

**Test Count:** 21 comprehensive integration tests

**Key Features:**
- Uses real ContainerList and ContainerDetailsModal components
- Tests user interactions with userEvent
- Mocks only the API layer via MSW
- Validates state synchronization between components
- Tests confirmation dialogs and user flows

### 2. service-management.test.tsx (983 lines)

Tests complete service management workflows for Docker Compose stacks.

**Coverage Areas:**
- List Services
  - Display all configured services with status
  - Loading, error, and empty states
  - Refresh functionality
- View Service Details
  - Modal with service information
  - Tab navigation (Overview, Logs)
  - Loading states
- Service Lifecycle Operations
  - Start stopped services
  - Stop running services with confirmation
  - Cancel operations
- Service Logs Viewing
  - Fetch and display multiple log entries
  - Handle empty logs
  - Error handling for log fetching
- Error Handling
  - Failed start/stop operations
  - Network errors
  - Detailed error messages
- State Synchronization
  - List view and modal consistency
  - State changes reflected across views
- Complete Workflows
  - View → start → check logs
  - Stop running service → verify status
- Service Status Indicators
  - Running, stopped, and non-existent services

**Test Count:** 28 comprehensive integration tests

**Key Features:**
- Uses real ServiceList and ServiceDetailsModal components
- Tests Docker Compose service management
- Validates confirmation dialogs
- Tests log viewing and multi-line output
- Handles service state transitions

### 3. websocket-realtime.test.tsx (944 lines)

Tests WebSocket functionality for real-time container and stats updates.

**Coverage Areas:**
- WebSocket Connection Management
  - Establish connection on mount
  - Handle connect/disconnect events
  - Cleanup on unmount
- Container List Real-time Updates
  - Subscribe/unsubscribe to container updates
  - Receive and display real-time data
  - Handle state changes (running, stopped)
  - Multiple container additions/removals
- Container Stats Streaming
  - Subscribe to stats for specific containers
  - Real-time CPU and memory updates
  - Handle rapid updates without flickering
  - Filter stats by container ID
- State Synchronization
  - Combine REST API initial data with WebSocket updates
  - Handle reconnection scenarios
- Error Handling
  - Malformed messages
  - Null values
  - Socket connection failures
- Performance
  - High-frequency updates
  - Resource cleanup
  - Multiple component subscriptions
- Complete Real-time Workflows
  - Connect → subscribe → receive → unsubscribe → disconnect
  - Sync state changes across WebSocket and UI

**Test Count:** 26 comprehensive integration tests

**Key Features:**
- Mocks Socket.IO client while testing real hook behavior
- Tests WebSocket lifecycle management
- Validates subscription/unsubscription flows
- Tests real-time data streaming
- Performance testing with rapid updates

## Testing Approach

### Integration vs Unit Tests

These are **integration tests**, not unit tests. The key differences:

| Aspect | Unit Tests | Integration Tests (These) |
|--------|-----------|---------------------------|
| Scope | Single function/component | Complete user workflows |
| Mocking | Mock most dependencies | Mock only external APIs |
| Components | Test in isolation | Test multiple components together |
| State | Simple, controlled | Real state management (React Query) |
| User Interaction | Minimal | Realistic user journeys |
| Purpose | Code correctness | Feature functionality |

### What We Mock

**Mocked (External Dependencies):**
- HTTP API calls (via MSW)
- WebSocket connections (via vitest mock)
- Docker daemon interactions

**Real (Application Code):**
- All React components
- React Query state management
- React hooks
- User interactions
- Component communication
- State synchronization

### MSW (Mock Service Worker)

All HTTP API calls are mocked using MSW, configured in `/tests/mocks/`:
- `handlers.ts` - API endpoint handlers
- `docker.ts` - Mock data (containers, services, stats)
- `server.ts` - MSW server setup

MSW intercepts network requests at the network level, making tests more realistic than mocking fetch/axios directly.

## Running the Tests

### Run All Integration Tests

```bash
npm test -- tests/integration
```

### Run Specific Test File

```bash
npm test -- tests/integration/container-workflow.test.tsx
npm test -- tests/integration/service-management.test.tsx
npm test -- tests/integration/websocket-realtime.test.tsx
```

### Run Tests in Watch Mode

```bash
npm test -- tests/integration --watch
```

### Run with Coverage

```bash
npm run test:coverage -- tests/integration
```

### Run in UI Mode

```bash
npm run test:ui
```

Then filter to "integration" to see only these tests.

## Test Structure

All integration tests follow a consistent structure:

```typescript
describe('Feature Area Integration Tests', () => {
  let queryClient: QueryClient
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    // Fresh QueryClient for each test (no state pollution)
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    })
    user = userEvent.setup()
  })

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ComponentUnderTest />
      </QueryClientProvider>
    )
  }

  describe('Specific Workflow', () => {
    it('should complete user journey', async () => {
      renderComponent()

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Expected Content')).toBeInTheDocument()
      })

      // Simulate user interaction
      await user.click(screen.getByRole('button', { name: /action/i }))

      // Verify result
      await waitFor(() => {
        expect(screen.getByText('Result')).toBeInTheDocument()
      })
    })
  })
})
```

## Key Testing Patterns

### 1. User-Centric Testing

Tests are written from the user's perspective:

```typescript
// Good - user perspective
const startButton = screen.getByRole('button', { name: /start/i })
await user.click(startButton)
expect(screen.getByText(/running/i)).toBeInTheDocument()

// Avoid - implementation details
expect(component.state.containers[0].status).toBe('running')
```

### 2. Async Operations

Always use `waitFor` for async operations:

```typescript
await waitFor(() => {
  expect(screen.getByText('Loaded Data')).toBeInTheDocument()
})
```

### 3. Modal Interactions

Test modal workflows completely:

```typescript
// Open modal
await user.click(screen.getByRole('button', { name: /view details/i }))

// Verify modal content
await waitFor(() => {
  expect(screen.getByText(/container:/i)).toBeInTheDocument()
})

// Close modal
const closeButton = screen.getByRole('button', { name: /close/i })
await user.click(closeButton)

// Verify modal closed
await waitFor(() => {
  expect(screen.queryByText(/container:/i)).not.toBeInTheDocument()
})
```

### 4. Confirmation Dialogs

Test the full confirmation flow:

```typescript
// Trigger action that needs confirmation
await user.click(screen.getByRole('button', { name: /stop/i }))

// Verify dialog appears
await waitFor(() => {
  expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
})

// Confirm action
await user.click(screen.getByRole('button', { name: /confirm/i }))

// Verify result
await waitFor(() => {
  expect(containerStopped).toBe(true)
})
```

### 5. WebSocket Testing

Mock Socket.IO while testing real hook behavior:

```typescript
// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}))

// In test: simulate WebSocket event
const updateHandler = mockSocket.on.mock.calls.find(
  (call) => call[0] === 'containers:update'
)?.[1]

await act(async () => {
  if (updateHandler) {
    updateHandler(newData)
  }
})
```

## Best Practices

### DO

- Test complete user workflows, not individual functions
- Use `screen.getByRole` for better accessibility testing
- Use `userEvent` for realistic user interactions
- Test error states and edge cases
- Verify loading states
- Clean up state between tests (fresh QueryClient)
- Use meaningful test descriptions
- Test cross-component interactions
- Validate state synchronization

### DON'T

- Mock React components
- Mock React Query
- Mock internal application code
- Test implementation details
- Skip error handling tests
- Ignore async operations
- Share state between tests
- Use `fireEvent` instead of `userEvent`

## Debugging Tests

### View Test Output

```bash
npm test -- tests/integration --reporter=verbose
```

### Debug Specific Test

```typescript
it.only('should test specific scenario', async () => {
  // Only this test will run
})
```

### View Rendered DOM

```typescript
import { screen } from '@testing-library/react'

// Add this in your test
screen.debug() // Prints current DOM
screen.debug(screen.getByRole('button')) // Debug specific element
```

### Check What's Queryable

```typescript
screen.logTestingPlaygroundURL() // Get playground URL for current DOM
```

## Coverage Goals

These integration tests complement the unit tests in `/tests/components/` and `/tests/hooks/`.

**Coverage Focus:**
- User workflows: 100%
- Happy paths: 100%
- Error scenarios: 90%+
- Edge cases: 80%+

**Not Covered Here:**
- Individual component rendering (unit tests)
- Hook logic in isolation (hook tests)
- Pure functions (service tests)
- API service classes (service tests)

## Maintenance

### Updating Tests When UI Changes

When components change, update tests to match:

1. Update selectors if button text/labels change
2. Adjust wait conditions if loading behavior changes
3. Update mock data if API responses change
4. Verify test still represents user workflow

### Adding New Tests

When adding new features:

1. Identify the complete user workflow
2. Create describe block for the workflow
3. Write tests for happy path
4. Add error/edge case tests
5. Test state synchronization if applicable
6. Update this README if adding new file

## Common Issues

### Tests Timing Out

**Problem:** Test hangs waiting for element

**Solution:**
```typescript
// Add explicit timeout
await waitFor(() => {
  expect(screen.getByText('Content')).toBeInTheDocument()
}, { timeout: 5000 })

// Or check if waiting for wrong thing
screen.debug() // See what's actually rendered
```

### Act Warnings

**Problem:** "Warning: An update to Component was not wrapped in act(...)"

**Solution:**
```typescript
// Wrap state updates in act
await act(async () => {
  updateHandler(newData)
})

// Or use waitFor
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument()
})
```

### Query Not Found

**Problem:** "Unable to find element with role..."

**Solution:**
```typescript
// Use more flexible queries
screen.getByText(/partial match/i)
screen.queryByRole('button') // Returns null instead of throwing

// Or wait for async rendering
await waitFor(() => {
  expect(screen.getByRole('button')).toBeInTheDocument()
})
```

### MSW Not Intercepting

**Problem:** Real network request made instead of mock

**Solution:**
```typescript
// Verify MSW is set up in setup.ts
// Check handler matches exact URL
http.get('http://localhost:5001/api/containers', ...)

// Verify server.listen() is called in beforeAll
```

## Related Documentation

- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [User Event Documentation](https://testing-library.com/docs/user-event/intro/)
- Main test README: `/tests/README.md`
- Component unit tests: `/tests/components/`
- Hook tests: `/tests/hooks/`
- Service tests: `/tests/services/`

## Statistics

- **Total Test Files:** 3
- **Total Tests:** 75 integration tests
- **Total Lines of Code:** 2,665 lines
- **Coverage Areas:** Container management, Service management, WebSocket real-time
- **Test Types:** Workflows, state sync, error handling, user interactions
- **Mock Strategy:** External APIs only (MSW + Socket.IO mock)
- **Real Components:** All React components, hooks, and state management
