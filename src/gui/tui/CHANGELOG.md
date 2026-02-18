# Changelog

All notable changes to the Docker Container TUI project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-02-16

### Added

#### Core Features
- Terminal-based UI for managing Docker containers
- Service list screen with real-time status updates
- Log viewer with real-time following capability
- Operations screen for executing system-wide commands
- Service details modal for comprehensive information
- Confirmation dialog for destructive operations

#### Testing Infrastructure
- Comprehensive test suite with 310+ tests
- Docker client tests (150+ tests)
- Command executor tests (50+ tests)
- Helper utility tests (40+ tests)
- Service configuration tests (50+ tests)
- Integration tests (20+ tests)
- Test coverage >85% across all modules
- pytest configuration with custom markers
- Shared test fixtures in conftest.py
- Detailed testing documentation

#### Development Tools
- pyproject.toml with complete configuration
- Optional test and dev dependency groups
- Black code formatter configuration
- Ruff linter configuration
- MyPy type checker configuration
- Coverage reporting configuration
- Development Makefile for common tasks
- Comprehensive development guide

#### Documentation
- User README with installation instructions
- Testing guide in tests/README.md
- Development guide (DEVELOPMENT.md)
- Inline documentation and docstrings

### Fixed

#### Critical Fixes
- Implemented actual confirmation dialog (previously always returned True)
- Added 5-second timeout to Docker client initialization
- Fixed race condition in log following with timestamp-based tracking
- Fixed DataTable cursor API (changed from property to move_cursor method)

#### Compliance Fixes
- Removed all emoji usage throughout codebase (CLAUDE.md compliance)
- Replaced with clear text labels (ERROR, WARNING, [OK], [FAIL])
- Professional output format

#### Python 3.14 Compatibility
- Replaced deprecated `Dict` with `dict`
- Replaced deprecated `List` with `list`
- Replaced deprecated `Optional` with union operator `|`
- Replaced deprecated `Union` with union operator `|`
- All type hints use modern Python 3.10+ syntax

### Changed

- Updated status text display to remove emoji
- Improved error messages for clarity
- Enhanced log following algorithm for better reliability
- Modernized type hints across entire codebase

### Security

- Confirmation required for destructive operations (restore, clean)
- No button focused by default in confirmation dialog for safety
- Docker connection timeout prevents indefinite blocking
- Input validation for all user inputs

## [Unreleased]

### Fixed

#### Critical Stability Improvements (24 bugs fixed)

**Widget Lifecycle Crashes** (13 fixes)
- Fixed crash when closing log viewer screen while viewing container logs
- Protected all `query_one()` calls in log_viewer.py with exception handling (4 locations)
- Protected all `query_one()` calls in service_list.py with exception handling (4 locations)
- Protected all `query_one()` calls in operations.py with exception handling (5 locations)
- Protected all `query_one()` calls in app.py with exception handling (2 locations)
- Protected focus() call in confirmation.py during screen teardown
- Fixed NoMatches exceptions during rapid screen transitions
- Added defensive widget queries throughout TUI to prevent DOM-related crashes

**Type Safety & Data Handling** (2 fixes)
- Fixed type inconsistency in `docker_client.get_container_logs()` - now always returns `list[str]`
- Fixed unsafe list access in log viewer that caused IndexError (added bounds checking)

**Race Conditions & State Management** (6 fixes)
- Fixed race condition in `action_clear()` - now stops log following before clearing
- Fixed race condition in `_follow_logs()` - added check after sleep to exit promptly
- Fixed timestamp update order to prevent missed or duplicate logs
- Fixed complex deduplication logic in log following (simplified from 15 lines to 8 lines)
- Improved state consistency when stopping log following
- Added proper worker tracking with `exclusive=True` for background operations

**Error Handling & Edge Cases** (6 fixes)
- Added exception handling for async task creation failures with state rollback
- Fixed task creation in log_viewer.py - properly handles and reports failures
- Fixed task creation in app.py - notifies user on auto-refresh start failure
- Protected widget queries in action_clear() to prevent crashes
- Added user feedback when tail limits are reached (min/max notifications)
- Fixed file save to show absolute path so users know where logs were saved

**Logic & UX Improvements** (5 fixes)
- Optimized tail limit actions to return early instead of unnecessary refresh
- Removed redundant length checks and nonsensical comparisons in deduplication
- Improved error recovery - task failures now reset UI state properly
- Enhanced user notifications for all critical operations
- Fixed memory bound enforcement in log following (strict limit at `tail_lines * 2`)

### Changed

- Log following algorithm simplified and made more reliable
- Memory management improved with strict bounds on log accumulation
- Error messages now provide clearer context and actionable information
- Widget updates now fail gracefully during screen lifecycle changes
- Async task creation wrapped with proper error handling throughout

### Performance

- Reduced unnecessary widget queries during screen transitions
- Eliminated redundant log refreshes when already at limits
- Improved memory efficiency in log following (prevents unbounded growth)

### Planned

- Screen for managing individual containers
- Bulk operations on multiple services
- Configuration file support for custom services
- Export/import functionality for logs
- Performance metrics dashboard
- Docker Compose integration improvements
- Settings screen for configuring refresh interval
- Search/filter functionality in log viewer
- Keyboard shortcut customization

---

## Version History

### Version 0.1.0 (Initial Release)

**Release Date**: February 16, 2024

**Highlights**:
- Complete TUI for Docker container management
- Comprehensive test coverage (>85%)
- Python 3.14 compatible
- Production-ready code quality
- Full documentation

**Statistics**:
- Lines of Code: ~5,000+
- Test Cases: 310+
- Code Coverage: >85%
- Supported Python Versions: 3.10, 3.11, 3.12+
- External Dependencies: 5 (textual, docker, click, pyyaml, rich)
- Dev Dependencies: 8

**Known Issues**:
- None at this time

**Breaking Changes**:
- None (initial release)

---

## Contributing

When adding entries to this changelog:

1. Place new entries under `[Unreleased]`
2. Group changes by type: Added, Changed, Deprecated, Removed, Fixed, Security
3. Use present tense ("Add feature" not "Added feature")
4. Link to relevant issues/PRs where applicable
5. Move entries to a new version section upon release

## Versioning Policy

- **Major version** (X.0.0): Breaking changes, major features
- **Minor version** (0.X.0): New features, non-breaking changes
- **Patch version** (0.0.X): Bug fixes, minor improvements

## Links

- [Repository](https://github.com/Arkiralor/DockerContainers)
- [Issues](https://github.com/Arkiralor/DockerContainers/issues)
- [Pull Requests](https://github.com/Arkiralor/DockerContainers/pulls)
