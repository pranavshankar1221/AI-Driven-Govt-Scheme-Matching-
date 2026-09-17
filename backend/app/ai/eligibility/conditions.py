"""
Module: app/ai/eligibility/conditions.py

Deterministic operator evaluators for eligibility rule conditions.

Supported operators:
    =, !=, <, <=, >, >=, IN, NOT_IN

NO LLM is used here. All comparisons are pure Python logic.
"""

from typing import Any, List, Union


# ---------------------------------------------------------------------------
# Type alias
# ---------------------------------------------------------------------------
RuleValue = Union[str, int, float, List[Any]]


class ConditionEvaluationError(ValueError):
    """Raised when a condition cannot be evaluated (type mismatch, unknown op)."""


def _coerce(profile_val: Any, rule_val: Any) -> tuple:
    """
    Coerce profile_val to the type of rule_val for numeric comparisons.
    Strings are lowercased for case-insensitive equality checks.
    Returns (coerced_profile_val, rule_val) or raises ConditionEvaluationError.
    """
    if isinstance(rule_val, (int, float)):
        try:
            return (float(profile_val), float(rule_val))
        except (TypeError, ValueError):
            raise ConditionEvaluationError(
                f"Cannot coerce profile value '{profile_val}' to number for comparison with '{rule_val}'."
            )
    if isinstance(rule_val, str):
        return (str(profile_val).lower().strip(), rule_val.lower().strip())
    return (profile_val, rule_val)


def _coerce_list(profile_val: Any, rule_list: List[Any]) -> tuple:
    """
    Coerce profile_val and every element in rule_list to a comparable type
    (strings lowercased, numbers as floats).
    Returns (coerced_profile_val, coerced_list).
    """
    if not rule_list:
        return (profile_val, rule_list)

    sample = rule_list[0]
    if isinstance(sample, (int, float)):
        try:
            coerced_pv = float(profile_val)
            coerced_list = [float(v) for v in rule_list]
            return (coerced_pv, coerced_list)
        except (TypeError, ValueError):
            raise ConditionEvaluationError(
                f"Cannot coerce profile value '{profile_val}' to number for IN/NOT_IN check."
            )
    # String list — lower-case everything
    coerced_pv = str(profile_val).lower().strip()
    coerced_list = [str(v).lower().strip() for v in rule_list]
    return (coerced_pv, coerced_list)


# ---------------------------------------------------------------------------
# Operator implementations
# ---------------------------------------------------------------------------

def op_eq(profile_val: Any, rule_val: Any) -> bool:
    """Operator: = (equals)"""
    pv, rv = _coerce(profile_val, rule_val)
    return pv == rv


def op_neq(profile_val: Any, rule_val: Any) -> bool:
    """Operator: != (not equals)"""
    pv, rv = _coerce(profile_val, rule_val)
    return pv != rv


def op_lt(profile_val: Any, rule_val: Any) -> bool:
    """Operator: < (less than)"""
    pv, rv = _coerce(profile_val, rule_val)
    return pv < rv  # type: ignore[operator]


def op_lte(profile_val: Any, rule_val: Any) -> bool:
    """Operator: <= (less than or equal)"""
    pv, rv = _coerce(profile_val, rule_val)
    return pv <= rv  # type: ignore[operator]


def op_gt(profile_val: Any, rule_val: Any) -> bool:
    """Operator: > (greater than)"""
    pv, rv = _coerce(profile_val, rule_val)
    return pv > rv  # type: ignore[operator]


def op_gte(profile_val: Any, rule_val: Any) -> bool:
    """Operator: >= (greater than or equal)"""
    pv, rv = _coerce(profile_val, rule_val)
    return pv >= rv  # type: ignore[operator]


def op_in(profile_val: Any, rule_list: List[Any]) -> bool:
    """Operator: IN — profile value must be one of the listed values."""
    if not isinstance(rule_list, list):
        raise ConditionEvaluationError(
            f"IN operator requires a list as rule value, got {type(rule_list).__name__}."
        )
    pv, rl = _coerce_list(profile_val, rule_list)
    return pv in rl


def op_not_in(profile_val: Any, rule_list: List[Any]) -> bool:
    """Operator: NOT_IN — profile value must NOT be in the listed values."""
    if not isinstance(rule_list, list):
        raise ConditionEvaluationError(
            f"NOT_IN operator requires a list as rule value, got {type(rule_list).__name__}."
        )
    pv, rl = _coerce_list(profile_val, rule_list)
    return pv not in rl


# ---------------------------------------------------------------------------
# Dispatcher
# ---------------------------------------------------------------------------

OPERATOR_MAP = {
    "=":       op_eq,
    "==":      op_eq,       # alias
    "!=":      op_neq,
    "<":       op_lt,
    "<=":      op_lte,
    ">":       op_gt,
    ">=":      op_gte,
    "IN":      op_in,
    "NOT_IN":  op_not_in,
}


def evaluate_condition(profile_val: Any, operator: str, rule_val: RuleValue) -> bool:
    """
    Evaluate a single condition deterministically.

    Args:
        profile_val: The value extracted from the beneficiary profile.
        operator:    One of =, !=, <, <=, >, >=, IN, NOT_IN.
        rule_val:    The target value from the scheme rule definition.

    Returns:
        True if the condition passes, False otherwise.

    Raises:
        ConditionEvaluationError: For unsupported operators or type mismatches.
    """
    fn = OPERATOR_MAP.get(operator.strip())
    if fn is None:
        raise ConditionEvaluationError(
            f"Unsupported operator '{operator}'. "
            f"Supported: {list(OPERATOR_MAP.keys())}"
        )
    return fn(profile_val, rule_val)
