import logging

logger = logging.getLogger(__name__)

_encoder = None

def count_tokens(text: str) -> int:
    """Calculate token count using tiktoken (cl100k_base) or fallback word-ratio estimation."""
    global _encoder
    if not text:
        return 0
    try:
        if _encoder is None:
            import tiktoken
            _encoder = tiktoken.get_encoding("cl100k_base")
        return len(_encoder.encode(text))
    except Exception:
        # Fallback estimation: ~1.3 tokens per word
        words = text.split()
        return int(len(words) * 1.3)
