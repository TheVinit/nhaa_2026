"""
FastAPI Route Handlers for AI Perception Service Endpoints
==============================================================================
NHAA 14566 / SIH 26093 - AI Perception Layer
==============================================================================
Exposes RESTful endpoints for speech-to-text, speech emotion recognition,
acoustic analysis, text distress classification, and SVI score fusion.
==============================================================================
"""

import time
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import APIRouter, File, Form, UploadFile, HTTPException, Request, status
from fastapi.responses import JSONResponse

from perception.schemas import PerceptionOutputContract
from api.services.perception_service import (
    PerceptionService,
    ALLOWED_AUDIO_EXTENSIONS,
    MAX_FILE_SIZE_BYTES
)

router = APIRouter(prefix="/api/v1/perception", tags=["AI Perception Layer"])

# Global Perception Service Instance
_perception_service = PerceptionService()

def get_perception_service() -> PerceptionService:
    global _perception_service
    if not _perception_service.models_loaded:
        _perception_service.load_models()
    return _perception_service


@router.post(
    "/analyze",
    response_model=PerceptionOutputContract,
    status_code=status.HTTP_200_OK,
    summary="Analyze Multimodal Perception Signals (Audio & Text)",
    description="Extracts STT transcript, acoustic speech features, Wav2Vec2 SER emotions, text distress flags, and composite SVI score."
)
async def analyze_perception(
    request: Request,
    audio: Optional[UploadFile] = File(None, description="Optional uploaded audio file (wav, mp3, m4a, ogg, flac)"),
    text: Optional[str] = Form(None, description="Optional citizen text / transcript string"),
    language: str = Form("hi", description="ISO language code ('hi', 'en', 'ta')"),
    case_id: Optional[str] = Form(None, description="Optional Central Case API Case ID"),
    channel: str = Form("ivrs", description="Ingestion channel ('ivrs', 'phone', 'chat', 'portal', 'mobile_app')")
) -> PerceptionOutputContract:
    """
    Main Perception Endpoint combining STT, Acoustic Analysis, SER, Text Distress, and SVI Fusion.
    """
    service = get_perception_service()

    audio_bytes = None
    filename = None

    # 1. Validate Audio Upload if provided
    if audio is not None:
        filename = audio.filename
        ext = Path(filename).suffix.lower() if filename else ".wav"
        
        if ext not in ALLOWED_AUDIO_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported audio format '{ext}'. Allowed formats: {sorted(list(ALLOWED_AUDIO_EXTENSIONS))}"
            )

        audio_bytes = await audio.read()
        if len(audio_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded audio file is empty (0 bytes)."
            )

        if len(audio_bytes) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Audio file size ({len(audio_bytes)/(1024*1024):.1f}MB) exceeds maximum limit of 50MB."
            )

    # 2. Check Input Requirements (At least one of audio or text must be present)
    has_audio = audio_bytes is not None and len(audio_bytes) > 0
    has_text = text is not None and len(text.strip()) > 0

    if not has_audio and not has_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request payload: Must provide at least one of 'audio' file upload or 'text' payload."
        )

    # 3. Execute Perception Pipeline (Non-blocking via asyncio.to_thread)
    try:
        import asyncio
        contract_payload = await asyncio.to_thread(
            service.analyze,
            audio_bytes=audio_bytes,
            filename=filename,
            text=text,
            language=language,
            case_id=case_id,
            channel=channel
        )
        return contract_payload

    except ValueError as ve:
        print(f"[422 DEBUG] ValueError in analyze_perception: {ve}")
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as e:
        print(f"[API ERROR] Exception during perception pipeline execution: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Perception pipeline error: {str(e)}")


@router.get(
    "/models",
    summary="Get Pre-loaded Perception Models Status",
    description="Returns status of loaded models, hardware acceleration (CUDA/CPU), and VRAM allocation."
)
async def get_models_status():
    service = get_perception_service()
    return service.get_model_status()


@router.get(
    "/upload-test",
    summary="Interactive Audio Upload Tester Page",
    description="Renders dark-themed web page for drag-and-drop audio perception testing."
)
async def upload_test_page():
    from fastapi.responses import HTMLResponse
    html_content = """<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>🎙️ NHAA AI Perception - Audio Voice Tester</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
            .container { max-width: 750px; margin: 30px auto; background: #1e293b; padding: 30px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
            h1 { color: #38bdf8; font-size: 24px; margin-top: 0; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
            .form-group { margin-bottom: 20px; }
            label { display: block; margin-bottom: 8px; font-weight: 600; color: #e2e8f0; font-size: 14px; }
            input[type="file"], select, input[type="text"] { width: 100%; padding: 12px; border-radius: 6px; border: 1px solid #475569; background: #0f172a; color: #f8fafc; box-sizing: border-box; font-size: 14px; }
            button { width: 100%; background: #0284c7; color: white; border: none; padding: 14px; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background 0.2s; }
            button:hover { background: #0369a1; }
            #result { margin-top: 25px; padding: 15px; background: #090d16; border-radius: 8px; border: 1px solid #334155; font-family: monospace; white-space: pre-wrap; font-size: 13px; max-height: 450px; overflow-y: auto; color: #4ade80; display: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎙️ NHAA AI Perception - Audio Voice Tester</h1>
            <p>Upload any recorded .mp3 or .wav voice file below to analyze STT transcript, pitch, pauses, emotion, and SVI Risk Score live.</p>
            
            <form id="voiceForm">
                <div class="form-group">
                    <label for="audio">Select Spoken Audio Voice File (.mp3, .wav, .m4a):</label>
                    <input type="file" id="audio" name="audio" accept="audio/*" required>
                </div>

                <div class="form-group">
                    <label for="language">Select Language:</label>
                    <select id="language" name="language">
                        <option value="hi">Hindi (hi)</option>
                        <option value="mr">Marathi (mr)</option>
                        <option value="en">English (en)</option>
                        <option value="ta">Tamil (ta)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="channel">Helpline Ingestion Channel:</label>
                    <select id="channel" name="channel">
                        <option value="ivrs">IVRS Telephonic Call</option>
                        <option value="mobile_app">Mobile App</option>
                        <option value="phone">Helpline Phone Call</option>
                    </select>
                </div>

                <button type="submit" id="submitBtn">⚡ Analyze Audio Perception Live</button>
            </form>

            <div id="result"></div>
        </div>

        <script>
            document.getElementById('voiceForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('submitBtn');
                const resultDiv = document.getElementById('result');
                btn.disabled = true;
                btn.innerText = "⏳ Processing Audio via GPU Neural Models...";
                resultDiv.style.display = "block";
                resultDiv.innerText = "Analyzing audio... Please wait...";

                const formData = new FormData(e.target);

                try {
                    const response = await fetch('/api/v1/perception/analyze', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await response.json();
                    btn.disabled = false;
                    btn.innerText = "⚡ Analyze Audio Perception Live";
                    resultDiv.innerText = JSON.stringify(data, null, 2);
                } catch (err) {
                    btn.disabled = false;
                    btn.innerText = "⚡ Analyze Audio Perception Live";
                    resultDiv.innerText = "Error: " + err.message;
                }
            });
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
