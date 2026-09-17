"""
Module: app/ai/recommendation/ranker.py

SchemeRanker: sorts a list of RankedScheme by suitability score.

Ranking order:
  1. potentially_eligible (highest score first)
  2. needs_verification (highest score first)
  3. not_eligible (highest score first)
"""

from __future__ import annotations

from typing import List, Optional

from app.schemas.recommendation import RankedScheme


_VERDICT_ORDER = {
    "potentially_eligible": 0,
    "needs_verification": 1,
    "not_eligible": 2,
}


class SchemeRanker:
    """Sorts matched schemes by verdict priority + suitability score."""

    @staticmethod
    def rank(
        schemes: List[RankedScheme],
        top_n: Optional[int] = None,
    ) -> List[RankedScheme]:
        """
        Sort schemes by verdict priority then by suitability_score descending.

        Args:
            schemes: List of RankedScheme from SchemeMatcher.
            top_n:   Optional cap on number of results returned.

        Returns:
            Sorted list of RankedScheme.
        """
        sorted_schemes = sorted(
            schemes,
            key=lambda s: (
                _VERDICT_ORDER.get(s.verdict, 99),
                -s.suitability_score,
            ),
        )
        if top_n and top_n > 0:
            return sorted_schemes[:top_n]
        return sorted_schemes
