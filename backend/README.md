# Backend - AI-Driven Government Scheme Matching Platform

This is the central FastAPI backend repository for the AI-Driven Government Scheme Matching platform.

## Architecture Overview

```
backend/
├── app/
│   ├── main.py                     # Primary FastAPI entrypoint
│   ├── core/                       # Settings, Security, Exceptions
│   ├── api/v1/                     # API Routers (ai.py, chat.py, schemes.py, voice.py, etc.)
│   ├── ai/                         # Modular AI engines (nlp, eligibility, recommendation, rag, agent, voice)
│   ├── models/                     # Database Models
│   ├── schemas/                    # Pydantic Schemas
│   ├── services/                   # Business Logic Services
│   ├── database/                   # DB Connections & Migrations
│   ├── integrations/               # External Providers (LLMs, Vector DB, Telephony)
│   └── utils/                      # Helper Utilities
├── data/                           # Data files (schemes, documents, partners)
├── tests/                          # Test suite
└── scripts/                        # Database seeding & ingestion scripts
```

## Quickstart

### 1. Set up Virtual Environment
```bash
python -m venv .venv
.\.venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 2. Run API Server
```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Run Tests
```bash
python -m pytest tests/ -v
```
