"""Main entry point for Docker Container TUI application.

This module provides the command-line interface for starting the TUI application
with various options and configuration parameters.
"""

import sys
from pathlib import Path

import click

from .tui.app import DockerTUIApp
from .utils.helpers import check_prerequisites, find_repository_root


@click.command()
@click.option(
    "--repository-root",
    "-r",
    type=click.Path(exists=True, file_okay=False, dir_okay=True, path_type=Path),
    help="Path to DockerContainers repository root directory",
)
@click.option(
    "--refresh-interval",
    "-i",
    type=int,
    default=5,
    help="Auto-refresh interval in seconds (default: 5)",
)
@click.option(
    "--no-docker-check", is_flag=True, help="Skip Docker connectivity check on startup"
)
@click.option("--debug", is_flag=True, help="Enable debug mode with verbose logging")
@click.version_option(version="0.1.0", prog_name="docker-tui")
def main(
    repository_root: Path | None,
    refresh_interval: int,
    no_docker_check: bool,
    debug: bool,
) -> None:
    """Docker Container TUI - Terminal interface for repository-specific container management.

    This tool provides a keyboard-driven interface for managing Docker containers
    defined in the DockerContainers repository. It uses existing Makefile commands
    and scripts rather than directly manipulating Docker containers.

    Key Features:
    - Start/stop services (PostgreSQL, Redis, OpenSearch, etc.)
    - View real-time logs with following capability
    - Execute system operations (backup, restore, setup)
    - Monitor container status and health
    - Real-time auto-refresh with configurable intervals

    Navigation:
    - Press 's' for Services screen
    - Press 'o' for Operations screen
    - Press '?' for Help
    - Press 'q' to quit
    """

    # Set up basic error handling
    if debug:
        click.echo("🔧 Debug mode enabled")

    # Validate refresh interval
    if refresh_interval < 1 or refresh_interval > 300:
        click.echo("❌ Refresh interval must be between 1 and 300 seconds", err=True)
        sys.exit(1)

    # Check prerequisites
    click.echo("🔍 Checking prerequisites...")
    prereqs_ok, errors = check_prerequisites()

    if not prereqs_ok:
        click.echo("❌ Prerequisites check failed:", err=True)
        for error in errors:
            click.echo(f"   • {error}", err=True)
        sys.exit(1)

    # Find repository root
    if repository_root:
        repo_path = repository_root
    else:
        repo_path = find_repository_root()
        if not repo_path:
            click.echo(
                "❌ Could not find DockerContainers repository root.\n"
                "   Please run from within the repository or use --repository-root option.",
                err=True,
            )
            sys.exit(1)

    click.echo(f"📁 Repository root: {repo_path}")

    # Check Docker availability (unless skipped)
    if not no_docker_check:
        click.echo("🐳 Checking Docker availability...")

        try:
            from .services.command_executor import CommandExecutor

            executor = CommandExecutor(str(repo_path))

            if not executor.check_docker_available():
                click.echo(
                    "⚠️  Docker not available or not running.\n"
                    "   Some features may not work. Start Docker Desktop or daemon.\n"
                    "   Use --no-docker-check to skip this check.",
                    err=True,
                )

                if not click.confirm("Continue anyway?"):
                    sys.exit(1)
            else:
                click.echo("✅ Docker is available")

                if not executor.check_docker_compose_available():
                    click.echo("⚠️  Docker Compose not available", err=True)
                else:
                    click.echo("✅ Docker Compose is available")

        except Exception as e:
            if debug:
                click.echo(f"🔧 Docker check error: {e}")
            click.echo("⚠️  Could not check Docker status", err=True)

    # Start the TUI application
    try:
        click.echo(f"🚀 Starting Docker TUI (refresh interval: {refresh_interval}s)")
        click.echo("   Press Ctrl+C or 'q' to quit")

        app = DockerTUIApp()
        app.refresh_interval = refresh_interval

        # Override repository root if specified
        if (
            repository_root
            and hasattr(app, "command_executor")
            and app.command_executor
        ):
            app.command_executor.repository_root = str(repository_root)

        app.run()

    except KeyboardInterrupt:
        click.echo("\n👋 Goodbye!")
        sys.exit(0)

    except Exception as e:
        if debug:
            import traceback

            click.echo(f"🔧 Full traceback:\n{traceback.format_exc()}", err=True)

        click.echo(f"❌ Application error: {e}", err=True)
        sys.exit(1)


@click.group()
def cli() -> None:
    """Docker Container TUI - Repository-specific container management."""
    pass


@cli.command()
def version() -> None:
    """Show version information."""
    click.echo("Docker Container TUI v0.1.0")
    click.echo("Repository-specific Docker container management")


@cli.command()
@click.option(
    "--repository-root",
    "-r",
    type=click.Path(exists=True, file_okay=False, dir_okay=True, path_type=Path),
    help="Path to DockerContainers repository root directory",
)
def check(repository_root: Path | None) -> None:
    """Check system prerequisites and Docker availability."""

    click.echo("🔍 Checking Docker Container TUI prerequisites...\n")

    # Check basic prerequisites
    prereqs_ok, errors = check_prerequisites()

    click.echo("📋 Basic Prerequisites:")
    if prereqs_ok:
        click.echo("   ✅ Python version")
        click.echo("   ✅ Repository structure")
    else:
        click.echo("   ❌ Some prerequisites failed:")
        for error in errors:
            click.echo(f"      • {error}")

    # Find repository root
    if repository_root:
        repo_path = repository_root
    else:
        repo_path = find_repository_root()

    click.echo("\n📁 Repository Root:")
    if repo_path:
        click.echo(f"   ✅ Found: {repo_path}")
    else:
        click.echo("   ❌ Not found")
        return

    # Check Docker
    click.echo("\n🐳 Docker Availability:")
    try:
        from .services.command_executor import CommandExecutor

        executor = CommandExecutor(str(repo_path))

        if executor.check_docker_available():
            click.echo("   ✅ Docker daemon running")
        else:
            click.echo("   ❌ Docker daemon not available")

        if executor.check_docker_compose_available():
            click.echo("   ✅ Docker Compose available")
        else:
            click.echo("   ❌ Docker Compose not available")

    except Exception as e:
        click.echo(f"   ❌ Error checking Docker: {e}")

    # Check services
    click.echo("\n🔧 Service Configurations:")
    try:
        from .config.services import get_all_services

        services = get_all_services()

        click.echo(f"   ✅ Found {len(services)} configured services:")
        for service in services:
            click.echo(f"      • {service.name} ({service.container_name})")

    except Exception as e:
        click.echo(f"   ❌ Error loading services: {e}")

    click.echo(
        f"\n🎯 Status: {'✅ Ready to run!' if prereqs_ok and repo_path else '❌ Not ready'}"
    )


# Add commands to the CLI group
cli.add_command(main, name="run")


if __name__ == "__main__":
    # If no arguments provided, run the main TUI
    import sys

    if len(sys.argv) == 1:
        main()
    else:
        cli()
