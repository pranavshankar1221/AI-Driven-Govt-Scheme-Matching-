import logging
import sys
import json
from datetime import datetime

# Set up logger
logger = logging.getLogger("yojanasetu_rag")
logger.setLevel(logging.INFO)

# Console handler
handler = logging.StreamHandler(sys.stdout)
formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s")
handler.setFormatter(formatter)

if not logger.handlers:
    logger.addHandler(handler)


def log_rag_request(
    request_id: str,
    query: str,
    intent: str,
    rewritten_queries: list,
    filters: dict,
    dense_count: int,
    sparse_count: int,
    fused_count: int,
    reranked_count: int,
    latency_ms: float,
    confidence: str,
):
    """Log structured diagnostic telemetry for every RAG query."""
    log_payload = {
        "event": "rag_query",
        "timestamp": datetime.utcnow().isoformat(),
        "request_id": request_id,
        "query": query,
        "intent": intent,
        "rewritten_queries": rewritten_queries,
        "filters": filters,
        "counts": {
            "dense": dense_count,
            "sparse": sparse_count,
            "fused": fused_count,
            "reranked": reranked_count,
        },
        "latency_ms": round(latency_ms, 2),
        "confidence": confidence,
    }
    logger.info(json.dumps(log_payload))
