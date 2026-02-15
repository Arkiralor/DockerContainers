.PHONY: help setup start stop restart status backup restore test lint lint-shell lint-yaml lint-markdown lint-compose clean logs-redis logs-postgres logs-opensearch network-create

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "Docker Containers - Available Commands"
	@echo "======================================"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

setup: ## Initial setup: create .env files and data directories
	@echo "🚀 Running initial setup..."
	@./scripts/setup.sh

start: ## Start all services
	@echo "▶️  Starting all services..."
	@./scripts/start-all.sh

stop: ## Stop all services
	@echo "⏸️  Stopping all services..."
	@./scripts/stop-all.sh

restart: stop start ## Restart all services
	@echo "🔄 Services restarted"

status: ## Show status of all services
	@./scripts/status.sh

backup: ## Create backups of all services
	@echo "💾 Creating backups..."
	@./scripts/backup.sh

restore: ## Restore services from backup
	@echo "🔄 Starting restore process..."
	@./scripts/restore.sh

test: ## Run automated tests
	@echo "🧪 Running tests..."
	@cd test && ./test.sh

# Linting targets
lint: ## Run comprehensive linting with all checks
	@./scripts/lint.sh

lint-quick: lint-shell lint-yaml lint-markdown lint-compose ## Run individual linters quickly

lint-shell: ## Lint shell scripts
	@echo "Linting shell scripts..."
	@command -v shellcheck >/dev/null 2>&1 || { echo "shellcheck not installed. Run: brew install shellcheck"; exit 1; }
	@shellcheck scripts/*.sh test/test.sh
	@echo "Shell scripts passed"

lint-yaml: ## Lint YAML files
	@echo "Linting YAML files..."
	@command -v yamllint >/dev/null 2>&1 || { echo "yamllint not installed. Run: pip3 install yamllint"; exit 1; }
	@yamllint -c .yamllint.yml .
	@echo "YAML files passed"

lint-markdown: ## Lint markdown files
	@echo "Linting markdown files..."
	@command -v markdownlint >/dev/null 2>&1 || { echo "markdownlint not installed. Run: npm install -g markdownlint-cli"; exit 1; }
	@markdownlint --config .markdownlint.yml *.md docs/*.md
	@echo "Markdown files passed"

lint-compose: ## Validate Docker Compose files
	@echo "Validating Docker Compose files..."
	@cd postgresql && docker-compose config --quiet
	@cd redis && docker-compose config --quiet
	@cd opensearch && docker-compose config --quiet
	@echo "Docker Compose files are valid"

clean: ## Remove all containers, volumes, and data (WARNING: DATA LOSS)
	@echo "⚠️  WARNING: This will remove all containers, volumes, and data!"
	@read -p "Are you sure? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "🧹 Cleaning up..."; \
		./scripts/stop-all.sh; \
		docker volume rm postgresql_postgres_data redis_redis_data opensearch_opensearch_data 2>/dev/null || true; \
		rm -rf postgresql/data redis/data opensearch/data 2>/dev/null || true; \
		echo "✅ Cleanup complete"; \
	else \
		echo "❌ Cleanup cancelled"; \
	fi

logs-redis: ## Show Redis logs
	@cd redis && docker-compose logs -f

logs-postgres: ## Show PostgreSQL logs
	@cd postgresql && docker-compose logs -f

logs-opensearch: ## Show OpenSearch logs
	@cd opensearch && docker-compose logs -f

logs-dashboards: ## Show OpenSearch Dashboards logs
	@cd opensearch && docker-compose logs -f opensearch-dashboards

# Individual service commands
start-redis: ## Start only Redis
	@echo "▶️  Starting Redis..."
	@cd redis && docker-compose up -d

start-postgres: ## Start only PostgreSQL
	@echo "▶️  Starting PostgreSQL..."
	@cd postgresql && docker-compose up -d

start-opensearch: ## Start only OpenSearch
	@echo "▶️  Starting OpenSearch..."
	@cd opensearch && docker-compose up -d

stop-redis: ## Stop Redis
	@echo "⏸️  Stopping Redis..."
	@cd redis && docker-compose stop

stop-postgres: ## Stop PostgreSQL
	@echo "⏸️  Stopping PostgreSQL..."
	@cd postgresql && docker-compose stop

stop-opensearch: ## Stop OpenSearch
	@echo "⏸️  Stopping OpenSearch..."
	@cd opensearch && docker-compose stop

restart-redis: stop-redis start-redis ## Restart Redis
	@echo "🔄 Redis restarted"

restart-postgres: stop-postgres start-postgres ## Restart PostgreSQL
	@echo "🔄 PostgreSQL restarted"

restart-opensearch: stop-opensearch start-opensearch ## Restart OpenSearch
	@echo "🔄 OpenSearch restarted"

# Multi-Redis specific
start-multi-redis: ## Start multi-instance Redis setup
	@echo "▶️  Starting multi-instance Redis..."
	@cd redis && docker-compose -f docker-compose.multi-redis.yml up -d

stop-multi-redis: ## Stop multi-instance Redis setup
	@echo "⏸️  Stopping multi-instance Redis..."
	@cd redis && docker-compose -f docker-compose.multi-redis.yml stop

# Development helpers
shell-redis: ## Open Redis CLI
	@cd redis && docker-compose exec redis redis-cli

shell-postgres: ## Open PostgreSQL shell
	@cd postgresql && docker-compose exec postgres psql -U postgres -d elay-local

shell-opensearch: ## Open bash shell in OpenSearch container
	@cd opensearch && docker-compose exec opensearch bash

# Quick status checks
ps: ## Show running containers (short format)
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "postgres|redis|opensearch|NAMES"

stats: ## Show resource usage statistics
	@docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
