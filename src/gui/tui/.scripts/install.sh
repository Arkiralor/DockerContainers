#!/bin/bash

set -e  # Exit on any error

echo "Setting up TUI dependencies..."

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

# Compile requirements.in to requirements.txt with pinned versions
echo "Compiling requirements.in to requirements.txt..."
pip-compile requirements.in

# Install dependencies from the compiled requirements.txt
echo "Installing dependencies..."
pip install -r requirements.txt

echo "Dependencies installed successfully"
echo "Run 'source env/bin/activate && python -m src.main' to start the TUI"
