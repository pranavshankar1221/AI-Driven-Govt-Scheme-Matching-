import re
from typing import List


def normalize_whitespace(text: str) -> str:
    """Normalize irregular spaces and line breaks while preserving paragraph boundaries."""
    if not text:
        return ""
    # Replace non-breaking spaces
    text = text.replace("\xa0", " ")
    # Replace 3+ newlines with double newline
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Replace multiple horizontal spaces with single space
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def remove_headers_footers(pages_text: List[str]) -> List[str]:
    """
    Detect and strip repeated header/footer lines across PDF pages.
    """
    if len(pages_text) <= 2:
        return pages_text

    line_counts = {}
    total_pages = len(pages_text)

    # Count occurrences of top 2 and bottom 2 lines per page
    for page in pages_text:
        lines = [l.strip() for l in page.split("\n") if l.strip()]
        if not lines:
            continue
        header_candidates = lines[:2]
        footer_candidates = lines[-2:]
        for candidate in header_candidates + footer_candidates:
            if len(candidate) > 5 and not candidate.isdigit():  # ignore simple page numbers
                line_counts[candidate] = line_counts.get(candidate, 0) + 1

    # Identify headers/footers that appear on >= 60% of pages
    repeated_patterns = {line for line, count in line_counts.items() if count >= max(2, total_pages * 0.6)}

    cleaned_pages = []
    for page in pages_text:
        lines = page.split("\n")
        filtered_lines = [line for line in lines if line.strip() not in repeated_patterns]
        cleaned_pages.append("\n".join(filtered_lines))

    return cleaned_pages


def clean_chunk_text(text: str) -> str:
    """Clean individual chunk text, ensuring numbers, currencies, and structure remain intact."""
    cleaned = normalize_whitespace(text)
    # Preserve currency formatting e.g. Rs. 2.5 Lakh, ₹25,000, 15%
    return cleaned
