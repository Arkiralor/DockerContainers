#!/bin/bash

set -e  # Exit on any error

echo "Setting up development dependencies..."

# Parse command-line flags
UPGRADE_FLAG=""
if [ "$1" = "--upgrade" ]; then
    UPGRADE_FLAG="--upgrade"
    echo "Upgrade mode enabled: will get latest compatible versions"
fi

# Check if a virtual environment is active
if [ -z "$VIRTUAL_ENV" ]; then
    echo "Error: No virtual environment detected!"
    echo "Please activate a virtual environment before running this script."
    echo "Example: source env/bin/activate"
    exit 1
fi

echo "Virtual environment detected: $VIRTUAL_ENV"

# Install pip-tools if not already installed
if ! command -v pip-compile &> /dev/null; then
    echo "Installing pip-tools..."
    pip install pip-tools
fi

# Compile dev.requirements.in to dev.requirements.txt with pinned versions
# Use --resolver=backtracking for explicit resolver choice
# Pass --upgrade flag if specified to force latest compatible versions
echo "Compiling dev.requirements.in to dev.requirements.txt..."
pip-compile --resolver=backtracking $UPGRADE_FLAG dev.requirements.in

# Install dependencies from the compiled dev.requirements.txt
echo "Installing dependencies..."
pip install -r dev.requirements.txt

echo "Development dependencies installed successfully"
echo ""
echo "Available tools:"
echo "  - pytest:     Run tests"
echo "  - black:      Format code"
echo "  - ruff:       Lint code"
echo "  - mypy:       Type check"
echo ""
echo "Use make commands for convenience:"
echo "  - make test"
echo "  - make format"
echo "  - make lint"
echo "  - make type-check"
