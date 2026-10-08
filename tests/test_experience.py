"""
tests/test_experience.py — Tests for auto-computed tenure/experience.

Run with: pytest tests/ -v
"""

from datetime import date

import config


# ── Tenure computation ────────────────────────────────────
class TestYearsSince:
    def test_whole_year(self):
        # Arrange
        start = date(2024, 1, 1)
        today = date(2025, 1, 1)

        # Act
        years = config.years_since(start, today)

        # Assert
        assert years == 1.0

    def test_one_and_a_half_years(self):
        start = date(2024, 1, 1)
        today = date(2025, 7, 2)  # ~1.5 years later
        assert config.years_since(start, today) == 1.5

    def test_rounds_to_one_decimal(self):
        start = date(2024, 10, 1)
        today = date(2026, 10, 8)  # ~2.02 years
        assert config.years_since(start, today) == 2.0

    def test_defaults_to_today_when_omitted(self):
        start = date(2024, 10, 1)
        # Should not raise and should be a positive float.
        assert config.years_since(start) > 0


# ── Display formatting ────────────────────────────────────
class TestFormatYears:
    def test_whole_number_drops_trailing_zero(self):
        assert config.format_years(2.0) == "2"

    def test_fractional_keeps_one_decimal(self):
        assert config.format_years(1.5) == "1.5"


# ── Config wiring ─────────────────────────────────────────
class TestExperienceWiring:
    def test_years_experience_metric_is_computed(self):
        metric = next(m for m in config.METRICS if m["label"] == "Years Experience")
        assert metric["value"] == config.YEARS_EXPERIENCE

    def test_current_role_shows_computed_duration(self):
        current = config.EXPERIENCE[0]
        assert f"{config.YEARS_EXPERIENCE} yrs" in current["date"]
        assert "Present" in current["date"]
