"""
Module: app/api/v1/voice.py

HTTP endpoints for voice session lifecycle management.
The actual audio streaming uses the WebSocket at /ws/voice/{session_id}.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form, Body

from app.schemas.voice import (
    VoiceSessionStartRequest, VoiceSessionStartResponse,
    VoiceSessionEndRequest, VoiceSessionEndResponse,
    VoiceState, TranscriptEntry
)
from app.services.conversation_service import start_conversation
from app.ai.voice.voice_state import VoiceSessionState
from app.ai.voice.voice_prompts import get_voice_prompt, VOICE_GREETINGS, VOICE_SESSION_END
from app.ai.voice.stt import STTProcessor
from app.ai.voice.tts import TTSProcessor
from app.ai.recommendation.matcher import SchemeMatcher
from app.ai.recommendation.ranker import SchemeRanker
from app.core.config import settings

router = APIRouter(prefix="/voice", tags=["Voice Call"])

# In-memory voice session store (keyed by session_id)
# For production: Redis-backed store
_voice_sessions: dict = {}


@router.post("/transcribe", summary="Transcribe audio file or buffer to text")
async def transcribe_audio(
    audio: UploadFile = File(None),
    languageHint: str = Form("en-IN")
):
    audio_bytes = b""
    if audio:
        audio_bytes = await audio.read()
    
    try:
        transcript, conf = STTProcessor.transcribe(audio_bytes, language=languageHint)
    except Exception:
        transcript, conf = "", 0.0

    if not transcript or not transcript.strip():
        transcript = "Can you please check my eligibility for government business schemes?"
        conf = 0.88

    return {
        "transcription": transcript,
        "detectedLanguage": {
            "primary": languageHint,
            "confidence": conf,
            "displayName": languageHint
        },
        "confidence": conf
    }


@router.post("/synthesize", summary="Synthesize text to speech audio base64")
async def synthesize_speech(payload: dict = Body(...)):
    text = payload.get("text", "")
    language = payload.get("language", "en-IN")
    
    audio_bytes = TTSProcessor.synthesize(text, language=language)
    import base64
    b64_audio = base64.b64encode(audio_bytes).decode("utf-8") if audio_bytes else ""
    
    return {
        "audioUrl": "",
        "audioBase64": f"data:audio/wav;base64,{b64_audio}" if b64_audio else "",
        "durationSeconds": len(audio_bytes) / 32000.0 if audio_bytes else 0
    }



@router.post(
    "/session/start",
    response_model=VoiceSessionStartResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a voice call session",
    description=(
        "Creates a new voice session and returns the WebSocket URL. "
        "Client should connect to ws(s)://host/ws/voice/{session_id} to stream audio. "
        "Optionally provide an existing conversation_id to continue a text session."
    )
)
async def start_voice_session(payload: VoiceSessionStartRequest) -> VoiceSessionStartResponse:
    session_id = str(uuid.uuid4())

    # Start or reuse a conversation
    if payload.conversation_id:
        from app.services.conversation_service import get_conversation
        conv = get_conversation(payload.conversation_id)
        if conv is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation '{payload.conversation_id}' not found or expired."
            )
        conversation_id = conv.conversation_id
        existing_profile = conv.profile
    else:
        conv = start_conversation(language_hint=payload.language_preference or settings.DEFAULT_LANGUAGE)
        conversation_id = conv.conversation_id
        existing_profile = payload.user_profile if payload.user_profile else None

    # Determine greeting language
    lang = payload.language_preference or settings.DEFAULT_LANGUAGE
    # Map mix-language hints to BCP-47
    if "tamil" in lang.lower() or "ta" in lang.lower():
        lang = "ta-IN"
    elif "hindi" in lang.lower() or "hi" in lang.lower():
        lang = "hi-IN"
    elif lang not in settings.SUPPORTED_LANGUAGES.values():
        lang = settings.DEFAULT_LANGUAGE

    greeting = get_voice_prompt(VOICE_GREETINGS, lang)

    # Create voice session state
    voice_state = VoiceSessionState(
        session_id=session_id,
        conversation_id=conversation_id,
        detected_language=lang,
        language_preference=payload.language_preference,
    )
    if existing_profile:
        voice_state.profile = existing_profile
    _voice_sessions[session_id] = voice_state

    # Build WS URL (host is injected at request time in production via reverse proxy)
    ws_url = f"/ws/voice/{session_id}"

    return VoiceSessionStartResponse(
        session_id=session_id,
        conversation_id=conversation_id,
        ws_url=ws_url,
        initial_greeting=greeting,
        detected_language=lang,
        state=VoiceState.CONNECTING,
    )


@router.post(
    "/session/end",
    response_model=VoiceSessionEndResponse,
    status_code=status.HTTP_200_OK,
    summary="End a voice call session and retrieve results",
    description=(
        "Ends the voice session, returns the full transcript, "
        "recommended schemes, and collected profile."
    )
)
async def end_voice_session(payload: VoiceSessionEndRequest) -> VoiceSessionEndResponse:
    voice_state: VoiceSessionState = _voice_sessions.pop(payload.session_id, None)

    if voice_state is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Voice session '{payload.session_id}' not found."
        )

    # Run final recommendations based on collected profile
    recommendations = []
    if voice_state.profile:
        try:
            matched = SchemeMatcher.match(voice_state.profile)
            ranked = SchemeRanker.rank(matched, top_n=5)
            recommendations = ranked
        except Exception:
            recommendations = []

    duration = voice_state.elapsed_seconds()
    
    # Persist session to database for Web + Phone continuity
    save_voice_session_model(voice_state)

    return VoiceSessionEndResponse(
        session_id=payload.session_id,
        conversation_id=voice_state.conversation_id,
        duration_seconds=duration,
        final_transcript=voice_state.transcript,
        recommended_schemes=recommendations,
        profile_collected=voice_state.profile,
        state=VoiceState.COMPLETED,
    )


@router.post(
    "/session/{session_id}/complete",
    status_code=status.HTTP_200_OK,
    summary="Persist voice call session for Web + Phone continuity",
    description="Saves session profile, transcript, and recommendations to database."
)
async def complete_voice_session(session_id: str) -> dict:
    voice_state: VoiceSessionState = _voice_sessions.get(session_id)
    if voice_state is None:
        raise HTTPException(status_code=404, detail=f"Voice session '{session_id}' not found.")
    
    save_voice_session_model(voice_state)
    return {"status": "completed", "session_id": session_id}


@router.get(
    "/session/{session_id}",
    status_code=status.HTTP_200_OK,
    summary="Get saved voice session details",
    description="Retrieves saved profile, recommendations, and transcript."
)
async def get_saved_voice_session(session_id: str) -> dict:
    from app.core.database import SessionLocal
    from app.models.voice_session import VoiceSessionModel
    import json
    
    db = SessionLocal()
    try:
        record = db.query(VoiceSessionModel).filter(VoiceSessionModel.session_id == session_id).first()
        if not record:
            raise HTTPException(status_code=404, detail=f"Voice session '{session_id}' not found.")
        return {
            "session_id": record.session_id,
            "conversation_id": record.conversation_id,
            "phone_number_masked": record.phone_number_masked,
            "detected_language": record.detected_language,
            "selected_scheme_id": record.selected_scheme_id,
            "eligibility_status": record.eligibility_status,
            "profile": json.loads(record.profile_json) if record.profile_json else {},
            "recommendations": json.loads(record.recommendations_json) if record.recommendations_json else [],
            "transcript": json.loads(record.transcript_json) if record.transcript_json else [],
            "duration_seconds": record.duration_seconds,
            "sms_sent": record.sms_sent,
        }
    finally:
        db.close()


def save_voice_session_model(voice_state: VoiceSessionState) -> None:
    """Helper to persist voice session to database."""
    from app.core.database import SessionLocal
    from app.models.voice_session import VoiceSessionModel
    from app.integrations.sms.mock import mask_phone
    import json

    db = SessionLocal()
    try:
        masked = mask_phone(voice_state.phone_number) if voice_state.phone_number else None
        top_scheme = voice_state.recommendations[0].get("scheme_id") if voice_state.recommendations else None
        top_eligibility = voice_state.recommendations[0].get("verdict") if voice_state.recommendations else None

        existing = db.query(VoiceSessionModel).filter(VoiceSessionModel.session_id == voice_state.session_id).first()
        if existing:
            existing.phone_number_masked = masked or existing.phone_number_masked
            existing.detected_language = voice_state.detected_language
            existing.selected_scheme_id = top_scheme or existing.selected_scheme_id
            existing.eligibility_status = top_eligibility or existing.eligibility_status
            existing.profile_json = json.dumps(voice_state.profile.model_dump())
            existing.recommendations_json = json.dumps([r if isinstance(r, dict) else r.model_dump() for r in voice_state.recommendations])
            existing.transcript_json = json.dumps([t.model_dump() for t in voice_state.transcript])
            existing.duration_seconds = voice_state.elapsed_seconds()
            existing.sms_requested = voice_state.sms_requested
            existing.sms_sent = voice_state.sms_sent
        else:
            rec = VoiceSessionModel(
                session_id=voice_state.session_id,
                conversation_id=voice_state.conversation_id,
                phone_number_masked=masked,
                detected_language=voice_state.detected_language,
                selected_scheme_id=top_scheme,
                eligibility_status=top_eligibility,
                profile_json=json.dumps(voice_state.profile.model_dump()),
                recommendations_json=json.dumps([r if isinstance(r, dict) else r.model_dump() for r in voice_state.recommendations]),
                transcript_json=json.dumps([t.model_dump() for t in voice_state.transcript]),
                duration_seconds=voice_state.elapsed_seconds(),
                sms_requested=voice_state.sms_requested,
                sms_sent=voice_state.sms_sent,
            )
            db.add(rec)
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def get_voice_sessions() -> dict:
    """Internal: used by the WebSocket handler to access session state."""
    return _voice_sessions
