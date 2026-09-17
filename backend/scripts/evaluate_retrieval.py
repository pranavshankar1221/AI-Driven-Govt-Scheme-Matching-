import os
import sys
import json
import time
import math
import logging

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, init_db
from app.services.rag_service import RAGService
from app.schemas.rag import RAGQueryRequest

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("eval_cli")


def compute_mrr(retrieved_facts_found: list) -> float:
    """Mean Reciprocal Rank calculation."""
    for idx, found in enumerate(retrieved_facts_found, start=1):
        if found:
            return 1.0 / idx
    return 0.0


def compute_ndcg(retrieved_facts_found: list, k: int = 5) -> float:
    """Normalized Discounted Cumulative Gain calculation."""
    dcg = 0.0
    for idx, found in enumerate(retrieved_facts_found[:k], start=1):
        rel = 1.0 if found else 0.0
        dcg += rel / math.log2(idx + 1)

    idcg = sum(1.0 / math.log2(i + 1) for i in range(1, min(k, sum(1 for f in retrieved_facts_found if f)) + 1))
    return dcg / idcg if idcg > 0 else 0.0


def main():
    dataset_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "golden_dataset.json"))
    output_metrics_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "retrieval_metrics.json"))

    if not os.path.exists(dataset_path):
        logger.error(f"Golden dataset not found at {dataset_path}")
        sys.exit(1)

    with open(dataset_path, "r", encoding="utf-8") as f:
        golden_dataset = json.load(f)

    init_db()
    db = SessionLocal()
    rag_service = RAGService(db)

    total_questions = len(golden_dataset)
    logger.info(f"Running evaluation benchmark on {total_questions} golden questions...")

    recall_5_count = 0
    recall_10_count = 0
    precision_5_sum = 0.0
    mrr_sum = 0.0
    ndcg_sum = 0.0
    groundedness_sum = 0.0
    citation_accuracy_sum = 0.0

    eval_results = []

    for item in golden_dataset:
        qid = item["id"]
        q_text = item["question"]
        expected_facts = item.get("expected_facts", [])

        start = time.time()
        response = rag_service.answer_query(RAGQueryRequest(query=q_text))
        latency = (time.time() - start) * 1000.0

        # Check facts in retrieved sources & answer
        facts_found = []
        answer_text = response.answer.lower()

        sources = response.sources
        source_texts = " ".join([s.title.lower() for s in sources] + [s.citation_text.lower() for s in sources])

        for fact in expected_facts:
            f_lower = fact.lower()
            in_sources = f_lower in source_texts or f_lower in answer_text
            facts_found.append(in_sources)

        facts_hit = sum(1 for f in facts_found if f)
        fact_recall = facts_hit / len(expected_facts) if expected_facts else 1.0

        if fact_recall >= 0.5:
            recall_5_count += 1
            recall_10_count += 1

        p5 = facts_hit / 5.0
        precision_5_sum += p5

        mrr = compute_mrr(facts_found)
        mrr_sum += mrr

        ndcg = compute_ndcg(facts_found, k=5)
        ndcg_sum += ndcg

        citation_acc = 1.0 if response.sources else 0.0
        citation_accuracy_sum += citation_acc

        grounded = 1.0 if "could not find" not in answer_text else 0.5
        groundedness_sum += grounded

        eval_results.append({
            "id": qid,
            "question": q_text,
            "intent": response.retrieval.query_intent,
            "confidence": response.confidence,
            "confidence_score": response.confidence_score,
            "latency_ms": round(latency, 2),
            "sources_count": len(response.sources),
            "facts_hit": facts_hit,
            "total_expected_facts": len(expected_facts),
            "mrr": round(mrr, 3),
            "ndcg_5": round(ndcg, 3),
        })

    metrics = {
        "benchmark_timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_questions": total_questions,
        "recall_at_5": round(recall_5_count / total_questions, 3) if total_questions else 0,
        "recall_at_10": round(recall_10_count / total_questions, 3) if total_questions else 0,
        "precision_at_5": round(precision_5_sum / total_questions, 3) if total_questions else 0,
        "mrr": round(mrr_sum / total_questions, 3) if total_questions else 0,
        "ndcg_at_5": round(ndcg_sum / total_questions, 3) if total_questions else 0,
        "citation_accuracy": round(citation_accuracy_sum / total_questions, 3) if total_questions else 0,
        "answer_groundedness_score": round(groundedness_sum / total_questions, 3) if total_questions else 0,
        "details": eval_results,
    }

    with open(output_metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    logger.info(f"Evaluation benchmark complete! Output metrics saved to {output_metrics_path}")
    logger.info(f"Summary Metrics -> Recall@5: {metrics['recall_at_5']}, Precision@5: {metrics['precision_at_5']}, MRR: {metrics['mrr']}, NDCG@5: {metrics['ndcg_at_5']}")


if __name__ == "__main__":
    main()
