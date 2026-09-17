"""
Module: app/main.py

Main FastAPI application entry point.
Registers all API v1 routers and the WebSocket voice endpoint.
"""

from __future__ import annotations

import json
import asyncio
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.routers.rag import router as rag_router
from app.routers.ingestion import router as ingestion_router
from app.routers.documents import router as documents_registry_router
from app.routers.schemes import router as schemes_router
from app.routers.admin import router as admin_router


# ── API Routers ───────────────────────────────────────────────────────────
from app.api.v1.ai import router as ai_router
from app.api.v1.eligibility import router as eligibility_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.finance import router as finance_router
from app.api.v1.documents import router as documents_router
from app.api.v1.partners import router as partners_router
from app.api.v1.conversations import router as conversations_router
from app.api.v1.voice import router as voice_router, get_voice_sessions
from app.api.v1.sms import router as sms_router

# ── Initialize Database Tables ────────────────────────────────────────────
init_db()

# ── App Factory ──────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "AI-Driven Government Scheme Matching Platform (YojanaSetu). "
        "Supports multilingual RAG scheme assistance, deterministic eligibility engine, "
        "and live voice calls."
    ),
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS Middleware ───────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register RAG & Core Pipeline Routers ────────────────────────────────
app.include_router(rag_router, prefix="/api")
app.include_router(ingestion_router, prefix="/api")
app.include_router(documents_registry_router, prefix="/api")
app.include_router(schemes_router, prefix="/api")
app.include_router(admin_router, prefix="/api")

# ── Register API v1 Routes ────────────────────────────────────────────────
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(eligibility_router, prefix=settings.API_V1_STR)
app.include_router(recommendations_router, prefix=settings.API_V1_STR)
app.include_router(finance_router, prefix=settings.API_V1_STR)
app.include_router(documents_router, prefix=settings.API_V1_STR)
app.include_router(partners_router, prefix=settings.API_V1_STR)
app.include_router(conversations_router, prefix=settings.API_V1_STR)
app.include_router(voice_router, prefix=settings.API_V1_STR)
app.include_router(voice_router, prefix="/api")
app.include_router(sms_router, prefix=settings.API_V1_STR)



# ── WebSocket: Live AI Voice Call ─────────────────────────────────────────

