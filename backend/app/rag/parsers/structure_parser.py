import re
from typing import List, Dict, Any
from pydantic import BaseModel


class StructureElement(BaseModel):
    element_type: str  # heading, subheading, paragraph, list, table, eligibility, financial, application
    text: str
    page_number: int
    heading_path: List[str] = []
    metadata: Dict[str, Any] = {}


class StructureParser:
    """
    Parses pages into structural elements (headings, subheadings, lists, tables, paragraphs)
    and maintains the heading hierarchy path.
    """

    HEADING_PATTERNS = [
        r"^(SECTION|CHAPTER|PART)\s+\d+[:\.\s\-]",
        r"^\d+\.\d*\s+[A-Z]",
        r"^[A-Z\s]{4,50}$",
        r"^(Eligibility|Pattern of Finance|Loan Details|Application Procedure|Required Documents|Target Group|Channel Partners|Repayment Period|Interest Rate|Moratorium|Financial Assistance|Quantum of Loan|Purpose)[:\s]?",
    ]

    ELIGIBILITY_KEYWORDS = ["eligibility", "eligible", "target group", "annual income", "age limit", "qualification", "category"]
    FINANCIAL_KEYWORDS = ["loan", "interest", "pattern of finance", "subsidy", "quantum", "repayment", "moratorium", "cost", "financing"]
    APPLICATION_KEYWORDS = ["application", "how to apply", "procedure", "channel partner", "sca", "bank", "portal", "where to apply"]
    DOCUMENTS_KEYWORDS = ["documents required", "required documents", "enclosures", "certificates", "aadhaar", "proof"]

    @classmethod
    def classify_text_type(cls, text: str, heading_context: str = "") -> str:
        """Classify chunk content type based on keywords and headings."""
        lower = (text + " " + heading_context).lower()

        if any(kw in lower for kw in cls.ELIGIBILITY_KEYWORDS):
            return "eligibility"
        elif any(kw in lower for kw in cls.FINANCIAL_KEYWORDS):
            return "financial"
        elif any(kw in lower for kw in cls.DOCUMENTS_KEYWORDS):
            return "documents"
        elif any(kw in lower for kw in cls.APPLICATION_KEYWORDS):
            return "application"

        return "overview"

    @classmethod
    def is_heading(cls, line: str) -> bool:
        """Check if line matches heading patterns."""
        line_s = line.strip()
        if not line_s or len(line_s) > 120:
            return False

        for pattern in cls.HEADING_PATTERNS:
            if re.search(pattern, line_s, re.IGNORECASE):
                return True
        return False
