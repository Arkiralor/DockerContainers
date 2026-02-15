#!/bin/bash

# Linting script for Docker Containers repository
# Runs all configured linters locally

set -e

echo "Running code quality checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    local status=$1
    local message=$2
    case $status in
        "info")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "success")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        "warning")
            echo -e "${YELLOW}[WARNING]${NC} $message"
            ;;
        "error")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
    esac
}

# Check if running from repository root
if [[ ! -f ".yamllint.yml" ]]; then
    print_status "error" "Please run this script from the repository root directory"
    exit 1
fi

# Initialize error counter
errors=0

# YAML Linting
print_status "info" "Linting YAML files..."
if command_exists yamllint; then
    if yamllint -c .yamllint.yml .; then
        print_status "success" "YAML files passed linting"
    else
        print_status "error" "YAML linting failed"
        ((errors++))
    fi
else
    print_status "warning" "yamllint not found. Install with: pip install yamllint"
fi

# Shell Script Linting
print_status "info" "Linting shell scripts..."
if command_exists shellcheck; then
    shellcheck_failed=0
    while IFS= read -r -d '' file; do
        if ! shellcheck "$file"; then
            shellcheck_failed=1
        fi
    done < <(find . -name "*.sh" -type f -print0)

    if [[ $shellcheck_failed -eq 0 ]]; then
        print_status "success" "Shell scripts passed linting"
    else
        print_status "error" "Shell script linting failed"
        ((errors++))
    fi
else
    print_status "warning" "shellcheck not found. Install with: apt-get install shellcheck (Linux) or brew install shellcheck (macOS)"
fi

# Markdown Linting
print_status "info" "Linting Markdown files..."
if command_exists markdownlint; then
    if markdownlint --config .markdownlint.yml ./*.md docs/*.md 2>/dev/null; then
        print_status "success" "Markdown files passed linting"
    else
        print_status "error" "Markdown linting failed"
        ((errors++))
    fi
else
    print_status "warning" "markdownlint not found. Install with: npm install -g markdownlint-cli"
fi

# Docker Compose Validation
print_status "info" "Validating Docker Compose files..."
if command_exists docker; then
    compose_failed=0
    while IFS= read -r -d '' file; do
        print_status "info" "Validating $file"
        if ! docker compose -f "$file" config --quiet 2>/dev/null; then
            print_status "error" "Invalid Docker Compose file: $file"
            compose_failed=1
        fi
    done < <(find . -name "docker-compose*.yml" -type f -print0)

    if [[ $compose_failed -eq 0 ]]; then
        print_status "success" "Docker Compose files are valid"
    else
        ((errors++))
    fi
else
    print_status "warning" "docker not found. Cannot validate Docker Compose files"
fi

# File Format Checks
print_status "info" "Checking file formatting..."
format_errors=0

# Check for trailing whitespace (excluding markdown)
if grep -r --include="*.yml" --include="*.yaml" --include="*.sh" --include="*.conf" -n "[[:space:]]$" . 2>/dev/null; then
    print_status "error" "Trailing whitespace found in files above"
    format_errors=1
fi

# Check for files missing final newline
while IFS= read -r -d '' file; do
    if [[ -s "$file" ]] && [[ "$(tail -c 1 "$file" 2>/dev/null)" != "" ]]; then
        print_status "warning" "$file is missing final newline"
    fi
done < <(find . -type f \( -name "*.yml" -o -name "*.yaml" -o -name "*.sh" -o -name "*.md" \) -print0)

if [[ $format_errors -eq 0 ]]; then
    print_status "success" "File formatting checks passed"
else
    ((errors++))
fi

# Summary
echo ""
if [[ $errors -eq 0 ]]; then
    print_status "success" "All linting checks passed!"
    exit 0
else
    print_status "error" "$errors linting check(s) failed"
    exit 1
fi
