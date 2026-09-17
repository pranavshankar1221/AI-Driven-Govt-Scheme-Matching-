from typing import Optional, Dict, Any


def format_citation_string(title: str, organization: str, page_start: int, page_end: Optional[int] = None) -> str:
    """Format citation string, e.g. [Source: NBCFDC Pattern of Finance, p. 3-4]."""
    page_str = f"p. {page_start}" if page_start == page_end or not page_end else f"pp. {page_start}-{page_end}"
    return f"[Source: {title} ({organization}), {page_str}]"


def build_citation_dict(
    chunk_id: str,
    document_id: str,
    title: str,
    organization: str,
    page_start: int,
    page_end: int,
    source_url: Optional[str] = None,
    chunk_type: Optional[str] = None,
) -> Dict[str, Any]:
    """Build standardized citation metadata dictionary."""
    citation_text = format_citation_string(title, organization, page_start, page_end)
    return {
        "chunk_id": chunk_id,
        "document_id": document_id,
        "title": title,
        "organization": organization,
        "page": page_start,
        "page_end": page_end,
        "source_url": source_url,
        "chunk_type": chunk_type,
        "citation_text": citation_text,
    }
