.PHONY: help start stop restart dev status logs clean install build

help: ## Show this help message
	@echo "Docker Container Management GUI - Make Commands"
	@echo ""
	@echo "Usage: make [command]"
	@echo ""
	@echo "Commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

start: ## Start the GUI (frontend and backend on bare metal)
	@./scripts/start.sh

stop: ## Stop the GUI
	@./scripts/stop.sh

restart: stop start ## Restart the GUI

dev: ## Start the GUI in development mode with hot reload
	@./scripts/dev.sh

status: ## Show status of GUI processes
	@echo "Docker GUI Status:"
	@if [ -f .pids/server.pid ] && kill -0 $$(cat .pids/server.pid) 2>/dev/null; then \
		echo "  Backend:  Running (PID: $$(cat .pids/server.pid))"; \
	else \
		echo "  Backend:  Stopped"; \
	fi
	@if [ -f .pids/client.pid ] && kill -0 $$(cat .pids/client.pid) 2>/dev/null; then \
		echo "  Frontend: Running (PID: $$(cat .pids/client.pid))"; \
	else \
		echo "  Frontend: Stopped"; \
	fi

logs: ## Show GUI logs (use logs-server or logs-client for specific logs)
	@if [ -f .pids/server.log ] && [ -f .pids/client.log ]; then \
		echo "==> Server logs:"; \
		tail -n 20 .pids/server.log; \
		echo ""; \
		echo "==> Client logs:"; \
		tail -n 20 .pids/client.log; \
	else \
		echo "No logs found. GUI may not be running."; \
	fi

logs-server: ## Show backend server logs
	@tail -f .pids/server.log

logs-client: ## Show frontend client logs
	@tail -f .pids/client.log

install: ## Install dependencies for frontend and backend
	@echo "Installing dependencies..."
	@cd server && npm install
	@cd client && npm install
	@echo "Dependencies installed successfully"

build: ## Build frontend and backend for production
	@echo "Building server..."
	@cd server && npm run build
	@echo "Building client..."
	@cd client && npm run build
	@echo "Build complete"

clean: ## Remove build artifacts, node_modules, and logs
	@echo "Cleaning build artifacts..."
	@rm -rf server/dist client/dist
	@rm -rf server/node_modules client/node_modules
	@rm -rf .pids
	@echo "Clean complete"
