"""
Module: app/ai/recommendation/weights.py

Loads and validates scoring weights from:
    data/config/ranking_weights.json

This is the SINGLE SOURCE OF TRUTH for all ranking parameters.
No weight values are hard-coded anywhere else in the ranking pipeline.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Dict

from pydantic import BaseModel, Field, model_validator


# ---------------------------------------------------------------------------
# Path to the configuration file
# ---------------------------------------------------------------------------

_BASE_DIR     = Path(__file__).resolve().parent.parent.parent.parent  # backend/
_WEIGHTS_FILE = _BASE_DIR / "data" / "config" / "ranking_weights.json"


# ---------------------------------------------------------------------------
# Pydantic model for weights — validates on load
# ---------------------------------------------------------------------------

class WeightValues(BaseModel):
    """Core component weights. Positive = reward. Negative = penalty."""
    required_conditions_passed:       float = Field(..., description="Weight for ratio of required conditions passed (0-1).")
    optional_conditions_passed:       float = Field(..., description="Weight for ratio of optional conditions passed (0-1).")
    data_completeness:                float = Field(..., description="Weight for ratio of required fields present in profile (0-1).")
    required_conditions_failed:       float = Field(..., le=0, description="Per-condition penalty (≤0) for required failures.")
    required_conditions_unverifiable: float = Field(..., le=0, description="Per-condition penalty (≤0) for required fields absent.")
    optional_conditions_failed:       float = Field(..., le=0, description="Per-condition penalty (≤0) for optional failures.")


class BonusValues(BaseModel):
    """One-off bonus points for perfect matches."""
    all_conditions_passed: float = Field(..., ge=0, description="Bonus when every single condition passes.")
    no_missing_fields:     float = Field(..., ge=0, description="Bonus when no required profile field is missing.")


class RankingWeights(BaseModel):
    """
    Complete ranking configuration loaded from ranking_weights.json.

    Edit that file to adjust behaviour — never edit this model's defaults.
    """
    weights:       WeightValues
    bonus:         BonusValues
    score_floor:   float = Field(default=0.0,   ge=0,   le=100)
    score_ceiling: float = Field(default=100.0, ge=0,   le=100)
    field_weights: Dict[str, float] = Field(default_factory=dict)
    disclaimer:    str   = Field(
        default=(
            "Suitability scores are indicative only and do NOT represent "
            "official government eligibility determination. Final eligibility "
            "is subject to document verification by the relevant authority."
        )
    )

    @model_validator(mode="after")
    def floor_below_ceiling(self) -> "RankingWeights":
        if self.score_floor >= self.score_ceiling:
            raise ValueError(
                f"score_floor ({self.score_floor}) must be less than "
                f"score_ceiling ({self.score_ceiling})."
            )
        return self

    # ── Convenience passthrough properties ────────────────────────────

    @property
    def required_conditions_passed(self) -> float:
        return self.weights.required_conditions_passed

    @property
    def optional_conditions_passed(self) -> float:
        return self.weights.optional_conditions_passed

    @property
    def data_completeness(self) -> float:
        return self.weights.data_completeness

    @property
    def required_conditions_failed(self) -> float:
        return self.weights.required_conditions_failed

    @property
    def required_conditions_unverifiable(self) -> float:
        return self.weights.required_conditions_unverifiable

    @property
    def optional_conditions_failed(self) -> float:
        return self.weights.optional_conditions_failed

    @property
    def bonus_all_conditions_passed(self) -> float:
        return self.bonus.all_conditions_passed

    @property
    def bonus_no_missing_fields(self) -> float:
        return self.bonus.no_missing_fields


# ---------------------------------------------------------------------------
# Loader — cached for the process lifetime
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def load_ranking_weights() -> RankingWeights:
    """
    Parse ranking_weights.json and return a validated RankingWeights instance.
    Cached via @lru_cache — file is read exactly once per process.

    Raises:
        FileNotFoundError: If the config file does not exist.
        ValidationError:   If the JSON structure is invalid.
    """
    if not _WEIGHTS_FILE.exists():
        raise FileNotFoundError(
            f"Ranking weights config not found at: {_WEIGHTS_FILE}. "
            "Please create data/config/ranking_weights.json."
        )

    with open(_WEIGHTS_FILE, encoding="utf-8") as fh:
        raw: dict = json.load(fh)

    # Strip internal comment keys before validation
    clean = {k: v for k, v in raw.items() if not k.startswith("_")}

    # Rename _field_weights → field_weights if present
    if "_field_weights" in raw:
        field_w = {k: v for k, v in raw["_field_weights"].items() if not k.startswith("_")}
        clean["field_weights"] = field_w

    return RankingWeights.model_validate(clean)


def reload_ranking_weights() -> RankingWeights:
    """
    Force reload of ranking_weights.json (clears lru_cache).
    Use in tests or when the config file is hot-updated.
    """
    load_ranking_weights.cache_clear()
    return load_ranking_weights()
