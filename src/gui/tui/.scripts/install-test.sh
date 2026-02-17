#!/bin/bash

set -e  # Exit on any error

echo "Setting up test dependencies..."

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

# Compile test.requirements.in to test.requirements.txt with pinned versions
# Use --resolver=backtracking for explicit resolver choice
# Pass --upgrade flag if specified to force latest compatible versions
echo "Compiling test.requirements.in to test.requirements.txt..."
pip-compile --resolver=backtracking $UPGRADE_FLAG test.requirements.in

# Install dependencies from the compiled test.requirements.txt
echo "Installing dependencies..."
pip install -r test.requirements.txt

echo "Test dependencies installed successfully"
echo "Run 'pytest' to execute tests"
