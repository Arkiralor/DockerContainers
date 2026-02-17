.PHONY: help install install-test install-dev test test-unit test-integration test-cov format lint type-check clean build

help:
	@echo "Docker Container TUI - Development Commands"
	@echo ""
	@echo "Installation:"
	@echo "  make install          Install runtime dependencies"
	@echo "  make install-test     Install with test dependencies"
	@echo "  make install-dev      Install with development dependencies"
	@echo ""
	@echo "Testing:"
	@echo "  make test            Run all tests"
	@echo "  make test-unit       Run only unit tests (fast)"
	@echo "  make test-integration  Run integration tests"
	@echo "  make test-cov        Run tests with coverage report"
	@echo "  make test-watch      Run tests in watch mode"
	@echo ""
	@echo "Code Quality:"
	@echo "  make format          Format code with black"
	@echo "  make lint            Lint code with ruff"
	@echo "  make type-check      Type check with mypy"
	@echo "  make quality         Run all quality checks"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean           Remove build artifacts"
	@echo "  make build           Build distribution packages"

install:
	./.scripts/install.sh

install-test:
	./.scripts/install-test.sh

install-dev:
	./.scripts/install-dev.sh

test:
	pytest

test-unit:
	pytest -m unit

test-integration:
	pytest -m integration

test-cov:
	pytest --cov=src --cov-report=html --cov-report=term

test-watch:
	pytest-watch

format:
	black src/ tests/

lint:
	ruff check src/ tests/

lint-fix:
	ruff check --fix src/ tests/

type-check:
	mypy src/

quality: format lint type-check test
	@echo "All quality checks passed!"

clean:
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info
	rm -rf .pytest_cache
	rm -rf .coverage
	rm -rf htmlcov/
	rm -rf .mypy_cache
	rm -rf .ruff_cache
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

build:
	python -m build
