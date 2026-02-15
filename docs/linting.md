# Code Quality and Linting

This repository uses multiple linters to maintain code quality and consistency across all files. This document explains the linting setup and how to use it.

## Available Linters

### 1. YAML Linting (yamllint)

**Purpose**: Ensures YAML files follow proper syntax and formatting conventions.

**Configuration**: [.yamllint.yml](.yamllint.yml)

**Files checked**:

- `docker-compose*.yml`
- `*.yml` and `*.yaml` files
- OpenSearch configuration files

**Key rules**:

- 2-space indentation (matches codebase style)
- Maximum line length of 120 characters
- Consistent spacing and formatting
- Allows Docker Compose-specific syntax

### 2. Shell Script Linting (shellcheck)

**Purpose**: Identifies potential issues in bash scripts and promotes best practices.

**Configuration**: [.shellcheckrc](.shellcheckrc)

**Files checked**:

- All `*.sh` files in `scripts/` directory
- Test scripts in `test/` directory

**Key checks**:

- Quoting issues and word splitting
- Command substitution problems
- Logic errors and potential bugs
- Portability concerns
- Deprecated syntax usage

### 3. Markdown Linting (markdownlint)

**Purpose**: Ensures consistent markdown formatting across documentation.

**Configuration**: [.markdownlint.yml](.markdownlint.yml)

**Files checked**:

- All `*.md` files in root directory
- Documentation files in `docs/` directory

**Key rules**:

- Maximum line length of 120 characters
- Consistent heading styles
- Proper code block formatting
- Allows HTML elements for badges and formatting

### 4. EditorConfig

**Purpose**: Maintains consistent coding styles across different editors.

**Configuration**: [.editorconfig](.editorconfig)

**Settings**:

- UTF-8 character encoding
- LF line endings
- Trim trailing whitespace
- Insert final newline
- Language-specific indentation rules

### 5. Pre-commit Hooks

**Purpose**: Automatically runs linting checks before commits.

**Configuration**: [.pre-commit-config.yaml](.pre-commit-config.yaml)

**Included hooks**:

- All linters mentioned above
- File formatting checks
- Docker Compose validation
- Large file detection
- Merge conflict detection

## Installation

### Install Linting Tools

#### macOS (using Homebrew)

```bash
# ShellCheck
brew install shellcheck

# yamllint
pip3 install yamllint

# markdownlint
npm install -g markdownlint-cli

# Pre-commit (optional)
pip3 install pre-commit
```

#### Ubuntu/Debian

```bash
# ShellCheck
sudo apt-get install shellcheck

# yamllint
pip3 install yamllint

# markdownlint
sudo npm install -g markdownlint-cli

# Pre-commit (optional)
pip3 install pre-commit
```

### Setup Pre-commit Hooks (Optional)

If you want automatic linting before commits:

```bash
# Install pre-commit hooks
pre-commit install

# Run hooks on all files (one-time setup)
pre-commit run --all-files
```

## Usage

### Running Linters

#### Comprehensive Linting (Recommended)

Run all linters with detailed output:

```bash
make lint
# or
./scripts/lint.sh
```

#### Individual Linters

Run specific linters quickly:

```bash
# All individual linters
make lint-quick

# Shell scripts only
make lint-shell

# YAML files only
make lint-yaml

# Markdown files only
make lint-markdown

# Docker Compose validation only
make lint-compose
```

#### Manual Commands

You can also run linters manually:

```bash
# YAML linting
yamllint -c .yamllint.yml .

# Shell script linting
shellcheck scripts/*.sh test/test.sh

# Markdown linting
markdownlint --config .markdownlint.yml *.md docs/*.md

# Docker Compose validation
docker compose -f postgresql/docker-compose.yml config --quiet
docker compose -f redis/docker-compose.yml config --quiet
docker compose -f opensearch/docker-compose.yml config --quiet
```

### Continuous Integration

Linting runs automatically on:

- Pull requests to main branch
- Pushes to main branch

The GitHub Actions workflow is defined in [.github/workflows/lint.yml](.github/workflows/lint.yml).

### Fixing Common Issues

#### YAML Issues

- **Indentation errors**: Use 2 spaces for indentation
- **Line too long**: Break long lines or adjust `.yamllint.yml` if necessary
- **Trailing spaces**: Remove trailing whitespace

#### Shell Script Issues

- **Unquoted variables**: Quote variables like `"$variable"`
- **Command not found**: Check command availability with `command -v`
- **Logic errors**: Review conditional statements and loops

#### Markdown Issues

- **Line length**: Keep lines under 120 characters
- **Inconsistent headings**: Use consistent heading hierarchy
- **Missing language in code blocks**: Specify language after ```

## Customization

### Disabling Specific Rules

#### yamllint

Edit `.yamllint.yml` and add rules to disable:

```yaml
rules:
  line-length: disable
  # or modify specific rule parameters
  indentation:
    spaces: 4  # change if needed
```

#### shellcheck

Edit `.shellcheckrc` and add rule numbers to disable:

```bash
# Disable specific checks
disable=SC2034,SC2086
```

#### markdownlint

Edit `.markdownlint.yml`:

```yaml
# Disable specific rules
MD013: false  # disable line length check
MD041: false  # disable first-line heading requirement
```

### Adding File Exclusions

Most linters support ignoring specific files or patterns:

#### yamllint

```yaml
ignore: |
  .env*
  data/
  *.log
```

#### markdownlint

Use `.markdownlint-cli2.jsonc` if you need complex exclusion patterns.

## Best Practices

1. **Run linting before commits**: Use `make lint` before committing changes
2. **Fix issues promptly**: Don't let linting errors accumulate
3. **Use editor integration**: Install linter plugins for your editor
4. **Consistent style**: Follow the established patterns in existing files
5. **Document exceptions**: If you need to disable a rule, document why

## Development Workflow

Recommended workflow for contributors:

1. **Setup**: Install linting tools after cloning the repository
2. **Development**: Write code following existing patterns
3. **Pre-commit**: Run `make lint` before committing
4. **Optional**: Install pre-commit hooks for automatic checking
5. **CI/CD**: Let GitHub Actions validate on push/PR

## Troubleshooting

### Common Installation Issues

**yamllint not found**:

```bash
pip3 install --user yamllint
# Add ~/.local/bin to PATH if needed
```

**markdownlint not found**:

```bash
# Make sure npm is installed first
npm install -g markdownlint-cli
```

**shellcheck not found on macOS**:

```bash
# If Homebrew is not available, download from releases
# https://github.com/koalaman/shellcheck/releases
```

### Editor Integration

#### VS Code

Install these extensions:

- YAML (Red Hat)
- ShellCheck (Timonwong)
- markdownlint (David Anson)
- EditorConfig for VS Code

#### Vim/Neovim

Consider using:

- ALE (Asynchronous Lint Engine)
- Syntastic
- Native LSP with appropriate language servers

#### JetBrains IDEs

- Enable YAML/Shell/Markdown inspections
- Install EditorConfig plugin

## Summary

The linting configuration ensures:

- **Consistency**: All code follows the same style guidelines
- **Quality**: Catches common errors and issues early
- **Maintainability**: Code remains readable and well-formatted
- **Collaboration**: Makes it easier for multiple contributors to work together

Use `make lint` regularly during development to catch issues early and maintain high code quality standards.
