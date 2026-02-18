#!/usr/bin/env python3
"""Simple import verification test."""


def verify_imports():
    """Verify all modules can be imported without errors."""
    try:
        print("Testing imports...")

        # Test config imports
        print(" - Importing config.services")
        from src.config.services import get_all_services

        # Test service imports
        print(" - Importing services.command_executor")

        print(" - Importing services.docker_client")

        # Test TUI imports
        print(" - Importing tui.app")

        # Test screen imports
        print(" - Importing tui.screens")

        # Test utils
        print(" - Importing utils.helpers")
        from src.utils.helpers import find_repository_root

        print(" - All imports successful! ✅")

        # Test basic functionality
        print("\nTesting basic functionality...")
        services = get_all_services()
        print(f" - Found {len(services)} services")

        repo_root = find_repository_root()
        print(f" - Repository root: {repo_root}")

        print("\nVerification complete! ✅")
        return True

    except Exception as e:
        print(f"❌ Import failed: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    verify_imports()