@app.websocket("/ws/voice/{session_id}")
async def voice_websocket(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for Live AI Voice Call.

    Protocol:
      Client → Server:
        bytes: raw PCM audio frames (16kHz, mono, int16)
        json {"type": "barge_in"}: interrupt AI speech
        json {"type": "ping"}:    keep-alive

      Server → Client:
        bytes: PCM TTS audio frames
        json {"type": "transcript", "role": "user"|"ai", "text": "...", "time": "0:08"}
        json {"type": "state_change", "state": "listening|processing|speaking|..."}
        json {"type": "error", "code": "...", "message": "...", "recoverable": true}
        json {"type": "pong"}: keep-alive reply
    """
    from app.ai.voice.voice_state import VoiceSessionState
    from app.ai.voice.stt import STTProcessor, VADProcessor
    from app.ai.voice.tts import TTSProcessor
    from app.ai.voice.voice_prompts import get_voice_prompt, VOICE_GREETINGS, VOICE_ERROR_PROMPT
    from app.schemas.voice import VoiceState, VoiceErrorCode
    from app.ai.agent.orchestrator import AgentOrchestrator
    from app.schemas.conversation import ChatRequest
    from app.services.conversation_service import get_conversation, save_conversation

    # Look up session
    voice_sessions = get_voice_sessions()
    voice_state: VoiceSessionState = voice_sessions.get(session_id)

    if voice_state is None:
        await websocket.close(code=4404, reason="Voice session not found. Call POST /voice/session/start first.")
        return

    await websocket.accept()
    voice_state.ws_state = VoiceState.CONNECTING

    # ── Send initial state ────────────────────────────────────────────────
    async def send_json(data: dict):
        try:
            await websocket.send_text(json.dumps(data))
        except Exception:
            pass

    async def send_audio(audio_bytes: bytes):
        if audio_bytes:
            try:
                await websocket.send_bytes(audio_bytes)
            except Exception:
                pass

    async def change_state(new_state: VoiceState, msg: str = ""):
        voice_state.ws_state = new_state
        await send_json({"type": "state_change", "state": new_state.value, "message": msg})

    async def send_error(code: VoiceErrorCode, message: str, recoverable: bool = True):
        await send_json({
            "type": "error",
            "code": code.value,
            "message": message,
            "recoverable": recoverable,
        })

    # Greet the user via TTS
    try:
        await change_state(VoiceState.SPEAKING)
        greeting = get_voice_prompt(VOICE_GREETINGS, voice_state.detected_language)
        greeting_audio = TTSProcessor.synthesize(greeting, language=voice_state.detected_language)
        await send_json({
            "type": "transcript",
            "role": "ai",
            "text": greeting,
            "time": voice_state.elapsed_str(),
        })
        voice_state.append_transcript("ai", greeting)
        await send_audio(greeting_audio)
        await change_state(VoiceState.LISTENING)
    except Exception as e:
        await send_error(VoiceErrorCode.TTS_ERROR, "Could not generate greeting audio.")
        await change_state(VoiceState.LISTENING)

    # ── Main WebSocket Loop ───────────────────────────────────────────────
    audio_buffer = b""

    try:
        while True:
            # Check session timeout
            if voice_state.is_expired(settings.SESSION_TIMEOUT_SECONDS):
                await send_error(VoiceErrorCode.SESSION_EXPIRED, "Session expired.", recoverable=False)
                await change_state(VoiceState.COMPLETED)
                break

            voice_state.touch()

            # Receive next message
            try:
                msg = await asyncio.wait_for(websocket.receive(), timeout=60.0)
            except asyncio.TimeoutError:
                await send_json({"type": "pong"})  # Keep-alive
                continue

            # Handle binary (audio) messages
            if msg.get("bytes") is not None:
                chunk = msg["bytes"]

                # Security: reject oversized frames
                if len(chunk) > settings.MAX_AUDIO_SIZE_BYTES:
                    await send_error(VoiceErrorCode.INVALID_AUDIO, "Audio frame too large.")
                    continue

                # Handle barge-in
                if voice_state.is_speaking and voice_state.barge_in_requested:
                    voice_state.is_speaking = False
                    voice_state.barge_in_requested = False
                    await change_state(VoiceState.INTERRUPTED)
                    await change_state(VoiceState.LISTENING)
                    audio_buffer = b""

                audio_buffer += chunk
                is_speech = VADProcessor.is_speech(chunk)

                if is_speech:
                    voice_state.vad_speech_frames += 1
                    voice_state.vad_silence_frames = 0
                else:
                    voice_state.vad_silence_frames += 1

                # Utterance end detection: enough silence after speech
                utterance_complete = (
                    voice_state.vad_speech_frames >= VADProcessor.SPEECH_FRAMES_REQUIRED and
                    voice_state.vad_silence_frames >= VADProcessor.SILENCE_FRAMES_REQUIRED
                )

                if utterance_complete and audio_buffer:
                    await change_state(VoiceState.PROCESSING)

                    # STT
                    try:
                        transcript_text, stt_conf = STTProcessor.transcribe(
                            audio_buffer, language=voice_state.detected_language
                        )
                    except Exception:
                        await send_error(VoiceErrorCode.STT_ERROR, "Speech recognition failed. Please try again.")
                        await change_state(VoiceState.LISTENING)
                        audio_buffer = b""
                        voice_state.vad_speech_frames = 0
                        voice_state.vad_silence_frames = 0
                        continue

                    # Reset VAD buffer
                    audio_buffer = b""
                    voice_state.vad_speech_frames = 0
                    voice_state.vad_silence_frames = 0

                    if not transcript_text.strip():
                        await change_state(VoiceState.LISTENING)
                        continue

                    # Send user transcript
                    await send_json({
                        "type": "transcript",
                        "role": "user",
                        "text": transcript_text,
                        "time": voice_state.elapsed_str(),
                        "language": voice_state.detected_language,
                        "confidence": stt_conf,
                    })
                    voice_state.append_transcript("user", transcript_text)

                    # Run AI orchestrator
                    try:
                        conv = get_conversation(voice_state.conversation_id)
                        chat_req = ChatRequest(
                            text=transcript_text,
                            conversation_id=voice_state.conversation_id,
                        )
                        chat_response, updated_conv = AgentOrchestrator.run(
                            request=chat_req,
                            conversation_state=conv,
                        )
                        save_conversation(updated_conv)

                        # Update detected language from orchestrator
                        voice_state.detected_language = chat_response.detected_language
                        voice_state.profile = chat_response.profile
                        ai_text = chat_response.response_text

                    except Exception:
                        ai_text = get_voice_prompt(VOICE_ERROR_PROMPT, voice_state.detected_language)

                    # TTS
                    await change_state(VoiceState.SPEAKING)
                    voice_state.is_speaking = True

                    try:
                        tts_audio = TTSProcessor.synthesize(ai_text, language=voice_state.detected_language)
                    except Exception:
                        await send_error(VoiceErrorCode.TTS_ERROR, "Could not synthesize response audio.")
                        tts_audio = b""

                    await send_json({
                        "type": "transcript",
                        "role": "ai",
                        "text": ai_text,
                        "time": voice_state.elapsed_str(),
                    })
                    voice_state.append_transcript("ai", ai_text)
                    await send_audio(tts_audio)

                    voice_state.is_speaking = False
                    await change_state(VoiceState.LISTENING)

            # Handle text (control) messages
            elif msg.get("text") is not None:
                try:
                    control = json.loads(msg["text"])
                except json.JSONDecodeError:
                    continue

                msg_type = control.get("type", "")

                if msg_type == "ping":
                    await send_json({"type": "pong"})

                elif msg_type == "barge_in":
                    if voice_state.is_speaking:
                        voice_state.barge_in_requested = True
                        await change_state(VoiceState.INTERRUPTED, "User interrupted.")

    except WebSocketDisconnect:
        pass
    except Exception:
        await send_error(VoiceErrorCode.INTERNAL_ERROR, "Internal error. Session ended.", recoverable=False)
    finally:
        voice_state.ws_state = VoiceState.COMPLETED


# ── Health Check ──────────────────────────────────────────────────────────

@app.get("/health", tags=["Health Check"])
async def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "llm_provider": settings.LLM_PROVIDER,
        "speech_provider": settings.SPEECH_PROVIDER,
    }
