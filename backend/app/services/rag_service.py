import time
import uuid
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.rag.pipeline.retrieve import RetrievalPipeline
from app.rag.pipeline.generate import GenerationPipeline
from app.services.context_service import ContextService
from app.services.citation_service import CitationService
from app.schemas.rag import RAGQueryRequest, RAGQueryResponse, RetrievalDiagnostics
from app.schemas.retrieval import RetrievalFilter
from app.rag.retrievers.metadata_filter import MetadataFilterBuilder
from app.core.logging import log_rag_request
from app.core.config import settings

logger = logging.getLogger(__name__)


class RAGService:
    """
    Main YojanaSetu RAG Service.
    Orchestrates Query Understanding -> Filtering -> Hybrid Retrieval -> RRF -> Reranking -> Expansion -> Compression -> LLM Generation -> Citation & Confidence Rating.
    """

    def __init__(self, db: Session):
        self.db = db
        self.retrieval_pipeline = RetrievalPipeline(db)

    def answer_query(self, request: RAGQueryRequest) -> RAGQueryResponse:
        start_time = time.time()
        request_id = f"rag_{uuid.uuid4().hex[:8]}"

        # 1. Query Understanding & Intent Classification
        query_intent = self._classify_intent(request.query)
        rewritten_queries = self._rewrite_query(request.query, query_intent)

        # 2. Build Metadata Filter
        filter_obj = RetrievalFilter(
            scheme_id=request.scheme_id,
            language=request.language,
        )
        filter_dict = MetadataFilterBuilder.build_filter(filter_obj)

        # 3. Retrieve & Rerank Candidates
        retrieval_res = self.retrieval_pipeline.retrieve_candidates(
            query=request.query,
            dense_top_k=settings.RAG_DENSE_TOP_K,
            sparse_top_k=settings.RAG_SPARSE_TOP_K,
            rerank_top_k=settings.RAG_RERANK_TOP_K,
            filter_metadata=filter_dict,
        )

        raw_chunks = retrieval_res["reranked_chunks"]

        # Also run retrieval on expanded queries if enabled and initial results are low
        if settings.ENABLE_QUERY_EXPANSION and len(raw_chunks) < 3 and rewritten_queries:
            for alt_q in rewritten_queries[:2]:
                sub_res = self.retrieval_pipeline.retrieve_candidates(
                    query=alt_q,
                    dense_top_k=10,
                    sparse_top_k=10,
                    rerank_top_k=4,
                    filter_metadata=filter_dict,
                )
                raw_chunks.extend(sub_res["reranked_chunks"])

        # 4. Context Expansion & Compression
        expanded_chunks = ContextService.expand_parent_context(self.db, raw_chunks)
        final_context_chunks = ContextService.compress_context(
            expanded_chunks[:settings.RAG_FINAL_CONTEXT_TOP_K]
        )

        # 5. Calculate Confidence & Quality Diagnostics
        confidence, conf_score = self._compute_confidence(final_context_chunks)

        # 6. Generate Grounded Answer
        if not final_context_chunks or confidence == "low":
            answer = GenerationPipeline.generate_answer(request.query, final_context_chunks, request.language)
            warnings = ["Confidence is low due to limited matching official scheme context."]
        else:
            answer = GenerationPipeline.generate_answer(request.query, final_context_chunks, request.language)
            warnings = []

        # 7. Generate Citations
        citations = CitationService.generate_citations(final_context_chunks)

        latency_ms = (time.time() - start_time) * 1000.0

        diagnostics = RetrievalDiagnostics(
            dense_count=retrieval_res["dense_count"],
            sparse_count=retrieval_res["sparse_count"],
            fused_count=retrieval_res["fused_count"],
            reranked_count=len(final_context_chunks),
            latency_ms=round(latency_ms, 2),
            query_intent=query_intent,
            rewritten_queries=rewritten_queries,
        )

        # Log Telemetry
        log_rag_request(
            request_id=request_id,
            query=request.query,
            intent=query_intent,
            rewritten_queries=rewritten_queries,
            filters=filter_dict or {},
            dense_count=retrieval_res["dense_count"],
            sparse_count=retrieval_res["sparse_count"],
            fused_count=retrieval_res["fused_count"],
            reranked_count=len(final_context_chunks),
            latency_ms=latency_ms,
            confidence=confidence,
        )

        return RAGQueryResponse(
            answer=answer,
            confidence=confidence,
            confidence_score=round(conf_score, 3),
            sources=citations,
            retrieval=diagnostics,
            warnings=warnings,
        )

    def _classify_intent(self, query: str) -> str:
        q_lower = query.lower()
        if any(w in q_lower for w in ["document", "proof", "aadhaar", "certificate"]):
            return "DOCUMENT_REQUIREMENTS"
        elif any(w in q_lower for w in ["interest", "loan amount", "cost", "emi", "repayment", "rate"]):
            return "FINANCIAL_INFORMATION"
        elif any(w in q_lower for w in ["apply", "portal", "where", "procedure", "form", "bank"]):
            return "APPLICATION_PROCESS"
        elif any(w in q_lower for w in ["eligible", "income limit", "age", "criteria", "who can"]):
            return "ELIGIBILITY_EXPLANATION"
        elif any(w in q_lower for w in ["compare", "difference", "versus", "vs"]):
            return "COMPARISON"
        elif any(w in q_lower for w in ["why recommended", "why match"]):
            return "WHY_RECOMMENDED"
        elif any(w in q_lower for w in ["why not eligible", "why rejected"]):
            return "WHY_NOT_RECOMMENDED"

        return "SCHEME_DISCOVERY"

    def _rewrite_query(self, query: str, intent: str) -> List[str]:
        rewritten = []
        if intent == "FINANCIAL_INFORMATION":
            rewritten.append(f"{query} loan terms interest rate maximum loan pattern of finance")
        elif intent == "DOCUMENT_REQUIREMENTS":
            rewritten.append(f"{query} required documents application enclosures proof")
        elif intent == "APPLICATION_PROCESS":
            rewritten.append(f"{query} application procedure channel partner bank online portal")
        elif intent == "ELIGIBILITY_EXPLANATION":
            rewritten.append(f"{query} target group income limit age criteria backward classes")
        else:
            rewritten.append(f"government scheme {query} guidelines assistance")

        return rewritten

    def _compute_confidence(self, chunks: List[Any]) -> tuple[str, float]:
        if not chunks:
            return "low", 0.0

        scores = [chk.score for chk in chunks if hasattr(chk, "score")]
        max_score = max(scores) if scores else 0.0
        count = len(chunks)

        # Baseline rating algorithm
        if count >= 3 and max_score > 0.4:
            return "high", min(0.95, 0.6 + max_score * 0.35)
        elif count >= 1 or max_score > 0.2:
            return "medium", min(0.75, 0.4 + max_score * 0.3)
        
        return "low", 0.3
