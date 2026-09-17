import os
from typing import Dict
from pydantic import BaseModel


class Settings(BaseModel):
    PROJECT_NAME: str = "YojanaSetu - AI-Driven Government Scheme Matching & RAG Assistance"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    APP_ENV: str = os.environ.get("APP_ENV", "development")
    DEFAULT_LANGUAGE: str = "en-IN"

    # ── Database Configuration ──────────────────────────────────────────
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "sqlite:///./yojanasetu.db")

    # ── Vector Store Abstraction ────────────────────────────────────────
    # Options: "local" | "pinecone"
    VECTOR_STORE: str = os.environ.get("VECTOR_STORE", "local")
    PINECONE_API_KEY: str = os.environ.get("PINECONE_API_KEY", "")
    PINECONE_INDEX: str = os.environ.get("PINECONE_INDEX", "yojanasetu-schemes")
    PINECONE_NAMESPACE: str = os.environ.get("PINECONE_NAMESPACE", "government-schemes")

    # ── Embedding Provider ──────────────────────────────────────────────
    # Options: "local" | "openai" | "gemini"
    EMBEDDING_PROVIDER: str = os.environ.get("EMBEDDING_PROVIDER", "local")
    EMBEDDING_MODEL: str = os.environ.get("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    EMBEDDING_VERSION: str = os.environ.get("EMBEDDING_VERSION", "v1")
    EMBEDDING_DIMENSION: int = int(os.environ.get("EMBEDDING_DIMENSION", "384"))

    # ── Reranker Provider ───────────────────────────────────────────────
    # Options: "local" | "none"
    RERANKER_PROVIDER: str = os.environ.get("RERANKER_PROVIDER", "local")
    RERANKER_MODEL: str = os.environ.get("RERANKER_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")

    # ── LLM Integration ────────────────────────────────────────────────
    # Options: "gemini" | "openai" | "mock"
    LLM_PROVIDER: str = os.environ.get("LLM_PROVIDER", "mock")
    LLM_MODEL: str = os.environ.get("LLM_MODEL", "gemini-1.5-flash")
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.environ.get("OPENAI_API_KEY", "")
    LLM_MAX_TOKENS: int = int(os.environ.get("LLM_MAX_TOKENS", "1024"))

    # ── RAG Pipeline Tuning ─────────────────────────────────────────────
    RAG_DENSE_TOP_K: int = int(os.environ.get("RAG_DENSE_TOP_K", "20"))
    RAG_SPARSE_TOP_K: int = int(os.environ.get("RAG_SPARSE_TOP_K", "20"))
    RAG_RERANK_TOP_K: int = int(os.environ.get("RAG_RERANK_TOP_K", "8"))
    RAG_FINAL_CONTEXT_TOP_K: int = int(os.environ.get("RAG_FINAL_CONTEXT_TOP_K", "5"))

    CHUNK_MIN_TOKENS: int = int(os.environ.get("CHUNK_MIN_TOKENS", "100"))
    CHUNK_TARGET_TOKENS: int = int(os.environ.get("CHUNK_TARGET_TOKENS", "600"))
    CHUNK_MAX_TOKENS: int = int(os.environ.get("CHUNK_MAX_TOKENS", "1000"))

    ENABLE_QUERY_EXPANSION: bool = os.environ.get("ENABLE_QUERY_EXPANSION", "true").lower() == "true"
    ENABLE_RERANKING: bool = os.environ.get("ENABLE_RERANKING", "true").lower() == "true"

    # ── Speech / Voice Integration ─────────────────────────────────────
    # Options: "parakeet" | "sarvam" | "mock"
    SPEECH_PROVIDER: str = os.environ.get("SPEECH_PROVIDER", "mock")
    SARVAM_API_KEY: str = os.environ.get("SARVAM_API_KEY", "")
    GOOGLE_SPEECH_API_KEY: str = os.environ.get("GOOGLE_SPEECH_API_KEY", "")

    # ── AI Phone Agent & SMS Integration ──────────────────────────────
    AI_AGENT_PHONE_NUMBER: str = os.environ.get("AI_AGENT_PHONE_NUMBER", "")
    # Options: "twilio" | "mock"
    SMS_PROVIDER: str = os.environ.get("SMS_PROVIDER", "mock")
    SMS_API_KEY: str = os.environ.get("SMS_API_KEY", "")
    SMS_API_SECRET: str = os.environ.get("SMS_API_SECRET", "")
    SMS_FROM_NUMBER: str = os.environ.get("SMS_FROM_NUMBER", "")
    SMS_TEMPLATE_VERSION: str = "v1.0.0"

    # ── NVIDIA NIM / Parakeet 1.1B RNNT Multilingual ──────────────────
    # Get your API key at: https://build.nvidia.com/nvidia/parakeet-1-1b-rnnt-multilingual
    NVIDIA_API_KEY: str = os.environ.get("NVIDIA_API_KEY", "")

    # Override for self-hosted NIM container (leave empty for cloud API)
    # Example: "http://localhost:9000" (Docker NIM container)
    NVIDIA_NIM_URL: str = os.environ.get("NVIDIA_NIM_URL", "")

    # Request timeout in seconds for Parakeet STT calls
    NVIDIA_STT_TIMEOUT: float = float(os.environ.get("NVIDIA_STT_TIMEOUT", "30.0"))

    # ── Audio Processing ───────────────────────────────────────────────
    VOICE_INPUT_SAMPLE_RATE: int = int(os.environ.get("VOICE_INPUT_SAMPLE_RATE", "16000"))
    VOICE_OUTPUT_SAMPLE_RATE: int = int(os.environ.get("VOICE_OUTPUT_SAMPLE_RATE", "16000"))
    VOICE_AUDIO_FORMAT: str = os.environ.get("VOICE_AUDIO_FORMAT", "pcm")

    # ── Session / Security ─────────────────────────────────────────────
    SESSION_TIMEOUT_SECONDS: int = int(os.environ.get("SESSION_TIMEOUT_SECONDS", "1800"))
    MAX_AUDIO_SIZE_BYTES: int = int(os.environ.get("MAX_AUDIO_SIZE_BYTES", "1048576"))
    MAX_REQUEST_SIZE_BYTES: int = int(os.environ.get("MAX_REQUEST_SIZE_BYTES", "524288"))

    # ── Confidence Thresholds ──────────────────────────────────────────
    MIN_LANGUAGE_CONFIDENCE: float = float(os.environ.get("MIN_LANGUAGE_CONFIDENCE", "0.65"))
    MIN_INTENT_CONFIDENCE: float = float(os.environ.get("MIN_INTENT_CONFIDENCE", "0.65"))

    # Document storage paths
    OFFICIAL_DOCS_DIR: str = os.environ.get("OFFICIAL_DOCS_DIR", "data/documents/official")
    PROCESSED_DOCS_DIR: str = os.environ.get("PROCESSED_DOCS_DIR", "data/documents/processed")
    CACHE_DIR: str = os.environ.get("CACHE_DIR", "data/cache")

    # ── Supported Languages (BCP-47 → display name) ────────────────────
    # Used by the voice session router for language validation.
    SUPPORTED_LANGUAGES: Dict[str, str] = {
        "English": "en-IN",
        "Hindi": "hi-IN",
        "Tamil": "ta-IN",
        "Telugu": "te-IN",
        "Kannada": "kn-IN",
        "Malayalam": "ml-IN",
        "Bengali": "bn-IN",
        "Marathi": "mr-IN",
        "Punjabi": "pa-IN",
        "Gujarati": "gu-IN",
        "Odia": "or-IN",
        "Urdu": "ur-IN",
    }


settings = Settings()

