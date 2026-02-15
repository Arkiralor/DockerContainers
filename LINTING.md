# Linter Configuration Files

This directory contains configuration files for code quality tools used in this repository.

## Files Created

| File | Purpose | Tool |
|------|---------|------|
| `.yamllint.yml` | YAML linting configuration | yamllint |
| `.shellcheckrc` | Shell script linting configuration | shellcheck |
| `.markdownlint.yml` | Markdown linting configuration | markdownlint-cli |
| `.editorconfig` | Editor formatting consistency | EditorConfig |
| `.pre-commit-config.yaml` | Pre-commit hooks configuration | pre-commit |
| `scripts/lint.sh` | Local linting script | Bash |

## Quick Usage

```bash
# Run comprehensive linting
make lint

# Run individual linters
make lint-shell      # Shell scripts
make lint-yaml       # YAML files
make lint-markdown   # Markdown files
make lint-compose    # Docker Compose validation
```

## Installation Requirements

```bash
# Install required tools
pip3 install yamllint
brew install shellcheck  # or apt-get install shellcheck
npm install -g markdownlint-cli

# Optional: Pre-commit hooks
pip3 install pre-commit && pre-commit install
```

For detailed information, see [docs/linting.md](docs/linting.md).
