import re
from typing import List, Dict, Any


class TableParser:
    """
    Parses and normalizes tabular content into clean descriptive text chunks.
    Ensures financial tables and numbers maintain their semantic association.
    """

    @staticmethod
    def is_table_block(text: str) -> bool:
        """Check if a text segment contains tabular data (e.g. pipe tables, tab-delimited columns)."""
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        if not lines:
            return False
        
        # Pipe separated table or aligned numbers/percentages
        pipe_count = sum(1 for line in lines if "|" in line)
        tab_colon_count = sum(1 for line in lines if ":" in line or "\t" in line or "%" in line or "₹" in line or "Rs" in line)
        
        return pipe_count >= 2 or (len(lines) >= 3 and tab_colon_count / len(lines) >= 0.5)

    @staticmethod
    def normalize_table(table_text: str, heading: str = "") -> str:
        """
        Convert tabular text into clear key-value key sentence representations.
        Example:
        Loan amount: up to ₹25 lakh.
        NBCFDC contribution: 85%.
        Channel partner/beneficiary contribution: 15%.
        """
        lines = [l.strip() for l in table_text.split("\n") if l.strip()]
        normalized_sentences = []

        if heading:
            normalized_sentences.append(f"Table Summary for {heading}:")

        for line in lines:
            # Clean Markdown pipes
            cleaned_line = re.sub(r"^\||\|$", "", line).strip()
            parts = [p.strip() for p in cleaned_line.split("|") if p.strip()]

            if len(parts) >= 2:
                # Key-Value or Column pair
                label = parts[0]
                value = " - ".join(parts[1:])
                normalized_sentences.append(f"{label}: {value}.")
            else:
                # Handle colon separated lines
                normalized_sentences.append(cleaned_line)

        return "\n".join(normalized_sentences)
