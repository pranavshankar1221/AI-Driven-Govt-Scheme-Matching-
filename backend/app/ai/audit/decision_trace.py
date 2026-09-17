"""
Module: app/ai/audit/decision_trace.py

Decision trace recorder for audit and transparency.

Records key decision points in the AI pipeline per session.
NO sensitive PII is logged — only structural decisions.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List


# In-memory audit store (per process, non-persistent)
# For production: replace with a database or structured logging backend.
_audit_log: Dict[str, List[Dict[str, Any]]] = {}


class DecisionTracer:
    """Records audit trail of AI decisions per session."""

    @classmethod
    def record(
        cls,
        session_id: str,
        step: str,
        inputs: Dict[str, Any],
        output: Any,
        note: str = "",
    ) -> None:
        """
        Record a decision step in the audit log.

        Args:
            session_id: Session or conversation ID.
            step:       Pipeline step name (e.g., 'intent_classification').
            inputs:     Sanitized inputs (NO PII).
            output:     Sanitized output.
            note:       Optional note.
        """
        if session_id not in _audit_log:
            _audit_log[session_id] = []

        _audit_log[session_id].append({
            "timestamp": datetime.utcnow().isoformat(),
            "step": step,
            "inputs": inputs,
            "output": output,
            "note": note,
        })

    @classmethod
    def get_trace(cls, session_id: str) -> List[Dict[str, Any]]:
        """Retrieve the full audit trace for a session."""
        return _audit_log.get(session_id, [])

    @classmethod
    def clear(cls, session_id: str) -> None:
        """Clear audit trace for a session (on session end)."""
        _audit_log.pop(session_id, None)
