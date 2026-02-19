#!/usr/bin/env python3
"""
sync-pyproject-deps.py

Synchronizes the dependency arrays in pyproject.toml with the contents of
the requirements .in files. The script reads each .in file, resolves the
include (-r) hierarchy, and updates the corresponding TOML sections in-place
while preserving all other content in the file.

Requirements file purpose and hierarchy
---------------------------------------

requirements.in
    Runtime dependencies required to run the application. Every environment
    that executes the application must have these installed. These map
    directly to [project].dependencies in pyproject.toml.

    Install: pip install .

test.requirements.in
    Packages required to execute the test suite. Inherits runtime
    dependencies from requirements.in via the "-r requirements.in" directive.
    The packages declared directly in this file (pytest and related plugins)
    map to [project.optional-dependencies].test in pyproject.toml.

    Install: pip install .[test]

dev.requirements.in
    Packages that constitute the full development environment: code
    formatters, linters, and type checkers. Inherits test and runtime
    dependencies via "-r test.requirements.in". The packages declared
    directly in this file are merged with those from test.requirements.in
    to form [project.optional-dependencies].dev in pyproject.toml.

    Install: pip install .[dev]

pyproject.toml mapping
-----------------------

    requirements.in             -> [project].dependencies
    test.requirements.in (own)  -> [project.optional-dependencies].test
    test.requirements.in (own)
      + dev.requirements.in (own)
                                -> [project.optional-dependencies].dev

Usage
-----

    # Apply changes:
    python .scripts/sync-pyproject-deps.py

    # Preview changes without writing to disk:
    python .scripts/sync-pyproject-deps.py --dry-run

    # Also print the resolved package lists:
    python .scripts/sync-pyproject-deps.py --verbose

    # Combine flags:
    python .scripts/sync-pyproject-deps.py --dry-run --verbose
"""

import argparse
import os
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Path constants
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent

PYPROJECT_FILE: str = os.path.join(str(PROJECT_DIR), "pyproject.toml")  # type: ignore[assignment]
if not os.path.isfile(PYPROJECT_FILE):
    print(
        f"Error: pyproject.toml not found at expected location: {PYPROJECT_FILE}",
        file=sys.stderr,
    )
    sys.exit(1)
RUNTIME_REQUIREMENTS_FILE: str = os.path.join(str(PROJECT_DIR), "requirements.in")  # type: ignore[assignment]
if not os.path.isfile(RUNTIME_REQUIREMENTS_FILE):
    print(
        f"Error: requirements.in not found at expected location: {RUNTIME_REQUIREMENTS_FILE}",
        file=sys.stderr,
    )
    sys.exit(1)
TEST_REQUIREMENTS_FILE: str = os.path.join(str(PROJECT_DIR), "test.requirements.in")  # type: ignore[assignment]
if not os.path.isfile(TEST_REQUIREMENTS_FILE):
    print(
        f"Error: test.requirements.in not found at expected location: {TEST_REQUIREMENTS_FILE}",
        file=sys.stderr,
    )
    sys.exit(1)
DEV_REQUIREMENTS_FILE: str = os.path.join(str(PROJECT_DIR), "dev.requirements.in")  # type: ignore[assignment]
if not os.path.isfile(DEV_REQUIREMENTS_FILE):
    print(
        f"Error: dev.requirements.in not found at expected location: {DEV_REQUIREMENTS_FILE}",
        file=sys.stderr,
    )
    sys.exit(1)


# ---------------------------------------------------------------------------
# Requirements parsing
# ---------------------------------------------------------------------------


def parse_own_packages(filepath: str) -> list[str]:
    """
    Parse a requirements .in file and return only the package specifiers
    declared directly in the file.

    Lines that are blank, start with '#' (comments), or start with '-r'
    (include directives) are excluded. All other non-empty lines are treated
    as package specifiers and returned verbatim, preserving version
    constraints, extras, and environment markers.

    Args:
        filepath: Absolute path to the requirements .in file.

    Returns:
        List of package specifier strings in the order they appear in the file.
    """
    packages: list[str] = []

    with open(filepath, encoding="utf-8") as f:
        for raw_line in f.read().splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or line.startswith("-r"):
                continue
            packages.append(line)

    return packages


# ---------------------------------------------------------------------------
# TOML array formatting and replacement
# ---------------------------------------------------------------------------


def format_toml_array(packages: list[str], indent: str = "  ") -> str:
    """
    Format a list of package specifiers as a multi-line TOML array.

    Each entry is placed on its own line with the given indent. The result
    is suitable for direct substitution into a .toml file.

    Args:
        packages: Ordered list of package specifier strings.
        indent:   Whitespace prefix for each entry line inside the brackets.

    Returns:
        A string representing the TOML array value, e.g.:

            [
              "click>=8.1.0",
              "rich>=13.7.0",
            ]
    """
    if not packages:
        return "[]"

    lines = ["["]
    for pkg in packages:
        lines.append(f'{indent}"{pkg}",')
    lines.append("]")

    return "\n".join(lines)


