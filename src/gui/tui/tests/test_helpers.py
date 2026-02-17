"""Comprehensive tests for helper utility functions."""

from unittest.mock import patch

from src.utils.helpers import (
    check_prerequisites,
    find_repository_root,
    format_duration,
    get_terminal_size,
    safe_filename,
    truncate_text,
    validate_container_name,
)


class TestFindRepositoryRoot:
    """Tests for finding repository root."""

    def test_find_repository_root_with_valid_repo(self, mock_repository_root):
        """Test finding repository root when in valid repo."""
        result = find_repository_root(str(mock_repository_root))

        assert result is not None
        assert result == mock_repository_root

    def test_find_repository_root_from_subdirectory(self, mock_repository_root):
        """Test finding repository root from subdirectory."""
        sub_dir = mock_repository_root / "src" / "services"
        sub_dir.mkdir(parents=True)

        result = find_repository_root(str(sub_dir))

        assert result is not None
        assert result == mock_repository_root

    def test_find_repository_root_no_makefile(self, tmp_path):
        """Test when no Makefile exists."""
        result = find_repository_root(str(tmp_path))

        assert result is None

    def test_find_repository_root_makefile_missing_dirs(self, tmp_path):
        """Test when Makefile exists but required directories don't."""
        (tmp_path / "Makefile").touch()

        result = find_repository_root(str(tmp_path))

        assert result is None

    def test_find_repository_root_current_directory(
        self, mock_repository_root, monkeypatch
    ):
        """Test finding repository root from current directory."""
        monkeypatch.chdir(mock_repository_root)

        result = find_repository_root()

        assert result is not None


class TestCheckPrerequisites:
    """Tests for prerequisite checking."""

    def test_check_prerequisites_python_version_ok(
        self, mock_repository_root, monkeypatch
    ):
        """Test prerequisites check with correct Python version."""
        # Create a tuple-like object with major/minor attributes that supports comparison
        from collections import namedtuple

        VersionInfo = namedtuple("VersionInfo", ["major", "minor", "micro", "releaselevel", "serial"])
        version_info = VersionInfo(3, 11, 0, "final", 0)
        monkeypatch.setattr("src.utils.helpers.sys.version_info", version_info)
        monkeypatch.chdir(mock_repository_root)

        all_good, errors = check_prerequisites()

        assert all_good is True
        assert len(errors) == 0

    def test_check_prerequisites_python_version_too_old(self, monkeypatch):
        """Test prerequisites check with old Python version."""
        # Create a tuple-like object with major/minor attributes that supports comparison
        from collections import namedtuple

        VersionInfo = namedtuple("VersionInfo", ["major", "minor", "micro", "releaselevel", "serial"])
        version_info = VersionInfo(3, 9, 0, "final", 0)
        monkeypatch.setattr("src.utils.helpers.sys.version_info", version_info)

        all_good, errors = check_prerequisites()

        assert all_good is False
        assert any("Python 3.10+" in error for error in errors)

    def test_check_prerequisites_no_repository_root(self, tmp_path, monkeypatch):
        """Test prerequisites check when repository not found."""        # Mock find_repository_root to return None (simulating no repository found)
        monkeypatch.setattr(
            "src.utils.helpers.find_repository_root", lambda start_path=None: None
        )

        all_good, errors = check_prerequisites()

        assert all_good is False
        assert any("repository root" in error.lower() for error in errors)

    def test_check_prerequisites_missing_directories(
        self, mock_repository_root, monkeypatch
    ):
        """Test prerequisites check with missing required directories."""
        # Remove scripts directory
        import shutil

        shutil.rmtree(mock_repository_root / "scripts")

        # Mock find_repository_root to return the mock_repository_root (which now has missing directories)
        monkeypatch.setattr(
            "src.utils.helpers.find_repository_root",
            lambda start_path=None: mock_repository_root,
        )

        all_good, errors = check_prerequisites()

        assert all_good is False
        assert any("scripts" in error.lower() for error in errors)


class TestFormatDuration:
    """Tests for duration formatting."""

    def test_format_duration_seconds(self):
        """Test formatting duration in seconds."""
        result = format_duration(45.5)

        assert "45.5" in result
        assert "s" in result

    def test_format_duration_minutes(self):
        """Test formatting duration in minutes."""
        result = format_duration(125)  # 2.08 minutes

        assert "m" in result

    def test_format_duration_hours(self):
        """Test formatting duration in hours."""
        result = format_duration(7200)  # 2 hours

        assert "h" in result

    def test_format_duration_zero(self):
        """Test formatting zero duration."""
        result = format_duration(0)

        assert "0.0s" == result

    def test_format_duration_fractional(self):
        """Test formatting fractional durations."""
        result = format_duration(0.123)

        assert "0.1s" == result


