# Contributing to Docker Containers

Thank you for your interest in contributing to this Docker containers repository.

## How to Contribute

### 1. Fork and Clone

1. Fork this repository
2. Clone your fork locally
3. Create a new branch for your changes

### 2. Making Changes

- Follow the existing directory structure for new services
- Each service should have its own directory with:
  - `docker-compose.yml`
  - `README.md`
  - `config/` directory for configuration files
  - `.env.example` file for environment variables

### 3. Testing

All code changes must include appropriate tests:

**For Docker Compose Services:**
- Test your Docker compositions locally
- Ensure all services start properly
- Verify connectivity between services if applicable
- Run any existing tests in the `test/` directory

**For Web GUIs (Client/Server):**
- Write unit tests for new components and functions
- Write integration tests for user workflows
- Maintain 80%+ code coverage
- All tests must pass before submitting PR
- Follow existing test patterns in the codebase

**Running Web GUI Tests:**
```bash
# Client tests
cd src/gui/web/client
npm test                 # Watch mode
npm run test:coverage    # With coverage

# Server tests
cd src/gui/web/server
npm test                 # Watch mode
npm run test:coverage    # With coverage
```

**Test Requirements:**
- Unit tests for all new functions/components
- Integration tests for user-facing features
- Mock external dependencies (Docker, APIs)
- Test both success and error paths
- Follow React Testing Library best practices (client)
- Use Supertest for API testing (server)

See [Testing Guide](docs/testing.md) for detailed information.

### 4. Documentation

- Update the main README.md if adding new services
- Include a service-specific README.md with:
  - Service description
  - Prerequisites
  - Setup instructions
  - Configuration options
  - Usage examples

### 5. Pull Request Guidelines

- Create a clear, descriptive PR title
- Include a detailed description of changes
- Reference any related issues
- Ensure all checks pass

## Code Standards

### Docker Compose Files

- Use version 3.8+ for docker-compose.yml
- Include proper service names and container names
- Use environment variables for configurable values
- Include necessary volumes and networks
- Add health checks where applicable

### Configuration Files

- Comment configuration files thoroughly
- Use secure defaults
- Provide examples for common use cases

### Environment Variables

- Provide `.env.example` files
- Use descriptive variable names
- Include comments explaining each variable
- Never commit actual `.env` files

## Getting Help

If you need help or have questions:

- Check existing issues and documentation
- Open a new issue for bugs or feature requests
- Follow the issue templates when available

## Code of Conduct

Please be respectful and professional in all interactions. We're here to learn and help each
other build better Docker setups.
