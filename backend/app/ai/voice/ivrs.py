"""
Module: app/ai/voice/ivrs.py

IVRS (Interactive Voice Response System) session flow.

Provides a menu-driven fallback for users calling via phone,
where continuous voice recognition may not be reliable.

Uses DTMF tone detection + pre-recorded prompts.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class IVRSMenuNode:
    """A single IVRS menu node."""
    node_id: str
    prompt: str  # To be spoken via TTS
    options: Dict[str, str] = field(default_factory=dict)  # digit → next_node_id
    action: Optional[str] = None  # intent to trigger if a leaf node


# Default IVRS menu tree
IVRS_MENU: Dict[str, IVRSMenuNode] = {
    "main": IVRSMenuNode(
        node_id="main",
        prompt=(
            "Welcome to the Government Scheme Assistant. "
            "Press 1 for scheme eligibility check. "
            "Press 2 for loan and EMI information. "
            "Press 3 for document requirements. "
            "Press 4 to speak with a human officer. "
            "Press 0 to repeat this menu."
        ),
        options={
            "1": "eligibility",
            "2": "finance",
            "3": "documents",
            "4": "human",
            "0": "main",
        },
    ),
    "eligibility": IVRSMenuNode(
        node_id="eligibility",
        prompt="You selected scheme eligibility. Please speak your query after the beep, or press 1 for farmers, press 2 for business, press 3 for women's schemes.",
        options={"1": "farmer", "2": "business", "3": "women"},
        action="eligibility_check",
    ),
    "finance": IVRSMenuNode(
        node_id="finance",
        prompt="You selected financial information. Please speak your loan amount and tenure after the beep.",
        action="financial_calculation",
    ),
    "documents": IVRSMenuNode(
        node_id="documents",
        prompt="You selected document requirements. Please speak the scheme name after the beep.",
        action="document_query",
    ),
    "human": IVRSMenuNode(
        node_id="human",
        prompt="Connecting you to a human officer. Please hold. The helpline number is 1800-180-1111. Thank you.",
        action="human_assistance",
    ),
}


class IVRSSession:
    """Manages an IVRS session state."""

    def __init__(self) -> None:
        self.current_node_id: str = "main"
        self.history: List[str] = []

    @property
    def current_node(self) -> IVRSMenuNode:
        return IVRS_MENU.get(self.current_node_id, IVRS_MENU["main"])

    @property
    def current_prompt(self) -> str:
        return self.current_node.prompt

    @property
    def current_action(self) -> Optional[str]:
        return self.current_node.action

    def handle_dtmf(self, digit: str) -> str:
        """
        Process a DTMF digit press.

        Returns:
            The prompt text for the next node (to be spoken via TTS).
        """
        node = self.current_node
        if digit in node.options:
            self.history.append(self.current_node_id)
            self.current_node_id = node.options[digit]
            return self.current_prompt
        # Invalid digit — repeat current menu
        return f"Invalid option. {self.current_prompt}"

    def go_back(self) -> str:
        """Navigate back one level."""
        if self.history:
            self.current_node_id = self.history.pop()
        return self.current_prompt