def replace_toml_array(content: str, key: str, packages: list[str]) -> str:
    """
    Replace the TOML array value assigned to key with a freshly formatted
    array built from packages.

    The replacement targets the first occurrence of:

        <key> = [
          ...
        ]

    Only the array value is rewritten; the key name and surrounding content
    are left intact. The match is non-greedy and relies on the TOML
    convention that the closing bracket appears on its own line.

    Args:
        content:  Full text content of the pyproject.toml file.
        key:      TOML key whose array value should be replaced.
        packages: Package specifiers that will populate the new array.

    Returns:
        Updated file content with the targeted array replaced.

    Raises:
        ValueError: If the key cannot be found in content.
    """
    pattern = rf"(^{re.escape(key)}\s*=\s*)\[[\s\S]*?\]"
    replacement = rf"\g<1>{format_toml_array(packages)}"
    updated, count = re.subn(pattern, replacement, content, count=1, flags=re.MULTILINE)

    if count == 0:
        raise ValueError(
            f"Could not locate '{key} = [...]' in {PYPROJECT_FILE}. "
            "Verify the key name matches what is in the file."
        )

    return updated


# ---------------------------------------------------------------------------
# Diff display (dry-run support)
# ---------------------------------------------------------------------------


def _extract_array_text(content: str, key: str) -> str:
    """
    Extract the raw TOML array text currently assigned to key.

    Returns an empty string when no match is found.
    """
    match = re.search(
        rf"^{re.escape(key)}\s*=\s*(\[[\s\S]*?\])",
        content,
        flags=re.MULTILINE,
    )
    return match.group(1) if match else ""


def print_diff(original: str, updated: str, keys: list[str]) -> None:
    """
    Print a human-readable summary of the changes that would be applied to
    pyproject.toml, restricted to the provided keys.

    Args:
        original: File content before modifications.
        updated:  File content after modifications.
        keys:     TOML keys to include in the diff output.
    """
    changed = False

    for key in keys:
        before = _extract_array_text(original, key)
        after = _extract_array_text(updated, key)

        if before == after:
            print(f"  {key}: no change")
            continue

        changed = True
        print(f"\n  {key}:")

        before_lines = {
            ln.strip() for ln in before.splitlines() if ln.strip() not in ("[", "]")
        }
        after_lines = {
            ln.strip() for ln in after.splitlines() if ln.strip() not in ("[", "]")
        }

        for removed in sorted(before_lines - after_lines):
            print(f"    - {removed}")
        for added in sorted(after_lines - before_lines):
            print(f"    + {added}")

    if not changed:
        print("\n  All sections are already up to date.")


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="sync-pyproject-deps.py",
        description=(
            "Synchronize pyproject.toml dependency arrays with the "
            "requirements .in files."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Requirements file map:\n"
            "  requirements.in         -> [project].dependencies\n"
            "  test.requirements.in    -> [project.optional-dependencies].test\n"
            "  test + dev .in files    -> [project.optional-dependencies].dev\n"
        ),
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what changes would be made without writing to pyproject.toml.",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Print the resolved package list for each dependency group.",
    )
    return parser


def main() -> None:
    parser = build_arg_parser()
    args = parser.parse_args()

    # ------------------------------------------------------------------
    # Resolve package lists for each dependency group
    # ------------------------------------------------------------------

    # [project].dependencies <- requirements.in (own packages only)
    runtime_packages = parse_own_packages(RUNTIME_REQUIREMENTS_FILE)

    # [project.optional-dependencies].test <- test.requirements.in own packages
    test_own_packages = parse_own_packages(TEST_REQUIREMENTS_FILE)

    # [project.optional-dependencies].dev <- test own + dev own
    # The dev group intentionally includes test packages so that a developer
    # who installs .[dev] obtains a complete environment without needing to
    # also install .[test] separately.
    dev_own_packages = parse_own_packages(DEV_REQUIREMENTS_FILE)
    dev_packages = test_own_packages + dev_own_packages

    if args.verbose:
        print("Resolved package lists:")
        print(
            f"\n  [project].dependencies  ({os.path.basename(RUNTIME_REQUIREMENTS_FILE)})"
        )
        for pkg in runtime_packages:
            print(f"    {pkg}")

        print(
            f"\n  [project.optional-dependencies].test  ({os.path.basename(TEST_REQUIREMENTS_FILE)})"
        )
        for pkg in test_own_packages:
            print(f"    {pkg}")

        print(
            f"\n  [project.optional-dependencies].dev  "
            f"({os.path.basename(TEST_REQUIREMENTS_FILE)} + {os.path.basename(DEV_REQUIREMENTS_FILE)})"
        )
        for pkg in dev_packages:
            print(f"    {pkg}")

        print()

    # ------------------------------------------------------------------
    # Apply replacements
    # ------------------------------------------------------------------

    with open(PYPROJECT_FILE, encoding="utf-8") as f:
        original_content = f.read()

    try:
        updated_content = replace_toml_array(
            original_content, "dependencies", runtime_packages
        )
        updated_content = replace_toml_array(updated_content, "test", test_own_packages)
        updated_content = replace_toml_array(updated_content, "dev", dev_packages)
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)

    # ------------------------------------------------------------------
    # Report results
    # ------------------------------------------------------------------

    if updated_content == original_content:
        print("pyproject.toml is already up to date. No changes required.")
        return

    if args.dry_run:
        print("Dry run: changes that would be applied to pyproject.toml:")
        print_diff(original_content, updated_content, ["dependencies", "test", "dev"])
        print("\nRun without --dry-run to apply these changes.")
        return

    with open(PYPROJECT_FILE, "w", encoding="utf-8") as f:
        f.write(updated_content)
    print(f"Updated {PYPROJECT_FILE}")
    print("\nSections modified:")
    print_diff(original_content, updated_content, ["dependencies", "test", "dev"])


if __name__ == "__main__":
    main()