class TestTruncateText:
    """Tests for text truncation."""

    def test_truncate_text_short_text(self):
        """Test truncating text shorter than max length."""
        result = truncate_text("Short text", max_length=50)

        assert result == "Short text"

    def test_truncate_text_exact_length(self):
        """Test truncating text at exact max length."""
        text = "A" * 50
        result = truncate_text(text, max_length=50)

        assert result == text

    def test_truncate_text_long_text(self):
        """Test truncating text longer than max length."""
        long_text = "A" * 100
        result = truncate_text(long_text, max_length=50)

        assert len(result) == 50
        assert result.endswith("...")
        assert result[:47] == "A" * 47

    def test_truncate_text_custom_max_length(self):
        """Test truncating with custom max length."""
        result = truncate_text("This is a long text", max_length=10)

        assert len(result) == 10
        assert result.endswith("...")

    def test_truncate_text_empty(self):
        """Test truncating empty text."""
        result = truncate_text("", max_length=50)

        assert result == ""


class TestValidateContainerName:
    """Tests for container name validation."""

    def test_validate_container_name_valid(self):
        """Test validating valid container names."""
        valid_names = [
            "redis",
            "postgres-db",
            "my_container",
            "container.name",
            "app123",
            "a",
        ]

        for name in valid_names:
            assert validate_container_name(name) is True, f"Failed for: {name}"

    def test_validate_container_name_invalid(self):
        """Test validating invalid container names."""
        invalid_names = [
            "",  # Empty
            "-starts-with-dash",  # Starts with dash
            "_starts_with_underscore",  # Starts with underscore
            ".starts.with.dot",  # Starts with dot
            "has space",  # Contains space
            "has@symbol",  # Contains invalid character
            "has/slash",  # Contains slash
        ]

        for name in invalid_names:
            assert validate_container_name(name) is False, f"Should fail for: {name}"

    def test_validate_container_name_edge_cases(self):
        """Test edge cases for container name validation."""
        assert validate_container_name("a1-_") is True
        assert validate_container_name("9container") is True
        assert validate_container_name("A" * 100) is True  # Long name


class TestSafeFilename:
    """Tests for safe filename conversion."""

    def test_safe_filename_normal(self):
        """Test converting normal text to safe filename."""
        result = safe_filename("my_file_name")

        assert result == "my_file_name"

    def test_safe_filename_with_unsafe_chars(self):
        """Test converting text with unsafe characters."""
        result = safe_filename("file<name>:with|unsafe?chars")

        assert "<" not in result
        assert ">" not in result
        assert ":" not in result
        assert "|" not in result
        assert "?" not in result

    def test_safe_filename_with_slashes(self):
        """Test converting text with slashes."""
        result = safe_filename("path/to/file")

        assert "/" not in result
        assert "\\" not in result

    def test_safe_filename_multiple_underscores(self):
        """Test that multiple consecutive underscores are collapsed."""
        result = safe_filename("file___with____many_underscores")

        assert "___" not in result
        assert "__" not in result

    def test_safe_filename_empty(self):
        """Test converting empty text."""
        result = safe_filename("")

        assert result == "untitled"

    def test_safe_filename_only_unsafe_chars(self):
        """Test converting text with only unsafe characters."""
        result = safe_filename("<<<>>>")

        assert result == "untitled"

    def test_safe_filename_with_spaces(self):
        """Test converting text with leading/trailing spaces."""
        result = safe_filename("  filename  ")

        assert result == "filename"


class TestGetTerminalSize:
    """Tests for getting terminal size."""

    @patch("src.utils.helpers.os.get_terminal_size")
    def test_get_terminal_size_success(self, mock_get_size):
        """Test getting terminal size successfully."""
        from collections import namedtuple

        Size = namedtuple("Size", ["columns", "rows"])
        mock_get_size.return_value = Size(columns=120, rows=40)

        columns, rows = get_terminal_size()

        assert columns == 120
        assert rows == 40

    @patch("src.utils.helpers.os.get_terminal_size")
    def test_get_terminal_size_os_error(self, mock_get_size):
        """Test getting terminal size when OS error occurs."""
        mock_get_size.side_effect = OSError("No terminal")

        columns, rows = get_terminal_size()

        # Should return fallback values
        assert columns == 80
        assert rows == 24

    @patch("src.utils.helpers.os.get_terminal_size")
    def test_get_terminal_size_small_terminal(self, mock_get_size):
        """Test getting size for small terminal."""
        from collections import namedtuple

        Size = namedtuple("Size", ["columns", "rows"])
        mock_get_size.return_value = Size(columns=40, rows=10)

        columns, rows = get_terminal_size()

        assert columns == 40
        assert rows == 10


class TestHelpersIntegration:
    """Integration tests for helper utilities."""

    def test_helpers_chain(self, mock_repository_root):
        """Test chaining helper functions together."""
        # Find repository
        repo_path = find_repository_root(str(mock_repository_root))
        assert repo_path is not None

        # Create safe filename from repo path
        safe_name = safe_filename(str(repo_path))
        assert "/" not in safe_name

        # Truncate if needed
        truncated = truncate_text(safe_name, max_length=100)
        assert len(truncated) <= 100

    def test_edge_case_combinations(self):
        """Test combinations of edge cases."""
        # Empty input to various functions
        assert truncate_text("", 10) == ""
        assert safe_filename("") == "untitled"
        assert validate_container_name("") is False

        # Very long inputs
        long_text = "A" * 1000
        assert len(truncate_text(long_text, 50)) == 50
        assert len(safe_filename(long_text)) > 0
